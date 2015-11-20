
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
exports.undefinedVarMessage = undefinedVarMessage;
exports.undefinedVarByOpMessage = undefinedVarByOpMessage;
exports.NoUndefinedVariables = NoUndefinedVariables;

var _error = require('../../error');

var _languageKinds = require('../../language/kinds');

function undefinedVarMessage(varName) {
  return 'Variable "$' + varName + '" is not defined.';
}

function undefinedVarByOpMessage(varName, opName) {
  return 'Variable "$' + varName + '" is not defined by operation "' + opName + '".';
}

/**
 * No undefined variables
 *
 * A GraphQL operation is only valid if all variables encountered, both directly
 * and via fragment spreads, are defined by that operation.
 */

function NoUndefinedVariables() {
  var operation;
  var visitedFragmentNames = {};
  var definedVariableNames = {};

  return {
    // Visit FragmentDefinition after visiting FragmentSpread
    visitSpreadFragments: true,

    OperationDefinition: function OperationDefinition(node) {
      operation = node;
      visitedFragmentNames = {};
      definedVariableNames = {};
    },
    VariableDefinition: function VariableDefinition(def) {
      definedVariableNames[def.variable.name.value] = true;
    },
    Variable: function Variable(variable, key, parent, path, ancestors) {
      var varName = variable.name.value;
      if (definedVariableNames[varName] !== true) {
        var withinFragment = ancestors.some(function (node) {
          return node.kind === _languageKinds.FRAGMENT_DEFINITION;
        });
        if (withinFragment && operation && operation.name) {
          return new _error.GraphQLError(undefinedVarByOpMessage(varName, operation.name.value), [variable, operation]);
        }
        return new _error.GraphQLError(undefinedVarMessage(varName), [variable]);
      }
    },
    FragmentSpread: function FragmentSpread(spreadAST) {
      // Only visit fragments of a particular name once per operation
      if (visitedFragmentNames[spreadAST.name.value] === true) {
        return false;
      }
      visitedFragmentNames[spreadAST.name.value] = true;
    }
  };
}