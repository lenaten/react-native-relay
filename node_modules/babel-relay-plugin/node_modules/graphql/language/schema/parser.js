
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
exports.parseSchemaIntoAST = parseSchemaIntoAST;

var _source = require('../source');

var _lexer = require('../lexer');

var _parserCore = require('../parserCore');

var _parser = require('../parser');

var _kinds = require('./kinds');

function parseSchemaIntoAST(source, options) {
  var sourceObj = source instanceof _source.Source ? source : new _source.Source(source);
  var parser = (0, _parserCore.makeParser)(sourceObj, options || {});
  return parseSchemaDocument(parser);
}

/**
 * SchemaDocument : SchemaDefinition+
 */
function parseSchemaDocument(parser) {
  var start = parser.token.start;
  var definitions = [];
  do {
    definitions.push(parseSchemaDefinition(parser));
  } while (!(0, _parserCore.skip)(parser, _lexer.TokenKind.EOF));

  return {
    kind: _kinds.SCHEMA_DOCUMENT,
    definitions: definitions,
    loc: (0, _parserCore.loc)(parser, start)
  };
}

/**
 * SchemaDefinition :
 *   - TypeDefinition
 *   - InterfaceDefinition
 *   - UnionDefinition
 *   - ScalarDefinition
 *   - EnumDefinition
 *   - InputObjectDefinition
 */
function parseSchemaDefinition(parser) {
  if (!(0, _parserCore.peek)(parser, _lexer.TokenKind.NAME)) {
    throw (0, _parserCore.unexpected)(parser);
  }
  switch (parser.token.value) {
    case 'type':
      return parseTypeDefinition(parser);
    case 'interface':
      return parseInterfaceDefinition(parser);
    case 'union':
      return parseUnionDefinition(parser);
    case 'scalar':
      return parseScalarDefinition(parser);
    case 'enum':
      return parseEnumDefinition(parser);
    case 'input':
      return parseInputObjectDefinition(parser);
    default:
      throw (0, _parserCore.unexpected)(parser);
  }
}

/**
 * TypeDefinition : TypeName ImplementsInterfaces? { FieldDefinition+ }
 *
 * TypeName : Name
 */
function parseTypeDefinition(parser) {
  var start = parser.token.start;
  (0, _parserCore.expectKeyword)(parser, 'type');
  var name = (0, _parser.parseName)(parser);
  var interfaces = parseImplementsInterfaces(parser);
  var fields = (0, _parserCore.any)(parser, _lexer.TokenKind.BRACE_L, parseFieldDefinition, _lexer.TokenKind.BRACE_R);
  return {
    kind: _kinds.TYPE_DEFINITION,
    name: name,
    interfaces: interfaces,
    fields: fields,
    loc: (0, _parserCore.loc)(parser, start)
  };
}

/**
 * ImplementsInterfaces : `implements` NamedType+
 */
function parseImplementsInterfaces(parser) {
  var types = [];
  if (parser.token.value === 'implements') {
    (0, _parserCore.advance)(parser);
    do {
      types.push((0, _parser.parseNamedType)(parser));
    } while (!(0, _parserCore.peek)(parser, _lexer.TokenKind.BRACE_L));
  }
  return types;
}

/**
 * FieldDefinition : FieldName ArgumentsDefinition? : Type
 *
 * FieldName : Name
 */
function parseFieldDefinition(parser) {
  var start = parser.token.start;
  var name = (0, _parser.parseName)(parser);
  var args = parseArgumentDefs(parser);
  (0, _parserCore.expect)(parser, _lexer.TokenKind.COLON);
  var type = (0, _parser.parseType)(parser);
  return {
    kind: _kinds.FIELD_DEFINITION,
    name: name,
    arguments: args,
    type: type,
    loc: (0, _parserCore.loc)(parser, start)
  };
}

/**
 * ArgumentsDefinition : ( InputValueDefinition+ )
 */
function parseArgumentDefs(parser) {
  if (!(0, _parserCore.peek)(parser, _lexer.TokenKind.PAREN_L)) {
    return [];
  }
  return (0, _parserCore.many)(parser, _lexer.TokenKind.PAREN_L, parseInputValueDef, _lexer.TokenKind.PAREN_R);
}

/**
 * InputValueDefinition : Name : Value[Const] DefaultValue?
 *
 * DefaultValue : = Value[Const]
 */
