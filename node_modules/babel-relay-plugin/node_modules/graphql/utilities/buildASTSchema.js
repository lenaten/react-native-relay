/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.buildASTSchema = buildASTSchema;

var _jsutilsIsNullish = require('../jsutils/isNullish');

var _jsutilsIsNullish2 = _interopRequireDefault(_jsutilsIsNullish);

var _jsutilsKeyMap = require('../jsutils/keyMap');

var _jsutilsKeyMap2 = _interopRequireDefault(_jsutilsKeyMap);

var _jsutilsKeyValMap = require('../jsutils/keyValMap');

var _jsutilsKeyValMap2 = _interopRequireDefault(_jsutilsKeyValMap);

var _valueFromAST = require('./valueFromAST');

var _languageKinds = require('../language/kinds');

var _languageSchemaKinds = require('../language/schema/kinds');

var _languageSchemaAst = require('../language/schema/ast');

var _type = require('../type');

function buildWrappedType(innerType, inputTypeAST) {
  if (inputTypeAST.kind === _languageKinds.LIST_TYPE) {
    return new _type.GraphQLList(buildWrappedType(innerType, inputTypeAST.type));
  }
  if (inputTypeAST.kind === _languageKinds.NON_NULL_TYPE) {
    return new _type.GraphQLNonNull(buildWrappedType(innerType, inputTypeAST.type));
  }
  return innerType;
}

function getInnerTypeName(_x) {
  var _again = true;

  _function: while (_again) {
    var typeAST = _x;
    _again = false;

    if (typeAST.kind === _languageKinds.LIST_TYPE || typeAST.kind === _languageKinds.NON_NULL_TYPE) {
      _x = typeAST.type;
      _again = true;
      continue _function;
    }
    return typeAST.name.value;
  }
}

/**
 * This takes the ast of a schema document produced by parseSchema in
 * src/language/schema/parser.js.
 *
 * Given that AST it constructs a GraphQLSchema. As constructed
 * they are not particularly useful for non-introspection queries
 * since they have no resolve methods.
 */

