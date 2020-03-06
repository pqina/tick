export default (transform) => (value, cb) => {

	const output = [];
	const input = value;

	input.forEach((v, vi) => {

		transform(v, (out) => {

			output[vi] = out;

			if (vi === input.length - 1) {
				cb(output.concat());
			}

		});

	});


}