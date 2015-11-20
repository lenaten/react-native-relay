
/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _slicedToArray = require('babel-runtime/helpers/sliced-to-array')['default'];

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var _Map = require('babel-runtime/core-js/map')['default'];

var _Set = require('babel-runtime/core-js/set')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.fieldsConflictMessage = fieldsConflictMessage;
exports.OverlappingFieldsCanBeMerged = OverlappingFieldsCanBeMerged;

// Field name and reason.

// Reason is a string, or a nested list of conflicts.

var _error = require('../../error');

var _jsutilsFind = require('../../jsutils/find');

var _jsutilsFind2 = _interopRequireDefault(_jsutilsFind);

var _languageKinds = require('../../language/kinds');

var _languagePrinter = require('../../language/printer');

var _typeDefinition = require('../../type/definition');

var _utilitiesTypeFromAST = require('../../utilities/typeFromAST');

function fieldsConflictMessage(responseName, reason) {
  return 'Fields "' + responseName + '" conflict because ' + reasonMessage(reason) + '.';
}

function reasonMessage(reason) {
  if (Array.isArray(reason)) {
    return reason.map(function (_ref) {
      var _ref2 = _slicedToArray(_ref, 2);

      var responseName = _ref2[0];
      var subreason = _ref2[1];
      return 'subfields "' + responseName + '" conflict because ' + reasonMessage(subreason);
    }).join(' and ');
  }
  return reason;
}

/**
 * Overlapping fields can be merged
 *
 * A selection set is only valid if all fields (including spreading any
 * fragments) either correspond to distinct response names or can be merged
 * without ambiguity.
 */

function OverlappingFieldsCanBeMerged(context) {
  var comparedSet = new PairSet();

  function findConflicts(fieldMap) {
    var conflicts = [];
    _Object$keys(fieldMap).forEach(function (responseName) {
      var fields = fieldMap[responseName];
      if (fields.length > 1) {
        for (var i = 0; i < fields.length; i++) {
          for (var j = i; j < fields.length; j++) {
            var conflict = findConflict(responseName, fields[i], fields[j]);
            if (conflict) {
              conflicts.push(conflict);
            }
          }
        }
      }
    });
    return conflicts;
  }

  function findConflict(responseName, pair1, pair2) {
    var _pair1 = _slicedToArray(pair1, 2);

    var ast1 = _pair1[0];
    var def1 = _pair1[1];

    var _pair2 = _slicedToArray(pair2, 2);

    var ast2 = _pair2[0];
    var def2 = _pair2[1];

    if (ast1 === ast2 || comparedSet.has(ast1, ast2)) {
      return;
    }
    comparedSet.add(ast1, ast2);

    var name1 = ast1.name.value;
    var name2 = ast2.name.value;
    if (name1 !== name2) {
      return [[responseName, name1 + ' and ' + name2 + ' are different fields'], [ast1, ast2]];
    }

    var type1 = def1 && def1.type;
    var type2 = def2 && def2.type;
    if (type1 && type2 && !sameType(type1, type2)) {
      return [[responseName, 'they return differing types ' + type1 + ' and ' + type2], [ast1, ast2]];
    }

    if (!sameArguments(ast1.arguments || [], ast2.arguments || [])) {
      return [[responseName, 'they have differing arguments'], [ast1, ast2]];
    }

    if (!sameDirectives(ast1.directives || [], ast2.directives || [])) {
      return [[responseName, 'they have differing directives'], [ast1, ast2]];
    }

    var selectionSet1 = ast1.selectionSet;
    var selectionSet2 = ast2.selectionSet;
    if (selectionSet1 && selectionSet2) {
      var visitedFragmentNames = {};
      var subfieldMap = collectFieldASTsAndDefs(context, (0, _typeDefinition.getNamedType)(type1), selectionSet1, visitedFragmentNames);
      subfieldMap = collectFieldASTsAndDefs(context, (0, _typeDefinition.getNamedType)(type2), selectionSet2, visitedFragmentNames, subfieldMap);
      var conflicts = findConflicts(subfieldMap);
      if (conflicts.length > 0) {
        return [[responseName, conflicts.map(function (_ref3) {
          var _ref32 = _slicedToArray(_ref3, 1);

          var reason = _ref32[0];
          return reason;
        })], conflicts.reduce(function (allFields, _ref4) {
          var _ref42 = _slicedToArray(_ref4, 2);

          var fields = _ref42[1];
          return allFields.concat(fields);
        }, [ast1, ast2])];
      }
    }
  }

  return {
    SelectionSet: {
      // Note: we validate on the reverse traversal so deeper conflicts will be
      // caught first, for clearer error messages.
      leave: function leave(selectionSet) {
        var fieldMap = collectFieldASTsAndDefs(context, context.getParentType(), selectionSet);
        var conflicts = findConflicts(fieldMap);
        if (conflicts.length) {
          return conflicts.map(function (_ref5) {
            var _ref52 = _slicedToArray(_ref5, 2);

            var _ref52$0 = _slicedToArray(_ref52[0], 2);

            var responseName = _ref52$0[0];
            var reason = _ref52$0[1];
            var fields = _ref52[1];
            return new _error.GraphQLError(fieldsConflictMessage(responseName, reason), fields);
          });
        }
      }
    }
  };
}

