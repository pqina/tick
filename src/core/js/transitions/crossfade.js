import { toDuration } from '../style';

export default (speed = 1, delayIn, delayOut) => {
	return {
		intro:[{ name:'fade', parameters:[0,1], duration:1000 * speed, delay:toDuration(delayIn) }],
		outro:[{ name:'fade', parameters:[1,0], duration:1000 * speed, delay:toDuration(delayOut) }]
	}
};