/**
 * Destroyer
 * @param state
 */
export default (state) => {

	return {
		destroy:() => {

			state.destroyed = true;

			if (state.frame) {
				cancelAnimationFrame(state.frame);
			}

			if (state.styleObserver) {
				state.styleObserver.disconnect();
			}

			if (state.didResizeWindow) {
				window.removeEventListener('resize', state.didResizeWindow);
			}

			if (state.root && state.root.parentNode) {
				state.root.parentNode.removeChild(state.root);
			}

		}
	}

};