function sameDirectives(directives1, directives2) {
  if (directives1.length !== directives2.length) {
    return false;
  }
  return directives1.every(function (directive1) {
    var directive2 = (0, _jsutilsFind2['default'])(directives2, function (directive) {
      return directive.name.value === directive1.name.value;
    });
    if (!directive2) {
      return false;
    }
    return sameArguments(directive1.arguments || [], directive2.arguments || []);
  });
}

function sameArguments(arguments1, arguments2) {
  if (arguments1.length !== arguments2.length) {
    return false;
  }
  return arguments1.every(function (argument1) {
    var argument2 = (0, _jsutilsFind2['default'])(arguments2, function (argument) {
      return argument.name.value === argument1.name.value;
    });
    if (!argument2) {
      return false;
    }
    return sameValue(argument1.value, argument2.value);
  });
}

function sameValue(value1, value2) {
  return !value1 && !value2 || (0, _languagePrinter.print)(value1) === (0, _languagePrinter.print)(value2);
}

function sameType(type1, type2) {
  return String(type1) === String(type2);
}

/**
 * Given a selectionSet, adds all of the fields in that selection to
 * the passed in map of fields, and returns it at the end.
 *
 * Note: This is not the same as execution's collectFields because at static
 * time we do not know what object type will be used, so we unconditionally
 * spread in all fragments.
 */
function collectFieldASTsAndDefs(context, parentType, selectionSet, visitedFragmentNames, astAndDefs) {
  var _visitedFragmentNames = visitedFragmentNames || {};
  var _astAndDefs = astAndDefs || {};
  for (var i = 0; i < selectionSet.selections.length; i++) {
    var selection = selectionSet.selections[i];
    switch (selection.kind) {
      case _languageKinds.FIELD:
        var fieldName = selection.name.value;
        var fieldDef;
        if (parentType instanceof _typeDefinition.GraphQLObjectType || parentType instanceof _typeDefinition.GraphQLInterfaceType) {
          fieldDef = parentType.getFields()[fieldName];
        }
        var responseName = selection.alias ? selection.alias.value : fieldName;
        if (!_astAndDefs[responseName]) {
          _astAndDefs[responseName] = [];
        }
        _astAndDefs[responseName].push([selection, fieldDef]);
        break;
      case _languageKinds.INLINE_FRAGMENT:
        _astAndDefs = collectFieldASTsAndDefs(context, (0, _utilitiesTypeFromAST.typeFromAST)(context.getSchema(), selection.typeCondition), selection.selectionSet, _visitedFragmentNames, _astAndDefs);
        break;
      case _languageKinds.FRAGMENT_SPREAD:
        var fragName = selection.name.value;
        if (_visitedFragmentNames[fragName]) {
          continue;
        }
        _visitedFragmentNames[fragName] = true;
        var fragment = context.getFragment(fragName);
        if (!fragment) {
          continue;
        }
        _astAndDefs = collectFieldASTsAndDefs(context, (0, _utilitiesTypeFromAST.typeFromAST)(context.getSchema(), fragment.typeCondition), fragment.selectionSet, _visitedFragmentNames, _astAndDefs);
        break;
    }
  }
  return _astAndDefs;
}

/**
 * A way to keep track of pairs of things when the ordering of the pair does
 * not matter. We do this by maintaining a sort of double adjacency sets.
 */

var PairSet = (function () {
  function PairSet() {
    _classCallCheck(this, PairSet);

    this._data = new _Map();
  }

  _createClass(PairSet, [{
    key: 'has',
    value: function has(a, b) {
      var first = this._data.get(a);
      return first && first.has(b);
    }
  }, {
    key: 'add',
    value: function add(a, b) {
      _pairSetAdd(this._data, a, b);
      _pairSetAdd(this._data, b, a);
    }
  }]);

  return PairSet;
})();

function _pairSetAdd(data, a, b) {
  var set = data.get(a);
  if (!set) {
    set = new _Set();
    data.set(a, set);
  }
  set.add(b);
}