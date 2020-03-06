import destroyer from './destroyer';
import rooter from './rooter';
import grouper from './grouper';
import drawer from './drawer';
import updater from './updater';
import resizer from './resizer';

import { clone } from '../utils';

const draw = (state, present) => {

	const views = (state.definition || []).concat();

	if (state.align === 'right') {
		views.reverse();
	}

	const value = Array.isArray(state.value) ? state.value.concat() : typeof state.value === 'object' ? clone(state.value) : state.value;

	views.forEach(view => {

		if (!view.presenter) {
			state.update = present(view);
			if (!view.presenter) {
				return;
			}
			view.presenter.appendTo(state.root);
		}

	});

	views.filter(view => view.presenter !== undefined).forEach(view => {

		if (Array.isArray(value) && state.valueMapping) {
			// if set to indexes divide values over views, else (must be "none") just pass array
			state.update(view, state.valueMapping === 'indexes' ? state.align === 'right' ? value.pop() : value.shift() : value);
		}
		else if (view.key && value[view.key] !== undefined) {
			// view expects a key so value should be object
			state.update(view, value[view.key]);
		}
		else {
			// just pass on value to all sub views
			state.update(view, value);
		}

	});

	state.views = views;

	// also draw subviews
	drawViews(state);
};

const drawViews = (state) => {

	let redrawn = false;
	state.views.filter(view => view.presenter !== undefined).forEach(view => {
		if (view.presenter.draw()) {
			redrawn = true;
		}
	});
	return redrawn;

};

export default (root, definition, present) => {

	const state = {
		valueMapping:null // "none" or "indexes"
	};

	if (root && root.dataset.valueMapping) {
		const allowed = ['none','indexes'];
		const mapping = root.dataset.valueMapping;
		state.valueMapping = allowed.indexOf(mapping) !== -1 ? mapping : null;
	}

	return Object.assign(
		{},
		rooter(state, root),
		resizer(state),
		updater(state),
		grouper(state, definition),
		drawer(state, draw, drawViews, present),
		destroyer(state)
	);

}