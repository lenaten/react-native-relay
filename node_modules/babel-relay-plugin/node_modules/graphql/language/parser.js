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
exports.parse = parse;
exports.parseValue = parseValue;
exports.parseName = parseName;
exports.parseConstValue = parseConstValue;
exports.parseType = parseType;
exports.parseNamedType = parseNamedType;

var _source = require('./source');

var _error = require('../error');

var _lexer = require('./lexer');

var _kinds = require('./kinds');

var _parserCore = require('./parserCore');

/**
 * Given a GraphQL source, parses it into a Document.
 * Throws GraphQLError if a syntax error is encountered.
 */

function parse(source, options) {
  var sourceObj = source instanceof _source.Source ? source : new _source.Source(source);
  var parser = (0, _parserCore.makeParser)(sourceObj, options || {});
  return parseDocument(parser);
}

/**
 * Given a string containing a GraphQL value, parse the AST for that value.
 * Throws GraphQLError if a syntax error is encountered.
 *
 * This is useful within tools that operate upon GraphQL Values directly and
 * in isolation of complete GraphQL documents.
 */

function parseValue(source, options) {
  var sourceObj = source instanceof _source.Source ? source : new _source.Source(source);
  var parser = (0, _parserCore.makeParser)(sourceObj, options || {});
  return parseValueLiteral(parser);
}

/**
 * Converts a name lex token into a name parse node.
 */

function parseName(parser) {
  var token = (0, _parserCore.expect)(parser, _lexer.TokenKind.NAME);
  return {
    kind: _kinds.NAME,
    value: token.value,
    loc: (0, _parserCore.loc)(parser, token.start)
  };
}

// Implements the parsing rules in the Document section.

function parseDocument(parser) {
  var start = parser.token.start;
  var definitions = [];
  do {
    if ((0, _parserCore.peek)(parser, _lexer.TokenKind.BRACE_L)) {
      definitions.push(parseOperationDefinition(parser));
    } else if ((0, _parserCore.peek)(parser, _lexer.TokenKind.NAME)) {
      if (parser.token.value === 'query' || parser.token.value === 'mutation') {
        definitions.push(parseOperationDefinition(parser));
      } else if (parser.token.value === 'fragment') {
        definitions.push(parseFragmentDefinition(parser));
      } else {
        throw (0, _parserCore.unexpected)(parser);
      }
    } else {
      throw (0, _parserCore.unexpected)(parser);
    }
  } while (!(0, _parserCore.skip)(parser, _lexer.TokenKind.EOF));
  return {
    kind: _kinds.DOCUMENT,
    definitions: definitions,
    loc: (0, _parserCore.loc)(parser, start)
  };
}

// Implements the parsing rules in the Operations section.

function parseOperationDefinition(parser) {
  var start = parser.token.start;
  if ((0, _parserCore.peek)(parser, _lexer.TokenKind.BRACE_L)) {
    return {
      kind: _kinds.OPERATION_DEFINITION,
      operation: 'query',
      name: null,
      variableDefinitions: null,
      directives: [],
      selectionSet: parseSelectionSet(parser),
      loc: (0, _parserCore.loc)(parser, start)
    };
  }
  var operationToken = (0, _parserCore.expect)(parser, _lexer.TokenKind.NAME);
  var operation = operationToken.value;
  return {
    kind: _kinds.OPERATION_DEFINITION,
    operation: operation,
    name: parseName(parser),
    variableDefinitions: parseVariableDefinitions(parser),
    directives: parseDirectives(parser),
    selectionSet: parseSelectionSet(parser),
    loc: (0, _parserCore.loc)(parser, start)
  };
}

function parseVariableDefinitions(parser) {
  return (0, _parserCore.peek)(parser, _lexer.TokenKind.PAREN_L) ? (0, _parserCore.many)(parser, _lexer.TokenKind.PAREN_L, parseVariableDefinition, _lexer.TokenKind.PAREN_R) : [];
}

function parseVariableDefinition(parser) {
  var start = parser.token.start;
  return {
    kind: _kinds.VARIABLE_DEFINITION,
    variable: parseVariable(parser),
    type: ((0, _parserCore.expect)(parser, _lexer.TokenKind.COLON), parseType(parser)),
    defaultValue: (0, _parserCore.skip)(parser, _lexer.TokenKind.EQUALS) ? parseValueLiteral(parser, true) : null,
    loc: (0, _parserCore.loc)(parser, start)
  };
}

