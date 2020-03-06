/**
 * @param a { object }
 * @param b { object }
 */
export const mergeObjects = (a, b = {}) => {

	let key;
	const obj = {};

	for (key in a) {
		if (!a.hasOwnProperty(key)) {
			continue;
		}
		obj[key] = typeof b[key] === 'undefined' ? a[key] : b[key];
	}

	return obj;
};