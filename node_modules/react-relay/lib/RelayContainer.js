/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule RelayContainer
 * @typechecks
 * 
 */

'use strict';

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _extends = require('babel-runtime/helpers/extends')['default'];

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var ErrorUtils = require('fbjs/lib/ErrorUtils');
var GraphQLFragmentPointer = require('./GraphQLFragmentPointer');
var GraphQLStoreDataHandler = require('./GraphQLStoreDataHandler');
var GraphQLStoreQueryResolver = require('./GraphQLStoreQueryResolver');
var React = require('react-native');
var RelayContainerComparators = require('./RelayContainerComparators');
var RelayContainerProxy = require('./RelayContainerProxy');
var RelayFragmentReference = require('./RelayFragmentReference');

var RelayMetaRoute = require('./RelayMetaRoute');
var RelayMutationTransaction = require('./RelayMutationTransaction');
var RelayPropTypes = require('./RelayPropTypes');
var RelayProfiler = require('./RelayProfiler');
var RelayQuery = require('./RelayQuery');
var RelayStore = require('./RelayStore');
var RelayStoreData = require('./RelayStoreData');
var unstable_batchedUpdates = require('./RelayUnstableBatchedUpdates');

var buildRQL = require('./buildRQL');

var forEachObject = require('fbjs/lib/forEachObject');
var invariant = require('fbjs/lib/invariant');
var nullthrows = require('fbjs/lib/nullthrows');
var prepareRelayContainerProps = require('./prepareRelayContainerProps');
var shallowEqual = require('fbjs/lib/shallowEqual');
var warning = require('fbjs/lib/warning');
var isReactComponent = require('./isReactComponent');

var containerContextTypes = {
  route: RelayPropTypes.QueryConfig.isRequired
};
var nextContainerID = 0;

var storeData = RelayStoreData.getDefaultInstance();

storeData.getChangeEmitter().injectBatchingStrategy(unstable_batchedUpdates);

/**
 * @public
 *
 * RelayContainer is a higher order component that provides the ability to:
 *
 *  - Encode data dependencies using query fragments that are parameterized by
 *    routes and variables.
 *  - Manipulate variables via methods on `this.props.relay`.
 *  - Automatically subscribe to data changes.
 *  - Avoid unnecessary updates if data is unchanged.
 *  - Propagate the `route` via context (available on `this.props.relay`).
 *
 */