function buildASTSchema(ast, queryTypeName, mutationTypeName) {

  if ((0, _jsutilsIsNullish2['default'])(ast)) {
    throw new Error('must pass in ast');
  }
  if ((0, _jsutilsIsNullish2['default'])(queryTypeName)) {
    throw new Error('must pass in query type');
  }

  var astMap = (0, _jsutilsKeyMap2['default'])(ast.definitions, function (d) {
    return d.name.value;
  });

  if ((0, _jsutilsIsNullish2['default'])(astMap[queryTypeName])) {
    throw new Error('Specified query type ' + queryTypeName + ' not found in document.');
  }

  if (!(0, _jsutilsIsNullish2['default'])(mutationTypeName) && (0, _jsutilsIsNullish2['default'])(astMap[mutationTypeName])) {
    throw new Error('Specified mutation type ' + mutationTypeName + ' not found in document.');
  }

  /**
   * This generates a function that allows you to produce
   * type definitions on demand. We produce the function
   * in order to close over the memoization dictionaries
   * that need to be retained over multiple functions calls.
   **/
  function getTypeDefProducer() {

    var innerTypeMap = {
      String: _type.GraphQLString,
      Int: _type.GraphQLInt,
      Float: _type.GraphQLFloat,
      Boolean: _type.GraphQLBoolean,
      ID: _type.GraphQLID
    };

    return function (typeAST) {
      var typeName = getInnerTypeName(typeAST);
      if (!(0, _jsutilsIsNullish2['default'])(innerTypeMap[typeName])) {
        return buildWrappedType(innerTypeMap[typeName], typeAST);
      }

      if ((0, _jsutilsIsNullish2['default'])(astMap[typeName])) {
        throw new Error('Type ' + typeName + ' not found in document');
      }

      var innerTypeDef = makeSchemaDef(astMap[typeName]);
      if ((0, _jsutilsIsNullish2['default'])(innerTypeDef)) {
        throw new Error('Nothing constructed for ' + typeName);
      }
      innerTypeMap[typeName] = innerTypeDef;
      return buildWrappedType(innerTypeDef, typeAST);
    };
  }

  var produceTypeDef = getTypeDefProducer(ast);

  ast.definitions.forEach(produceTypeDef);

  var queryType = produceTypeDef(astMap[queryTypeName]);
  var schema;
  if ((0, _jsutilsIsNullish2['default'])(mutationTypeName)) {
    schema = new _type.GraphQLSchema({ query: queryType });
  } else {
    schema = new _type.GraphQLSchema({
      query: queryType,
      mutation: produceTypeDef(astMap[mutationTypeName])
    });
  }

  return schema;

  function makeSchemaDef(def) {
    if ((0, _jsutilsIsNullish2['default'])(def)) {
      throw new Error('def must be defined');
    }
    switch (def.kind) {
      case _languageSchemaKinds.TYPE_DEFINITION:
        return makeTypeDef(def);
      case _languageSchemaKinds.INTERFACE_DEFINITION:
        return makeInterfaceDef(def);
      case _languageSchemaKinds.ENUM_DEFINITION:
        return makeEnumDef(def);
      case _languageSchemaKinds.UNION_DEFINITION:
        return makeUnionDef(def);
      case _languageSchemaKinds.SCALAR_DEFINITION:
        return makeScalarDef(def);
      case _languageSchemaKinds.INPUT_OBJECT_DEFINITION:
        return makeInputObjectDef(def);
      default:
        throw new Error(def.kind + ' not supported');
    }
  }

  function makeTypeDef(def) {
    var typeName = def.name.value;
    var config = {
      name: typeName,
      fields: function fields() {
        return makeFieldDefMap(def);
      },
      interfaces: function interfaces() {
        return makeImplementedInterfaces(def);
      }
    };
    return new _type.GraphQLObjectType(config);
  }

  function makeFieldDefMap(def) {
    return (0, _jsutilsKeyValMap2['default'])(def.fields, function (field) {
      return field.name.value;
    }, function (field) {
      return {
        type: produceTypeDef(field.type),
        args: makeInputValues(field.arguments)
      };
    });
  }

  function makeImplementedInterfaces(def) {
    return def.interfaces.map(function (inter) {
      return produceTypeDef(inter);
    });
  }

  function makeInputValues(values) {
    return (0, _jsutilsKeyValMap2['default'])(values, function (value) {
      return value.name.value;
    }, function (value) {
      var type = produceTypeDef(value.type);
      return { type: type, defaultValue: (0, _valueFromAST.valueFromAST)(value.defaultValue, type) };
    });
  }

  function makeInterfaceDef(def) {
    var typeName = def.name.value;
    var config = {
      name: typeName,
      resolveType: function resolveType() {
        return null;
      },
      fields: function fields() {
        return makeFieldDefMap(def);
      }
    };
    return new _type.GraphQLInterfaceType(config);
  }

  function makeEnumDef(def) {
    var enumType = new _type.GraphQLEnumType({
      name: def.name.value,
      values: (0, _jsutilsKeyValMap2['default'])(def.values, function (v) {
        return v.name.value;
      }, function () {
        return {};
      })
    });

    return enumType;
  }

  function makeUnionDef(def) {
    return new _type.GraphQLUnionType({
      name: def.name.value,
      resolveType: function resolveType() {
        return null;
      },
      types: def.types.map(function (t) {
        return produceTypeDef(t);
      })
    });
  }

  function makeScalarDef(def) {
    return new _type.GraphQLScalarType({
      name: def.name.value,
      serialize: function serialize() {
        return null;
      },
      // Note: validation calls the parse functions to determine if a
      // literal value is correct. Returning null would cause use of custom
      // scalars to always fail validation. Returning false causes them to
      // always pass validation.
      parseValue: function parseValue() {
        return false;
      },
      parseLiteral: function parseLiteral() {
        return false;
      }
    });
  }

  function makeInputObjectDef(def) {
    return new _type.GraphQLInputObjectType({
      name: def.name.value,
      fields: function fields() {
        return makeInputValues(def.fields);
      }
    });
  }
}