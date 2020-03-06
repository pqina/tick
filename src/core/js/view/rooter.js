/**
 * Rooter
 * @param state
 * @param root
 * @param name
 */
export default (state, root = document.createElement('span'), name = null) => {

	state.root = root;
	state.aligned = null;
	state.destroyed = false;

	if (root && name) {
		state.root.classList.add(`tick-${name}`);
		state.root.setAttribute('data-view', name);
	}

	if (root && root.dataset.layout) {
		state.align = (root.dataset.layout.match(/left|right|center/) || [])[0] || 'left';
	}

	return {

		appendTo:(element, location = 'last') => {

			// if no root or already attached -> exit
			if (!state.root || (state.root && state.root.parentNode)) {return;}

			if (location === 'last') {
				// place before last text node if found
				if (element.childNodes.length && element.childNodes[element.childNodes.length-1].nodeType === Node.TEXT_NODE) {
					element.insertBefore(state.root, element.childNodes[element.childNodes.length-1]);
				}
				else {
					// else just append
					element.appendChild(state.root);
				}
				return;
			}

			if (location === 'first') {
				// no elements and no text
				if (element.childNodes.length === 0) {
					element.appendChild(state.root);
				}
				// no elements but does contain text
				else if (element.children.length === 0 && element.childNodes.length) {
					element.insertBefore(state.root, element.childNodes[element.childNodes.length - 1]);
				}
				// elements!
				else {
					element.insertBefore(state.root, element.children[0]);
				}
			}

			if (typeof location !== 'string') {
				element.insertBefore(state.root, location);
			}

		}

	};

};