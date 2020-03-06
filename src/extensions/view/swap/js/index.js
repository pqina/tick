export default ({
	DOM,
	View:{ rooter, destroyer, drawer, updater, styler } } = API) => {


	const draw = (state) => {

		if (!state.spacer) {

			// remove initial content
			state.root.textContent = '';

			state.spacer = DOM.create('span', 'tick-swap-spacer');
			state.root.appendChild(state.spacer);
		}

		// set value
		state.spacer.textContent = state.value;

		// remove finished transitions
		state.textTransitions = state.textTransitions.filter(textTransition => !textTransition.hidden);

		const currentText = state.textTransitions[state.textTransitions.length - 1];

		// get current value
		const currentValue = currentText ? currentText.value : 0;

		// calculate animation direction
		const direction = state.style.transitionDirection === 'detect' ? state.value - currentValue : state.style.transitionDirection === 'reverse' ? -1 : 1;

		// hide all previous transitions
		state.textTransitions.forEach(textTransition => {
			textTransition.hide(direction);
		});

		// create animation
		const nextText = createTextTransition(state.value, state.transitionIn, state.transitionOut);
		nextText.appendTo(state.root);

		if (state.isInitialValue()) {
			nextText.showNow();
		}
		else {
			nextText.show(direction);
		}

		state.textTransitions.push(nextText);
	};


	const createTextTransition = (text, transitionIn, transitionOut) => {

		const state = {
			shouldHide:false,
			hiding:false,
			hidden:false,
			shown:false,
			value:text
		};

		const root = DOM.create('span', 'tick-swap-transition');
		root.textContent = text;
		root.dataset.value = text;

		const api = {
			showNow:() => {
				state.shown = true;
			},
			show:(direction) => {

				// animate into view

				(direction > 0 ? transitionIn : transitionOut)(state.root, direction, () => {

					// done, test if should hide
					state.shown = true;

					// hide immidiately if the hide method has been called earlier
					if (state.shouldHide) {
						api.hide(direction);
					}
				});

			},
			hide:(direction) => {

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
				(direction > 0 ? transitionOut : transitionIn)(state.root, direction, () => {

					// no longer hiding
					state.hiding = false;

					// clean up
					state.hidden = true;

					// remove from DOM
					state.root.parentNode.removeChild(state.root);

				})

			}
		};

		Object.defineProperty(api, 'value', {
			get: function () {
				return state.value;
			}
		});

		return Object.assign(
			api,
			rooter(state, root)
		);
	};

	return (root) => {

		const state = {
			spacer:null,
			textTransitions:[]
		};


		return Object.assign(
			{},
			rooter(state, root, 'swap'),
			updater(state),
			styler(state, {
				transition:[{ name: 'crossfade' }],
				transitionIn:[],
				transitionOut:[],
				transitionDirection:'forward' // 'forward', 'reverse', 'detect'
			}),
			drawer(state, draw),
			destroyer(state)
		);

	};

};