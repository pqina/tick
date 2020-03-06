/**
 * Drawer
 * @param state
 * @param draw
 * @param present
 * @param drawViews
 */
export default (state, draw, drawViews, present) => {

	return {
		draw:() => {

			// not dirty, might need to draw subviews
			if (!state.dirty) {
				if (drawViews) {

					// draw sub views
					const redrawn = drawViews(state);
					if (redrawn) {
						// let's fit it! (if necessary)
						fit(state);
					}

				}
				return false;
			}

			// draw everything
			draw(state, present);

			// let's fit this view (if necessary)
			fit(state);

			// no longer dirty
			state.dirty = false;

			return true;
		}
	}

};

const fit = (state) => {

	if (!state.fit) {

		// nope
		if (!state.root || !(state.root.getAttribute('data-layout') || '').match(/fit/)) {
			state.fit = false;
			return;
		}

		// create fit info object
    const style = window.getComputedStyle(state.root, null);
		state.fit = true;
		state.fitInfo = {
			currentFontSize: parseInt(style.getPropertyValue('font-size'), 10)
		};
	}

	// get available width from parent node
	state.fitInfo.availableWidth = state.root.parentNode.clientWidth;

	// the space our target element uses
	state.fitInfo.currentWidth = state.root.scrollWidth;

	// let's calculate the new font size
	const newFontSize = Math.min(
	Math.max(
		4,
		(state.fitInfo.availableWidth / state.fitInfo.currentWidth) * state.fitInfo.currentFontSize
		),
		1024
	);

	// size has not changed enough?
	const dist = Math.abs(newFontSize - state.fitInfo.currentFontSize);
	
	if (dist <= 1) { // prevents flickering on firefox / safari / ie by not redrawing tiny font size changes
		return;
	}

	state.fitInfo.currentFontSize = newFontSize;

	state.root.style.fontSize = state.fitInfo.currentFontSize + 'px';

};