(function(root, plugins, undefined){
	'use strict';
	
	// private library reference
	var Tick = (__LIB__());
	
	(function(){

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

	}());

}(window, window.Tick || []));