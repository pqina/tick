import { toDuration } from '../style';

export default (axis = 'y', distance = 1, speed = 1, delayIn, delayOut) => {
	return {
		intro:[{
			name:'move',
			parameters:[`${ -distance * 100 }`,'0%', axis],
			duration:1000 * speed,
			delay:toDuration(delayIn)
		}],
		outro:[{
			name:'move',
			parameters:['0%',`${ distance * 100 }`, axis],
			duration:1000 * speed,
			delay:toDuration(delayOut)
		}]
	}
};