export default (padding = '', side = 'left') => (value, cb) => 
	cb(
		padding.length > ('' + value).length ?
		side === 'left' ? 
			('' + padding + value).slice(-padding.length) : 
			('' + value + padding).substring(0, padding.length) : value
	)
