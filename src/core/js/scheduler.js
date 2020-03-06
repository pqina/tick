import { capitalizeFirstLetter, trim, toInt } from './utils';
import { Days, TimeUnit, setMonth, clone, setTime, setDay, setDayOfMonth, sameDate } from './date';

const toInterval = (string) => {
	if (!/^[\d]+/.test(string)) {
		string = '1 ' + string;
	}
	const parts = string.split(' ');
	return parseFloat(parts[0]) * TimeUnit[parts[1].toLowerCase()];
};

const toTime = (date, time) => {
	return setTime(date, time.split(':').map(toInt));
};

const toYearlyMoment = (date, string) => {

	/*
	 every 1st of november at 12:00
	 every 25th of november at 13:00 wait 10 seconds
	 every 25th of november from 10 till 15 every 10 minutes
	 */

	const parts = string.match(/januari|februari|march|april|may|june|july|august|september|october|november|december|[\d]+th|\dst|\dnd|first|last|at\s[\d]+(?::[\d]+)?(?::[\d]+)?/g);

	// no `at time` supplied
	if (parts.length > 1) {
		let rest = '';
		parts.forEach(p => {
			rest = string.split(p)[1] || '';
		});
		const wait = rest.trim().match(/wait\s[\d]+\s[a-z]+/);
		if (wait) {
			parts.push(wait[0]);
		}
	}

	// to moment object
	const moment = parts.reduce((obj, part) => {

		// is month day (1st, 2nd, 12th, first, last)
		if (/([\d]+th|\dst|\dnd|first|last)/.test(part)) {
			obj.day = /^[\d]/.test(part) ? parseInt(part, 10) : part === 'first' ? 1 : part;
		}

		// if is time (at 12:00)
		if (/^at/.test(part)) {
			obj.time = toTime(clone(date), part.substr(3));
		}

		// is waiting period
		else if (/wait/.test(part)) {
			obj.idle = toInterval(part.substr(5));
		}

		// must be month
		else if (/^[\a-zA-Z]+$/.test(part)) {
			obj.month = part;
		}

		return obj;
	},{
		idle: null,
		day: null,
		month: null,
		time: null,
		date: null,
		dist: null,
		wait: false
	});

	if (!moment.time) {

		// set to day
		// move to first day (so when the month changes its not accidentally out of range)
		moment.time = clone(date);
		moment.time.setDate(1);
		moment.time = setMonth(moment.time, moment.month);
		moment.time = setDayOfMonth(moment.time, moment.day);

		// if so get first valid date and use that for time
		const hourlyMoment = toHourlyMoment(moment.time, string);

		// waiting
		if (hourlyMoment.wait) {
			return moment;
		}

		// copy either date or from time
		moment.time = clone(sameDate(date, moment.time) && hourlyMoment.date ? hourlyMoment.date : hourlyMoment.from);

		// test if has already passed, if so, set to hourly from for next month
		let dist = moment.time - date;
		if (dist < 0) {

			// move to next year
			moment.time = clone(hourlyMoment.from);
			moment.time.setFullYear(moment.time.getFullYear() + 1);

			// recalculate distance
			dist = moment.time - date;
		}

		moment.dist = dist;
	}
	else {

		// correct time to given month
		moment.time.setDate(1);
		moment.time = setMonth(moment.time, moment.month);
		moment.time = setDayOfMonth(moment.time, moment.day);

		let dist = moment.time - date;
		let distOverflow = 0;
		if (dist < 0) {

			distOverflow = dist;

			// move to next year
			moment.time.setFullYear(moment.time.getFullYear() + 1);

			// recalculate distance
			dist = moment.time - date;
		}

		// get total time from today to next moment
		if (moment.idle !== null && distOverflow + moment.idle > 0) {
			moment.wait = true;
			return moment;
		}

		moment.dist = dist;
	}

	moment.date = clone(moment.time);

	return moment;
};

