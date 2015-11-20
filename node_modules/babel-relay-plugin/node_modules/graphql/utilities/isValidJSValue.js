
/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * Given a JavaScript value and a GraphQL type, determine if the value will be
 * accepted for that type. This is primarily useful for validating the
 * runtime values of query variables.
 */
'use strict';

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.isValidJSValue = isValidJSValue;

var _jsutilsInvariant = require('../jsutils/invariant');

var _jsutilsInvariant2 = _interopRequireDefault(_jsutilsInvariant);

var _jsutilsIsNullish = require('../jsutils/isNullish');

var _jsutilsIsNullish2 = _interopRequireDefault(_jsutilsIsNullish);

var _typeDefinition = require('../type/definition');

function isValidJSValue(_x, _x2) {
  var _again = true;

  _function: while (_again) {
    var value = _x,
        type = _x2;
    nullableType = itemType = fields = undefined;
    _again = false;

    // A value must be provided if the type is non-null.
    if (type instanceof _typeDefinition.GraphQLNonNull) {
      if ((0, _jsutilsIsNullish2['default'])(value)) {
        return false;
      }
      var nullableType = type.ofType;
      _x = value;
      _x2 = nullableType;
      _again = true;
      continue _function;
    }

    if ((0, _jsutilsIsNullish2['default'])(value)) {
      return true;
    }

    // Lists accept a non-list value as a list of one.
    if (type instanceof _typeDefinition.GraphQLList) {
      var itemType = type.ofType;
      if (Array.isArray(value)) {
        return value.every(function (item) {
          return isValidJSValue(item, itemType);
        });
      }
      _x = value;
      _x2 = itemType;
      _again = true;
      continue _function;
    }

    // Input objects check each defined field.
    if (type instanceof _typeDefinition.GraphQLInputObjectType) {
      if (typeof value !== 'object') {
        return false;
      }
      var fields = type.getFields();

      // Ensure every provided field is defined.
      if (_Object$keys(value).some(function (fieldName) {
        return !fields[fieldName];
      })) {
        return false;
      }

      // Ensure every defined field is valid.
      return _Object$keys(fields).every(function (fieldName) {
        return isValidJSValue(value[fieldName], fields[fieldName].type);
      });
    }

    (0, _jsutilsInvariant2['default'])(type instanceof _typeDefinition.GraphQLScalarType || type instanceof _typeDefinition.GraphQLEnumType, 'Must be input type');

    // Scalar/Enum input checks to ensure the type can parse the value to
    // a non-null value.
    return !(0, _jsutilsIsNullish2['default'])(type.parseValue(value));
  }
}