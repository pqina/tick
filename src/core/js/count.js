import { mergeObjects } from './utils';
import { setTimer } from './timer';
import { TimeUnit, clone, dateFromISO, dateDiff, now, isDate, serverDate, offsetDate, sameTime, toTimezoneOffset, timezoneDate } from './date';
import { getNextScheduledDate } from './scheduler';

/**
 * Returns the server offset based on the type of value
 * will subtract current time from server time resulting in a correction offset
 * @param server
 * @param cb
 * @returns {*}
 */
const getServerOffset = (server, cb) => {
	if (server === true) {
		serverDate(date => {
			cb(date.getTime() - now().getTime());
		});
		return;
	}
	if (typeof server === 'string') {
		setTimeout(() => {
			cb(dateFromISO(server).getTime() - now().getTime());
		}, 0);
		return;
	}
	setTimeout(() => {
		cb(0);
	}, 0);
};

/**
 * Default options for counter
 * @type object
 */
const DEFAULT_COUNTDOWN_OPTIONS = {
	format: ['d','h','m','s'],
	cascade: true,
	server: null, // null (use client date) | true (use info in Date header) | ISO 8601 (fixed date)
	interval: 1000
};


/**
 * Creates a counter object
 * @param props
 */
const createCounter = (props) => ({

	// read only
	complete: false,
	offset: null,
	value: null,
	timer: null,

	// api
	onload:() => {},
	onupdate:(value) => {},

	// add additional props
	...props

});


/**
 * Countdown Value
 * @param total - total milliseconds to count down
 * @param options
 */
export const countdownAmount = (total, options = {}) => {

	if (typeof total !== 'number') {
		throw `Can't start counter, the "milliseconds" parameter is required`;
	}

	// set base options
	options = mergeObjects({ units:'seconds', target:0, amount: 1000, interval:1000 }, options);

	// set private target
	const target = options.target;
	let current = total;

	// counter api
	const counter = createCounter({
		target,
		onended:() => {}
	});

	setTimeout(() => {

		// count method
		const count = (runtime) => {

			current = total - ((runtime / options.interval) * options.amount);

			// test if reached target date
			if (current <= target) {

				// set final value
				counter.value = options.target;

				// set output to zero
				counter.onupdate(counter.value / TimeUnit[options.units]);

				// stop timer
				counter.timer.stop();

				// we're done!
				counter.onended();

				// really done!
				return;
			}

			// set value
			counter.value = current;

			// calculate duration
			counter.onupdate(counter.value / TimeUnit[options.units]);

		};

		// set our counter, don't start automatically as we want to call onload first
		counter.timer = setTimer(count, options.interval, { autostart: false });

		// ready!
		counter.complete = true;
		counter.onload();

		// start timer automatically
		counter.timer.start();

	}, 0);

	return counter;
};

/**
 * Count down towards date
 * @param due
 * @param options
 * @returns object
 */
export const countdownDuration = (due, options = {}) => {

	if (typeof due === 'undefined') {
		throw `Can't start counter, the "due" parameter is required`;
	}

	// set base options
	options = mergeObjects(DEFAULT_COUNTDOWN_OPTIONS, options);

	// set private target
	const target = isDate(due) ? due : dateFromISO(due);

	// counter api
	const counter = createCounter({
		due: clone(target),
		onended:() => {}
	});

	// get offset
	getServerOffset(options.server, offset => {

		counter.offset = offset;

		const count = () => {

			const now = offsetDate(offset);

			// test if reached target date
			if (target - now <= 0) {

				// set final value
				counter.value = new Array(options.format.length).fill(0);

				// set output to zero
				counter.onupdate(counter.value);

				// stop timer
				counter.timer.stop();

				// we're done!
				counter.onended();

				// really done!
				return;
			}

			// set value
			counter.value = dateDiff(now, target, options.format, options.cascade);

			// calculate duration
			counter.onupdate(counter.value);

		};

		// start our counter
		counter.timer = setTimer(count, options.interval, { autostart:false });

		// ready!
		counter.complete = true;
		counter.onload();

		// run timer
		counter.timer.start();

	});

	return counter;
};



