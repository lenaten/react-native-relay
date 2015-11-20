
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
exports.locatedError = locatedError;

var _GraphQLError = require('./GraphQLError');

/**
 * Given an arbitrary Error, presumably thrown while attempting to execute a
 * GraphQL operation, produce a new GraphQLError aware of the location in the
 * document responsible for the original Error.
 */

function locatedError(error, nodes) {
  var message = error ? error.message || String(error) : 'An unknown error occurred.';
  var stack = error ? error.stack : null;
  return new _GraphQLError.GraphQLError(message, nodes, stack);
}