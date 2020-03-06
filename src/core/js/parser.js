const arrow = (str, i) => str[i] === '-' && str[i+1] === '>';

const string = (c) => c === "'" || c === '"';

const comma = (c) => c === ',';

const opener = (c) => c === '(';

const closer = (c) => c === ')';

const value = (v) => v.trim().length !== 0;

const add = (r, v) => r.push(v.trim());

const token = (r, v) => {
	if (value(v)) {
		add(r, v);
		return '';
	}
	return v;
};

const chain = (chain, output) => {
	if (chain.length) {
		output.push(chain.length > 1 ? chain.concat() : chain[0]);
	}
	return [];
};

const parse = (i, str, result) => {

	let v = '';
	let fns = [];
	let quote = null;
	let hitArrow = false;

	while (i < str.length) {

		// character reference
		let c = str[i];

		// enter level
		if (opener(c)) {

			hitArrow = false;
			let fn = [v.trim()];

			i = parse(i + 1, str, fn);
			c = str[i];

			fns.push(fn);
			v = '';
		}

		// exit level
		else if (closer(c)) {

			if (hitArrow && v.trim().length) {
				fns.push([v.trim()]);
				v = '';
				hitArrow = false;
			}

			if (value(v)) {
				add(fns, v);
			}

			fns = chain(fns, result);

			return i+1;
		}

		// function names or arguments
		else {

			// we're in a string
			// as long as the exit has not been found add to value
			if (quote !== null && c !== quote) {

				// accept any value
				v += c;

			}
			// we've found the string exit
			else if (c === quote) {

				fns.push(v);
				v = '';

				quote = null;
			}
			// we're not in a string and we found a string opener
			else if (string(c)) {
				v = '';
				quote = c;
			}

			else {

				// we're not in a string

				// we've found an arrow
				if (arrow(str, i)) {

					hitArrow = true;

					// we might have finished a function without parenthesis
					if (v.trim().length) {
						fns.push([v.trim()]);
						v = '';
					}

					// skip two additional characters because arrow is of length 2
					i+=2;
				}
				// we've reached an argument separator
				else if (comma(c)) {

					if (hitArrow && v.trim().length) {
						fns.push([v.trim()]);
						v = '';
						hitArrow = false;
					}

					fns = chain(fns, result);

					// add possible previous token
					v = token(result, v);

				}
				else {
					v += c;
				}

			}

			// next character
			i++;
		}
	}

	if ((hitArrow && v.trim().length) ||
		(!hitArrow && v.trim().length && !fns.length)) {
		fns.push([v.trim()]);
		v = '';
	}

	chain(fns, result);
	
	// add final token
	token(result, v);

	return i;
};

export const parseTransformChain = string => {
	let result = [];
	parse(0, string, result);
	return result;
};