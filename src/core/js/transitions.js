import { setTransform } from './dom';
import { toCSSValue } from './utils';
import cache from '../../shared/cache';

import { easeInOutQuad,  } from './easing';
import { ExtensionType, addExtensions } from './extensions/index';

const Translation = {
	'x':'translateX',
	'y':'translateY',
	'z':'translateZ'
};

const Rotation = {
	'x':'rotateX',
	'y':'rotateY',
	'z':'rotateZ'
};

const Scalar = {
	'both':'scale',
	'x':'scaleX',
	'y':'scaleY'
};


/**
 * Helper methods
 */
const between = (from, to, p) => {
	return from + ((to - from) * p);
};


/**
 * Single Element transitions
 */
const fade = (element, p, direction, ease = easeInOutQuad, from = 0, to = 1) => {
	if (direction < 0) {
		[from, to] = [to, from];
	}
	element.style.opacity = between(from, to, ease(p));
};

const move = (element, p, direction, ease = easeInOutQuad, from = '0', to = '100%', axis = 'y') => {
	if (direction < 0) {
		[from, to] = [to, from];
	}
	const f = cache(from, toCSSValue);
	const t = cache(to, toCSSValue);
	setTransform(
		element,
		Translation[axis],
		between(f.value, t.value, ease(p)),
		f.units || t.units
	);
};

const rotate = (element, p, direction, ease = easeInOutQuad, from = '0', to = '90deg', axis = 'x') => {
	if (direction < 0) {
		[from, to] = [to, from];
	}
	const f = cache(from, toCSSValue);
	const t = cache(to, toCSSValue);
	setTransform(
		element,
		Rotation[axis],
		between(f.value, t.value, ease(p)),
		f.units || t.units
	);
};

const scale = (element, p, direction, ease = easeInOutQuad, from = 0, to = 1, axis = 'both') => {
	if (direction < 0) {
		[from, to] = [to, from];
	}
	setTransform(
		element,
		Scalar[axis],
		between(from, to, ease(p))
	);
};

/**
 * Composed
 */
import crossfade from './transitions/crossfade';
import swap from './transitions/swap';
import revolve from './transitions/revolve';
import zoom from './transitions/zoom';

/**
 * Available transitions
 */
export const Transitions = {
	fade,
	move,
	rotate,
	scale,

	// composed transitions
	crossfade,
	swap,
	revolve,
	zoom
};

addExtensions(ExtensionType.TRANSITION, Transitions);