function parseVariable(parser) {
  var start = parser.token.start;
  (0, _parserCore.expect)(parser, _lexer.TokenKind.DOLLAR);
  return {
    kind: _kinds.VARIABLE,
    name: parseName(parser),
    loc: (0, _parserCore.loc)(parser, start)
  };
}

function parseSelectionSet(parser) {
  var start = parser.token.start;
  return {
    kind: _kinds.SELECTION_SET,
    selections: (0, _parserCore.many)(parser, _lexer.TokenKind.BRACE_L, parseSelection, _lexer.TokenKind.BRACE_R),
    loc: (0, _parserCore.loc)(parser, start)
  };
}

function parseSelection(parser) {
  return (0, _parserCore.peek)(parser, _lexer.TokenKind.SPREAD) ? parseFragment(parser) : parseField(parser);
}

/**
 * Corresponds to both Field and Alias in the spec
 */
function parseField(parser) {
  var start = parser.token.start;

  var nameOrAlias = parseName(parser);
  var alias;
  var name;
  if ((0, _parserCore.skip)(parser, _lexer.TokenKind.COLON)) {
    alias = nameOrAlias;
    name = parseName(parser);
  } else {
    alias = null;
    name = nameOrAlias;
  }

  return {
    kind: _kinds.FIELD,
    alias: alias,
    name: name,
    arguments: parseArguments(parser),
    directives: parseDirectives(parser),
    selectionSet: (0, _parserCore.peek)(parser, _lexer.TokenKind.BRACE_L) ? parseSelectionSet(parser) : null,
    loc: (0, _parserCore.loc)(parser, start)
  };
}

function parseArguments(parser) {
  return (0, _parserCore.peek)(parser, _lexer.TokenKind.PAREN_L) ? (0, _parserCore.many)(parser, _lexer.TokenKind.PAREN_L, parseArgument, _lexer.TokenKind.PAREN_R) : [];
}

function parseArgument(parser) {
  var start = parser.token.start;
  return {
    kind: _kinds.ARGUMENT,
    name: parseName(parser),
    value: ((0, _parserCore.expect)(parser, _lexer.TokenKind.COLON), parseValueLiteral(parser, false)),
    loc: (0, _parserCore.loc)(parser, start)
  };
}

// Implements the parsing rules in the Fragments section.

/**
 * Corresponds to both FragmentSpread and InlineFragment in the spec
 */
function parseFragment(parser) {
  var start = parser.token.start;
  (0, _parserCore.expect)(parser, _lexer.TokenKind.SPREAD);
  if (parser.token.value === 'on') {
    (0, _parserCore.advance)(parser);
    return {
      kind: _kinds.INLINE_FRAGMENT,
      typeCondition: parseNamedType(parser),
      directives: parseDirectives(parser),
      selectionSet: parseSelectionSet(parser),
      loc: (0, _parserCore.loc)(parser, start)
    };
  }
  return {
    kind: _kinds.FRAGMENT_SPREAD,
    name: parseFragmentName(parser),
    directives: parseDirectives(parser),
    loc: (0, _parserCore.loc)(parser, start)
  };
}

function parseFragmentName(parser) {
  if (parser.token.value === 'on') {
    throw (0, _parserCore.unexpected)(parser);
  }
  return parseName(parser);
}

function parseFragmentDefinition(parser) {
  var start = parser.token.start;
  (0, _parserCore.expectKeyword)(parser, 'fragment');
  return {
    kind: _kinds.FRAGMENT_DEFINITION,
    name: parseFragmentName(parser),
    typeCondition: ((0, _parserCore.expectKeyword)(parser, 'on'), parseNamedType(parser)),
    directives: parseDirectives(parser),
    selectionSet: parseSelectionSet(parser),
    loc: (0, _parserCore.loc)(parser, start)
  };
}

// Implements the parsing rules in the Values section.

function parseConstValue(parser) {
  return parseValueLiteral(parser, true);
}

function parseValueValue(parser) {
  return parseValueLiteral(parser, false);
}

