import { getExtension, ExtensionType } from './extensions/index';
import { dateFromISO } from './date';
import {
	createPresenterView,
	createPresenterRoot,
	createPresenterRepeater
} from './view/index';

import { parseTransformChain } from './parser';

export const isRootDefinition = (definition) => definition.children && definition.children.length;

export const cloneDefinition = (definition) => {

	const clone = {};

	for (let key in definition) {

		if (!definition.hasOwnProperty(key)) {continue;}

		if (key === 'root') {
			clone[key] = definition[key].cloneNode();
			continue;
		}

		if (key === 'children') {
			clone[key] = definition[key] === null ? null : definition[key].map(cloneDefinition);
			continue;
		}

		if (key === 'repeat') {
			clone[key] = definition[key] === null ? null : cloneDefinition(definition[key]);
			continue;
		}

		clone[key] = definition[key];
	}

	clone.presenter = null;

	return clone;
};



/**
 * Parsing DOM to DefinitionTree
 * @param nodes
 */
const definitionOutline = {
	root:null,
	key:null,
	view:null,
	overlay:null,
	presenter:null,
	transform:null,
	layout:null,
	style:null,
	repeat:null,
	children:null,
	className:null
};

export const toPresenterDefinitionTree = (nodes) =>
	Array.from(nodes)
		// fix to allow nesting of tick counters
		// .filter(node => !node.classList.contains('tick'))
		.map(node => {

	const definition = mergeObjects( definitionOutline, { root:node } );

	// get all properties above from attributes
	for (let key in node.dataset) {
		if (!node.dataset.hasOwnProperty(key)) { continue; }
		if (typeof definition[key] === 'undefined') { continue; }
		definition[key] = node.dataset[key];
	}

	// if is repeater set do not parse children as children but define as repeat
	if (definition.repeat) {

		// can only have one repeated child
		definition.repeat = toPresenterDefinitionTree(node.children).pop();

		// detach repeated elements from DOM
		Array.from(node.children).forEach(node => {
			node.parentNode.removeChild(node);
		});

	}
	// children are normal children
	else if (node.children.length) {
		definition.children = toPresenterDefinitionTree(node.children);
	}

	return definition;
});

export const createDOMTreeForDefinition = (definition) => {

	return definition.map(def => {

		def = mergeObjects(definitionOutline, def);

		if (typeof def.root === 'string') {
			def.root = document.createElement(def.root);
		}
		else {
			def.root = document.createElement('span');
		}

		if (def.transform) {
			def.root.dataset.transform = def.transform;
		}

		if (def.className) {
			def.root.className = def.className;
		}
		
		if (def.overlay) {
			def.root.dataset.overlay = def.overlay;
		}
		
		if (def.view) {
			def.root.dataset.view = def.view;
			if (def.style) {
				def.root.dataset.style = def.style;
			}
			def.repeat = null;
		}
		else {

			if (def.layout) {
				def.root.dataset.layout = def.layout;
			}

			if (def.repeat) {
				def.root.dataset.repeat = true;
				def.repeat = createDOMTreeForDefinition(def.children).pop();
			}
			else if (def.children) {
				def.children = createDOMTreeForDefinition(def.children);
				def.children.forEach(child => {
					def.root.appendChild(child.root);
				});
			}
		}

		return def;
	});

};


/**
 * Presenting values
 */
export const createPresenterByDefinition = (definition, presentDefinition) => {

	let presenter;

	if (definition.repeat) {
		presenter = createPresenterRepeater(definition.root, definition.repeat, presentDefinition);
	}

	else if (typeof definition.view === 'string') {
		presenter = createPresenterView(definition.view, definition.root, definition.style);
	}

	else if (isRootDefinition(definition)) {
		presenter = createPresenterRoot(definition.root, definition.children, presentDefinition);
	}

	return presenter;
};