function createContainerComponent(Component, spec, containerID) {
  var componentName = Component.displayName || Component.name;
  var containerName = 'Relay(' + componentName + ')';

  var fragments = spec.fragments;
  var fragmentNames = _Object$keys(fragments);
  var initialVariables = spec.initialVariables || {};
  var prepareVariables = spec.prepareVariables;

  var RelayContainer = (function (_React$Component) {
    _inherits(RelayContainer, _React$Component);

    function RelayContainer(props, context) {
      _classCallCheck(this, RelayContainer);

      _React$Component.call(this, props, context);

      var route = context.route;

      !(route && typeof route.name === 'string') ? process.env.NODE_ENV !== 'production' ? invariant(false, 'RelayContainer: `%s` was rendered without a valid route. Make sure ' + 'the route is valid, and make sure that it is correctly set on the ' + 'parent component\'s context (e.g. using <RelayRootContainer>).', containerName) : invariant(false) : undefined;

      var self = this;
      self.forceFetch = this.forceFetch.bind(this);
      self.getPendingTransactions = this.getPendingTransactions.bind(this);
      self.hasFragmentData = this.hasFragmentData.bind(this);
      self.hasOptimisticUpdate = this.hasOptimisticUpdate.bind(this);
      self.setVariables = this.setVariables.bind(this);

      this._deferredSubscriptions = null;
      this._didShowFakeDataWarning = false;
      this._fragmentPointers = {};
      this._hasStaleQueryData = false;
      this._queryResolvers = {};

      this.mounted = true;
      this.pending = null;
      this.state = {
        variables: {},
        queryData: {}
      };
    }

    /**
     * Requests an update to variables. This primes the cache for the new
     * variables and notifies the caller of changes via the callback. As data
     * becomes ready, the component will be updated.
     */

    RelayContainer.prototype.setVariables = function setVariables(partialVariables, callback) {
      this._runVariables(partialVariables, callback, false);
    };

    /**
     * Requests an update to variables. Unlike `setVariables`, this forces data
     * to be fetched and written for the supplied variables. Any data that
     * previously satisfied the queries will be overwritten.
     */

    RelayContainer.prototype.forceFetch = function forceFetch(partialVariables, callback) {
      this._runVariables(partialVariables, callback, true);
    };

    /**
     * Creates a query for each of the component's fragments using the given
     * variables, and fragment pointers that can be used to resolve the results
     * of those queries. The fragment pointers are of the same shape as the
     * `_fragmentPointers` property.
     */

    RelayContainer.prototype._createQuerySetAndFragmentPointers = function _createQuerySetAndFragmentPointers(variables) {
      var _this = this;

      var fragmentPointers = {};
      var querySet = {};
      fragmentNames.forEach(function (fragmentName) {
        var fragment = getFragment(fragmentName, _this.context.route, variables);
        var queryData = _this.state.queryData[fragmentName];
        if (!fragment || queryData == null) {
          return;
        }

        var fragmentPointer;
        if (fragment.isPlural()) {
          !Array.isArray(queryData) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'RelayContainer: Invalid queryData for `%s`, expected an array ' + 'of records because the corresponding fragment is plural.', fragmentName) : invariant(false) : undefined;
          var dataIDs = [];
          queryData.forEach(function (data, ii) {
            var dataID = GraphQLStoreDataHandler.getID(data);
            if (dataID) {
              querySet[fragmentName + ii] = storeData.buildFragmentQueryForDataID(fragment, dataID);
              dataIDs.push(dataID);
            }
          });
          if (dataIDs.length) {
            fragmentPointer = new GraphQLFragmentPointer(dataIDs, fragment);
          }
        } else {
          /* $FlowFixMe(>=0.19.0) - queryData is mixed but getID expects Object
           */
          var dataID = GraphQLStoreDataHandler.getID(queryData);
          if (dataID) {
            fragmentPointer = new GraphQLFragmentPointer(dataID, fragment);
            querySet[fragmentName] = storeData.buildFragmentQueryForDataID(fragment, dataID);
          }
        }

        fragmentPointers[fragmentName] = fragmentPointer;
      });
      return { fragmentPointers: fragmentPointers, querySet: querySet };
    };

    RelayContainer.prototype._runVariables = function _runVariables(partialVariables, callback, forceFetch) {
      var _this2 = this;

      var lastVariables = this.state.variables;
      var prevVariables = this.pending ? this.pending.variables : lastVariables;
      var nextVariables = mergeVariables(prevVariables, partialVariables);

      this.pending && this.pending.request.abort();

      var completeProfiler = RelayProfiler.profile('RelayContainer.setVariables', {
        containerName: containerName,
        nextVariables: nextVariables
      });

      // If variables changed or we are force-fetching, we need to build a new
      // set of queries that includes the updated variables. Because the pending
      // fetch is always canceled, always initiate a new fetch.
      var querySet = {};
      var fragmentPointers = null;
      if (forceFetch || !shallowEqual(nextVariables, lastVariables)) {
        var _createQuerySetAndFragmentPointers2 = this._createQuerySetAndFragmentPointers(nextVariables);

        querySet = _createQuerySetAndFragmentPointers2.querySet;
        fragmentPointers = _createQuerySetAndFragmentPointers2.fragmentPointers;
      }

      var onReadyStateChange = ErrorUtils.guard(function (readyState) {
        var aborted = readyState.aborted;
        var done = readyState.done;
        var error = readyState.error;
        var ready = readyState.ready;

        var isComplete = aborted || done || error;
        if (isComplete && _this2.pending === current) {
          _this2.pending = null;
        }
        var partialState;
        if (ready && fragmentPointers) {
          // Only update query data if variables changed. Otherwise, `querySet`
          // and `fragmentPointers` will be empty, and `nextVariables` will be
          // equal to `lastVariables`.
          _this2._fragmentPointers = fragmentPointers;
          _this2._updateQueryResolvers();
          var queryData = _this2._getQueryData(_this2.props);
          partialState = { variables: nextVariables, queryData: queryData };
        } else {
          partialState = {};
        }
        var mounted = _this2.mounted;
        if (mounted) {
          var updateProfiler = RelayProfiler.profile('RelayContainer.update');
          unstable_batchedUpdates(function () {
            _this2.setState(partialState, function () {
              updateProfiler.stop();
              if (isComplete) {
                completeProfiler.stop();
              }
            });
            if (callback) {
              callback.call(_this2.refs.component || null, _extends({}, readyState, { mounted: mounted }));
            }
          });
        } else {
          if (callback) {
            callback(_extends({}, readyState, { mounted: mounted }));
          }
          if (isComplete) {
            completeProfiler.stop();
          }
        }
      }, 'RelayContainer.onReadyStateChange');

      var current = {
        variables: nextVariables,
        request: forceFetch ? RelayStore.forceFetch(querySet, onReadyStateChange) : RelayStore.primeCache(querySet, onReadyStateChange)
      };
      this.pending = current;
    };

    /**
     * Determine if the supplied record reflects an optimistic update.
     */

    RelayContainer.prototype.hasOptimisticUpdate = function hasOptimisticUpdate(record) {
      var dataID = GraphQLStoreDataHandler.getID(record);
      !(dataID != null) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'RelayContainer.hasOptimisticUpdate(): Expected a record in `%s`.', componentName) : invariant(false) : undefined;
      return storeData.hasOptimisticUpdate(dataID);
    };

    /**
     * Returns the pending mutation transactions affecting the given record.
     */

    RelayContainer.prototype.getPendingTransactions = function getPendingTransactions(record) {
      var dataID = GraphQLStoreDataHandler.getID(record);
      !(dataID != null) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'RelayContainer.getPendingTransactions(): Expected a record in `%s`.', componentName) : invariant(false) : undefined;
      var mutationIDs = storeData.getClientMutationIDs(dataID);
      if (!mutationIDs) {
        return null;
      }
      var mutationQueue = storeData.getMutationQueue();
      return mutationIDs.map(function (id) {
        return mutationQueue.getTransaction(id);
      });
    };

    /**
     * Checks if data for a deferred fragment is ready. This method should
     * *always* be called before rendering a child component whose fragment was
     * deferred (unless that child can handle null or missing data).
     */

    RelayContainer.prototype.hasFragmentData = function hasFragmentData(fragmentReference, record) {
      if (!storeData.getPendingQueryTracker().hasPendingQueries()) {
        // nothing can be missing => must have data
        return true;
      }
      // convert builder -> fragment in order to get the fragment's name
      var dataID = GraphQLStoreDataHandler.getID(record);
      !(dataID != null) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'RelayContainer.hasFragmentData(): Second argument is not a valid ' + 'record. For `<%s X={this.props.X} />`, use ' + '`this.props.hasFragmentData(%s.getFragment(\'X\'), this.props.X)`.', componentName, componentName) : invariant(false) : undefined;
      var fragment = getDeferredFragment(fragmentReference, this.context, this.state.variables);
      !(fragment instanceof RelayQuery.Fragment) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'RelayContainer.hasFragmentData(): First argument is not a valid ' + 'fragment. Ensure that there are no failing `if` or `unless` ' + 'conditions.') : invariant(false) : undefined;
      return storeData.getCachedStore().hasDeferredFragmentData(dataID, fragment.getFragmentID());
    };

    RelayContainer.prototype.componentWillMount = function componentWillMount() {
      if (this.context.route.useMockData) {
        return;
      }
      var variables = getVariablesWithPropOverrides(spec, this.props, initialVariables);
      this._updateFragmentPointers(this.props, this.context.route, variables);
      this._updateQueryResolvers();
      var queryData = this._getQueryData(this.props);

      this.setState({
        variables: variables,
        queryData: queryData
      });
    };

    RelayContainer.prototype.componentWillReceiveProps = function componentWillReceiveProps(nextProps, nextContext) {
      var _this3 = this;

      var _nullthrows = nullthrows(nextContext);

      var route = _nullthrows.route;

      if (route.useMockData) {
        return;
      }
      this.setState(function (state) {
        var variables = getVariablesWithPropOverrides(spec, nextProps, resetPropOverridesForVariables(spec, nextProps, state.variables));
        _this3._updateFragmentPointers(nextProps, route, variables);
        _this3._updateQueryResolvers();
        return {
          variables: variables,
          queryData: _this3._getQueryData(nextProps)
        };
      });
    };

    RelayContainer.prototype.componentWillUnmount = function componentWillUnmount() {
      // A guarded error in mounting might prevent initialization of resolvers.
      if (this._queryResolvers) {
        forEachObject(this._queryResolvers, function (queryResolver) {
          return queryResolver && queryResolver.reset();
        });
      }

      if (this._deferredSubscriptions) {
        forEachObject(this._deferredSubscriptions, function (sub) {
          return sub.dispose();
        });
      }
      this._deferredSubscriptions = null;

      this._fragmentPointers = {};
      this._queryResolvers = {};

      var pending = this.pending;
      if (pending) {
        pending.request.abort();
        this.pending = null;
      }
      this.mounted = false;
    };

    RelayContainer.prototype._updateQueryResolvers = function _updateQueryResolvers() {
      var _this4 = this;

      var fragmentPointers = this._fragmentPointers;
      var queryResolvers = this._queryResolvers;
      fragmentNames.forEach(function (fragmentName) {
        var fragmentPointer = fragmentPointers[fragmentName];
        var queryResolver = queryResolvers[fragmentName];
        if (!fragmentPointer) {
          if (queryResolver) {
            queryResolver.reset();
            queryResolvers[fragmentName] = null;
          }
        } else if (!queryResolver) {
          queryResolver = new GraphQLStoreQueryResolver(storeData, fragmentPointer, _this4._handleFragmentDataUpdate.bind(_this4));
          queryResolvers[fragmentName] = queryResolver;
        }
      });
    };

    RelayContainer.prototype._handleFragmentDataUpdate = function _handleFragmentDataUpdate() {
      var queryData = this._getQueryData(this.props);
      var updateProfiler = RelayProfiler.profile('RelayContainer.handleFragmentDataUpdate');
      this.setState({ queryData: queryData }, updateProfiler.stop);
    };

    RelayContainer.prototype._updateFragmentPointers = function _updateFragmentPointers(props, route, variables) {
      var _this5 = this;

      var fragmentPointers = this._fragmentPointers;
      fragmentNames.forEach(function (fragmentName) {
        var propValue = props[fragmentName];
        process.env.NODE_ENV !== 'production' ? warning(propValue !== undefined, 'RelayContainer: Expected query `%s` to be supplied to `%s` as ' + 'a prop from the parent. Pass an explicit `null` if this is ' + 'intentional.', fragmentName, componentName) : undefined;
        if (!propValue) {
          fragmentPointers[fragmentName] = null;
          return;
        }
        var fragment = getFragment(fragmentName, route, variables);
        var concreteFragmentID = fragment.getConcreteFragmentID();
        var dataIDOrIDs;

        if (fragment.isPlural()) {
          // Plural fragments require the prop value to be an array of fragment
          // pointers, which are merged into a single fragment pointer to pass
          // to the query resolver `resolve`.
          !Array.isArray(propValue) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'RelayContainer: Invalid prop `%s` supplied to `%s`, expected an ' + 'array of records because the corresponding fragment is plural.', fragmentName, componentName) : invariant(false) : undefined;
          if (propValue.length) {
            dataIDOrIDs = propValue.reduce(function (acc, item, ii) {
              var eachFragmentPointer = item[concreteFragmentID];
              !eachFragmentPointer ? process.env.NODE_ENV !== 'production' ? invariant(false, 'RelayContainer: Invalid prop `%s` supplied to `%s`, ' + 'expected element at index %s to have query data.', fragmentName, componentName, ii) : invariant(false) : undefined;
              return acc.concat(eachFragmentPointer.getDataIDs());
            }, []);
          } else {
            // An empty plural fragment cannot be observed; the empty array prop
            // can be passed as-is to the component.
            dataIDOrIDs = null;
          }
        } else {
          !!Array.isArray(propValue) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'RelayContainer: Invalid prop `%s` supplied to `%s`, expected a ' + 'single record because the corresponding fragment is not plural.', fragmentName, componentName) : invariant(false) : undefined;
          var fragmentPointer = propValue[concreteFragmentID];
          if (fragmentPointer) {
            dataIDOrIDs = fragmentPointer.getDataID();
          } else {
            // TODO: Throw when we have mock data validation, #6332949.
            dataIDOrIDs = null;
            if (process.env.NODE_ENV !== 'production') {
              if (!route.useMockData && !_this5._didShowFakeDataWarning) {
                _this5._didShowFakeDataWarning = true;
                process.env.NODE_ENV !== 'production' ? warning(false, 'RelayContainer: Expected prop `%s` supplied to `%s` to ' + 'be data fetched by Relay. This is likely an error unless ' + 'you are purposely passing in mock data that conforms to ' + 'the shape of this component\'s fragment.', fragmentName, componentName) : undefined;
              }
            }
          }
        }
        fragmentPointers[fragmentName] = dataIDOrIDs ? new GraphQLFragmentPointer(dataIDOrIDs, fragment) : null;
      });
      if (process.env.NODE_ENV !== 'production') {
        // If a fragment pointer is null, warn if it was found on another prop.
        fragmentNames.forEach(function (fragmentName) {
          if (fragmentPointers[fragmentName]) {
            return;
          }
          var fragment = getFragment(fragmentName, route, variables);
          var concreteFragmentID = fragment.getConcreteFragmentID();
          _Object$keys(props).forEach(function (propName) {
            process.env.NODE_ENV !== 'production' ? warning(fragmentPointers[propName] || !props[propName] || !props[propName][concreteFragmentID], 'RelayContainer: Expected record data for prop `%s` on `%s`, ' + 'but it was instead on prop `%s`. Did you misspell a prop or ' + 'pass record data into the wrong prop?', fragmentName, componentName, propName) : undefined;
          });
        });
      }
    };

    RelayContainer.prototype._getQueryData = function _getQueryData(props) {
      var _this6 = this;

      var queryData = {};
      var fragmentPointers = this._fragmentPointers;
      forEachObject(this._queryResolvers, function (queryResolver, propName) {
        var propValue = props[propName];
        var fragmentPointer = fragmentPointers[propName];

        if (!propValue || !fragmentPointer) {
          // Clear any subscriptions since there is no data.
          queryResolver && queryResolver.reset();
          // Allow mock data to pass through without modification.
          queryData[propName] = propValue;
        } else {
          queryData[propName] = queryResolver.resolve(fragmentPointer);
        }
        if (_this6.state.queryData.hasOwnProperty(propName) && queryData[propName] !== _this6.state.queryData[propName]) {
          _this6._hasStaleQueryData = true;
        }
      });
      return queryData;
    };

    RelayContainer.prototype.shouldComponentUpdate = function shouldComponentUpdate(nextProps, nextState, nextContext) {
      // Flag indicating that query data changed since previous render.
      if (this._hasStaleQueryData) {
        this._hasStaleQueryData = false;
        return true;
      }

      if (this.context.route !== nextContext.route) {
        return true;
      }

      var fragmentPointers = this._fragmentPointers;
      return !RelayContainerComparators.areNonQueryPropsEqual(fragments, this.props, nextProps) || fragmentPointers && !RelayContainerComparators.areQueryResultsEqual(fragmentPointers, this.state.queryData, nextState.queryData) || !RelayContainerComparators.areQueryVariablesEqual(this.state.variables, nextState.variables);
    };

    RelayContainer.prototype.render = function render() {
      var relayProps = {
        forceFetch: this.forceFetch,
        getPendingTransactions: this.getPendingTransactions,
        hasFragmentData: this.hasFragmentData,
        hasOptimisticUpdate: this.hasOptimisticUpdate,
        route: this.context.route,
        setVariables: this.setVariables,
        variables: this.state.variables
      };
      return React.createElement(Component, _extends({}, this.props, this.state.queryData, prepareRelayContainerProps(relayProps, this), {
        ref: isReactComponent(Component) ? 'component' : null
      }));
    };

    return RelayContainer;
  })(React.Component);

  function getFragment(fragmentName, route, variables) {
    var fragmentBuilder = fragments[fragmentName];
    !fragmentBuilder ? process.env.NODE_ENV !== 'production' ? invariant(false, 'RelayContainer: Expected `%s` to have a query fragment named `%s`.', containerName, fragmentName) : invariant(false) : undefined;
    var fragment = buildContainerFragment(containerName, fragmentName, fragmentBuilder, initialVariables);
    // TODO: Allow routes without names, #7856965.
    var metaRoute = RelayMetaRoute.get(route.name);
    if (prepareVariables) {
      variables = prepareVariables(variables, metaRoute);
    }
    return RelayQuery.Fragment.create(fragment, metaRoute, variables);
  }

  initializeProfiler(RelayContainer);
  RelayContainer.contextTypes = containerContextTypes;
  RelayContainer.displayName = containerName;
  RelayContainerProxy.proxyMethods(RelayContainer, Component);

  return RelayContainer;
}

