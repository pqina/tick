import { equal } from '../utils';

export default (state) => {

	state.dirty = true;
	state.value = null;
	state.valueUpdateCount = 0;
	state.isInitialValue = () => {
		return state.valueUpdateCount <= 1;
	};

	return {
		reset: () => {
			state.dirty = true;
			state.value = null;
			state.valueUpdateCount = 0;
		},
		update:(value) => {

			// don't update on same value
			if (equal(state.value, value)) {
				return;
			}

			state.value = value;
			state.valueUpdateCount++;
			state.dirty = true;
		}
	}
}