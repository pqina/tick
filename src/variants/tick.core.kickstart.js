(function(root, plugins, undefined) {
	'use strict';

	// Cut the mustard for really old browsers
	if (!root || !('MutationObserver' in root) || !('requestAnimationFrame' in root)) {
		return;
	}

	// private library reference
	var Tick = (__LIB__());

	(function() {

		// convert array to params
		function add(arr) {
			Tick.plugin.add.apply(null, arr);
		} 
		
		// create fake push method for new extensions
		Tick.push = add;

		// loop over already pushed extensions and add to Tick
		plugins.forEach(add);

		// expose globally (overwriting extension array)
		root.Tick = Tick;

		/**
		 * Auto parses document for Tick elements
		 */
		function kick() {
			Tick.DOM.parse(document);
		}

		if (document.readyState !== 'loading') {
			// make sure kick is called async (same as when called on DOMContentLoaded)
			setTimeout(function(){
				kick();
			},0)
		}
		else {
			document.addEventListener('DOMContentLoaded', kick);
		}

	}());
	
}(window, window.Tick || []));