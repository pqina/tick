export default (decimalsSeparator = '.', thousandsSeparator = ',', decimals = 2) => (value, cb) => {
	cb(
		(value < 0 ? '-' : '') + parseFloat(Math.abs(value))
			.toFixed(decimals)
			.replace(/./g, (c, i ,a) => {
				if (c === '.') {
					return decimalsSeparator;
				}
				return i && ((a.length - i) % 3 === 0) ? thousandsSeparator + c : c
			})
	);
}