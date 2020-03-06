export const VENDOR_PREFIX = typeof document === 'undefined' ? null : (function(){
	const VENDORS = ['webkit', 'Moz', 'ms', 'O'];
	let i = 0;
	let l = VENDORS.length;
	let transform;
	let elementStyle = document.createElement('div').style;
	for (;i<l;i++) {
		transform = VENDORS[i] + 'Transform';
		if (transform in elementStyle ) {
			return VENDORS[i];
		}
	}
	return null;
})();

export const text = (node, value) => {
	let textNode = node.childNodes[0];
	if (!textNode) {
		textNode = document.createTextNode(value);
		node.appendChild(textNode);
	}
	else if (value !== textNode.nodeValue) {
		textNode.nodeValue = value;
	}
}

export const create = (name, className) => {
	const el = document.createElement(name);
	if (className) {
		el.className = className;
	}
	return el;
};

export const observeAttributes = (element, attributes, cb) => {
	const observer = new MutationObserver((mutations) => {
		attributes.forEach(attr => {
			if (mutations.filter(mutation => attributes.includes(mutation.attributeName)).length) {
				cb(element.getAttribute(attr));
			}
		});
	});
	observer.observe(element, { attributes:true });
	return observer;
};

export const isHTMLElement = (value) => {
	return value instanceof HTMLElement;
};

/**
 * Element Transform Origin
 * @param element
 * @param value
 */
export const setTransformOrigin = (element, value) => {
	element.style.transformOrigin = value;
};

/**
 * Element Transforms
 * @param element
 * @param name
 * @param value
 * @param unit
 */
export const setTransform = (element, name, value, unit = '') => {

	if (!element.transforms) {
		element.transforms = [];
	}

	const t = element.transforms.find(t => t.name === name);
	if (t) {
		t.value = value;
	}
	else {
		element.transforms.push({ name, value, unit });
	}

	setTransformStyle(element, element.transforms);
};

const setTransformStyle = (element, transforms) => {
	element.style.transform = transforms.map(t => `${ t.name }(${ t.value }${ t.unit })`).join(' ');
};

export const isVisible = (element) => {

	const elementRect = element.getBoundingClientRect();

	// is above top of the page
	if (elementRect.bottom < 0) {
		return false;
	}

	// is below bottom of page
	if (elementRect.top > window.scrollY + window.innerHeight) {
		return false;
	}

	return true;

};