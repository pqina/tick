import cache from './cache';

const toRGBAColor = (c) => {
	return `rgba(${ c.map((v,i) => i < 3 ? Math.round(v * 255) : v).join(',') })`
};

const interpolateColor = (a, b, p) => {
	return a.map((v, i) => v + ((b[i] - v) * p));
};

const toColorList = (color) => {
	const c = color
		.match(/[.\d]+/g)
		.map((value, index) => index < 3 ? parseFloat(value) / 255 : parseFloat(value));
	return c.length === 4 ? c : c.concat([1]);
};

export const getColorRangeForColors = (colors, precision) => {
	
	let colorOffset = 0;
	const count = colors.length - 1;
	const colorFirst = colors[0];
	const colorLast = colors[colors.length-1];

	if (colorFirst.offset && colorFirst.offset > 0) {
		colors.unshift({
			offset: 0,
			value: colorFirst.value
		})
	}

	if (colorLast.offset && colorLast.offset < 1) {
		colors.push({
			offset: 1,
			value: colorLast.value
		});
	}

	const input = colors
		.map((color, index) => {

			colorOffset = color.offset  || Math.max(index / count, colorOffset);

			return {
				offset: colorOffset,
				// copy color as array so we don't modify cache value
				value: cache(color.value, toColorList).concat()
			}
		});

	const output = input.reduce((output, color, index) => {

		// color to interpolate towards
		const targetColor = color.value;

		// add first color
		if (index === 0) {
			output.push(targetColor);
		}
		// interpolate to this color from last color
		else if (index > 0) {

			const previousColor = output[output.length - 1];
			const previousOffset = (output.length - 1) / precision;

			const steps = Math.round(precision * (color.offset - previousOffset));

			let i = 1; // skip previous color (it's already in array)
			for(;i<=steps;i++) {
				output.push(interpolateColor(previousColor, targetColor, i / steps));
			}

		}

		return output;

	},[]);

	return output.map(toRGBAColor);
};