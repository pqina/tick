import { mergeObjects, presentTick, toValue } from './utils';
import { observeAttributes } from './dom';
import { getConstants, getPresets } from './TickDOM';


/**
 * Tick
 */
export default class Tick {

	constructor(options = {}, element = document.createElement('div')) {

		// set base configuration options
		this._options = mergeObjects(Tick.options(), options);

		// instance properties
		this._element = element;
		this._value = null;
		this._observer = null;
		this._viewDefinition = null;
		this._constants = null;
		this._presets = null;
		this._updater = null;

		// callback methods
		this._didInit = null;
		this._didDestroy = null;
		this._willDestroy = null;
		this._didUpdate = null;

		// initialise Tick
		this._init();

	}

	/**
	 * Default options for this control
	 */
	static options() {
		return {
			constants: getConstants(),
			presets: getPresets(),
			value: null,
			view: null,
			didInit: (tick) => {},
			didUpdate: (tick, value) => {},
			willDestroy: (tick) => {},
			didDestroy: (tick) => {}
		}
	}

	/**
	 * Public Properties
	 */
	get baseDefinition() {
		return this._viewDefinition;
	}

	get root() {
		return this._element;
	}

	get value() {
		return this._value;
	}

	set value(value) {
		this._value = typeof value === 'string' ? toValue(value) : value;
		this._update(value);
	}

	/**
	 * Public API
	 */
	isRootElement(element) {
		return this._element === element;
	}

	setConstant(key, value) {
		this._constants[key] = value;
	}

	getConstants() {
		return this._constants;
	}

	getConstant(key) {
		return this._constants[key];
	}

	setPreset(key, fn) {
		this._presets[key] = fn;
	}

	getPreset(key) {
		return this._presets[key];
	}

	destroy() {
		this._willDestroy(this);

		// clean up
		this._observer.disconnect();

		// destroy presenters
		this.baseDefinition.presenter.destroy();

		this._didDestroy(this);
	}

	redraw() {
		if (!this.baseDefinition || !this.baseDefinition.presenter) return;
		this.baseDefinition.presenter.reset();
		this.baseDefinition.presenter.draw();
		this._updater(this.baseDefinition, this._value);
	}


	/**
	 * Private Methods
	 */
	_init() {

		// move options to properties
		this._viewDefinition = this._options.view;
		this._willDestroy = this._options.willDestroy;
		this._didDestroy = this._options.didDestroy;
		this._didInit = this._options.didInit;
		this._didUpdate = this._options.didUpdate;
		this._value = this._options.value;
		this._presets = this._options.presets;
		this._constants = this._options.constants;

		// no more use of options behind this line
		// ---------------------------------------

		// always add class tick to element (make sure it's only added once)
		if (!this._element.classList.contains('tick')) {
			this._element.classList.add('tick');
		}

		// use mutation observer to detect changes to value attribute
		this._observer = observeAttributes(this._element, ['data-value'], (value) => {
			this.value = value;
		});

		// force default view root, move children of current root to this element
		if (this._viewDefinition.root !== this._element) {
			Array.from(this._viewDefinition.root.children).forEach((node) => {
				this._element.appendChild(node);
			});
			this._viewDefinition.root = this._element;
		}

		// no default view presenter defined, fallback to text
		if (!this._viewDefinition.view && !this._viewDefinition.children) {
			this._viewDefinition.view = 'text';
		}

		// setup root presenter
		this._updater = presentTick(this);

		// update for first time
		if (this.value !== null) {
			this._update(this.value);
		}

		// set to ready state
		this._element.dataset.state = 'initialised';

		// done with init
		this._didInit(this, this.value);
	}

	_update(value) {

		this._updater(this.baseDefinition, value);

		this._didUpdate(this, value);

	}

}