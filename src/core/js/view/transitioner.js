import { interpolate } from '../animate';
import { setTransformOrigin, isHTMLElement } from '../dom';
import { ExtensionType, getExtension } from '../extensions/index';

/**
 * Returns a function that applies the transitions to the given element
 * @param transitions
 * @returns {function(*)}
 */
export const createTransitioner = (transitions) => {

	const transitioners = transitions.map(t => {
		return createDurationTransitioner(
			createTransition(t.name, t.parameters, t.ease), 
			t.origin, t.duration, t.delay
		);
	});

	return (element, direction, complete) => {

		// don't run animations when no element is supplied
		if (!isHTMLElement(element)) {
			return false;
		}

		let count = transitioners.length;
		transitioners.forEach(transitioner => {
			transitioner(element, direction, () => {
				count--;
				if (!count && complete) {
					complete(element);
				}
			});
		});

	}

};

const createTransition = (name, parameters, ease) => {
	const easing = ease ? getExtension(ExtensionType.EASING_FUNCTION, ease) : ease;
	const transition = getExtension(ExtensionType.TRANSITION, name);
	return (element, direction, p) => {
		transition(element, p, direction, easing, ...parameters);
	}
};

const createDurationTransitioner = (transition, origin = '50% 50% 0', duration = 500, delay) => {

	return (element, direction = 1, complete) => {

		// set transform origin
		setTransformOrigin(element, origin);

		// run animation
		interpolate(p => {
			transition(element, direction, p);
		}, complete, duration, delay);

	};

};

export const getComposedTransitionActs = (transition) => {
	return getExtension(ExtensionType.TRANSITION, transition.name)(...(transition.parameters || []));
};