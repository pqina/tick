import createBar from './bar';
import createRing from './ring';

export default (API) => (root) => /shape:\s*(?:ring|circle)/.test(root.dataset.style) ? createRing(API)(root) : createBar(API)(root);