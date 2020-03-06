const MILLISECOND = 1;
const SECOND = 1000;
const MINUTE = 60000;
const HOUR = 3600000;
const DAY = 86400000;
const WEEK = 604800000;
const MONTH = 2628000000;
const YEAR = 31536000000;

export const TimeUnit = {
	'Week': WEEK,
	'Day': DAY,
	'Hour': HOUR,
	'Minute': MINUTE,
	'Second': SECOND,
	'Millisecond': MILLISECOND,
	'Month': MONTH,
	'Year': YEAR
};

export const Months = [
	'Januari',
	'Februari',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December'
];

for (let key in TimeUnit) {
	if (!TimeUnit.hasOwnProperty(key)) { continue; }
	let val = TimeUnit[key];
	if (val === MILLISECOND) {
		TimeUnit['mi'] = val;
		TimeUnit['ms'] = val;
	}
	else if (val === MONTH) {
		TimeUnit['M'] = val;
	}
	else {
		TimeUnit[key.charAt(0).toLowerCase()] = val;
	}
	TimeUnit[key.toLowerCase()] = val;
	TimeUnit[key.toLowerCase() + 's'] = val;
}

export const Days = {
	Monday:1,
	Tuesday:2,
	Wednesday:3,
	Thursday:4,
	Friday:5,
	Saturday:6,
	Sunday:0
};

const TimeTokens = [
	'y',
	'M',
	'w',
	'd',
	'h',
	'm',
	's',
	'mi'
];

const MonthFactor = {
	'M':1,
	'y':12
};

export const serverDate = (cb) => {

	const xhr = new XMLHttpRequest();

	const now = Date.now();
	xhr.open('HEAD', window.location + '?noCache=' + now);
	xhr.setRequestHeader('Content-Type', 'text/html');
	xhr.setRequestHeader('Cache-Control', 'no-cache');

	xhr.onload = () => {
		const correction = (now - Date.now()) * .5;
		const responseDate = new Date(xhr.getResponseHeader('Date'));
		cb(new Date(responseDate.getTime() + correction));
	};

	xhr.send();
};

export const isDate = (date) => date instanceof Date;

export const setTime = (date, time) => {
	date.setHours(time[0] || 0, time[1] || 0, time[2] || 0, time[3] || 0);
	return date;
};

export const setDay = (date, day) => {
	const current = date.getDay();
	const dist = day - current;
	date.setDate(date.getDate() + dist);
	return date;
};

export const setDayOfMonth = (date, day) => {
	const totalDays = daysInMonth(date.getMonth() + 1, date.getFullYear());
	day = day === 'last' ? totalDays : Math.max(1, Math.min(totalDays, day));
	date.setDate(day);
	return date;
};

export const setMonth = (date, month) => {
	date.setMonth(Months.map(m => m.toLowerCase()).indexOf(month));
	return date;
};

/*
 Z
 ±hh:mm
 ±hhmm
 ±hh
 */
export const toTimezoneOffset = (ISO8601Timezone) => {
	const current = ((new Date()).getTimezoneOffset() * 60000);
	if (ISO8601Timezone === 'Z') {
		return current;
	}
	const parts = ISO8601Timezone.match(/\+|-|[\d]{2}|[\d]{2}/g);
	const multiplier = parts.shift() === '-' ? -1 : 1;
	const hours = parseInt(parts[0], 10);
	const minutes = parseInt(parts[1], 10);
	// calculate zone offset plus our current zone offset, all in milliseconds
	return (multiplier * ((hours * 3600000) + (minutes * 60000))) + current;
};

export const offsetDate = (offset) => new Date(Date.now() + offset);

export const timezoneDate = (date, offset) => {
	return new Date(date.getTime() + offset);
};

// same date (day)
export const sameDate = (a, b) => {
	return a.toDateString() === b.toDateString();
};

// exact same date and time
export const sameTime = (a, b) => {
	return a.getTime() === b.getTime();
};

const daysInMonth = (month, year) => {
	return new Date(year, month, 0).getDate();
};

export const dateFromISO = (iso) => {

	// use existing timezone
	if (iso.match(/(Z)|([+\-][0-9]{2}:?[0-9]*$)/g)) {
		return new Date(iso);
	}

	// add local timezone
	iso += iso.indexOf('T') !== -1 ? 'Z' : '';
	return dateToLocal(new Date(iso));
};

