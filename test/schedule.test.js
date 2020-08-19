// Import chai.
const chai = require('chai');
const path = require('path');
const expect = chai.expect;

chai.expect();

// Import the Rectangle class.
let Scheduler = require(path.join(__dirname, '../src/core/js/', 'scheduler'));
const runSchedule = Scheduler.getNextScheduledDate;

const toLocal = (date, dst = 0) => new Date(date.getTime() + (date.getTimezoneOffset() * dst * 60000));
const clone = (date) => new Date(date.valueOf());

const addFiveMinutes = (date) => {
	date.setMinutes(date.getMinutes() + 5);
	return date;
};

const addFiveDays = (date) => {
	date.setDate(date.getDate() + 5);
	return date;
};

const DATE_DEFAULT = toLocal(new Date('2017-01-01T12:00:00')); // sunday
const DATE_LEAP_YEAR = toLocal(new Date('2016-01-01T12:00:00'));

const dateMethods = [
	'getFullYear',
	'getMonth',
	'getDate',
	'getHours',
	'getMinutes',
	'getSeconds'
];

describe('Counter', () => {

	describe('getNextScheduledDate', () => {
		[
			// hourly schedules
			{
				input:'every hour',
				output:[2017,0,1,13]
			},
			{
				input:'every minute',
				output:[2017,0,1,12,1]
			},
			{
				input:'every second',
				output:[2017,0,1,12,0,1]
			},
			{
				input:'every 2 hours',
				output:[2017,0,1,14]
			},
			{
				input:'every 10 minutes',
				output:[2017,0,1,12,10]
			},
			{
				input:'every 45 seconds',
				output:[2017,0,1,12,0,45]
			},
			{
				input:'till 10 every hour', // it's 12 o'clock so no output
				output:null
			},
			{
				input:'from 13 every hour', // it's 12 o'clock so no output
				output:null
			},
			{
				input:'from 12 every hour',
				output:[2017,0,1,13]
			},
			{
				input:'from 12 till 13 every hour',
				output:[2017,0,1,13]
			},
			{
				input:'from 12 till 12:59 every hour', // hour does not fit
				output:null
			},
			{
				input:'from 9 till 12 every hour, from 13 till 15 every hour',
				output:null
			},
			{
				input:'from 11 till 15 every hour, from 16 till 18 every hour',
				output:[2017,0,1,13]
			},
			{
				input:'from 9 till 11 every hour, from 12 till 15 every hour',
				output:[2017,0,1,13]
			},
			{
				date: addFiveMinutes(clone(DATE_DEFAULT)), // should wait
				input:'every hour wait 10 minutes',
				output:null
			},

			// daily schedules
			{
				input:'every day at 13',
				output:[2017,0,1,13]
			},
			{
				input:'at 13', // shorthand
				output:[2017,0,1,13]
			},
			{
				input:'every day at 13:15',
				output:[2017,0,1,13,15]
			},
			{
				input:'every day at 13:15:30',
				output:[2017,0,1,13,15,30]
			},
			{
				input:'every day at 11', // should jump to next day
				output:[2017,0,2,11]
			},
			{
				input:'at 11', // shorthand
				output:[2017,0,2,11]
			},
			{
				date: addFiveMinutes(clone(DATE_DEFAULT)),
				input:'every day at 11 wait 2 hours', // should wait
				output:null
			},
			// weekly schedules
			{
				input:'every sunday at 14', // is today
				output:[2017,0,1,14]
			},
			{
				input:'every monday at 10', // is tomorrow
				output:[2017,0,2,10]
			},
			{
				input:'every sunday at 10', // skip to next week
				output:[2017,0,8,10]
			},
			{
				input:'saturday at 10, monday at 10',
				output:[2017,0,2,10]
			},
			{
				input:'saturday at 10, wednesday at 10',
				output:[2017,0,4,10]
			},
			{
				date:addFiveMinutes(clone(DATE_DEFAULT)),
				input:'every sunday at 11 wait 2 hours',
				output:null
			},
			{
				input:'sunday every hour',
				output:[2017,0,1,13]
			},
			{
				input:'monday every hour',
				output:[2017,0,2,0,0,0]
			},
			{
				input:'saturday every hour, sunday every hour',
				output:[2017,0,1,13]
			},
			{
				input:'sunday every hour from 10 till 12',
				output:[2017,0,8,10]
			},
			{
				date:addFiveMinutes(clone(DATE_DEFAULT)),
				input:'sunday every hour wait 10 minutes',
				output:null
			},
			// monthly schedules
			{
				input:'every 1st day of the month at 12:00',
				output:[2017,0,1,12]
			},
			{
				input:'every 2nd day of the month at 12:00',
				output:[2017,0,2,12]
			},
			{
				input:'every 3th day of the month at 12:00',
				output:[2017,0,3,12]
			},
			{
				input:'every first day of the month at 12:00',
				output:[2017,0,1,12]
			},
			{
				input:'every last day of the month at 12:00',
				output:[2017,0,31,12]
			},
			{
				input:'every 32th day of the month at 12:00',
				output:[2017,0,31,12]
			},
			{
				input:'every 0th day of the month at 12:00',
				output:[2017,0,1,12]
			},
			{
				input:'every 1st day of the month at 11:55 wait 10 minutes',
				output:null
			},
			{
				input:'every 2nd day of the month from 10 till 14 every hour',
				output:[2017,0,2,10]
			},
			{
				date: addFiveMinutes(clone(DATE_DEFAULT)),
				input:'every 1nd day of the month from 10 till 14 every hour wait 10 minutes',
				output:null
			},
			// yearly
			{
				input:'every januari the 12th at 12:00',
				output:[2017,0,12,12]
			},
			{
				input:'every 12th of januari at 12:00',
				output:[2017,0,12,12]
			}
		].forEach(schedule => {

			it(`should parse "${ schedule.input }"`, () => {
				const date = runSchedule(schedule.date || DATE_DEFAULT, schedule.input);
				if (date === null || schedule.output === null) {
					expect(date).to.equal(schedule.output);
				}
				else {
					dateMethods.forEach((fn,i) => {
						expect(date[fn]()).to.equal(schedule.output[i] || 0);
					});
				}
			})

		});

	});

});

