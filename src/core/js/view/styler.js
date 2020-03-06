import { observeAttributes } from '../dom';
import { mergeObjects, clone } from '../utils';
import { toStyles } from '../style';
import { getComposedTransitionActs, createTransitioner } from './transitioner';

/**
 * Styler
 * @param state
 * @param base
 */
export default (state, base = {}) => {

	// styles that were last applied to the element
	state.lastAppliedStyles = null;

	// set default style
	updateStyles(state, base, state.root.dataset.style);

	// setup observer, will observe style attribute so can restyle when changed
	state.styleObserver = observeAttributes(state.root, ['data-style'], (string) => {
		updateStyles(state, base, string);
	});

	// adds style setter
	return {
		setStyle:(css) => {
			updateStyles(state, base, css);
		}
	}

};

const updateStyles = (state, base, css) => {

	// don't update if is same
	if (state.lastAppliedStyles === css) {
		return;
	}

	// remember these styles
	state.lastAppliedStyles = css;

	state.style = css ? mergeObjects(base, toStyles(css)) : base;

	let intro = [];
	let outro = [];

	if (state.style.transitionIn && state.style.transitionIn.length) {
		intro = state.style.transitionIn;
		outro = state.style.transitionOut;
	}
	else if (state.style.transition && state.style.transition !== 'none') {

		state.style.transition.forEach(transition => {
			const acts = getComposedTransitionActs(transition);
			intro = intro.concat(acts.intro);
			outro = outro.concat(acts.outro);
		});

	}

	if (intro && outro) {
		state.transitionIn = createTransitioner(intro);
		state.transitionOut = createTransitioner(outro);

		state.skipToTransitionInEnd = createTransitioner(intro.map(clearTiming));
		state.skipToTransitionOutEnd = createTransitioner(outro.map(clearTiming));
	}

	state.dirty = true;
};

const clearTiming = t => {
	const tn = clone(t);
	tn.duration = 0;
	tn.delay = 0;
	return tn;
};