const toMonthlyMoment = (date, string) => {

	/*
	 every month on the 1st day
	 every month on the first day
	 every month on day the 12th
	 every last day of the month at 12:00
	 every first day of the month
	 every 1st day of the month at 10
	 every 2nd day of the month at 10
	 every 20th day of the month
	 every 20th day of the month at 12:00 wait 10 minutes
	 every 20th day of the month from 10 till 14 every hour
	 */

	const parts = string.match(/[\d]+th|\dst|\dnd|first|last|at\s[\d]+(?::[\d]+)?(?::[\d]+)?/g);

	// no `at time` supplied
	if (parts.length > 1) {
		let rest = '';
		parts.forEach(p => {
			rest = string.split(p)[1] || '';
		});
		const wait = rest.trim().match(/wait\s[\d]+\s[a-z]+/);
		if (wait) {
			parts.push(wait[0]);
		}
	}

	const moment = parts.reduce((obj, part) => {

		// is month day (1st, 2nd, 12th, first, last)
		if (/([\d]+th|\dst|\dnd|first|last)/.test(part)) {
			obj.day = /^[\d]/.test(part) ? parseInt(part, 10) : part === 'first' ? 1 : part;
		}

		// if is time (at 12:00)
		if (/^at/.test(part)) {
			obj.time = toTime(clone(date), part.substr(3));
		}

		// is waiting period
		else if (/wait/.test(part)) {
			obj.idle = toInterval(part.substr(5));
		}

		return obj;
	},{
		idle: null,
		day: null,
		time: null,
		date: null,
		dist: null,
		wait: false
	});

	if (!moment.time) {

		// set to day
		moment.time = setDayOfMonth(clone(date), moment.day);

		// if so get first valid date and use that for time
		const hourlyMoment = toHourlyMoment(moment.time, string);

		// waiting
		if (hourlyMoment.wait) {
			return moment;
		}

		// copy either date or from time
		moment.time = clone(sameDate(date, moment.time) && hourlyMoment.date ? hourlyMoment.date : hourlyMoment.from);

		// test if has already passed, if so, set to hourly from for next month
		let dist = moment.time - date;
		if (dist < 0) {

			// move to next month (set to first day of month)
			moment.time = clone(hourlyMoment.from);
			moment.time.setDate(1);
			moment.time.setMonth(moment.time.getMonth() + 1);

			// now set to expected day
			setDayOfMonth(moment.time, moment.day);

			// recalculate distance
			dist = moment.time - date;
		}

		moment.dist = dist;
	}
	else {

		// correct time to set week day
		moment.time = setDayOfMonth(moment.time, moment.day);

		let dist = moment.time - date;
		let distOverflow = 0;
		if (dist < 0) {

			distOverflow = dist;

			// move to next month (set to first day of month)
			moment.time.setDate(1);
			moment.time.setMonth(moment.time.getMonth() + 1);

			// now set to expected day
			setDayOfMonth(moment.time, moment.day);

			// recalculate distance
			dist = moment.time - date;
		}

		// get total time from today to next moment
		if (moment.idle !== null && distOverflow + moment.idle > 0) {
			moment.wait = true;
			return moment;
		}

		moment.dist = dist;
	}

	moment.date = clone(moment.time);

	return moment;
};

const toWeeklyMoment = (date, string) => {

	// - every wednesday at 12:00
	// - every wednesday at 12:00 wait 10 minutes
	// - wednesday every hour
	// - wednesday from 10 till 14 every hour
	// - wednesday 12:00, thursday 14:00
	// - tuesday 10:00 wait 2 hours
	// - tuesday 10:00 wait 2 hours, saturday 10:00 wait 2 hours
	// - every tuesday every 5 minutes
	// - wednesday from 10 till 14 every hour
	// - every tuesday every 5 minutes wait 10 seconds
	// - every tuesday from 10 till 12 every 5 minutes wait 10 seconds
	// - every tuesday every 5 minutes from 10 till 12 wait 10 seconds
	// - every tuesday at 12:00 wait 5 minutes

	// strip week part and then feed rest to toDaily() or Hourly() method
	const parts = string.match(/(?:mon|tues|wednes|thurs|fri|satur|sun)day|at\s[\d]+(?::[\d]+)?(?::[\d]+)?/g);

	// no `at time` supplied
	if (parts.length > 1) {
		let rest = '';
		parts.forEach(p => {
			rest = string.split(p)[1] || '';
		});
		const wait = rest.trim().match(/wait\s[\d]+\s[a-z]+/);
		if (wait) {
			parts.push(wait[0]);
		}
	}

	// to moment object
	const moment = parts.reduce((obj, part) => {

		// is day
		if (/(?:mon|tues|wednes|thurs|fri|satur|sun)day/.test(part)) {
			obj.day = Days[capitalizeFirstLetter(part)];
		}

		// if is time (at 12:00)
		if (/^at/.test(part)) {
			obj.time = toTime(clone(date), part.substr(3));
		}

		// is waiting period
		else if (/wait/.test(part)) {
			obj.idle = toInterval(part.substr(5));
		}

		return obj;
	},{
		idle: null,
		day: null,
		time: null,
		date: null,
		dist: null,
		wait: false
	});

	// if no time set see if a hourly period was defined
	if (!moment.time) {

		// set to day
		moment.time = setDay(clone(date), moment.day);

		// if so get first valid date and use that for time
		const hourlyMoment = toHourlyMoment(moment.time, string);

		// waiting
		if (hourlyMoment.wait) {
			return moment;
		}

		// copy either date or from time
		moment.time = clone(sameDate(date, moment.time) && hourlyMoment.date ? hourlyMoment.date : hourlyMoment.from);

		// test if has already passed, if so, set to hourly from for next week
		let dist = moment.time - date;

		if (dist < 0) {
			moment.time.setDate(moment.time.getDate() + 7);
		}

		moment.dist = dist;
	}
	else {

		// correct time to set week day
		moment.time = setDay(moment.time, moment.day);

		let dist = moment.time - date;
		if (dist < 0) {
			moment.time.setDate(moment.time.getDate() + 7);
			dist = moment.time - date;
		}

		// if is idling
		if (moment.idle !== null && dist >= TimeUnit.Week - moment.idle) {
			moment.wait = true;
			return moment;
		}

		moment.dist = dist;
	}

	moment.date = clone(moment.time);

	return moment;
};

