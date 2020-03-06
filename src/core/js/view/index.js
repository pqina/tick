import createRoot from './root';
import createRepeater from './repeater';

/**
 * View Composers
 */
import rooter from './rooter';
import drawer from './drawer';
import updater from './updater';
import styler from './styler';
import grouper from './grouper';
import resizer from './resizer';
import destroyer from './destroyer';

/**
 * API Utilities
 */
import { toPixels, toColor } from '../style';
import { request, now } from '../utils';
import { text, create, setTransform, isVisible } from '../dom';
import { clearCanvas, getDevicePixelRatio, getBackingStoreRatio } from '../canvas';
import { animate } from '../animate';
import { ExtensionType, getExtension, addExtensions } from '../extensions/index';


/**
 * Add default text view
 */
export const Views = {
	'text':() => (root) => {

		const state = {};

		const draw = (state) => {
			state.root.setAttribute('data-value', state.value);
			text(state.root, state.value);
		};

		return Object.assign(
			{},
			rooter(state, root, 'text'),
			updater(state),
			drawer(state, draw),
			destroyer(state)
		);
	}

};

addExtensions(ExtensionType.VIEW, Views);


/**
 * Internal API for use by views
 */
const API = () => ({
	Extension:{
		Type: ExtensionType,
		getExtension
	},
	Utils: {
		toPixels,
		toColor
	},
	Canvas: {
		clear: clearCanvas,
		getDevicePixelRatio,
		getBackingStoreRatio
	},
	DOM: {
		visible: isVisible,
		create,
		transform: setTransform
	},
	Animation: {
		animate
	},
	Data: {
		request,
	},
	Date: {
		performance: now
	},
	View: {
		rooter,
		drawer,
		updater,
		styler,
		grouper,
		resizer,
		destroyer
	}
});


/**
 * Base view definitions
 */
export const createPresenterRoot = (root, definition, presentDefinition) => createRoot(root, definition, presentDefinition);

export const createPresenterRepeater = (root, definition, presentDefinition) => createRepeater(root, definition, presentDefinition);

export const createPresenterView = (name, root, style) => {
	const view = getExtension(ExtensionType.VIEW, name);
	return view ? view(API())(root, style) : null;
};