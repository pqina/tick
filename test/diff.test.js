// Import chai.
const chai = require('chai');
const path = require('path');
const expect = chai.expect;

chai.expect();

// Import the Rectangle class.
const DateHelpers = require(path.join(__dirname, '../src/core/js/', 'date'));
const dateDiff = DateHelpers.dateDiff;
const timeDuration = DateHelpers.timeDuration;

const toLocal = (date) => new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
const dateFromISO = (iso) => {

	// use existing timezone
	if (iso.match(/(Z)|([+\-][0-9]{2}:?[0-9]*$)/g)) {
		return new Date(iso);
	}

	// add local timezone
	iso += iso.indexOf('T') !== -1 ? 'Z' : '';
	return toLocal(new Date(iso));
};

const DATE_DEFAULT = '2017-01-01T12:00:00.000';
const DATE_LEAP_YEAR = '2016-01-01T12:00:00.000';

const COMPONENTS_DEFAULT = [
	'y',
	'M',
	'd',
	'h',
	'm',
	's'
];

describe('Counter', () => {

	describe('time distance', () => {
		[
			{
				input:[1000,['ms']],
				output:[1000]
			},
			{
				input:[1000,['s']],
				output:[1]
			},
			{
				input:[1000,['m']],
				output:[0]
			},
			{
				input:[86400000,['h']],
				output:[24]
			},
			{
				input:[86400000,['m']],
				output:[1440]
			},
			{
				input:[86400000,['s']],
				output:[86400]
			},
			{
				input:[10000,['m','s']],
				output:[0,10]
			},
			{
				input:[31536000000,['M']],
				output:[12]
			},
			{
				input:[31536000000,['y']],
				output:[1]
			},
			{
				input:[31536000000,['d']],
				output:[365]
			},
			{
				input:[5184120001,['M','d','h','m','s','ms']],
				output:[1,29,14,2,0,1]
			}
		].forEach((test) => {

			it(`should correctly calculate duration of "${ test.input[0] }ms" to [${ test.input[1].join(',') }]`, () => {

				const result = timeDuration(test.input[0], test.input[1]);

				if (result === null || test.output === null) {
					expect(result).to.equal(test.output);
				}
				else {
					expect(result).to.deep.equal(test.output);
				}

			});

		});

	});

	describe('duration', () => {
		[
			// test all sub units
			{
				to:'2017-01-01T12:00:00.000',
				output:[0, 0, 0, 0, 0, 0]
			},
			{
				to:'2017-01-01T13:00:00.000',
				output:[0, 0, 0, 1, 0, 0]
			},
			{
				to:'2017-01-02T12:00:00.000',
				output:[0, 0, 1, 0, 0, 0]
			},
			{
				to:'2017-02-01T12:00:00.000',
				output:[0, 1, 0, 0, 0, 0]
			},
			{
				to:'2018-01-01T12:00:00.000',
				output:[1, 0, 0, 0, 0, 0]
			},
			{
				to:'2017-01-01T12:00:00.001',
				components:['y','M','d','h','m','s','mi'],
				output:[0, 0, 0, 0, 0, 0, 1]
			},
			{
				to:'2018-02-02T13:01:01.001',
				components:['y','M','d','h','m','s','mi'],
				output:[1, 1, 1, 1, 1, 1, 1]
			},
			{
				to:'2017-01-08T12:00:00.000',
				components:['w','d','h','m','s'],
				output:[1, 0, 0, 0, 0]
			},
			// negatives
			{
				to:'2017-01-01T11:00:00.000',
				output:[0, 0, 0, -1, 0, 0]
			},
			// year difference and day difference
			{
				from:'2015-01-01T12:00:00.000',
				to:'2016-01-01T12:00:00.000',
				output:[1, 0, 0, 0, 0, 0]
			},
			{
				from:'2015-01-01T12:00:00.000',
				to:'2016-01-01T12:00:00.000',
				components:['d','h','m','s'],
				output:[365, 0, 0, 0]
			},
			// year difference and day difference with leap year
			{
				from:'2016-01-01T12:00:00.000',
				to:'2017-01-01T12:00:00.000',
				output:[1, 0, 0, 0, 0, 0]
			},
			{
				from:'2016-01-01T12:00:00.000',
				to:'2017-01-01T12:00:00.000',
				components:['d','h','m','s'],
				output:[366, 0, 0, 0]
			},

			// time zones
			{
				from:'2017-01-01T12:00:00.000Z', // LONDON
				to:'2017-01-01T13:00:00.000+0100',
				output:[0, 0, 0, 0, 0, 0]
			},
			{
				from:'2017-01-01T07:00:00.000-0500', // NEW YORK
				to:'2017-01-01T13:00:00.000+0100',
				output:[0, 0, 0, 0, 0, 0]
			},
			{
				from:'2017-01-01T15:00:00.000+0300', // MOSCOW
				to:'2017-01-01T13:00:00.000+0100',
				output:[0, 0, 0, 0, 0, 0]
			}
		].forEach(test => {

			it(`should correctly diff "${ test.from || DATE_DEFAULT }" and "${ test.to }"`, () => {

				const from = dateFromISO(test.from || DATE_DEFAULT);
				const to = dateFromISO(test.to);

				const components = test.components || COMPONENTS_DEFAULT;
				const result = dateDiff(from, to, components);

				if (result === null || test.output === null) {
					expect(result).to.equal(test.output);
				}
				else {
					expect(result).to.deep.equal(test.output);
				}

			})

		});

	});

});

