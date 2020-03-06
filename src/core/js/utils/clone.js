/**
 * @param obj { object }
 */
export const clone = (obj) => {
	if (typeof obj === 'object' && obj !== null) {
		return JSON.parse(JSON.stringify(obj));
	}
	return obj;
};