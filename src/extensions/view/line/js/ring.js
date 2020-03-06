import { drawRing } from './canvas';

export default ({
	Canvas,
	DOM:{ create },
	Utils:{ toPixels, toColor },
	View:{ rooter, destroyer, drawer, updater, styler, resizer } } = API) => {


	/**
	 * Ring helper functions
	 */
	const draw = (state) => {

		// if is not attached can't draw (we need to know root size)
		if (!state.root || !state.root.parentNode) {
			return;
		}

		// if not in body, no need to draw
		if (!document.body.contains(state.root)) {
			return;
		}

		reflow(state);

		// clear canvas before redraw
		Canvas.clear(state.visual);

		// don't redraw as would be drawn outside of bounding box and throw errors
		if (state.sizeHalf - Math.max(state.fillRadius, state.railRadius) < 0) {
			return;
		}

		// draw new ring
		drawRing(
			state.visual.getContext('2d'),

			state.style.flip ? 1 - state.value : state.value,

			state.style.offset,
			state.style.length,
			state.style.gapSize,

			state.sizeHalf,

			state.fillRadius,
			state.fillWidth,
			state.style.fillColor,
			state.fillShadow,

			state.railRadius,
			state.railWidth,
			state.style.railColor,
			state.railShadow,

			state.style.capStyle,

			state.style.invert
		);
	};

	const reflow = (state) => {

		if (!state.visual) {
			state.visual = create('canvas');
			state.visual.width = 0;
			state.visual.height = 0;
			state.root.appendChild(state.visual);
		}

		let ctx = state.visual.getContext('2d');

		// if is not the first reflow and last one is more than a second ago
		let size = state.size;
		if (size === null || state.reflowStamp === null || Date.now() - state.reflowStamp > 1000) {
			const clientWidth = state.root.clientWidth;
			if (clientWidth > 0) {
				state.size = clientWidth;
				size = state.size;
			}
		}

		// 
		state.sizeHalf = size * .5;

		let devicePixelRatio = Canvas.getDevicePixelRatio();
		let backingStoreRatio = Canvas.getBackingStoreRatio(ctx);
		let ratio = devicePixelRatio / backingStoreRatio;

		// calculate fill width in pixels
		state.fillWidth = toPixels(state.style.fillWidth, state.root, 'ringFillWidth');
		state.railWidth = toPixels(state.style.railWidth, state.root, 'ringRailWidth');

		// handle various pixel densities
		if (devicePixelRatio !== backingStoreRatio) {

			state.visual.width = size * ratio;
			state.visual.height = size * ratio;

			state.visual.style.width = size + 'px';
			state.visual.style.height = size + 'px';

			ctx.scale(ratio, ratio);

		}
		else {
			state.visual.width = size;
			state.visual.height = size;
		}

		// background
		let padding = state.style.padding ? toPixels(state.style.padding, state.root, 'ringPadding') : 0;

		// calculate shadows if set
		state.fillShadow = state.style.fillShadow ? toCanvasShadow(state.style.fillShadow, state.root) : null;
		state.railShadow = state.style.railShadow ? toCanvasShadow(state.style.railShadow, state.root) : null;

		let paddingShadow = 0;
		if (state.fillShadow || state.railShadow) {
			paddingShadow = Math.max(getShadowArea(state.fillShadow), getShadowArea(state.railShadow));
		}

		let paddingWidth = 0;
		if (state.fillWidth || state.railWidth) {
			paddingWidth = Math.max(state.fillWidth, state.railWidth) * .5;
		}

		let radius = (state.sizeHalf - padding - paddingShadow - paddingWidth);
		state.fillRadius = Math.max(0, radius - (state.fillWidth * .5));
		state.railRadius = Math.max(0, radius - (state.railWidth * .5));

		// set ring offsets based on alignment
		if (state.style.railWidth === state.fillWidth) {
			state.railRadius = state.fillRadius;
		}
		else if (state.style.railWidth < state.fillWidth) {

			if (state.style.align === 'center') {
				state.railRadius = state.fillRadius;
			}
			else if (state.style.align === 'bottom') {
				state.railRadius = radius - (state.fillWidth - (state.railWidth *.5));
			}
			else if (state.style.align === 'inside') {
				state.railRadius = radius - (state.fillWidth + (state.railWidth * .5));
			}

		}
		else {

			if (state.style.align === 'center') {
				state.fillRadius = state.railRadius;
			}
			else if (state.style.align === 'bottom') {
				state.fillRadius = radius - (state.railWidth - (state.fillWidth * .5));
			}
			else if (state.style.align === 'inside') {
				state.fillRadius = radius - (state.railWidth + (state.fillWidth * .5));
			}

		}

		state.reflowStamp = Date.now();
	};

	const getShadowArea = (shadow) => {
		return shadow ? Math.max(Math.abs(shadow[0]), Math.abs(shadow[1])) + shadow[2] : 0;
	};

	const toCanvasShadow = (shadow, root) => {

		// limit shadow parts
		const parts = shadow.slice(0,3).concat(shadow[shadow.length-1]);

		// calculate actual values
		return parts.map((value, i) => {

			if (i < 3) {
				return toPixels(value, root, 'canvasShadow');
			}

			return toColor(value);

		});

	};

	/**
	 * Ring Definition
	 */
	return (root) => {

		const state = {
			size:null,
			sizeHalf:null,
			visual:null,
			fillShadow:null,
			fillRadius:null,
			fillWidth:null,
			ringShadow:null,
			ringRadius:null,
			ringWidth:null,
			reflowStamp:null
		};

		resizer(state);

		return Object.assign(
			{},
			rooter(state, root, 'line'),
			updater(state),
			styler(state, {
				offset:0, // 0 to 1
				length:1, // 0 to 1
				gapSize:0, // 0 to 1
				flip:false,
				invert:false,
				align:'center', // 'top', 'inside', 'bottom'
				padding:0, // padding
				capStyle:'butt', // 'round'

				fillColor:'#333', // { colors: ['red', 'blue'], type: 'horizontal' }
				fillWidth:'.125em',
				fillShadow:null, // 1em 0 3px rgba(0, 0, 0, .333)

				railColor:'#eee', // { colors: ['red', 'blue'], type: 'follow' }
				railWidth:'.125em',
				railShadow:null // 1em 0 3px rgba(0, 0, 0, .333)
			}),
			drawer(state, draw),
			destroyer(state)
		);

	};


};