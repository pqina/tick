/**
 * Grouper
 * @param state
 * @param definition
 */
export default (state, definition) => {

	state.definition = definition;

	return {
		setDefinition:(definition) => {
			state.definition = definition;
		}
	};

};
