/**
 * Resizer
 * @param state
 */
export default (state) => {

	state.didResizeWindow = () => {
		state.dirty = true;
	};

	window.addEventListener('resize', state.didResizeWindow);

};