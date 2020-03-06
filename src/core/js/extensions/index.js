import { keysToList } from '../utils';

// Available extension types
export const ExtensionType = {
	FONT:'font',
	VIEW:'view',
	TRANSFORM:'transform',
	EASING_FUNCTION:'easing-function',
	TRANSITION:'transition'
};

// Registered extension collection
const Extensions = {};
Extensions[ExtensionType.FONT] = {};
Extensions[ExtensionType.VIEW] = {};
Extensions[ExtensionType.TRANSFORM] = {};
Extensions[ExtensionType.EASING_FUNCTION] = {};
Extensions[ExtensionType.TRANSITION] = {};

/**
 * Adds multiple extensions in one go
 * @param type
 * @param extensions
 * @returns {null}
 */
export const addExtensions = (type, extensions) => {

	// type does not exist
	if (!Extensions[type]) {
		return null;
	}
	
	for (let name in extensions) {
		
		if (!extensions.hasOwnProperty(name)) { continue; }
		
		// name already exists 
		if (Extensions[type][name]) {
			return null;
		}

		// register
		Extensions[type][name] = extensions[name];
	}
};

/**
 * Adds an extension function by type
 * @param type
 * @param name
 * @param fn
 * @returns {null}
 */
export const addExtension = (type, name, fn) => {
	
	// type does not exist
	if (!Extensions[type]) {
		throw `Can't add extension with type of "${ type }", "${ type }" is not a valid extension type. The following types are valid: ${ keysToList(Extensions) }`;
	}
	
	// if is invalid name
	if (!/^[-a-z]+$/.test(name)) {
		throw `Can't add extension with name "${ name }", "${ name }" is contains invalid characters. Only lowercase alphabetical characters and dashes are allowed.`;
	}
	
	// name in type already exists 
	if (Extensions[type][name]) {
		throw `Can't add extension with name "${ name }", "${ name }" is already added.`;
	}
	
	// add
	Extensions[type][name] = fn;
};

/**
 * Returns an extension function by name and type
 * @param type
 * @param name
 * @returns {*}
 */
export const getExtension = (type, name) => {
	
	// type does not exist
	if (!Extensions[type]) {
		throw `Can't get extension with type of "${ type }", "${ type }" is not a valid extension type. The following types are available: ${ keysToList(Extensions) }`;
	}

	// name in type does not exist
	if (!Extensions[type][name]) {
		throw `Can't get extension with name "${ name }", "${ name }" is not available. The following extensions are available: ${ keysToList(Extensions[type]) }`;
	}
	
	return Extensions[type][name];
};