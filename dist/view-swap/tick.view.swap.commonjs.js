/* eslint-disable */

/*
 * tick v1.7.5 - Counters Made Easy
 * Copyright (c) 2020 PQINA - http://pqina.nl/tick/
 */
module.exports = (function() {
	if (!module) {
		var module = {};
	}
'use strict';

var index = (function () {
	var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : API,
	    DOM = _ref.DOM,
	    _ref$View = _ref.View,
	    rooter = _ref$View.rooter,
	    destroyer = _ref$View.destroyer,
	    drawer = _ref$View.drawer,
	    updater = _ref$View.updater,
	    styler = _ref$View.styler;

	var draw = function draw(state) {

		if (!state.spacer) {

			// remove initial content
			state.root.textContent = '';

			state.spacer = DOM.create('span', 'tick-swap-spacer');
			state.root.appendChild(state.spacer);
		}

		// set value
		state.spacer.textContent = state.value;

		// remove finished transitions
		state.textTransitions = state.textTransitions.filter(function (textTransition) {
			return !textTransition.hidden;
		});

		var currentText = state.textTransitions[state.textTransitions.length - 1];

		// get current value
		var currentValue = currentText ? currentText.value : 0;

		// calculate animation direction
		var direction = state.style.transitionDirection === 'detect' ? state.value - currentValue : state.style.transitionDirection === 'reverse' ? -1 : 1;

		// hide all previous transitions
		state.textTransitions.forEach(function (textTransition) {
			textTransition.hide(direction);
		});

		// create animation
		var nextText = createTextTransition(state.value, state.transitionIn, state.transitionOut);
		nextText.appendTo(state.root);

		if (state.isInitialValue()) {
			nextText.showNow();
		} else {
			nextText.show(direction);
		}

		state.textTransitions.push(nextText);
	};

	var createTextTransition = function createTextTransition(text, transitionIn, transitionOut) {

		var state = {
			shouldHide: false,
			hiding: false,
			hidden: false,
			shown: false,
			value: text
		};

		var root = DOM.create('span', 'tick-swap-transition');
		root.textContent = text;
		root.dataset.value = text;

		var api = {
			showNow: function showNow() {
				state.shown = true;
			},
			show: function show(direction) {

				// animate into view

				(direction > 0 ? transitionIn : transitionOut)(state.root, direction, function () {

					// done, test if should hide
					state.shown = true;

					// hide immidiately if the hide method has been called earlier
					if (state.shouldHide) {
						api.hide(direction);
					}
				});
			},
			hide: function hide(direction) {

				// already hiding
				if (state.hiding || state.hidden) {
					return;
				}

				// should be hidden when shown
				state.shouldHide = true;

				// are we shown yet?
				if (!state.shown) {
					return;
				}

				// already hiding
				state.hiding = true;

				// yes we are, let's hide immidiately
				(direction > 0 ? transitionOut : transitionIn)(state.root, direction, function () {

					// no longer hiding
					state.hiding = false;

					// clean up
					state.hidden = true;

					// remove from DOM
					state.root.parentNode.removeChild(state.root);
				});
			}
		};

		Object.defineProperty(api, 'value', {
			get: function get() {
				return state.value;
			}
		});

		return Object.assign(api, rooter(state, root));
	};

	return function (root) {

		var state = {
			spacer: null,
			textTransitions: []
		};

		return Object.assign({}, rooter(state, root, 'swap'), updater(state), styler(state, {
			transition: [{ name: 'crossfade' }],
			transitionIn: [],
			transitionOut: [],
			transitionDirection: 'forward' // 'forward', 'reverse', 'detect'
		}), drawer(state, draw), destroyer(state));
	};
});

module.exports = index;

	module.exports.identifier = {
		name:'swap',
		type:'view'
	};
    return module.exports;
}());