const toDailyMoment = (date, string) => {
	// - every day at 10
	// - every day at 14:00
	// - every day at 14:30 wait 5 minutes

	// get parts
	const parts = string.match(/([\d]+(?::[\d]+)?(?::[\d]+)?)|(wait\s[\d]+\s[a-z]+)/g);

	// to moment object
	const moment = parts.reduce((obj, part) => {

		// if is time
		if (/^[\d]/.test(part)) {
			obj.time = toTime(clone(date), part);
		}

		// is waiting period
		else if (/wait/.test(part)) {
			obj.idle = toInterval(part.substr(5));
		}

		return obj;
	},{
		idle: null,
		time: null,
		date: null,
		wait: false,
		dist: null
	});

	let dist = moment.time - date;

	// if time dist is negative set time to tomorrow
	if (dist < 0) {
		moment.time.setDate(moment.time.getDate() + 1);
		dist = moment.time - date;
	}

	// test if wait period has passed
	if (moment.idle !== null && dist >= TimeUnit.Day - moment.idle) {
		moment.wait = true;
		return moment;
	}

	moment.dist = dist;
	moment.date = clone(moment.time);

	return moment;
};

const toHourlyMoment = (date, string) => {

	// - from 10 till 20 every hour wait 5 minutes
	// - from 10:00:00 till 14:00 every 15 minutes
	// - every hour
	// - every 20 minutes
	// - every 30 seconds

	// get parts
	const parts = string.match(/((?:[\d]+\s)?(?:hours|hour|minutes|minute|seconds|second))|((?:from|till)\s[\d]+(?::[\d]+)?(?::[\d]+)?)|(wait\s[\d]+\s[a-z]+)/g);

	// to moment object
	const moment = parts.reduce((obj, part) => {

		// if is time
		if (/from/.test(part)) {
			obj.from = toTime(obj.from, part.split(' ')[1]);
		}

		else if (/till/.test(part)) {
			obj.till = toTime(obj.till, part.split(' ')[1]);
		}

		// is waiting period
		else if (/wait/.test(part)) {
			obj.idle = toInterval(part.substr(5));
		}

		// if is interval
		else if (/hours|hour|minutes|minute|seconds|second/.test(part)) {
			obj.interval = toInterval(part);
		}

		return obj;
	},{
		idle: null,
		interval: null,
		date: null,
		dist: null,
		wait: false,
		from: toTime(clone(date), '0'),
		till: toTime(clone(date), '23:59:59:999')
	});

	// if valid moment
	if (date < moment.from || date >= moment.till) {
		return moment;
	}

	// calculate if interval fits in duration
	if (moment.interval > moment.till - moment.from) {
		return moment;
	}

	// time passed since start of moment
	const diff = date - moment.from;

	// interval duration minus all intervals that fitted in the passed time since start
	// 200 - (diff % interval)
	// 200 - (1450 % 200)
	// 200 - 50
	// 150 till next moment
	const dist = moment.interval - (diff % moment.interval);

	// test if wait period has passed
	if (moment.idle !== null && dist >= moment.interval - moment.idle) {
		moment.wait = true;
		return moment;
	}

	// set as final distance
	moment.dist = dist;

	// turn into date by adding to current time
	moment.date = new Date(date.getTime() + moment.dist);

	return moment;
};

const toMoment = (date, string) => {

	// test yearly schedules
	if (/januari|februari|march|april|may|june|july|august|september|october|november|december/.test(string)) {
		return toYearlyMoment(date, string);
	}

	// test for monthly schedules
	if (/month/.test(string)) {
		return toMonthlyMoment(date, string);
	}

	// test for weekly schedules
	if (/(?:mon|tues|wednes|thurs|fri|satur|sun)day/.test(string)) {
		return toWeeklyMoment(date, string);
	}

	// test for daily schedules
	if (/day at/.test(string) || /^at /.test(string)) {
		return toDailyMoment(date, string);
	}

	// test for hourly schedules
	if (/hours|hour|minutes|minute|seconds|second/.test(string)) {
		return toHourlyMoment(date, string);
	}

	return null;
};

export const getNextScheduledDate = (date, schedule) => {

	// create moments
	const moments = schedule.split(',')
		.map(trim) // remove whitespace
		.map(s => toMoment(date, s)); // string to moment in time


	// calculate closest moment
	let nearest = null;
	for (let i =0;i<moments.length;i++) {

		const moment = moments[i];

		// currently waiting
		if (nearest === null && moment.wait) {
			return null;
		}

		if (nearest === null || moment.dist < nearest.dist) {
			nearest = moment;
		}
	}

	// return nearest date
	return nearest.date;
};