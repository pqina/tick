import { VENDOR_PREFIX } from './dom';

export const getBackingStoreRatio = (ctx) => {
	return ctx[`${ VENDOR_PREFIX }BackingStorePixelRatio`] || ctx.backingStorePixelRatio || 1;
};

export const getDevicePixelRatio = () => {
	return window.devicePixelRatio || 1;
};

export const clearCanvas = (canvas) => {
	const ctx = canvas.getContext('2d');
	ctx.clearRect(0, 0, canvas.width, canvas.height);
};