
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

var _definition = require('./definition');

var _language = require('../language');

// Integers are only safe when between -(2^53 - 1) and 2^53 - 1 due to being
// encoded in JavaScript and represented in JSON as double-precision floating
// point numbers, as specified by IEEE 754.
var MAX_INT = 9007199254740991;
var MIN_INT = -9007199254740991;

function coerceInt(value) {
  var num = Number(value);
  if (num === num && num <= MAX_INT && num >= MIN_INT) {
    return (num < 0 ? Math.ceil : Math.floor)(num);
  }
  return null;
}

var GraphQLInt = new _definition.GraphQLScalarType({
  name: 'Int',
  serialize: coerceInt,
  parseValue: coerceInt,
  parseLiteral: function parseLiteral(ast) {
    if (ast.kind === _language.Kind.INT) {
      var num = parseInt(ast.value, 10);
      if (num <= MAX_INT && num >= MIN_INT) {
        return num;
      }
    }
    return null;
  }
});

exports.GraphQLInt = GraphQLInt;
function coerceFloat(value) {
  var num = Number(value);
  return num === num ? num : null;
}

var GraphQLFloat = new _definition.GraphQLScalarType({
  name: 'Float',
  serialize: coerceFloat,
  parseValue: coerceFloat,
  parseLiteral: function parseLiteral(ast) {
    return ast.kind === _language.Kind.FLOAT || ast.kind === _language.Kind.INT ? parseFloat(ast.value) : null;
  }
});

exports.GraphQLFloat = GraphQLFloat;
var GraphQLString = new _definition.GraphQLScalarType({
  name: 'String',
  serialize: String,
  parseValue: String,
  parseLiteral: function parseLiteral(ast) {
    return ast.kind === _language.Kind.STRING ? ast.value : null;
  }
});

exports.GraphQLString = GraphQLString;
var GraphQLBoolean = new _definition.GraphQLScalarType({
  name: 'Boolean',
  serialize: Boolean,
  parseValue: Boolean,
  parseLiteral: function parseLiteral(ast) {
    return ast.kind === _language.Kind.BOOLEAN ? ast.value : null;
  }
});

exports.GraphQLBoolean = GraphQLBoolean;
var GraphQLID = new _definition.GraphQLScalarType({
  name: 'ID',
  serialize: String,
  parseValue: String,
  parseLiteral: function parseLiteral(ast) {
    return ast.kind === _language.Kind.STRING || ast.kind === _language.Kind.INT ? ast.value : null;
  }
});
exports.GraphQLID = GraphQLID;