function parseInputValueDef(parser) {
  var start = parser.token.start;
  var name = (0, _parser.parseName)(parser);
  (0, _parserCore.expect)(parser, _lexer.TokenKind.COLON);
  var type = (0, _parser.parseType)(parser, false);
  var defaultValue = null;
  if ((0, _parserCore.skip)(parser, _lexer.TokenKind.EQUALS)) {
    defaultValue = (0, _parser.parseConstValue)(parser);
  }
  return {
    kind: _kinds.INPUT_VALUE_DEFINITION,
    name: name,
    type: type,
    defaultValue: defaultValue,
    loc: (0, _parserCore.loc)(parser, start)
  };
}

/**
 * InterfaceDefinition : `interface` TypeName { Fields+ }
 */
function parseInterfaceDefinition(parser) {
  var start = parser.token.start;
  (0, _parserCore.expectKeyword)(parser, 'interface');
  var name = (0, _parser.parseName)(parser);
  var fields = (0, _parserCore.any)(parser, _lexer.TokenKind.BRACE_L, parseFieldDefinition, _lexer.TokenKind.BRACE_R);
  return {
    kind: _kinds.INTERFACE_DEFINITION,
    name: name,
    fields: fields,
    loc: (0, _parserCore.loc)(parser, start)
  };
}

/**
 * UnionDefinition : `union` TypeName = UnionMembers
 */
function parseUnionDefinition(parser) {
  var start = parser.token.start;
  (0, _parserCore.expectKeyword)(parser, 'union');
  var name = (0, _parser.parseName)(parser);
  (0, _parserCore.expect)(parser, _lexer.TokenKind.EQUALS);
  var types = parseUnionMembers(parser);
  return {
    kind: _kinds.UNION_DEFINITION,
    name: name,
    types: types,
    loc: (0, _parserCore.loc)(parser, start)
  };
}

/**
 * UnionMembers :
 *   - NamedType
 *   - UnionMembers | NamedType
 */
function parseUnionMembers(parser) {
  var members = [];
  do {
    members.push((0, _parser.parseNamedType)(parser));
  } while ((0, _parserCore.skip)(parser, _lexer.TokenKind.PIPE));
  return members;
}

/**
 * ScalarDefinition : `scalar` TypeName
 */
function parseScalarDefinition(parser) {
  var start = parser.token.start;
  (0, _parserCore.expectKeyword)(parser, 'scalar');
  var name = (0, _parser.parseName)(parser);
  return {
    kind: _kinds.SCALAR_DEFINITION,
    name: name,
    loc: (0, _parserCore.loc)(parser, start)
  };
}

/**
 * EnumDefinition : `enum` TypeName { EnumValueDefinition+ }
 */
function parseEnumDefinition(parser) {
  var start = parser.token.start;
  (0, _parserCore.expectKeyword)(parser, 'enum');
  var name = (0, _parser.parseName)(parser);
  var values = (0, _parserCore.many)(parser, _lexer.TokenKind.BRACE_L, parseEnumValueDefinition, _lexer.TokenKind.BRACE_R);
  return {
    kind: _kinds.ENUM_DEFINITION,
    name: name,
    values: values,
    loc: (0, _parserCore.loc)(parser, start)
  };
}

/**
 * EnumValueDefinition : EnumValue
 *
 * EnumValue : Name
 */
function parseEnumValueDefinition(parser) {
  var start = parser.token.start;
  var name = (0, _parser.parseName)(parser);
  return {
    kind: _kinds.ENUM_VALUE_DEFINITION,
    name: name,
    loc: (0, _parserCore.loc)(parser, start)
  };
}

/**
 * InputObjectDefinition : `input` TypeName { InputValueDefinition+ }
 */
function parseInputObjectDefinition(parser) {
  var start = parser.token.start;
  (0, _parserCore.expectKeyword)(parser, 'input');
  var name = (0, _parser.parseName)(parser);
  var fields = (0, _parserCore.any)(parser, _lexer.TokenKind.BRACE_L, parseInputValueDef, _lexer.TokenKind.BRACE_R);
  return {
    kind: _kinds.INPUT_OBJECT_DEFINITION,
    name: name,
    fields: fields,
    loc: (0, _parserCore.loc)(parser, start)
  };
}