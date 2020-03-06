/**
 * Helper methods for building the API
 */
import { create, destroy, parse, find, setConstant, setPreset } from './TickDOM';
import { addExtension, ExtensionType } from './extensions/index';
import { request, dashesToCamels } from './utils';
import { setTimer } from './timer';
import { dateFromISO, duration, now, isDate } from './date';
import { countdownAmount, countdownDuration, countUpDuration, countScheduled } from './count';
import support from './support';

/**
 * We wan't to be sure Rollup includes these collections in the output packages so that's why they are referenced here
 */
import { Transforms } from './transform/index';
import { EasingFunctions } from './easing';
import { Transitions } from './transitions';
import { Views } from './view/index';

const API = {

	/**
	 * Quick way to detect if Tick is supported
	 */
	supported: support(),

	// options
	options:{
		setConstant,
		setPreset
	},

	/**
	 * Helper Methods
	 */
	helper:{

		// Starts an interval and calls callback method on each tick
		interval: setTimer,

		// Returns current time or date object based on ISO
		date: (iso) => iso ? dateFromISO(iso) : now(),

		// Returns duration in milliseconds or duration between two dates
		duration
	},

	/**
	 * Data Access
	 */
	data:{

		// Request data from a url
		request,

		// Poll a URL for data with a set interval
		poll: (url, cb, interval = 60000) => {
			return setTimer(() => {
				request(url, cb);
			}, interval);
		}

	},

	/**
	 * DOM Operations
	 */
	DOM:{

		// Create a new ticker
		create,

		// Destroy an existing ticker
		destroy,

		// Parse a piece of the DOM for tickers
		parse,

		// Find a specific ticker by DOM node
		find

	},

	count:{
		down: (...args) => {

			// if is `amount` and `unit type`, 10 seconds
			if (typeof args[0] === 'number' && typeof args[1] === 'string') {
				const value = args[0];
				const units = args[1].toLowerCase();
				args.shift();
				args[0] = duration(value, units);
				args[1] = args[1] || {};
				args[1].units = units;
				return countdownAmount(...args);
			}

			// is date or iso string
			if (typeof args[0] === 'string' || isDate(args[0])) {
				return countdownDuration(...args);
			}

			return null;
		},
		up: countUpDuration,
		schedule: countScheduled
	},


	/**
	 * Public method to extend Tick functionality
	 */
	plugin:{
		add:(type, name, fn) => {
			if (typeof type === 'function') {
				const extension = type;
				return addExtension(
					extension.identifier.type,
					extension.identifier.name,
					extension
				);
			}
			return addExtension(type, name, fn);
		}
	}

};

// expose shortcut methods
for (let type in ExtensionType) {
	if (!ExtensionType.hasOwnProperty(type)) { continue; }
	API.plugin[dashesToCamels('add-' + ExtensionType[type])] = (name, fn) => {
		addExtension(ExtensionType[type], name, fn);
	}
}

export default API;