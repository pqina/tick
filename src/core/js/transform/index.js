import { ExtensionType, addExtensions } from '../extensions/index';

import transform from './transform';
import pad from './pad';
import ascii from './ascii';
import add from './add';
import abs from './abs';
import value from './value';
import modulus from './modulus';
import subtract from './subtract';
import replace from './replace';
import round from './round';
import floor from './floor';
import ceil from './ceil';
import fraction from './fraction';
import multiply from './multiply';
import divide from './divide';
import format from './format';
import split from './split';
import plural from './plural';
import limit from './limit';
import reverse from './reverse';
import arrive from './arrive';
import spring from './spring';
import delay from './delay';
import number from './number';
import percentage from './percentage';
import step from './step';
import upper from './upper';
import lower from './lower';
import duration from './duration';
import keys from './keys';
import map from './map';
import rotate from './rotate';
import input from './input';
import substring from './substring';
import tween from './tween';
import preset from './preset';
import char from './char';

export const Transforms = {
	ascii,
	char,
	tween,
	value,
	input,
	rotate,
	map,
	transform,
	upper,
	lower,
	abs,
	add,
	subtract,
	modulus,
	pad,
	number,
	replace,
	round,
	ceil,
	floor,
	fraction,
	percentage,
	multiply,
	divide,
	split,
	format,
	plural,
	limit,
	reverse,
	arrive,
	spring,
	delay,
	step,
	keys,
	duration,
	substring,
	preset
};

addExtensions(ExtensionType.TRANSFORM, Transforms);