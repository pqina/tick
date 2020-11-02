import Tick from './Tick';
import {
	createDOMTreeForDefinition,
	toFunctionReference,
	toValue,
	clone,
	toPresenterDefinitionTree
} from './utils';
import {
	isHTMLElement
} from './dom';

const transformDurationUnit = (value, single, plural, progress) => {
	return {
		label: value === 1 ? single : plural,
		progress: value / progress,
		value: value
	}
};

/**
 * Tick DOM interface
 */
const instances = [];

export const setConstant = (key, value) => {
	constants[key] = value;
};

export const setPreset = (key, value) => {
	presets[key] = value;
};

export const getConstants = () => {
	return constants;
};

export const getPresets = () => {
	return presets;
};

const constants = {
	YEAR_PLURAL: 'Years',
	YEAR_SINGULAR: 'Year',
	MONTH_PLURAL: 'Months',
	MONTH_SINGULAR: 'Month',
	WEEK_PLURAL: 'Weeks',
	WEEK_SINGULAR: 'Week',
	DAY_PLURAL: 'Days',
	DAY_SINGULAR: 'Day',
	HOUR_PLURAL: 'Hours',
	HOUR_SINGULAR: 'Hour',
	MINUTE_PLURAL: 'Minutes',
	MINUTE_SINGULAR: 'Minute',
	SECOND_PLURAL: 'Seconds',
	SECOND_SINGULAR: 'Second',
	MILLISECOND_PLURAL: 'Milliseconds',
	MILLISECOND_SINGULAR: 'Millisecond'
};

const presets = {
	y:(value, constants) => (
		transformDurationUnit(
			value,
			constants.YEAR_SINGULAR,
			constants.YEAR_PLURAL,
			10
		)
	),
	M:(value, constants) => (
		transformDurationUnit(
			value,
			constants.MONTH_SINGULAR,
			constants.MONTH_PLURAL,
			12
		)
	),
	w:(value, constants) => (
		transformDurationUnit(
			value,
			constants.WEEK_SINGULAR,
			constants.WEEK_PLURAL,
			52
		)
	),
	d:(value, constants) => (
		transformDurationUnit(
			value,
			constants.DAY_SINGULAR,
			constants.DAY_PLURAL,
			365
		)
	),
	h:(value, constants) => (
		transformDurationUnit(
			value,
			constants.HOUR_SINGULAR,
			constants.HOUR_PLURAL,
			24
		)
	),
	m:(value, constants) => (
		transformDurationUnit(
			value,
			constants.MINUTE_SINGULAR,
			constants.MINUTE_PLURAL,
			60
		)
	),
	s:(value, constants) => (
		transformDurationUnit(
			value,
			constants.SECOND_SINGULAR,
			constants.SECOND_PLURAL,
			60
		)
	),
	mi:(value, constants) => (
		transformDurationUnit(
			value,
			constants.MILLISECOND_SINGULAR,
			constants.MILLISECOND_PLURAL,
			1000
		)
	)
};

const attributes = {
	'value': toValue,
	'didInit': toFunctionReference,
	'didUpdate': toFunctionReference,
	'didDestroy': toFunctionReference,
	'willDestroy': toFunctionReference
};

const getOptionsFromAttributes = (element, transfomers = {}, defaults = {}) => {

	const dataset = element.dataset;

	const options = {
		meta:{}
	};

	for (let prop in dataset) {

		if (!dataset.hasOwnProperty(prop)) { continue; }

		let valueTransformer = transfomers[prop];
		let value = dataset[prop];

		if (valueTransformer) {
			value = valueTransformer(value);
			value = value === null ? clone(defaults[prop]) : value;
			options[prop] = value;
		}

	}

	if (dataset.credits === 'false') {
		options.credits = false;
	}
	
	return options;
};

const indexOfElement = (instances, element) => {
	let i=0;
	const l=instances.length;
	for (;i<l;i++) {
		if (instances[i].isRootElement(element)) {
			return i;
		}
	}
	return -1;
};

export const parse = (context) => {

	let elements;
	let element;
	let i;
	let instances = [];

	// find all crop elements and bind Crop behavior
	elements = context.querySelectorAll('.tick:not([data-state])');
	i = elements.length;

	while(i--) {
		element = elements[i];
		instances.push(create(element));
	}

	return instances;

};

export const find = (element) => {
	const result = instances.filter((instance) => {
		return instance.isRootElement(element)
	});
	return result ? result[0] : null;
};

const getDefaultOptions = () => {
	return { ...Tick.options(), constants: { ...constants }, presets: { ...presets } };
};

export const create = (element = undefined, options = undefined) => {

	// if first argument is options object correct parameter values
	if (element && !isHTMLElement(element)) {
		options = element;
		element = undefined;
	}

	// if already in array, can't create another on this location in the DOM
	if (element && find(element)) {
		return;
	}

	// if view defined
	if (options && options.view) {
		options.view = createDOMTreeForDefinition([options.view])[0];
	}

	// if no options supplied, get the options from the element attributes
	if (!options && element) {
		options = getOptionsFromAttributes(element, attributes, getDefaultOptions());
	}

	// if element supplied, view is either default view or defined by child elements
	if (element) {

		// no options defined, set blank options object
		if (!options) {
			options = {};
		}

		// no default view defined
		if (!options.view) {
			options.view = toPresenterDefinitionTree([element])[0];
		}
	}

	// instance (pass element to set root)
	const instance = new Tick(options, element);

	// add new instance
	instances.push(instance);

	// return the instance
	return instance;
};

export const destroy = (element) => {

	const index = indexOfElement(instances, element);

	if (index < 0) {
		return false;
	}

	instances[index].destroy();
	instances.splice(index, 1);

	return true;
};