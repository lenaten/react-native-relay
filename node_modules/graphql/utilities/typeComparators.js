
/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * Provided two types, return true if the types are equal (invariant).
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.isEqualType = isEqualType;
exports.isTypeSubTypeOf = isTypeSubTypeOf;

var _typeDefinition = require('../type/definition');

function isEqualType(_x, _x2) {
  var _again = true;

  _function: while (_again) {
    var typeA = _x,
        typeB = _x2;
    _again = false;

    // Equivalent types are equal.
    if (typeA === typeB) {
      return true;
    }

    // If either type is non-null, the other must also be non-null.
    if (typeA instanceof _typeDefinition.GraphQLNonNull && typeB instanceof _typeDefinition.GraphQLNonNull) {
      _x = typeA.ofType;
      _x2 = typeB.ofType;
      _again = true;
      continue _function;
    }

    // If either type is a list, the other must also be a list.
    if (typeA instanceof _typeDefinition.GraphQLList && typeB instanceof _typeDefinition.GraphQLList) {
      _x = typeA.ofType;
      _x2 = typeB.ofType;
      _again = true;
      continue _function;
    }

    // Otherwise the types are not equal.
    return false;
  }
}

/**
 * Provided a type and a super type, return true if the first type is either
 * equal or a subset of the second super type (covariant).
 */

function isTypeSubTypeOf(_x3, _x4) {
  var _again2 = true;

  _function2: while (_again2) {
    var maybeSubType = _x3,
        superType = _x4;
    _again2 = false;

    // Equivalent type is a valid subtype
    if (maybeSubType === superType) {
      return true;
    }

    // If superType is non-null, maybeSubType must also be nullable.
    if (superType instanceof _typeDefinition.GraphQLNonNull) {
      if (maybeSubType instanceof _typeDefinition.GraphQLNonNull) {
        _x3 = maybeSubType.ofType;
        _x4 = superType.ofType;
        _again2 = true;
        continue _function2;
      }
      return false;
    } else if (maybeSubType instanceof _typeDefinition.GraphQLNonNull) {
      // If superType is nullable, maybeSubType may be non-null.
      _x3 = maybeSubType.ofType;
      _x4 = superType;
      _again2 = true;
      continue _function2;
    }

    // If superType type is a list, maybeSubType type must also be a list.
    if (superType instanceof _typeDefinition.GraphQLList) {
      if (maybeSubType instanceof _typeDefinition.GraphQLList) {
        _x3 = maybeSubType.ofType;
        _x4 = superType.ofType;
        _again2 = true;
        continue _function2;
      }
      return false;
    } else if (maybeSubType instanceof _typeDefinition.GraphQLList) {
      // If superType is not a list, maybeSubType must also be not a list.
      return false;
    }

    // If superType type is an abstract type, maybeSubType type may be a currently
    // possible object type.
    if ((0, _typeDefinition.isAbstractType)(superType) && maybeSubType instanceof _typeDefinition.GraphQLObjectType && superType.isPossibleType(maybeSubType)) {
      return true;
    }

    // Otherwise, the child type is not a valid subtype of the parent type.
    return false;
  }
}