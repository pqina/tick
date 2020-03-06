export default ({
	DOM,
	View:{ rooter, destroyer, drawer, updater, styler } } = API) => {

	const draw = (state) => {

		// initial draw
		if (!state.rail) {
			state.rail = DOM.create('span','tick-line-rail');
			state.fill = DOM.create('span','tick-line-fill');
			state.rail.appendChild(state.fill);
			state.root.appendChild(state.rail);
		}

		// update style of bar
		if (state.style.fillColor) {
			state.fill.style.backgroundColor = state.style.fillColor;
		}

		if (state.style.railColor) {
			state.rail.style.backgroundColor = state.style.railColor;
		}

		// update bar
		DOM.transform(
			state.fill,
			state.style.orientation === 'horizontal' ? 'translateX' : 'translateY',
			state.style.flip ? 
				// flipped
				-100 + (state.style.orientation === 'horizontal' ? 1 : -1) * state.value * 100 :
				
				// normal
				(state.style.orientation === 'horizontal' ? 1 : -1) * state.value * 100,
			'%'
		);

	};

	return (root) => {

		const state = {
			rail: null,
			fill: null
		};

		return Object.assign(
			{},
			rooter(state, root, 'line'),
			updater(state),
			styler(state, {
				flip: false, // true
				fillColor: null, // color, { colors: ['red', 'blue'], type: 'horizontal' }
				railColor: null, // color, { colors: ['red', 'blue'], type: 'follow' }
				capStyle: 'auto', // auto is set by CSS, round, square, butt
				orientation: 'horizontal' // vertical
			}),
			drawer(state, draw),
			destroyer(state)
		);

	};
};