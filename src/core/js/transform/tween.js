import { animate } from '../animate';
import { ExtensionType, getExtension } from '../extensions/index';
import { toDuration } from '../style';

export default (duration, ease = 'ease-linear', delay) => {

	duration = toDuration(duration);

	const easeFn = getExtension(ExtensionType.EASING_FUNCTION, ease);
	let cancel = null;
	let previous = null;
	
	return (value, cb) => {

		value = parseFloat(value);

		if (cancel) {
			cancel();
		}
		
		// force value if
		// - no previous value defined
		// - is same value
		// - distance between from and to is too large
		if (previous === null || 
			value === previous) {
			previous = value;
			cb(value);
			return;
		}
		
		const to = value;
		const from = previous;
		const dist = to - from;
			
		cancel = animate((p) => {
			cb(from + (p * dist));
		}, () => {
			cancel = null;
		}, duration, easeFn, delay);

		previous = value;
	}

}