// Import chai.
const chai = require('chai');
const path = require('path');
const expect = chai.expect;

chai.expect();

// Import the Rectangle class.
let Style = require(path.join(__dirname, '../src/core/js/', 'style'));

describe('Style Parser', () => {

	describe('Generic', () => {

		it('should parse property', () => {

			const styles = Style.toStyles('foo:bar');
			expect(styles.foo).to.equal('bar');

		});

	});

	describe('Transitions', () => {

		it('should parse transition name', () => {

			const styles = Style.toStyles('transition:move');
			expect(styles.transition[0].name).to.equal('move')

		});

		it('should parse transition name parameters', () => {

			const styles = Style.toStyles('transition:move(0, 1, horizontal)');
			expect(styles.transition[0].parameters).to.include.members([0, 1, 'horizontal'])

		});

		it('should parse transition duration in milliseconds', () => {

			const styles = Style.toStyles('transition:move 500ms');
			expect(styles.transition[0].duration).to.equal(500);

		});

		it('should parse transition duration in seconds', () => {

			const styles = Style.toStyles('transition:move 5s');
			expect(styles.transition[0].duration).to.equal(5000);

		});

		it('should parse transition duration in fractions of seconds', () => {

			const styles = Style.toStyles('transition:move .5s');
			expect(styles.transition[0].duration).to.equal(500);

		});

		it('should parse transition ease', () => {

			const styles = Style.toStyles('transition:move .5s ease-out-quad');
			expect(styles.transition[0].ease).to.equal('ease-out-quad');

		});

		it('should parse transition delay', () => {

			const styles = Style.toStyles('transition:move .5s ease-out-quad 500ms');
			expect(styles.transition[0].delay).to.equal(500);

		});

		it('should parse transition origin', () => {

			const styles = Style.toStyles('transition:move origin(top left) .5s ease-out-quad 500ms');
			expect(styles.transition[0].origin).to.equal('top left');

		});

	});

});