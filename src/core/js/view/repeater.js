import destroyer from './destroyer';
import rooter from './rooter';
import grouper from './grouper';
import drawer from './drawer';
import updater from './updater';

import { cloneDefinition, copyArray } from '../utils';

const draw = (state, present, ready) => {

	// if value is not in form of array force to array
	const value = copyArray(Array.isArray(state.value) ? state.value : (state.value + '').split(''));

	// if we're aligned to the right we will append items differently so view updating is less jumpy
	if (state.align === 'right') {
		value.reverse();
	}

	// clean up presenters if too much presenters
	if (state.definitions.length > value.length) {
		while(state.definitions.length > value.length) {
			const def = state.definitions.pop();
			def.presenter.destroy();
		}
	}

	// setup presenters
	value.forEach((value, index) => {

		let def = state.definitions[index];
		if (!def) {
			def = state.definitions[index] = cloneDefinition(state.definition);
			state.update = present(def);
			def.presenter.appendTo(state.root, state.align === 'right' ? 'first' : 'last');
		}

	});

	// let's update all subs (possibly sets dirty flag)
	value.forEach(
		(value, index) => state.update(state.definitions[index], value)
	);

	state.views = value;

	// also draw subviews
	drawViews(state);
};

const drawViews = (state) => {

	let redrawn = false;
	state.views.forEach((view, index) => {
		if (state.definitions[index].presenter.draw()) {
			redrawn = true;
		}
	});
	return redrawn;

};

export default (root, definition, present) => {

	const state = {
		definitions:[]
	};


	return Object.assign(
		{},
		rooter(state, root),
		updater(state),
		grouper(state, definition),
		drawer(state, draw, drawViews, present),
		destroyer(state)
	);

}