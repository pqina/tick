import { createTranslator } from '../animate';

export default (stiffness, damping, mass) => {

	let current = null;
	let translator = null;

	return (value, cb) => {

		value = parseFloat(value);

		if (current === null) {
			current = value;
			cb(value);
			return;
		}

		if (!translator) {
			translator = createTranslator('spring', stiffness, damping, mass);
			translator.update(cb, current, value);
		}
		else {
			translator.update(cb, value);
		}

	}

}