export const presentTick = (instance) => {

	let isDrawing = false;

	const update = (definition, value) => {

		definition.transform(value, (output) => {
			definition.presenter.update(output);
		}, instance);

		if (!isDrawing) {
			isDrawing = true;
			draw();
		}
	};

	const draw = () => {
		instance.baseDefinition.presenter.draw();
		requestAnimationFrame(draw);
	};


	const presentDefinition = (definition) => {
		definition.presenter = createPresenterByDefinition(definition, presentDefinition);
		definition.transform = toTransformComposition(definition.transform, instance);
		return update;
	};

	return presentDefinition(instance.baseDefinition);

};









/**
 * Transform
 */
const composeAsync = (instance, ...funcs) => (initialValue, callback) => {

	function compose(i, value) {

		// return end result
		if (funcs.length <= i) {
			callback(value);
			return;
		}

		funcs[i](value, partial(compose, [i+1]), instance);
	}

	compose(0, initialValue);

};

const partial = (fn, initialArgs = [], ctx) => {
	return function() {
		let args = Array.from(initialArgs);
		Array.prototype.push.apply(args, arguments);
		return fn.apply(ctx, args);
	};
};

export const toTransformComposition = (string, instance) => {

	// no composition
	if (!string) {
		return (value, cb) => cb(value);
	}

	// already function no need to compose
	if (typeof string === 'function') {
		return string;
	}

	// wrap in default transform
	// if is single transform force parenthesis as it must be a fn
	const result = parseTransformChain(`transform(${ /^[a-z]+$/.test(string) ? string + '()' : string })`);
	return compose(result, instance);
};

const compose = (chain, instance) => {

	const composition = chain.map(item => {

		// get name
		let name = item.shift();

		// get related function
		const func = getExtension(ExtensionType.TRANSFORM, name) || function(value, cb, instance) { cb(value) };

		// other items in array are parameters
		const params = item.map(parameter => {

			// if is array turn into function
			if (Array.isArray(parameter)) {

				// normal transform
				if (typeof parameter[0] === 'string') {
					return compose([parameter], instance);
				}

				// chain of transforms
				return compose(parameter, instance);
			}

			return toParameter(parameter);
		});

		return func(...params);
	});

	return composeAsync(instance, ...composition);
};



export const toFunctionOutline = (string) => {
	const name = string.match(/[a-z]+/)[0];
	const parameters = toParameters(string.substring(name.length));
	return {
		name,
		parameters
	};
};

const toParameters = (string) => (string.match(/('.+?')|(".+?")|(\[.+?])|([.:\-\d\sa-zA-Z]+%?)/g) || []).map(trim).filter(str => str.length).map(toParameter);

const trimEdges = (string) => string.substring(1, string.length-1);