/**
 * Count up from date
 * @param since
 * @param options
 * @returns object
 */
export const countUpDuration = (since, options = {}) => {

	if (typeof since === 'undefined') {
		throw `Can't start counter, the "since" parameter is required`;
	}

	// set base options
	options = mergeObjects(DEFAULT_COUNTDOWN_OPTIONS, options);

	// set from date
	const from = isDate(since) ? since : dateFromISO(since);

	// counter api
	const counter = createCounter({
		since: clone(from)
	});

	// get offset
	getServerOffset(options.server, offset => {

		counter.offset = offset;

		const count = () => {

			const now = offsetDate(offset);

			// set value
			counter.value = dateDiff(from, now, options.format, options.cascade);

			// calculate duration
			counter.onupdate(counter.value);

		};

		// start our counter
		counter.timer = setTimer(count, options.interval, { autostart:false });

		// ready!
		counter.complete = true;
		counter.onload();

		// run timer
		counter.timer.start();

	});

	return counter;
};

/**
 * Count using a predefined schedule
 * @param schedule
 * @param options
 * @returns object
 */
export const countScheduled = (schedule, options = {}) => {

	if (typeof schedule !== 'string') {
		throw `Can't start scheduler, "schedule" is a required parameter`;
	}

	// timezone is in ISO8601 timezone format
	options = mergeObjects({ ...DEFAULT_COUNTDOWN_OPTIONS, timezone: null }, options);

	// get timezone offset
	const timezone = options.timezone ? toTimezoneOffset(options.timezone) : null;

	// counter api
	const counter = createCounter({
		waiting:null,
		nextScheduledDate:null,
		previouslyScheduledDate:null,
		onrepeat:(nextDate, lastDate) => {},
		onresume:(nextDate) => {},
		onwait:(sinceDate) => {}
	});

	// date scheduled during last check
	let lastDate = undefined;
	let nextDate = null;

	// get offset
	getServerOffset(options.server, offset => {

		counter.offset = offset;

		const count = () => {

			let now = offsetDate(offset);

			if (timezone !== null) {
				now = timezoneDate(now, timezone);
			}

			// get next date
			nextDate = getNextScheduledDate(now, schedule);

			// if no next date, we are in waiting state
			counter.waiting = nextDate === null;

			// if target is null call `wait` method
			if (counter.waiting) {

				// if is waiting initially
				if (lastDate === undefined) {
					lastDate = null;
				}

				// set output to zero
				counter.value = new Array(options.format.length).fill(0);

				// remember scheduled date if set
				if (counter.nextScheduledDate) {
					counter.previouslyScheduledDate = clone(counter.nextScheduledDate);
				}

				// update counter dates
				counter.nextScheduledDate = nextDate === null ? null : clone(nextDate);

				// update counter
				counter.onwait(counter.previouslyScheduledDate ? clone(counter.previouslyScheduledDate) : null);

				// we'll stop here but we'll leave the counter running
				return;
			}

			// update counter dates
			counter.nextScheduledDate = clone(nextDate);

			// just now we did not have a date (last date is always the date from the previous loop),
			// but now have, so we just woke up
			if (lastDate === null) {
				counter.onresume(clone(nextDate));
			}

			// if no last date or it's not the first loop and its not the same as the next date we are looping
			if (lastDate === null || (lastDate !== undefined && !sameTime(lastDate, nextDate))) {

				counter.onrepeat(clone(nextDate), lastDate ? clone(lastDate) : null);

				if (lastDate) {
					counter.previouslyScheduledDate = clone(lastDate);
				}
			}

			// remember last date
			lastDate = clone(nextDate);

			// calculate new duration
			counter.value = dateDiff(now, nextDate, options.format, options.cascade);
			counter.onupdate(counter.value);

		};

		// start our counter
		counter.timer = setTimer(count, options.interval, { autostart:false });

		// ready!
		counter.complete = true;
		counter.onload();

		// go!
		counter.timer.start();

	});

	return counter;
};