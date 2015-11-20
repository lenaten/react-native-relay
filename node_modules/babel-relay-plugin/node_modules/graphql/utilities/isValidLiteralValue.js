
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

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.isValidLiteralValue = isValidLiteralValue;

var _languageKinds = require('../language/kinds');

var _typeDefinition = require('../type/definition');

var _jsutilsInvariant = require('../jsutils/invariant');

var _jsutilsInvariant2 = _interopRequireDefault(_jsutilsInvariant);

var _jsutilsKeyMap = require('../jsutils/keyMap');

var _jsutilsKeyMap2 = _interopRequireDefault(_jsutilsKeyMap);

var _jsutilsIsNullish = require('../jsutils/isNullish');

var _jsutilsIsNullish2 = _interopRequireDefault(_jsutilsIsNullish);

/**
 * Utility for validators which determines if a value literal AST is valid given
 * an input type.
 *
 * Note that this only validates literal values, variables are assumed to
 * provide values of the correct type.
 */

function isValidLiteralValue(_x, _x2) {
  var _again = true;

  _function: while (_again) {
    var type = _x,
        valueAST = _x2;
    ofType = itemType = fields = fieldASTs = fieldASTMap = undefined;
    _again = false;

    // A value must be provided if the type is non-null.
    if (type instanceof _typeDefinition.GraphQLNonNull) {
      if (!valueAST) {
        return false;
      }
      var ofType = type.ofType;
      _x = ofType;
      _x2 = valueAST;
      _again = true;
      continue _function;
    }

    if (!valueAST) {
      return true;
    }

    // This function only tests literals, and assumes variables will provide
    // values of the correct type.
    if (valueAST.kind === _languageKinds.VARIABLE) {
      return true;
    }

    // Lists accept a non-list value as a list of one.
    if (type instanceof _typeDefinition.GraphQLList) {
      var itemType = type.ofType;
      if (valueAST.kind === _languageKinds.LIST) {
        return valueAST.values.every(function (itemAST) {
          return isValidLiteralValue(itemType, itemAST);
        });
      }
      _x = itemType;
      _x2 = valueAST;
      _again = true;
      continue _function;
    }

    // Input objects check each defined field and look for undefined fields.
    if (type instanceof _typeDefinition.GraphQLInputObjectType) {
      if (valueAST.kind !== _languageKinds.OBJECT) {
        return false;
      }
      var fields = type.getFields();

      // Ensure every provided field is defined.
      var fieldASTs = valueAST.fields;
      if (fieldASTs.some(function (fieldAST) {
        return !fields[fieldAST.name.value];
      })) {
        return false;
      }

      // Ensure every defined field is valid.
      var fieldASTMap = (0, _jsutilsKeyMap2['default'])(fieldASTs, function (fieldAST) {
        return fieldAST.name.value;
      });
      return _Object$keys(fields).every(function (fieldName) {
        return isValidLiteralValue(fields[fieldName].type, fieldASTMap[fieldName] && fieldASTMap[fieldName].value);
      });
    }

    (0, _jsutilsInvariant2['default'])(type instanceof _typeDefinition.GraphQLScalarType || type instanceof _typeDefinition.GraphQLEnumType, 'Must be input type');

    // Scalar/Enum input checks to ensure the type can parse the value to
    // a non-null value.
    return !(0, _jsutilsIsNullish2['default'])(type.parseLiteral(valueAST));
  }
}