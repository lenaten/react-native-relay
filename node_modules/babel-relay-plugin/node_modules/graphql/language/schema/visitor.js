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
exports.visitSchema = visitSchema;

var _visitor = require('../visitor');

var SchemaKeys = {
  Name: _visitor.QueryDocumentKeys.Name,

  SchemaDocument: ['definitions'],
  TypeDefinition: ['name', 'interfaces', 'fields'],
  FieldDefinition: ['name', 'arguments', 'type'],
  InputValueDefinition: ['name', 'type', 'defaultValue'],
  InterfaceDefinition: ['name', 'fields'],
  UnionDefinition: ['name', 'types'],
  ScalarDefinition: ['name'],
  EnumDefinition: ['name', 'values'],
  EnumValueDefinition: ['name'],
  InputObjectDefinition: ['name', 'fields'],

  IntValue: _visitor.QueryDocumentKeys.IntValue,
  FloatValue: _visitor.QueryDocumentKeys.FloatValue,
  StringValue: _visitor.QueryDocumentKeys.StringValue,
  BooleanValue: _visitor.QueryDocumentKeys.BooleanValue,
  EnumValue: _visitor.QueryDocumentKeys.EnumValue,
  ListValue: _visitor.QueryDocumentKeys.ListValue,
  ObjectValue: _visitor.QueryDocumentKeys.ObjectValue,
  ObjectField: _visitor.QueryDocumentKeys.ObjectField,

  NamedType: _visitor.QueryDocumentKeys.NamedType,
  ListType: _visitor.QueryDocumentKeys.ListType,
  NonNullType: _visitor.QueryDocumentKeys.NonNullType
};

exports.SchemaKeys = SchemaKeys;

function visitSchema(root, visitor, keys) {
  return (0, _visitor.visit)(root, visitor, keys || SchemaKeys);
}