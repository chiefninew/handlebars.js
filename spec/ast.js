describe('ast', function() {
  if (!Handlebars.AST) {
    return;
  }

  var AST = Handlebars.AST;

  var LOCATION_INFO = {
    start: {
      line: 1,
      column: 1
    },
    end: {
      line: 1,
      column: 1
    }
  };

  function testLocationInfoStorage(node) {
    equals(node.loc.start.line, 1);
    equals(node.loc.start.column, 1);
    equals(node.loc.end.line, 1);
    equals(node.loc.end.column, 1);
  }

  describe('MustacheStatement', function() {
    it('should store args', function() {
      var mustache = new AST.MustacheStatement({}, null, null, true, {}, LOCATION_INFO);
      equals(mustache.type, 'MustacheStatement');
      equals(mustache.escaped, true);
      testLocationInfoStorage(mustache);
    });
  });
  describe('BlockStatement', function() {
    it('should throw on mustache mismatch', function() {
      shouldThrow(function() {
        handlebarsEnv.parse('\n  {{#foo}}{{/bar}}');
      }, Handlebars.Exception, "foo doesn't match bar - 2:5");
    });

    it('stores location info', function() {
      var mustacheNode = new AST.MustacheStatement([{ original: 'foo'}], null, null, false, {});
      var block = new AST.BlockStatement(
            mustacheNode,
            null, null,
            {body: []},
            {body: []},
            {},
            {},
            {},
            LOCATION_INFO);
      testLocationInfoStorage(block);
    });
  });
  describe('PathExpression', function() {
    it('stores location info', function() {
      var idNode = new AST.PathExpression(false, 0, [], 'foo', LOCATION_INFO);
      testLocationInfoStorage(idNode);
    });
  });

  describe('Hash', function() {
    it('stores location info', function() {
      var hash = new AST.Hash([], LOCATION_INFO);
      testLocationInfoStorage(hash);
    });
  });

  describe('ContentStatement', function() {
    it('stores location info', function() {
      var content = new AST.ContentStatement('HI', LOCATION_INFO);
      testLocationInfoStorage(content);
    });
  });

  describe('CommentStatement', function() {
    it('stores location info', function() {
      var comment = new AST.CommentStatement('HI', {}, LOCATION_INFO);
      testLocationInfoStorage(comment);
    });
  });

  describe('NumberLiteral', function() {
    it('stores location info', function() {
      var integer = new AST.NumberLiteral('6', LOCATION_INFO);
      testLocationInfoStorage(integer);
    });
  });

  describe('StringLiteral', function() {
    it('stores location info', function() {
      var string = new AST.StringLiteral('6', LOCATION_INFO);
      testLocationInfoStorage(string);
    });
  });

  describe('BooleanLiteral', function() {
    it('stores location info', function() {
      var bool = new AST.BooleanLiteral('true', LOCATION_INFO);
      testLocationInfoStorage(bool);
    });
  });

  describe('PartialStatement', function() {
    it('provides default params', function() {
      var pn = new AST.PartialStatement('so_partial', undefined, {}, {}, LOCATION_INFO);
      equals(pn.params.length, 0);
    });
    it('stores location info', function() {
      var pn = new AST.PartialStatement('so_partial', [], {}, {}, LOCATION_INFO);
      testLocationInfoStorage(pn);
    });
  });

  describe('Program', function() {
    it('storing location info', function() {
      var pn = new AST.Program([], null, {}, LOCATION_INFO);
      testLocationInfoStorage(pn);
    });
  });

  describe('SubExpression', function() {
    it('provides default params', function() {
      var pn = new AST.SubExpression('path', undefined, {}, LOCATION_INFO);
      equals(pn.params.length, 0);
    });
  });

  describe('helpers', function() {
    describe('#helperExpression', function() {
      it('should handle mustache statements', function() {
        equals(AST.helpers.helperExpression(new AST.MustacheStatement('foo', [], undefined, false, {}, LOCATION_INFO)), false);
        equals(AST.helpers.helperExpression(new AST.MustacheStatement('foo', [1], undefined, false, {}, LOCATION_INFO)), true);
        equals(AST.helpers.helperExpression(new AST.MustacheStatement('foo', [], {}, false, {}, LOCATION_INFO)), true);
      });
      it('should handle block statements', function() {
        equals(AST.helpers.helperExpression(new AST.BlockStatement('foo', [], undefined, false, {}, LOCATION_INFO)), false);
        equals(AST.helpers.helperExpression(new AST.BlockStatement('foo', [1], undefined, false, {}, LOCATION_INFO)), true);
        equals(AST.helpers.helperExpression(new AST.BlockStatement('foo', [], {}, false, {}, LOCATION_INFO)), true);
      });
      it('should handle subexpressions', function() {
        equals(AST.helpers.helperExpression(new AST.SubExpression()), true);
      });
      it('should work with non-helper nodes', function() {
        equals(AST.helpers.helperExpression(new AST.Program([], [], {}, LOCATION_INFO)), false);

        equals(AST.helpers.helperExpression(new AST.PartialStatement()), false);
        equals(AST.helpers.helperExpression(new AST.ContentStatement('a', LOCATION_INFO)), false);
        equals(AST.helpers.helperExpression(new AST.CommentStatement('a', {}, LOCATION_INFO)), false);

        equals(AST.helpers.helperExpression(new AST.PathExpression(false, 0, ['a'], 'a', LOCATION_INFO)), false);

        equals(AST.helpers.helperExpression(new AST.StringLiteral('a', LOCATION_INFO)), false);
        equals(AST.helpers.helperExpression(new AST.NumberLiteral(1, LOCATION_INFO)), false);
        equals(AST.helpers.helperExpression(new AST.BooleanLiteral(true, LOCATION_INFO)), false);
        equals(AST.helpers.helperExpression(new AST.UndefinedLiteral(LOCATION_INFO)), false);
        equals(AST.helpers.helperExpression(new AST.NullLiteral(LOCATION_INFO)), false);

        equals(AST.helpers.helperExpression(new AST.Hash([], LOCATION_INFO)), false);
        equals(AST.helpers.helperExpression(new AST.HashPair('foo', 'bar', LOCATION_INFO)), false);
      });
    });
  });

  describe('Line Numbers', function() {
    var ast, body;

    function testColumns(node, firstLine, lastLine, firstColumn, lastColumn) {
      equals(node.loc.start.line, firstLine);
      equals(node.loc.start.column, firstColumn);
      equals(node.loc.end.line, lastLine);
      equals(node.loc.end.column, lastColumn);
    }

    ast = Handlebars.parse(
              'line 1 {{line1Token}}\n'             // 1
            + ' line 2 {{line2token}}\n'            // 2
            + ' line 3 {{#blockHelperOnLine3}}\n'   // 3
            + 'line 4{{line4token}}\n'              // 4
            + 'line5{{else}}\n'                     // 5
            + '{{line6Token}}\n'                    // 6
            + '{{/blockHelperOnLine3}}\n'           // 7
            + '{{#open}}\n'                         // 8
            + '{{else inverse}}\n'                  // 9
            + '{{else}}\n'                          // 10
            + '{{/open}}');                         // 11
    body = ast.body;

    it('gets ContentNode line numbers', function() {
      var contentNode = body[0];
      testColumns(contentNode, 1, 1, 0, 7);
    });

    it('gets MustacheStatement line numbers', function() {
      var mustacheNode = body[1];
      testColumns(mustacheNode, 1, 1, 7, 21);
    });

    it('gets line numbers correct when newlines appear', function() {
      testColumns(body[2], 1, 2, 21, 8);
    });

    it('gets MustacheStatement line numbers correct across newlines', function() {
      var secondMustacheStatement = body[3];
      testColumns(secondMustacheStatement, 2, 2, 8, 22);
     });

     it('gets the block helper information correct', function() {
       var blockHelperNode = body[5];
       testColumns(blockHelperNode, 3, 7, 8, 23);
     });

     it('correctly records the line numbers the program of a block helper', function() {
       var blockHelperNode = body[5],
           program = blockHelperNode.program;

       testColumns(program, 3, 5, 31, 5);
     });

     it('correctly records the line numbers of an inverse of a block helper', function() {
       var blockHelperNode = body[5],
           inverse = blockHelperNode.inverse;

       testColumns(inverse, 5, 7, 13, 0);
     });

     it('correctly records the line number of chained inverses', function() {
       var chainInverseNode = body[7];

       testColumns(chainInverseNode.program, 8, 9, 9, 0);
       testColumns(chainInverseNode.inverse, 9, 10, 16, 0);
       testColumns(chainInverseNode.inverse.body[0].program, 9, 10, 16, 0);
       testColumns(chainInverseNode.inverse.body[0].inverse, 10, 11, 8, 0);
     });
  });

  describe('standalone flags', function() {
    describe('mustache', function() {
      it('does not mark mustaches as standalone', function() {
        var ast = Handlebars.parse('  {{comment}} ');
        equals(!!ast.body[0].value, true);
        equals(!!ast.body[2].value, true);
      });
    });
    describe('blocks', function() {
      it('marks block mustaches as standalone', function() {
        var ast = Handlebars.parse(' {{# comment}} \nfoo\n {{else}} \n  bar \n  {{/comment}} '),
            block = ast.body[1];

        equals(ast.body[0].value, '');

        equals(block.program.body[0].value, 'foo\n');
        equals(block.inverse.body[0].value, '  bar \n');

        equals(ast.body[2].value, '');
      });
      it('marks initial block mustaches as standalone', function() {
        var ast = Handlebars.parse('{{# comment}} \nfoo\n {{/comment}}'),
            block = ast.body[0];

        equals(block.program.body[0].value, 'foo\n');
      });
      it('marks mustaches with children as standalone', function() {
        var ast = Handlebars.parse('{{# comment}} \n{{foo}}\n {{/comment}}'),
            block = ast.body[0];

        equals(block.program.body[0].value, '');
        equals(block.program.body[1].path.original, 'foo');
        equals(block.program.body[2].value, '\n');
      });
      it('marks nested block mustaches as standalone', function() {
        var ast = Handlebars.parse('{{#foo}} \n{{# comment}} \nfoo\n {{else}} \n  bar \n  {{/comment}} \n{{/foo}}'),
            body = ast.body[0].program.body,
            block = body[1];

        equals(body[0].value, '');

        equals(block.program.body[0].value, 'foo\n');
        equals(block.inverse.body[0].value, '  bar \n');

        equals(body[0].value, '');
      });
      it('does not mark nested block mustaches as standalone', function() {
        var ast = Handlebars.parse('{{#foo}} {{# comment}} \nfoo\n {{else}} \n  bar \n  {{/comment}} {{/foo}}'),
            body = ast.body[0].program.body,
            block = body[1];

        equals(body[0].omit, undefined);

        equals(block.program.body[0].value, ' \nfoo\n');
        equals(block.inverse.body[0].value, '  bar \n  ');

        equals(body[0].omit, undefined);
      });
      it('does not mark nested initial block mustaches as standalone', function() {
        var ast = Handlebars.parse('{{#foo}}{{# comment}} \nfoo\n {{else}} \n  bar \n  {{/comment}}{{/foo}}'),
            body = ast.body[0].program.body,
            block = body[0];

        equals(block.program.body[0].value, ' \nfoo\n');
        equals(block.inverse.body[0].value, '  bar \n  ');

        equals(body[0].omit, undefined);
      });

      it('marks column 0 block mustaches as standalone', function() {
        var ast = Handlebars.parse('test\n{{# comment}} \nfoo\n {{else}} \n  bar \n  {{/comment}} '),
            block = ast.body[1];

        equals(ast.body[0].omit, undefined);

        equals(block.program.body[0].value, 'foo\n');
        equals(block.inverse.body[0].value, '  bar \n');

        equals(ast.body[2].value, '');
      });
    });
    describe('partials', function() {
      it('marks partial as standalone', function() {
        var ast = Handlebars.parse('{{> partial }} ');
        equals(ast.body[1].value, '');
      });
      it('marks indented partial as standalone', function() {
        var ast = Handlebars.parse('  {{> partial }} ');
        equals(ast.body[0].value, '');
        equals(ast.body[1].indent, '  ');
        equals(ast.body[2].value, '');
      });
      it('marks those around content as not standalone', function() {
        var ast = Handlebars.parse('a{{> partial }}');
        equals(ast.body[0].omit, undefined);

        ast = Handlebars.parse('{{> partial }}a');
        equals(ast.body[1].omit, undefined);
      });
    });
    describe('comments', function() {
      it('marks comment as standalone', function() {
        var ast = Handlebars.parse('{{! comment }} ');
        equals(ast.body[1].value, '');
      });
      it('marks indented comment as standalone', function() {
        var ast = Handlebars.parse('  {{! comment }} ');
        equals(ast.body[0].value, '');
        equals(ast.body[2].value, '');
      });
      it('marks those around content as not standalone', function() {
        var ast = Handlebars.parse('a{{! comment }}');
        equals(ast.body[0].omit, undefined);

        ast = Handlebars.parse('{{! comment }}a');
        equals(ast.body[1].omit, undefined);
      });
    });
  });
});