function parseValueLiteral(parser, isConst) {
  var token = parser.token;
  switch (token.kind) {
    case _lexer.TokenKind.BRACKET_L:
      return parseList(parser, isConst);
    case _lexer.TokenKind.BRACE_L:
      return parseObject(parser, isConst);
    case _lexer.TokenKind.INT:
      (0, _parserCore.advance)(parser);
      return {
        kind: _kinds.INT,
        value: token.value,
        loc: (0, _parserCore.loc)(parser, token.start)
      };
    case _lexer.TokenKind.FLOAT:
      (0, _parserCore.advance)(parser);
      return {
        kind: _kinds.FLOAT,
        value: token.value,
        loc: (0, _parserCore.loc)(parser, token.start)
      };
    case _lexer.TokenKind.STRING:
      (0, _parserCore.advance)(parser);
      return {
        kind: _kinds.STRING,
        value: token.value,
        loc: (0, _parserCore.loc)(parser, token.start)
      };
    case _lexer.TokenKind.NAME:
      if (token.value === 'true' || token.value === 'false') {
        (0, _parserCore.advance)(parser);
        return {
          kind: _kinds.BOOLEAN,
          value: token.value === 'true',
          loc: (0, _parserCore.loc)(parser, token.start)
        };
      } else if (token.value !== 'null') {
        (0, _parserCore.advance)(parser);
        return {
          kind: _kinds.ENUM,
          value: token.value,
          loc: (0, _parserCore.loc)(parser, token.start)
        };
      }
      break;
    case _lexer.TokenKind.DOLLAR:
      if (!isConst) {
        return parseVariable(parser);
      }
      break;
  }
  throw (0, _parserCore.unexpected)(parser);
}

function parseList(parser, isConst) {
  var start = parser.token.start;
  var item = isConst ? parseConstValue : parseValueValue;
  return {
    kind: _kinds.LIST,
    values: (0, _parserCore.any)(parser, _lexer.TokenKind.BRACKET_L, item, _lexer.TokenKind.BRACKET_R),
    loc: (0, _parserCore.loc)(parser, start)
  };
}

function parseObject(parser, isConst) {
  var start = parser.token.start;
  (0, _parserCore.expect)(parser, _lexer.TokenKind.BRACE_L);
  var fieldNames = {};
  var fields = [];
  while (!(0, _parserCore.skip)(parser, _lexer.TokenKind.BRACE_R)) {
    fields.push(parseObjectField(parser, isConst, fieldNames));
  }
  return {
    kind: _kinds.OBJECT,
    fields: fields,
    loc: (0, _parserCore.loc)(parser, start)
  };
}

function parseObjectField(parser, isConst, fieldNames) {
  var start = parser.token.start;
  var name = parseName(parser);
  if (fieldNames.hasOwnProperty(name.value)) {
    throw (0, _error.syntaxError)(parser.source, start, 'Duplicate input object field ' + name.value + '.');
  }
  fieldNames[name.value] = true;
  return {
    kind: _kinds.OBJECT_FIELD,
    name: name,
    value: ((0, _parserCore.expect)(parser, _lexer.TokenKind.COLON), parseValueLiteral(parser, isConst)),
    loc: (0, _parserCore.loc)(parser, start)
  };
}

// Implements the parsing rules in the Directives section.

function parseDirectives(parser) {
  var directives = [];
  while ((0, _parserCore.peek)(parser, _lexer.TokenKind.AT)) {
    directives.push(parseDirective(parser));
  }
  return directives;
}

function parseDirective(parser) {
  var start = parser.token.start;
  (0, _parserCore.expect)(parser, _lexer.TokenKind.AT);
  return {
    kind: _kinds.DIRECTIVE,
    name: parseName(parser),
    arguments: parseArguments(parser),
    loc: (0, _parserCore.loc)(parser, start)
  };
}

// Implements the parsing rules in the Types section.

/**
 * Handles the Type: NamedType, ListType, and NonNullType parsing rules.
 */

function parseType(parser) {
  var start = parser.token.start;
  var type;
  if ((0, _parserCore.skip)(parser, _lexer.TokenKind.BRACKET_L)) {
    type = parseType(parser);
    (0, _parserCore.expect)(parser, _lexer.TokenKind.BRACKET_R);
    type = {
      kind: _kinds.LIST_TYPE,
      type: type,
      loc: (0, _parserCore.loc)(parser, start)
    };
  } else {
    type = parseNamedType(parser);
  }
  if ((0, _parserCore.skip)(parser, _lexer.TokenKind.BANG)) {
    return {
      kind: _kinds.NON_NULL_TYPE,
      type: type,
      loc: (0, _parserCore.loc)(parser, start)
    };
  }
  return type;
}

function parseNamedType(parser) {
  var start = parser.token.start;
  return {
    kind: _kinds.NAMED_TYPE,
    name: parseName(parser),
    loc: (0, _parserCore.loc)(parser, start)
  };
}