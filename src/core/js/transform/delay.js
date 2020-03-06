import { copyArray, random, shuffle, range } from '../utils';

/**
 * @param order { String } - order of flipping > random | ltr | rtl (default)
 * @param min { Number } - min random delay
 * @param max { Number } - max random delay
 */
export default (order = 'rtl', min = 50, max = 50) => {

	let current = null;

	return (value, cb) => {

		// if no current value, set current value and -> exit
		if (!current) {
			current = copyArray(value);
			cb(copyArray(current));
			return;
		}

		current = order === 'rtl' ? current.slice(current.length - value.length, current.length) : current.slice(0, value.length);

		let indexes = range(value.length);

		if (order === 'random') {
			shuffle(indexes);
		}

		if (order === 'rtl') {
			indexes.reverse();
		}

		const update = () => {
			flip(indexes.shift(), current, value, cb);
			if (indexes.length) {
				setTimeout(update, random(min, max));
			}
		};

		update();
	}
}

const flip = (index, current, next, cb) => {
	current[index] = next[index];
	cb(copyArray(current));
};
