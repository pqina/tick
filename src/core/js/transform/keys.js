export default (...keys) => {
	return (value, cb) => {
		const output = {};
		value.forEach((v,i) => {
			output[keys[i]] = v;
		});
		cb(output);
	}
}