export const dateToLocal = (date) => new Date(date.getTime() + (date.getTimezoneOffset() * 60000));




export const timeDuration = (milliseconds, components) => {

	return components.map(key => {

		let requiredMilliseconds = TimeUnit[key];

		let count = Math.max(0, Math.floor(milliseconds / requiredMilliseconds));

		milliseconds = milliseconds % requiredMilliseconds;

		return count;

	});

};

// makes use of time duration for everything expect years and months
export const dateDiff = (a, b, components) => {

	// do calculations
	let diff = b - a;
	let swapped = false;
	if (diff < 0) {
		diff = a - b;
		[a,b] = [b,a];
		swapped = true;
	}

	// set default components
	if (!components) {
		components = ['d','h','m']
	}

	// correct month uppercase M if set to lower case
	const mIndex = components.indexOf('m');
	if (mIndex >= 0 && (components[mIndex - 1] === 'y' || components[mIndex+1] === 'd')) {
		components[mIndex].key = 'M';
	}

	let anchor;
	let monthsRemaining;
	let months;

	const presentsYears = components.includes('y');
	const presentsMonths = components.includes('M');

	if (presentsMonths || presentsYears) {

		anchor = new Date(a.valueOf() + diff);

		monthsRemaining = diffInMonths(anchor, a);

		months = presentsMonths ? Math.floor(monthsRemaining) : Math.floor(monthsRemaining / 12) * 12;

		diff = anchor.valueOf() - addMonths(clone(a), months).valueOf();
	}

	const output = components.map(key => {

		// if is month or year
		if (key === 'y' || key === 'M') {
			let count = Math.max(0, Math.floor(monthsRemaining / MonthFactor[key]));
			monthsRemaining -= count * MonthFactor[key];
			return count;
		}

		let requiredMilliseconds = TimeUnit[key];

		let count = Math.max(0, Math.floor(diff / requiredMilliseconds));

		diff = diff % requiredMilliseconds;

		return count;
	});

	return swapped ? output.map(v => v > 0 ? -v : v) : output;
};


/**
 * Tick.helper.duration(10, 'seconds') -> milliseconds
 * Tick.helper.duration(a, b, format, cascade) -> [0, 10, 20, 4, 0];
 * @param args
 * @returns {*}
 */
export const duration = (...args) => {

	// if is countdown x amount of milliseconds
	if (typeof args[0] === 'number' && typeof args[1] === 'string') {
		if (!TimeUnit[args[1]]) {
			throw `"${ args[1] }" is not a valid amount.`;
		}
		return args[0] * TimeUnit[args[1]];
	}

	// is date diff
	if (isDate(args[0])) {
		return dateDiff(...args);
	}

	// is duration in milliseconds
	if (typeof args[0] === 'number' && Array.isArray(args[1])) {
		return timeDuration(...args);
	}

	return null;
};

/**
 * Returns current date
 */
export const now = () => new Date();

/**
 * Clones the given date object
 * @param date
 * @returns {Date}
 */
export const clone = (date) => {
	return new Date(date.valueOf());
};

/**
 * Adds x amount of months to date
 * @param date
 * @param months
 * @returns {*}
 */
const addMonths = (date, months) => {
	date.setMonth(date.getMonth() + months);
	return date;
};

/**
 * Difference in months between date `a` and date `b`
 * @param a
 * @param b
 * @returns {number}
 */
const diffInMonths = (a, b) => {

	const wholeMonthDiff = ((b.getFullYear() - a.getFullYear()) * 12) + (b.getMonth() - a.getMonth());
	let anchor = addMonths(clone(a), wholeMonthDiff);
	let anchor2;
	let adjust;

	if (b - anchor < 0) {
		anchor2 = addMonths(clone(a), wholeMonthDiff - 1);
		adjust = (b - anchor) / (anchor - anchor2);
	} else {
		anchor2 = addMonths(clone(a), wholeMonthDiff + 1);
		adjust = (b - anchor) / (anchor2 - anchor);
	}

	return -(wholeMonthDiff + adjust);
};