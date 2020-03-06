/**
 * @param value { * }
 */
export const toBoolean = (value) => typeof value === 'string' ? value === 'true' : value;