const isProbablyISODate = /^([\d]{4}-[\d]{1,2}-[\d]{1,2})/;
const isBoolean = /^(true|false)$/;
const isString = /^[\a-zA-Z]+$/;
const isZeroString = /^0[\d]+/;
const isQuotedString = /^('|")/;
const isNumber = /^-?(?:\d+)?(?:\.|0\.)?[\d]+$/;
const isArray = /^(\[)/;

export const toParameter = (string) => {

	if (isBoolean.test(string)) {
		return string === 'true';
	}

	if (isArray.test(string)) {
		return toParameters(trimEdges(string));
	}

	if (isProbablyISODate.test(string)) {
		return dateFromISO(string);
	}

	if (isQuotedString.test(string)) {
		return trimEdges(string);
	}

	if (isString.test(string) || isZeroString.test(string)) {
		return string;
	}

	if (isNumber.test(string)) {
		return parseFloat(string);
	}

	// is CSS unit (parsing will be handled by function that receives this value)
	return string;

};

export const toCSSValue = (value) => {
	const parts = (value + '').match(/(-?[.\d]+)(%|ms|s|deg|cm|em|ch|ex|q|in|mm|pc|pt|px|vh|vw|vmin|vmax)?/);
	return {
		value:parseFloat(parts[1]),
		units:parts[2]
	}
};


/**
 * @param a { object }
 * @param b { object }
 */
export const mergeObjects = (a, b = {}) => {

	let key;
	const obj = {};

	for (key in a) {
		if (!a.hasOwnProperty(key)) {
			continue;
		}
		obj[key] = typeof b[key] === 'undefined' ? a[key] : b[key];
	}

	return obj;
};

/**
 * @param string { string }
 */
export const toFunctionReference = (string) => {
	let ref = window;
	let levels = string.split('.');
	levels.forEach((level, index) => {
		if (!ref[levels[index]]) {
			return;
		}
		ref = ref[levels[index]];
	});
	return ref !== window ? ref : null;
};

/**
 *
 */
export const toValue = (string) => {

	// capture for object string
	if (/^(?:[\w]+\s?:\s?[\w.]+,\s?)+(?:[\w]+\s?:\s?[\w.]+)$/g.test(string)) {
		return string.match(/(?:(\w+)\s?:\s?([\w.]+))/g).reduce((obj, current) => {
			const parts = current.split(':');
			obj[parts[0]] = toParameter(parts[1]);
			return obj;
		},{})
	}

	// handle the other options
	return toParameter(string);
};

/**
 * @param value { * }
 */
export const toBoolean = (value) => typeof value === 'string' ? value === 'true' : value;

/**
 * @param value { * }
 */
export const toInt = (value) => parseInt(value, 10);

/**
 * @param string { string }
 */
export const trim = string => string.trim();

/**
 * @param string { string }
export const lowercaseFirstLetter = (string) => string.charAt(0).toLowerCase() + string.slice(1);
 */

/**
 * @param string { string }
 */
export const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1);

/**
 * @param string { string }
 */
export const dashesToCamels = string => string.replace(/-./g, sub => sub.charAt(1).toUpperCase());

/**
 * @param string
export const camelsToDashes = string => string.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
 */

/**
 * @param obj { object }
 */
export const clone = (obj) => {
	if (typeof obj === 'object' && obj !== null) {
		return JSON.parse(JSON.stringify(obj));
	}
	return obj;
};

export const copyArray = (arr) => {
	return arr.slice();
};

export const random = (min = 0, max = 1) => {
	return min + (Math.random() * (max - min));
};

export const range = (n) => {
	const arr = [];
	let i = 0;
	for(;i<n;i++) {
		arr.push(i);
	}
	return arr;
};

export const shuffle = (a) => {
	for (let i = a.length; i; i--) {
		let j = Math.floor(Math.random() * i);
		[a[i - 1], a[j]] = [a[j], a[i - 1]];
	}
};

export const toCSSBackgroundColor = (color) => {
	if (typeof color === 'string') {
		return color;
	}
	return `linear-gradient(to ${ color.type === 'vertical' ? 'bottom' : 'right' }, ${ color.colors[0] }, ${ color.colors[1] })`;
};

export const now = () => window.performance.now();

export const request = (url, success, error, options) => {
	const xhr = new XMLHttpRequest();
	if (options) {
		options(xhr);
	}
	xhr.open('GET', url, true);
	xhr.onload = () => {
		success(xhr.response);
	};
	if (error) {
		xhr.onerror = () => {
			error(xhr, xhr.status);
		};
	}
	xhr.send();
};

export const equal = (a, b) => {
	if (isObject(a)) {
		return equalObjects(a, b);
	}
	if (Array.isArray(a)) {
		return equalArrays(a, b);
	}
	return a === b;
};

const isObject = (obj) => obj === Object(obj);

const equalObjects = (a, b) => {
	for (let i in a) {
		if (!b.hasOwnProperty(i) || a[i] !== b[i]) {
			return false;
		}
	}
	return true;
};

const equalArrays = (a, b) => a.length==b.length && a.every((v,i)=> v === b[i]);

export const keysToList = (obj) => Object.keys(obj).map(k => `"${k}"`).join(', ');