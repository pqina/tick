// Import chai.
const chai = require('chai');
const path = require('path');
const expect = chai.expect;

chai.expect();

// Import the Rectangle class.
let Parser = require(path.join(__dirname, '../src/core/js/', 'parser'));

describe('Transform Chain Parser', () => {

	describe('parseTransformChain', () => {
		[
			{
				input: 'foo()',
				output: [['foo']]
			},
			{
				input: 'foo',
				output: [['foo']]
			},
			{
				input: 'foo(a)',
				output: [['foo', 'a']]
			},
			{
				input: 'foo(\'a\')',
				output: [['foo', 'a']]
			},
			{
				input: 'foo("\'a\'")',
				output: [['foo', '\'a\'']]
			},
			{
				input: 'foo(\'a, b\')',
				output: [['foo', 'a, b']]
			},
			{
				input: 'foo(a, b)',
				output: [['foo', 'a', 'b']]
			},
			{
				input: 'foo() -> bar()',
				output: [[['foo'],['bar']]]
			},
			{
				input: 'foo -> bar',
				output: [[['foo'],['bar']]]
			},
			{
				input: 'foo() -> bar(), baz()',
				output: [[['foo'],['bar']],['baz']]
			},
			{
				input: 'foo -> bar, baz',
				output: [[['foo'],['bar']],['baz']]
			},
			{
				input: 'foo(bar() -> baz())',
				output: [['foo',[['bar'],['baz']]]]
			},
			{
				input: 'foo(bar -> baz)',
				output: [['foo',[['bar'],['baz']]]]
			},
			{
				input: 'foo() -> bar(baz(a, b), boz())',
				output: [[['foo'],['bar',['baz','a','b'],['boz']]]]
			},
			{
				input: 'foo() -> bar(baz(foo() -> bar()), boz())',
				output: [[['foo'],['bar',['baz',[['foo'],['bar']]],['boz']]]]
			}
		].forEach(chain => {

			it(`should parse "${ chain.input }"`, () => {
				const result = Parser.parseTransformChain(chain.input);
				if (result === null || chain.output === null) {
					expect(result).to.equal(chain.output);
				}
				else {
					expect(result).to.deep.equal(chain.output);
				}
			})

		});
		
	});
	

});