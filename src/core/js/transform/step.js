import { createTranslator } from '../animate';

export default (velocity) => {

	let initial = null;
	let previous = null;
	let translator = null;

	return (value, cb) => {

		value = parseFloat(value);

		if (initial === null) {
			initial = value;
			cb(value);
			return;
		}

		if (previous !== null && initial === value) {
			translator.cancel();
			translator = null;
		}

		if (!translator) {
			translator = createTranslator('step', velocity);
			translator.update(cb, initial, value);
		}
		else {
			translator.update(cb, value);
		}

		previous = value;

	}

}