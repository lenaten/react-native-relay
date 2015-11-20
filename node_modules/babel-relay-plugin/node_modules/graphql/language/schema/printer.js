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
exports.printSchema = printSchema;

var _visitor = require('./visitor');

var _printer = require('../printer');

/**
 * Converts a Schema AST into a string, using one set of reasonable
 * formatting rules.
 */

function printSchema(ast) {
  return (0, _visitor.visitSchema)(ast, { leave: printSchemaASTReducer });
}

var printSchemaASTReducer = {
  Name: _printer.printDocASTReducer.Name,

  // Document

  SchemaDocument: function SchemaDocument(_ref) {
    var definitions = _ref.definitions;
    return (0, _printer.join)(definitions, '\n\n') + '\n';
  },

  TypeDefinition: function TypeDefinition(_ref2) {
    var name = _ref2.name;
    var interfaces = _ref2.interfaces;
    var fields = _ref2.fields;
    return 'type ' + name + ' ' + (0, _printer.wrap)('implements ', (0, _printer.join)(interfaces, ', '), ' ') + (0, _printer.block)(fields);
  },

  FieldDefinition: function FieldDefinition(_ref3) {
    var name = _ref3.name;
    var args = _ref3.arguments;
    var type = _ref3.type;
    return name + (0, _printer.wrap)('(', (0, _printer.join)(args, ', '), ')') + ': ' + type;
  },

  InputValueDefinition: function InputValueDefinition(_ref4) {
    var name = _ref4.name;
    var type = _ref4.type;
    var defaultValue = _ref4.defaultValue;
    return name + ': ' + type + (0, _printer.wrap)(' = ', defaultValue);
  },

  InterfaceDefinition: function InterfaceDefinition(_ref5) {
    var name = _ref5.name;
    var fields = _ref5.fields;
    return 'interface ' + name + ' ' + (0, _printer.block)(fields);
  },

  UnionDefinition: function UnionDefinition(_ref6) {
    var name = _ref6.name;
    var types = _ref6.types;
    return 'union ' + name + ' = ' + (0, _printer.join)(types, ' | ');
  },

  ScalarDefinition: function ScalarDefinition(_ref7) {
    var name = _ref7.name;
    return 'scalar ' + name;
  },

  EnumDefinition: function EnumDefinition(_ref8) {
    var name = _ref8.name;
    var values = _ref8.values;
    return 'enum ' + name + ' ' + (0, _printer.block)(values);
  },

  EnumValueDefinition: function EnumValueDefinition(_ref9) {
    var name = _ref9.name;
    return name;
  },

  InputObjectDefinition: function InputObjectDefinition(_ref10) {
    var name = _ref10.name;
    var fields = _ref10.fields;
    return 'input ' + name + ' ' + (0, _printer.block)(fields);
  },

  // Value

  IntValue: _printer.printDocASTReducer.IntValue,
  FloatValue: _printer.printDocASTReducer.FloatValue,
  StringValue: _printer.printDocASTReducer.StringValue,
  BooleanValue: _printer.printDocASTReducer.BooleanValue,
  EnumValue: _printer.printDocASTReducer.EnumValue,
  ListValue: _printer.printDocASTReducer.ListValue,
  ObjectValue: _printer.printDocASTReducer.ObjectValue,
  ObjectField: _printer.printDocASTReducer.ObjectField,

  // Type

  NamedType: _printer.printDocASTReducer.NamedType,
  ListType: _printer.printDocASTReducer.ListType,
  NonNullType: _printer.printDocASTReducer.NonNullType
};
exports.printSchemaASTReducer = printSchemaASTReducer;