/**
 * TODO: Stop allowing props to override variables, #7856288.
 */
function getVariablesWithPropOverrides(spec, props, variables) {
  var initialVariables = spec.initialVariables;
  if (initialVariables) {
    var mergedVariables;
    for (var key in initialVariables) {
      if (key in props) {
        mergedVariables = mergedVariables || _extends({}, variables);
        mergedVariables[key] = props[key];
      }
    }
    variables = mergedVariables || variables;
  }
  return variables;
}

/**
 * Compare props and variables and reset the internal query variables if outside
 * query variables change the component.
 *
 * TODO: Stop allowing props to override variables, #7856288.
 */
function resetPropOverridesForVariables(spec, props, variables) {
  var initialVariables = spec.initialVariables;
  for (var key in initialVariables) {
    if (key in props && props[key] != variables[key]) {
      return initialVariables;
    }
  }
  return variables;
}

function initializeProfiler(RelayContainer) {
  RelayProfiler.instrumentMethods(RelayContainer.prototype, {
    componentWillMount: 'RelayContainer.prototype.componentWillMount',
    componentWillReceiveProps: 'RelayContainer.prototype.componentWillReceiveProps',
    shouldComponentUpdate: 'RelayContainer.prototype.shouldComponentUpdate'
  });
}

/**
 * Merges a partial update into a set of variables. If no variables changed, the
 * same object is returned. Otherwise, a new object is returned.
 */
