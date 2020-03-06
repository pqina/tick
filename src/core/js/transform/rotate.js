export default (...transforms) => (value, cb) => {

	const input = Array.isArray(value) ? value : [value];
	const output = [];
	const totalTransforms = transforms.length;

	input.forEach((v,i)=> {

		transforms[i % totalTransforms](v, (out) => {

			output[i] = out;
			if (i === input.length - 1) {
				cb(output);
			}

		})
	});

}