
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
exports.defaultForNonNullArgMessage = defaultForNonNullArgMessage;
exports.badValueForDefaultArgMessage = badValueForDefaultArgMessage;
exports.DefaultValuesOfCorrectType = DefaultValuesOfCorrectType;

var _error = require('../../error');

var _languagePrinter = require('../../language/printer');

var _typeDefinition = require('../../type/definition');

var _utilitiesIsValidLiteralValue = require('../../utilities/isValidLiteralValue');

function defaultForNonNullArgMessage(varName, type, guessType) {
  return 'Variable "$' + varName + '" of type "' + type + '" is required and will not ' + ('use the default value. Perhaps you meant to use type "' + guessType + '".');
}

function badValueForDefaultArgMessage(varName, type, value) {
  return 'Variable "$' + varName + '" of type "' + type + '" has invalid default ' + ('value: ' + value + '.');
}

/**
 * Variable default values of correct type
 *
 * A GraphQL document is only valid if all variable default values are of the
 * type expected by their definition.
 */

function DefaultValuesOfCorrectType(context) {
  return {
    VariableDefinition: function VariableDefinition(varDefAST) {
      var name = varDefAST.variable.name.value;
      var defaultValue = varDefAST.defaultValue;
      var type = context.getInputType();
      if (type instanceof _typeDefinition.GraphQLNonNull && defaultValue) {
        return new _error.GraphQLError(defaultForNonNullArgMessage(name, type, type.ofType), [defaultValue]);
      }
      if (type && defaultValue && !(0, _utilitiesIsValidLiteralValue.isValidLiteralValue)(type, defaultValue)) {
        return new _error.GraphQLError(badValueForDefaultArgMessage(name, type, (0, _languagePrinter.print)(defaultValue)), [defaultValue]);
      }
    }
  };
}