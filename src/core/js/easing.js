import { ExtensionType, addExtensions } from './extensions/index';

// https://gist.github.com/gre/1650294
// http://easings.net/
// https://github.com/danro/jquery-easing/blob/master/jquery.easing.js
// http://gizma.com/easing/

export const easeLinear = t => t;

export const easeInSine = t => -1 * Math.cos( t * ( Math.PI / 2 ) ) + 1;

export const easeOutSine = t => Math.sin( t * ( Math.PI / 2 ) );

export const easeInOutSine = t => -0.5 * ( Math.cos( Math.PI * t ) - 1 );

export const easeInQuad = t => t*t;

export const easeOutQuad = t => t * (2-t);

export const easeInOutQuad = t => t<.5 ? 2*t*t : -1+(4-2*t)*t;

export const easeInCubic = t => t * t * t;

export const easeOutCubic = t => {
	const t1 = t - 1;
	return t1 * t1 * t1 + 1;
};

export const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : ( t - 1 ) * ( 2 * t - 2 ) * ( 2 * t - 2 ) + 1;

export const easeInQuart = t => t*t*t*t;

export const easeOutQuart = t => 1-(--t)*t*t*t;

export const easeInOutQuart = t => t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t;


export const easeInExpo = t => {
	if (t === 0) {
		return 0;
	}
	return Math.pow( 2, 10 * ( t - 1 ) );
};

export const easeOutExpo = t => {
	if( t === 1 ) {
		return 1;
	}
	return ( -Math.pow( 2, -10 * t ) + 1 );
};

export const easeInOutExpo = t => {

	if( t === 0 || t === 1 ) {
		return t;
	}

	const scaledTime = t * 2;
	const scaledTime1 = scaledTime - 1;

	if( scaledTime < 1 ) {
		return 0.5 * Math.pow( 2, 10 * ( scaledTime1 ) );
	}

	return 0.5 * ( -Math.pow( 2, -10 * scaledTime1 ) + 2 );
};

export const easeInCirc = t => {
	const scaledTime = t / 1;
	return -1 * ( Math.sqrt( 1 - scaledTime * t ) - 1 );
};

export const easeOutCirc = t => {
	const t1 = t - 1;
	return Math.sqrt( 1 - t1 * t1 );
};

export const easeInOutCirc = t => {

	const scaledTime = t * 2;
	const scaledTime1 = scaledTime - 2;

	if( scaledTime < 1 ) {
		return -0.5 * ( Math.sqrt( 1 - scaledTime * scaledTime ) - 1 );
	}

	return 0.5 * ( Math.sqrt( 1 - scaledTime1 * scaledTime1 ) + 1 );
};

export const easeInBack = (t, magnitude = 1.70158) => {
	const scaledTime = t / 1;
	return scaledTime * scaledTime * ( ( magnitude + 1 ) * scaledTime - magnitude );
};

export const easeOutBack = (t, magnitude = 1.70158) => {
	const scaledTime = ( t / 1 ) - 1;
	return (scaledTime * scaledTime * ( ( magnitude + 1 ) * scaledTime + magnitude )) + 1;
};

export const easeInOutBack = (t, magnitude = 1.70158) => {
	const scaledTime = t * 2;
	const scaledTime2 = scaledTime - 2;
	const s = magnitude * 1.525;
	if( scaledTime < 1) {
		return 0.5 * scaledTime * scaledTime * (
			( ( s + 1 ) * scaledTime ) - s
		);
	}

	return 0.5 * (scaledTime2 * scaledTime2 * ( ( s + 1 ) * scaledTime2 + s ) + 2);
};

export const easeOutElastic = ( t, magnitude = 0.7 ) => {

	const p = 1 - magnitude;
	const scaledTime = t * 2;

	if( t === 0 || t === 1 ) {
		return t;
	}

	const s = p / ( 2 * Math.PI ) * Math.asin( 1 );
	return (
		Math.pow( 2, -10 * scaledTime ) *
		Math.sin( ( scaledTime - s ) * ( 2 * Math.PI ) / p )
	) + 1;

};

export const easeOutBounce = t => {
	const scaledTime = t / 1;
	if( scaledTime < ( 1 / 2.75 ) ) {
		return 7.5625 * scaledTime * scaledTime;
	} else if( scaledTime < ( 2 / 2.75 ) ) {
		const scaledTime2 = scaledTime - ( 1.5 / 2.75 );
		return ( 7.5625 * scaledTime2 * scaledTime2 ) + 0.75;
	} else if( scaledTime < ( 2.5 / 2.75 ) ) {
		const scaledTime2 = scaledTime - ( 2.25 / 2.75 );
		return ( 7.5625 * scaledTime2 * scaledTime2 ) + 0.9375;
	} else {
		const scaledTime2 = scaledTime - ( 2.625 / 2.75 );
		return ( 7.5625 * scaledTime2 * scaledTime2 ) + 0.984375;
	}
};

export const EasingFunctions = {
	'ease-linear':easeLinear,

	'ease-in-sine':easeInSine,
	'ease-out-sine':easeOutSine,
	'ease-in-out-sine':easeInOutSine,

	'ease-in-cubic':easeInCubic,
	'ease-out-cubic':easeOutCubic,
	'ease-in-out-cubic':easeInOutCubic,

	'ease-in-circ':easeInCirc,
	'ease-out-circ':easeOutCirc,
	'ease-in-out-circ':easeInOutCirc,

	'ease-in-quad':easeInQuad,
	'ease-out-quad':easeOutQuad,
	'ease-in-out-quad':easeInOutQuad,

	'ease-in-quart':easeInQuart,
	'ease-out-quart':easeOutQuart,
	'ease-in-out-quart':easeInOutQuart,

	'ease-in-expo':easeInExpo,
	'ease-out-expo':easeOutExpo,
	'ease-in-out-expo':easeInOutExpo,

	'ease-in-back':easeInBack,
	'ease-out-back':easeOutBack,
	'ease-in-out-back':easeInOutBack,

	'ease-out-elastic':easeOutElastic,
	'ease-out-bounce':easeOutBounce
};

addExtensions(ExtensionType.EASING_FUNCTION, EasingFunctions);