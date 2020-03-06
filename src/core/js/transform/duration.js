import { timeDuration } from '../date';

/**
 * milliseconds duration
 * @param format
 * @returns {function(*=, *)}
 */
export default (...format) => (value, cb) => cb(timeDuration(value, format));