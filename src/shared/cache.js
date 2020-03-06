const CACHE = {};

export default (value, fn) => {
	const fns = fn.toString();
	if (!CACHE[fns]) {
		CACHE[fns] = {};
	}
	if (!CACHE[fns][value]) {
		CACHE[fns][value] = fn(value);
	}
	return CACHE[fns][value];
}