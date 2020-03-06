import { toDuration } from '../style';

export default (offset = 0, speed = 1, delayIn, delayOut) => {
	return {
		intro:[{
			name:'scale',
			parameters:[offset, 1],
			duration:1000 * speed,
			delay:toDuration(delayIn)
		}],
		outro:[{
			name:'scale',
			parameters:[1, offset],
			duration:1000 * speed,
			delay:toDuration(delayOut)
		}]
	}
};