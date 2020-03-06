export default () => {

	const w = window;
	if (typeof w === 'undefined') {
		return false;
	}

	// test if can use CSS supports feature detection 
	const canSupport = w.CSS && w.CSS.supports;
	
	// test if is IE 11
	// does not support CSS.supports but does support transforms without prefix
	const isIE11 = !!w.MSInputMethodContext && !!document.documentMode;

	// test if has transform support
	// we ignore the custom Opera implementation
	const canTransform = canSupport && CSS.supports('transform','translateX(0)');

	// can we use mutation observer and request animation frame
	const features = ['MutationObserver', 'requestAnimationFrame'];

	// test if is supported
	return isIE11 || (canSupport && canTransform && !!features.filter(p => p in w).length);
}