function mergeVariables(currentVariables, partialVariables) {
  if (partialVariables) {
    for (var key in partialVariables) {
      if (currentVariables[key] !== partialVariables[key]) {
        return _extends({}, currentVariables, partialVariables);
      }
    }
  }
  return currentVariables;
}

/**
 * Wrapper around `buildRQL.Fragment` with contextual error messages.
 */
function buildContainerFragment(containerName, fragmentName, fragmentBuilder, variables) {
  var fragment = buildRQL.Fragment(fragmentBuilder, variables);
  !fragment ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Relay.QL defined on container `%s` named `%s` is not a valid fragment. ' + 'A typical fragment is defined using: Relay.QL`fragment on Type {...}`', containerName, fragmentName) : invariant(false) : undefined;
  return fragment;
}

function getDeferredFragment(fragmentReference, context, variables) {
  var route = RelayMetaRoute.get(context.route.name);
  var concreteFragment = fragmentReference.getFragment(variables);
  var concreteVariables = fragmentReference.getVariables(route, variables);
  return RelayQuery.Fragment.create(concreteFragment, route, concreteVariables, {
    isDeferred: true,
    isContainerFragment: fragmentReference.isContainerFragment()
  });
}

/**
 * Creates a lazy Relay container. The actual container is created the first
 * time a container is being constructed by React's rendering engine.
 */
