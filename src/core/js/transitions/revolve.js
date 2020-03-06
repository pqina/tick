import { toDuration } from '../style';

export default (axis = 'y', distance = 1, speed = 1, delayIn, delayOut) => {
	return {
		intro:[{
			name:'rotate',
			parameters:[`${ -distance * 90 }deg`, '0deg', axis],
			duration:1000 * speed,
			delay:toDuration(delayIn)
		}],
		outro:[{
			name:'rotate',
			parameters:['0deg', `${ distance * 90 }deg`, axis],
			duration:1000 * speed,
			delay:toDuration(delayOut)
		}]
	}
};