
Array.prototype.includes = Array.prototype.includes||function(searchElement , fromIndex) {
		if (!this) {
			throw new TypeError('Array.prototype.includes called on null or undefined');
		}

		if (fromIndex===undefined){
			var i = this.length;
			while(i--){
				if (this[i]===searchElement){return true}
			}
		} else {
			var i = fromIndex, len=this.length;
			while(i++!==len){ // Addittion on hardware will perform as fast as, if not faster than subtraction
				if (this[i]===searchElement){return true}
			}
		}
		return false;
	};