function create(Component, spec) {
  var componentName = Component.displayName || Component.name;
  var containerName = 'Relay(' + componentName + ')';
  var containerID = (nextContainerID++).toString(36);

  var fragments = spec.fragments;
  !(typeof fragments === 'object' && fragments) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Relay.createContainer(%s, ...): Missing `fragments`, which is expected ' + 'to be an object mapping from `propName` to: () => Relay.QL`...`', componentName) : invariant(false) : undefined;
  var fragmentNames = _Object$keys(fragments);
  var initialVariables = spec.initialVariables || {};
  var prepareVariables = spec.prepareVariables;

  var Container;
  function ContainerConstructor(props, context) {
    if (!Container) {
      Container = createContainerComponent(Component, spec, containerID);
    }
    return new Container(props, context);
  }

  ContainerConstructor.getFragmentNames = function () {
    return fragmentNames;
  };
  ContainerConstructor.hasFragment = function (fragmentName) {
    return !!fragments[fragmentName];
  };
  ContainerConstructor.hasVariable = function (variableName) {
    return Object.prototype.hasOwnProperty.call(initialVariables, variableName);
  };

  /**
   * Retrieves a reference to the fragment by name. An optional second argument
   * can be supplied to override the component's default variables.
   */
  ContainerConstructor.getFragment = function (fragmentName, variableMapping) {
    var fragmentBuilder = fragments[fragmentName];
    if (!fragmentBuilder) {
      !false ? process.env.NODE_ENV !== 'production' ? invariant(false, '%s.getFragment(): `%s` is not a valid fragment name. Available ' + 'fragments names: %s', containerName, fragmentName, fragmentNames.map(function (name) {
        return '`' + name + '`';
      }).join(', ')) : invariant(false) : undefined;
    }
    !(typeof fragmentBuilder === 'function') ? process.env.NODE_ENV !== 'production' ? invariant(false, 'RelayContainer: Expected `%s.fragments.%s` to be a function returning ' + 'a fragment. Example: `%s: () => Relay.QL`fragment on ...`', containerName, fragmentName, fragmentName) : invariant(false) : undefined;
    return RelayFragmentReference.createForContainer(function () {
      return buildContainerFragment(containerName, fragmentName, fragmentBuilder, initialVariables);
    }, initialVariables, variableMapping, prepareVariables);
  };

  ContainerConstructor.contextTypes = containerContextTypes;
  ContainerConstructor.displayName = containerName;
  ContainerConstructor.moduleName = null;

  return ContainerConstructor;
}

module.exports = { create: create };