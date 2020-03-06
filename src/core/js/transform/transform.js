export default (...transforms) => (value, cb) => {

	const output = [];
	const input = value;

	transforms.forEach((t, i) => {

		t(input, (out) => {

			output[i] = out;

			if (i === transforms.length - 1) {
				cb(output.length === 1 ? output[0] : output);
			}

		});

	});

}