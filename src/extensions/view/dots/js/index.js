import { getColorRangeForColors } from '../../../../shared/utils';

export default ({
	DOM,
	Extension,
	View:{ rooter, destroyer, drawer, updater, styler } } = API) => {

	const getFontSize = (font) => {
		const char = font['0'];
		return {
			width: char[0].length,
			height: char.length
		}
	};

	const prepareFont = (font) => {
		
		// add small alphabetic characters if not present
		if (!font['a']) {
			const upper = 65;
			const lower = 97;
			const to = 122;
			let i = 0;
			let l = to - lower;
			for(;i<=l;i++) {
				font[String.fromCharCode(lower + i)] = font[String.fromCharCode(upper + i)];
			}
		}
		
		return font;
	};

	const initPixel = (state, pixel, enabled) => {

		if (enabled) {
			state.skipToTransitionInEnd(pixel);
			pixel.setAttribute('data-enabled', 'true');
		}
		else {
			state.skipToTransitionOutEnd(pixel);
			pixel.setAttribute('data-enabled', 'false');
		}
		
		pixel.setAttribute('data-initialised', 'true');
	};

	const updatePixel = (state, pixel, enabled) => {
		if (enabled) {
			state.transitionIn(pixel);
		}
		else {
			state.transitionOut(pixel);
		}
	};

	const updatePixelDelayed = (state, pixel, enabled, delay) => {
		setTimeout(()=>{
			updatePixel(state, pixel, enabled);
		}, delay);
	};

	const didPixelStateChange = (dataset, newState) => {
		const currentState = dataset.enabled === 'true';
		return newState !== currentState;
	};

	const displayCharInSlot = (char, slot, update) => {

		let x = 0;
		let y = 0;
		let ymax = slot.length;
		let xmax = slot[0].length;

		for(;y<ymax;y++) {
			x = 0;
			for(;x<xmax; x++) {
				update(slot[y][x], char[y][x] == 1);
			}
		}

	};

	const getSlot = (group) => {

		let pixels = [];
		let y = 0;
		let children = group.children;
		let rows = children.length;
		for(;y<rows;y++) {
			let cols = children[y].children.length;
			let x = 0;
			pixels[y] = [];
			for(;x<cols; x++) {
				pixels[y][x] = children[y].children[x].firstChild;
			}
		}

		return pixels;
	};

	const getSlots = (display) => {

		let slots = [];
		let i = 0;
		let l = display.children.length;

		for(;i<l;i++) {
			slots[i] = getSlot(display.children[i]);
		}

		return slots;
	};

	const removeSlots = (display, amount) => {
		while (amount > 0) {
			display.removeChild(display.firstChild);
			amount--;
		}
	};

	const renderSlot = (width, height, color) => {

		let slot = '';
		let i = 0;

		// for every row (top to bottom)
		for(; i<height; i++) {
			slot += '<div>';
			let j = 0;
			for(; j<width; j++) {
				slot += `<div><span class="tick-dots-dot"${ color ? ' style="background-color:' + color[i][j] +';"' : ''} data-initialised="false" data-enabled="false"></span></div>`;
			}
			slot += '</div>';
		}
		
		return `<div class="tick-dots-character">${slot}</div>`;
	};

	const addSlots = (display, amount, font, color) => {

		let { width, height } = getFontSize(font);
		let i = 0;
		for (;i<amount;i++) {
			display.innerHTML = renderSlot(width, height, color) + display.innerHTML;
		}
	};

	const getColorMatrix = (size, color) => {

		const matrix = [];
		
		if (typeof color === 'string') {
			let i=0;
			for(;i<size.height;i++) {
				let l=0;
				matrix[i] = [];
				for(;l<size.width;l++) {
					matrix[i][l] = color;
				}
			}
		}
		else {
			let colors = getColorRangeForColors(color.colors, size[color.type === 'horizontal-gradient' ? 'width' : 'height']);
			let i=0;
			let c=null;
			for(;i<size.height;i++) {
				let l=0;
				matrix[i] = [];
				if (color.type === 'vertical-gradient') {
					c = colors[i];
				}
				for(;l<size.width;l++) {
					if (color.type === 'horizontal-gradient') {
						c = colors[l];
					}
					matrix[i][l] = c;
				}
			}
			
		}
		
		return matrix;
	};

	const draw = (state) => {

		let valueStr = state.value + '';
		if (!state.display) {
			const fontExtension = Extension.getExtension(Extension.Type.FONT, state.style.font);
			state.font = prepareFont(fontExtension());
			state.display = DOM.create('div', 'tick-dots-display');
			state.root.appendChild(state.display);

			// set colors if not automatically handled by CSS
			if (state.style.color !== 'auto') {
				state.colorMatrix = getColorMatrix(getFontSize(state.font), state.style.color);
			}
		}

		// create new slots if value changes
		const diff = valueStr.length - state.slots.length;
		if (diff !== 0) {
			if (diff > 0) {
				addSlots(state.display, diff, state.font, state.colorMatrix);
			}
			else {
				removeSlots(state.display, Math.abs(diff));
			}
			state.slots = getSlots(state.display);
		}

		// render characters
		const initial = state.isInitialValue();
		let count = 0;
		let interval = 0;
		let characters = state.style.align === 'right' ? valueStr.split('').reverse() : valueStr.split('');

		// determine if should load delayed updater
		let updater = state.style.characterUpdateDelay + state.style.dotUpdateDelay > 0 ? updatePixelDelayed : updatePixel;
		
		characters.map((char,i) => {
			
			// filter out unchanged characters
			return state.current[i] === char ? null : char;
			
		}).forEach((char, i) => {
			
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
				(pixel, enabled) => {
					
					// set initial pixel state
					const dataset = pixel.dataset;
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
					interval = (state.style.characterUpdateDelay * i) + (state.style.dotUpdateDelay * count);

					// update this pixel
					updater(state, pixel, enabled, interval);

				}
			)
		});
		
		state.current = characters.concat();
	};
	
	return (root) => {

		const state = {
			current:[],
			display:null,
			font:null,
			colorMatrix:null,
			size:null,
			slots:[]
		};

		return Object.assign(
			{},
			rooter(state, root, 'dots'),
			updater(state),
			styler(state, {
				color: 'auto', // 'auto' means it's derived from CSS, can be gradient
				font: 'highres', // 'lowres' or user defined font
				shape: 'auto', // 'auto' means it's derived from CSS, 'square' / 'circle'
				align: 'right', // 'left', update pixels from the left or from the right
				dotUpdateDelay: 10, // milliseconds
				characterUpdateDelay: 0, // milliseconds
				transition:[{ name: 'crossfade', duration:500 }],
				transitionIn:[],
				transitionOut:[]
			}),
			drawer(state, draw),
			destroyer(state)
		);

	};
};