
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
exports.unusedVariableMessage = unusedVariableMessage;
exports.NoUnusedVariables = NoUnusedVariables;

var _error = require('../../error');

function unusedVariableMessage(varName) {
  return 'Variable "$' + varName + '" is never used.';
}

/**
 * No unused variables
 *
 * A GraphQL operation is only valid if all variables defined by an operation
 * are used, either directly or within a spread fragment.
 */

function NoUnusedVariables() {
  var visitedFragmentNames = {};
  var variableDefs = [];
  var variableNameUsed = {};

  return {
    // Visit FragmentDefinition after visiting FragmentSpread
    visitSpreadFragments: true,

    OperationDefinition: {
      enter: function enter() {
        visitedFragmentNames = {};
        variableDefs = [];
        variableNameUsed = {};
      },
      leave: function leave() {
        var errors = variableDefs.filter(function (def) {
          return variableNameUsed[def.variable.name.value] !== true;
        }).map(function (def) {
          return new _error.GraphQLError(unusedVariableMessage(def.variable.name.value), [def]);
        });
        if (errors.length > 0) {
          return errors;
        }
      }
    },
    VariableDefinition: function VariableDefinition(def) {
      variableDefs.push(def);
      // Do not visit deeper, or else the defined variable name will be visited.
      return false;
    },
    Variable: function Variable(variable) {
      variableNameUsed[variable.name.value] = true;
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