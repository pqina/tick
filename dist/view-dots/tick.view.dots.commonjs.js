/* eslint-disable */

/*
 * @pqina/tick v1.7.6 - Counters Made Easy
 * Copyright (c) 2020 PQINA - https://github.com/pqina/tick/
 */
module.exports = (function() {
	if (!module) {
		var module = {};
	}
'use strict';

var CACHE = {};

var cache = (function (value, fn) {
	var fns = fn.toString();
	if (!CACHE[fns]) {
		CACHE[fns] = {};
	}
	if (!CACHE[fns][value]) {
		CACHE[fns][value] = fn(value);
	}
	return CACHE[fns][value];
});

var toRGBAColor = function toRGBAColor(c) {
	return 'rgba(' + c.map(function (v, i) {
		return i < 3 ? Math.round(v * 255) : v;
	}).join(',') + ')';
};

var interpolateColor = function interpolateColor(a, b, p) {
	return a.map(function (v, i) {
		return v + (b[i] - v) * p;
	});
};

var toColorList = function toColorList(color) {
	var c = color.match(/[.\d]+/g).map(function (value, index) {
		return index < 3 ? parseFloat(value) / 255 : parseFloat(value);
	});
	return c.length === 4 ? c : c.concat([1]);
};

var getColorRangeForColors = function getColorRangeForColors(colors, precision) {

	var colorOffset = 0;
	var count = colors.length - 1;
	var colorFirst = colors[0];
	var colorLast = colors[colors.length - 1];

	if (colorFirst.offset && colorFirst.offset > 0) {
		colors.unshift({
			offset: 0,
			value: colorFirst.value
		});
	}

	if (colorLast.offset && colorLast.offset < 1) {
		colors.push({
			offset: 1,
			value: colorLast.value
		});
	}

	var input = colors.map(function (color, index) {

		colorOffset = color.offset || Math.max(index / count, colorOffset);

		return {
			offset: colorOffset,
			// copy color as array so we don't modify cache value
			value: cache(color.value, toColorList).concat()
		};
	});

	var output = input.reduce(function (output, color, index) {

		// color to interpolate towards
		var targetColor = color.value;

		// add first color
		if (index === 0) {
			output.push(targetColor);
		}
		// interpolate to this color from last color
		else if (index > 0) {

				var previousColor = output[output.length - 1];
				var previousOffset = (output.length - 1) / precision;

				var steps = Math.round(precision * (color.offset - previousOffset));

				var i = 1; // skip previous color (it's already in array)
				for (; i <= steps; i++) {
					output.push(interpolateColor(previousColor, targetColor, i / steps));
				}
			}

		return output;
	}, []);

	return output.map(toRGBAColor);
};

var index = (function () {
	var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : API,
	    DOM = _ref.DOM,
	    Extension = _ref.Extension,
	    _ref$View = _ref.View,
	    rooter = _ref$View.rooter,
	    destroyer = _ref$View.destroyer,
	    drawer = _ref$View.drawer,
	    updater = _ref$View.updater,
	    styler = _ref$View.styler;

	var getFontSize = function getFontSize(font) {
		var char = font['0'];
		return {
			width: char[0].length,
			height: char.length
		};
	};

	var prepareFont = function prepareFont(font) {

		// add small alphabetic characters if not present
		if (!font['a']) {
			var upper = 65;
			var lower = 97;
			var to = 122;
			var i = 0;
			var l = to - lower;
			for (; i <= l; i++) {
				font[String.fromCharCode(lower + i)] = font[String.fromCharCode(upper + i)];
			}
		}

		return font;
	};

	var initPixel = function initPixel(state, pixel, enabled) {

		if (enabled) {
			state.skipToTransitionInEnd(pixel);
			pixel.setAttribute('data-enabled', 'true');
		} else {
			state.skipToTransitionOutEnd(pixel);
			pixel.setAttribute('data-enabled', 'false');
		}

		pixel.setAttribute('data-initialised', 'true');
	};

	var updatePixel = function updatePixel(state, pixel, enabled) {
		if (enabled) {
			state.transitionIn(pixel);
		} else {
			state.transitionOut(pixel);
		}
	};

	var updatePixelDelayed = function updatePixelDelayed(state, pixel, enabled, delay) {
		setTimeout(function () {
			updatePixel(state, pixel, enabled);
		}, delay);
	};

	var didPixelStateChange = function didPixelStateChange(dataset, newState) {
		var currentState = dataset.enabled === 'true';
		return newState !== currentState;
	};

	var displayCharInSlot = function displayCharInSlot(char, slot, update) {

		var x = 0;
		var y = 0;
		var ymax = slot.length;
		var xmax = slot[0].length;

		for (; y < ymax; y++) {
			x = 0;
			for (; x < xmax; x++) {
				update(slot[y][x], char[y][x] == 1);
			}
		}
	};

	var getSlot = function getSlot(group) {

		var pixels = [];
		var y = 0;
		var children = group.children;
		var rows = children.length;
		for (; y < rows; y++) {
			var cols = children[y].children.length;
			var x = 0;
			pixels[y] = [];
			for (; x < cols; x++) {
				pixels[y][x] = children[y].children[x].firstChild;
			}
		}

		return pixels;
	};

	var getSlots = function getSlots(display) {

		var slots = [];
		var i = 0;
		var l = display.children.length;

		for (; i < l; i++) {
			slots[i] = getSlot(display.children[i]);
		}

		return slots;
	};

	var removeSlots = function removeSlots(display, amount) {
		while (amount > 0) {
			display.removeChild(display.firstChild);
			amount--;
		}
	};

	var renderSlot = function renderSlot(width, height, color) {

		var slot = '';
		var i = 0;

		// for every row (top to bottom)
		for (; i < height; i++) {
			slot += '<div>';
			var j = 0;
			for (; j < width; j++) {
				slot += '<div><span class="tick-dots-dot"' + (color ? ' style="background-color:' + color[i][j] + ';"' : '') + ' data-initialised="false" data-enabled="false"></span></div>';
			}
			slot += '</div>';
		}

		return '<div class="tick-dots-character">' + slot + '</div>';
	};

	var addSlots = function addSlots(display, amount, font, color) {
		var _getFontSize = getFontSize(font),
		    width = _getFontSize.width,
		    height = _getFontSize.height;

		var i = 0;
		for (; i < amount; i++) {
			display.innerHTML = renderSlot(width, height, color) + display.innerHTML;
		}
	};

	var getColorMatrix = function getColorMatrix(size, color) {

		var matrix = [];

		if (typeof color === 'string') {
			var i = 0;
			for (; i < size.height; i++) {
				var l = 0;
				matrix[i] = [];
				for (; l < size.width; l++) {
					matrix[i][l] = color;
				}
			}
		} else {
			var colors = getColorRangeForColors(color.colors, size[color.type === 'horizontal-gradient' ? 'width' : 'height']);
			var _i = 0;
			var c = null;
			for (; _i < size.height; _i++) {
				var _l = 0;
				matrix[_i] = [];
				if (color.type === 'vertical-gradient') {
					c = colors[_i];
				}
				for (; _l < size.width; _l++) {
					if (color.type === 'horizontal-gradient') {
						c = colors[_l];
					}
					matrix[_i][_l] = c;
				}
			}
		}

		return matrix;
	};

	var draw = function draw(state) {

		var valueStr = state.value + '';
		if (!state.display) {
			var fontExtension = Extension.getExtension(Extension.Type.FONT, state.style.font);
			state.font = prepareFont(fontExtension());
			state.display = DOM.create('div', 'tick-dots-display');
			state.root.appendChild(state.display);

			// set colors if not automatically handled by CSS
			if (state.style.color !== 'auto') {
				state.colorMatrix = getColorMatrix(getFontSize(state.font), state.style.color);
			}
		}

		// create new slots if value changes
		var diff = valueStr.length - state.slots.length;
		if (diff !== 0) {
			if (diff > 0) {
				addSlots(state.display, diff, state.font, state.colorMatrix);
			} else {
				removeSlots(state.display, Math.abs(diff));
			}
			state.slots = getSlots(state.display);
		}

		// render characters
		var initial = state.isInitialValue();
		var count = 0;
		var interval = 0;
		var characters = state.style.align === 'right' ? valueStr.split('').reverse() : valueStr.split('');

		// determine if should load delayed updater
		var updater = state.style.characterUpdateDelay + state.style.dotUpdateDelay > 0 ? updatePixelDelayed : updatePixel;

		characters.map(function (char, i) {

			// filter out unchanged characters
			return state.current[i] === char ? null : char;
		}).forEach(function (char, i) {

			// skip if was not changed (means no changes)
			if (char === null) {
				return;
			}

			displayCharInSlot(
			// get the character, if not found, render empty slot
			state.font[char] || state.font[' '],

			// determine alignment (go from back to front of string if aligned right)
			state.slots[state.style.align === 'right' ? valueStr.length - i - 1 : i],

			// render pixel
			function (pixel, enabled) {

				// set initial pixel state
				var dataset = pixel.dataset;
				if (dataset.initialised === 'false') {
					initPixel(state, pixel, initial ? enabled : false);
					if (initial) {
						return;
					}
				}

				// only redraw pixel if state changed
				if (!didPixelStateChange(dataset, enabled)) {
					return;
				}

				// update pixel state
				dataset.enabled = enabled ? 'true' : 'false';

				// total updated pixel count
				count++;

				// calculate animation interval
				interval = state.style.characterUpdateDelay * i + state.style.dotUpdateDelay * count;

				// update this pixel
				updater(state, pixel, enabled, interval);
			});
		});

		state.current = characters.concat();
	};

	return function (root) {

		var state = {
			current: [],
			display: null,
			font: null,
			colorMatrix: null,
			size: null,
			slots: []
		};

		return Object.assign({}, rooter(state, root, 'dots'), updater(state), styler(state, {
			color: 'auto', // 'auto' means it's derived from CSS, can be gradient
			font: 'highres', // 'lowres' or user defined font
			shape: 'auto', // 'auto' means it's derived from CSS, 'square' / 'circle'
			align: 'right', // 'left', update pixels from the left or from the right
			dotUpdateDelay: 10, // milliseconds
			characterUpdateDelay: 0, // milliseconds
			transition: [{ name: 'crossfade', duration: 500 }],
			transitionIn: [],
			transitionOut: []
		}), drawer(state, draw), destroyer(state));
	};
});

module.exports = index;

	module.exports.identifier = {
		name:'dots',
		type:'view'
	};
    return module.exports;
}());