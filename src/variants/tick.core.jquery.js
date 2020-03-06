(function($, plugins, undefined){
	'use strict';

    // if no jquery, stop here
    if (!$) { return; }

    // library reference
    var Tick = (__LIB__());

	(function(){

		// helpers
		function argsToArray(args) {
			return Array.prototype.slice.call(args);
		}

		function isConstructor(parameters) {
			return typeof parameters[0] === 'object' || parameters.length === 0;
		}

		function isGetter(tick, method) {
			var descriptor = Object.getOwnPropertyDescriptor(tick.prototype, method);
			return descriptor ? typeof descriptor.get !== 'undefined' : false;
		}

		function isSetter(tick, method) {
			var descriptor = Object.getOwnPropertyDescriptor(tick.prototype, method);
			return descriptor ? typeof descriptor.set !== 'undefined' : false;
		}

		function isMethod(tick, method) {
			return typeof tick[method] === 'function';
		}

		// plugin
		$.fn.tick = function() {

			// get arguments as array
			var parameters = argsToArray(arguments);

			// is method
			if (isConstructor(parameters)) {
				return this.each(function(){
					return Tick.DOM.create(this, parameters[0]);
				});
			}
			else {
				var method = parameters.shift();

				if (Tick.DOM[method]) {
					return this.each(function(){
						return Tick.DOM[method](this, parameters[0]);
					});
				}
				else {

					var results = [];
					// is instance API
					this.each(function(){

						var tick = Tick.DOM.find(this);
						if (!tick) {
							return null;
						}
						switch(method) {
							case 'value':
								if (parameters.length === 1) {
									results.push(tick[method] = parameters[0]);
								}
								else {
									results.push(tick[method]);
								}
								break;
							case 'root':
								results.push(tick.root);
								break;
							default:
								return null;
						}

					});
					return results;
				}

			}

		};

		// convert array to params
		function add(arr) {
			Tick.plugin.add.apply(null, arr);
		}

		// loop over already pushed extensions and add to Tick
		plugins.forEach(add);

		// public static api
		$.tick = {

			// register extension
			push: add,
			plugin: Tick.plugin,

			// method
			data:Tick.data,
			helper:Tick.helper,
			count:Tick.count,
			supported: Tick.supported

		};

	}());

}(window.jQuery, window.jQuery ? window.jQuery.tick || [] : []));