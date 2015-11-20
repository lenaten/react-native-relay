
/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.unusedFragMessage = unusedFragMessage;
exports.NoUnusedFragments = NoUnusedFragments;

var _error = require('../../error');

function unusedFragMessage(fragName) {
  return 'Fragment "' + fragName + '" is never used.';
}

/**
 * No unused fragments
 *
 * A GraphQL document is only valid if all fragment definitions are spread
 * within operations, or spread within other fragments spread within operations.
 */

function NoUnusedFragments() {
  var fragmentDefs = [];
  var spreadsWithinOperation = [];
  var fragAdjacencies = {};
  var spreadNames = {};

  return {
    OperationDefinition: function OperationDefinition() {
      spreadNames = {};
      spreadsWithinOperation.push(spreadNames);
    },
    FragmentDefinition: function FragmentDefinition(def) {
      fragmentDefs.push(def);
      spreadNames = {};
      fragAdjacencies[def.name.value] = spreadNames;
    },
    FragmentSpread: function FragmentSpread(spread) {
      spreadNames[spread.name.value] = true;
    },
    Document: {
      leave: function leave() {
        var fragmentNameUsed = {};
        var reduceSpreadFragments = function reduceSpreadFragments(spreads) {
          var keys = _Object$keys(spreads);
          keys.forEach(function (fragName) {
            if (fragmentNameUsed[fragName] !== true) {
              fragmentNameUsed[fragName] = true;
              var adjacencies = fragAdjacencies[fragName];
              if (adjacencies) {
                reduceSpreadFragments(adjacencies);
              }
            }
          });
        };
        spreadsWithinOperation.forEach(reduceSpreadFragments);
        var errors = fragmentDefs.filter(function (def) {
          return fragmentNameUsed[def.name.value] !== true;
        }).map(function (def) {
          return new _error.GraphQLError(unusedFragMessage(def.name.value), [def]);
        });
        if (errors.length > 0) {
          return errors;
        }
      }
    }
  };
}