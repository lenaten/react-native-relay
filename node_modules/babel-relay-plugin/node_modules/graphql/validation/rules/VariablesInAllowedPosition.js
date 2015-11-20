
/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.badVarPosMessage = badVarPosMessage;
exports.VariablesInAllowedPosition = VariablesInAllowedPosition;

var _error = require('../../error');

var _typeDefinition = require('../../type/definition');

var _utilitiesTypeFromAST = require('../../utilities/typeFromAST');

function badVarPosMessage(varName, varType, expectedType) {
  return 'Variable "$' + varName + '" of type "' + varType + '" used in position ' + ('expecting type "' + expectedType + '".');
}

/**
 * Variables passed to field arguments conform to type
 */

function VariablesInAllowedPosition(context) {
  var varDefMap = {};
  var visitedFragmentNames = {};

  return {
    // Visit FragmentDefinition after visiting FragmentSpread
    visitSpreadFragments: true,

    OperationDefinition: function OperationDefinition() {
      varDefMap = {};
      visitedFragmentNames = {};
    },
    VariableDefinition: function VariableDefinition(varDefAST) {
      varDefMap[varDefAST.variable.name.value] = varDefAST;
    },
    FragmentSpread: function FragmentSpread(spreadAST) {
      // Only visit fragments of a particular name once per operation
      if (visitedFragmentNames[spreadAST.name.value]) {
        return false;
      }
      visitedFragmentNames[spreadAST.name.value] = true;
    },
    Variable: function Variable(variableAST) {
      var varName = variableAST.name.value;
      var varDef = varDefMap[varName];
      var varType = varDef && (0, _utilitiesTypeFromAST.typeFromAST)(context.getSchema(), varDef.type);
      var inputType = context.getInputType();
      if (varType && inputType && !varTypeAllowedForType(effectiveType(varType, varDef), inputType)) {
        return new _error.GraphQLError(badVarPosMessage(varName, varType, inputType), [variableAST]);
      }
    }
  };
}

// If a variable definition has a default value, it's effectively non-null.
function effectiveType(varType, varDef) {
  return !varDef.defaultValue || varType instanceof _typeDefinition.GraphQLNonNull ? varType : new _typeDefinition.GraphQLNonNull(varType);
}

// A var type is allowed if it is the same or more strict than the expected
// type. It can be more strict if the variable type is non-null when the
// expected type is nullable. If both are list types, the variable item type can
// be more strict than the expected item type.
function varTypeAllowedForType(_x, _x2) {
  var _again = true;

  _function: while (_again) {
    var varType = _x,
        expectedType = _x2;
    _again = false;

    if (expectedType instanceof _typeDefinition.GraphQLNonNull) {
      if (varType instanceof _typeDefinition.GraphQLNonNull) {
        _x = varType.ofType;
        _x2 = expectedType.ofType;
        _again = true;
        continue _function;
      }
      return false;
    }
    if (varType instanceof _typeDefinition.GraphQLNonNull) {
      _x = varType.ofType;
      _x2 = expectedType;
      _again = true;
      continue _function;
    }
    if (varType instanceof _typeDefinition.GraphQLList && expectedType instanceof _typeDefinition.GraphQLList) {
      _x = varType.ofType;
      _x2 = expectedType.ofType;
      _again = true;
      continue _function;
    }
    return varType === expectedType;
  }
}