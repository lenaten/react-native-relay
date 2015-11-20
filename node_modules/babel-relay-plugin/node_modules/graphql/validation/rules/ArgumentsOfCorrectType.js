
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
exports.badValueMessage = badValueMessage;
exports.ArgumentsOfCorrectType = ArgumentsOfCorrectType;

var _error = require('../../error');

var _languagePrinter = require('../../language/printer');

var _utilitiesIsValidLiteralValue = require('../../utilities/isValidLiteralValue');

function badValueMessage(argName, type, value) {
  return 'Argument "' + argName + '" expected type "' + type + '" but got: ' + value + '.';
}

/**
 * Argument values of correct type
 *
 * A GraphQL document is only valid if all field argument literal values are
 * of the type expected by their position.
 */

function ArgumentsOfCorrectType(context) {
  return {
    Argument: function Argument(argAST) {
      var argDef = context.getArgument();
      if (argDef && !(0, _utilitiesIsValidLiteralValue.isValidLiteralValue)(argDef.type, argAST.value)) {
        return new _error.GraphQLError(badValueMessage(argAST.name.value, argDef.type, (0, _languagePrinter.print)(argAST.value)), [argAST.value]);
      }
    }
  };
}