/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule RelayQueryPath
 * 
 * @typechecks
 */

'use strict';

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _extends = require('babel-runtime/helpers/extends')['default'];

var GraphQLStoreDataHandler = require('./GraphQLStoreDataHandler');

var RelayNodeInterface = require('./RelayNodeInterface');
var RelayQuery = require('./RelayQuery');

var invariant = require('fbjs/lib/invariant');

var ID = RelayNodeInterface.ID;
var NODE_TYPE = RelayNodeInterface.NODE_TYPE;
var TYPENAME = RelayNodeInterface.TYPENAME;

var idField = RelayQuery.Field.build({
  fieldName: ID,
  type: 'String'
});
var typeField = RelayQuery.Field.build({
  fieldName: TYPENAME,
  type: 'String'
});

/**
 * @internal
 *
 * Represents the path (root plus fields) within a query that fetched a
 * particular node. Each step of the path may represent a root query (for
 * refetchable nodes) or the field path from the nearest refetchable node.
 */

var RelayQueryPath = (function () {
  function RelayQueryPath(node, parent) {
    _classCallCheck(this, RelayQueryPath);

    if (node instanceof RelayQuery.Root) {
      !!parent ? process.env.NODE_ENV !== 'production' ? invariant(false, 'RelayQueryPath: Root paths may not have a parent.') : invariant(false) : undefined;
      this._name = node.getName();
    } else {
      !parent ? process.env.NODE_ENV !== 'production' ? invariant(false, 'RelayQueryPath: A parent is required for field paths.') : invariant(false) : undefined;
      this._name = parent.getName();
    }
    this._node = node;
    this._parent = parent;
  }

  /**
   * Returns true if this is a root path (the node is a root node with an ID),
   * false otherwise.
   */

  RelayQueryPath.prototype.isRootPath = function isRootPath() {
    return !this._parent;
  };

  /**
   * Gets the parent path, throwing if it does not exist. Use `!isRootPath()`
   * to check if there is a parent.
   */

  RelayQueryPath.prototype.getParent = function getParent() {
    var parent = this._parent;
    !parent ? process.env.NODE_ENV !== 'production' ? invariant(false, 'RelayQueryPath.getParent(): Cannot get the parent of a root path.') : invariant(false) : undefined;
    return parent;
  };

  /**
   * Helper to get the name of the root query node.
   */

  RelayQueryPath.prototype.getName = function getName() {
    return this._name;
  };

  /**
   * Gets a new path that describes how to access the given `node` via the
   * current path. Returns a new, root path if `dataID` is provided and
   * refetchable, otherwise returns an extension of the current path.
   */

  RelayQueryPath.prototype.getPath = function getPath(node, dataID) {
    if (GraphQLStoreDataHandler.isClientID(dataID)) {
      return new RelayQueryPath(node, this);
    } else {
      var root = RelayQuery.Root.build(this.getName(), RelayNodeInterface.NODE, dataID, [idField, typeField], { identifyingArgName: RelayNodeInterface.ID }, NODE_TYPE);
      return new RelayQueryPath(root);
    }
  };

  /**
   * Returns a new root query that follows only the fields in this path and then
   * appends the specified field/fragment at the node reached by the path.
   *
   * The query also includes any ID fields along the way.
   */

  RelayQueryPath.prototype.getQuery = function getQuery(appendNode) {
    var node = this._node;
    var path = this;
    var child = appendNode;
    while (node instanceof RelayQuery.Field || node instanceof RelayQuery.Fragment) {
      var idFieldName = node instanceof RelayQuery.Field ? node.getInferredPrimaryKey() : ID;
      if (idFieldName) {
        child = node.clone([child, node.getFieldByStorageKey(idFieldName), node.getFieldByStorageKey(TYPENAME)]);
      } else {
        child = node.clone([child]);
      }
      path = path._parent;
      !path ? process.env.NODE_ENV !== 'production' ? invariant(false, 'RelayQueryPath.getQuery(): Expected a parent path.') : invariant(false) : undefined;
      node = path._node;
    }
    !child ? process.env.NODE_ENV !== 'production' ? invariant(false, 'RelayQueryPath: Expected a leaf node.') : invariant(false) : undefined;
    !(node instanceof RelayQuery.Root) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'RelayQueryPath: Expected a root node.') : invariant(false) : undefined;
    var metadata = _extends({}, node.getConcreteQueryNode().metadata);
    var identifyingArg = node.getIdentifyingArg();
    if (identifyingArg && identifyingArg.name != null) {
      metadata.identifyingArgName = identifyingArg.name;
    }
    return RelayQuery.Root.build(this.getName(), node.getFieldName(), identifyingArg && identifyingArg.value || null, [child, node.getFieldByStorageKey(ID), node.getFieldByStorageKey(TYPENAME)], metadata, node.getType());
  };

  return RelayQueryPath;
})();

module.exports = RelayQueryPath;