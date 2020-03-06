import fraction from './fraction';
export default (min = 0, max = 100) => {
	const f = fraction(min, max);
	return (value, cb) => {
		f(value, (value) => {
			cb(value * 100)
		});
	}
}