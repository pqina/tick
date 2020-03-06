import { getColorRangeForColors } from '../../../../shared/utils';

const CIRC = Math.PI * 2;
const QUART = Math.PI * .5;


const setShadow = (ctx,x,y,blur,color) => {
	ctx.shadowOffsetX = x;
	ctx.shadowOffsetY = y;
	ctx.shadowBlur = blur;
	ctx.shadowColor = color;
};


const drawGradientArc = (ctx,x,y,radius,offset,length,from,to,width,colorList,shadow,cap) => {

	if (to < from) {return;}

	// add shadow
	if (shadow) {

		drawArc(
			ctx,
			x,
			y,
			radius,

			offset,
			length,
			from,
			to,

			width,
			'transparent',
			shadow,

			cap
		);

	}

	// draw precision
	const segmentCount = Math.max(20, Math.round(radius * length * .75));
	
	let palette = getColorRangeForColors(colorList, segmentCount);

	const range = to - from;

	const circleOffset = -QUART + (CIRC * from);
	const segmentSize = CIRC / segmentCount;

	const wholeSegmentsCount = Math.floor(range * segmentCount);
	const finalSegmentEnd = ((range * segmentCount) - wholeSegmentsCount);
	const finalSegmentSize = finalSegmentEnd * segmentSize;
	
	const segments = [];
	
	for (let i=0; i < wholeSegmentsCount; i++) {

		const segmentOffset = circleOffset + (i * segmentSize);
		
		segments.push({
			from: {
				offset: segmentOffset,
				color: palette[i],
				x: Math.cos(segmentOffset),
				y: Math.sin(segmentOffset)
			},
			to: {
				offset: segmentOffset + segmentSize,
				color: palette[i + 1] || palette[i],
				x: Math.cos(segmentOffset + segmentSize),
				y: Math.sin(segmentOffset + segmentSize)
			}
		});
		
	}
	
	// add additional point
	const segmentOffset = circleOffset + (wholeSegmentsCount * segmentSize);
	segments.push({
		from: {
			offset: segmentOffset,
			color: palette[wholeSegmentsCount],
			x: Math.cos(segmentOffset),
			y: Math.sin(segmentOffset)
		},
		to: {
			offset: segmentOffset + finalSegmentSize,
			color: palette[wholeSegmentsCount + 1] || palette[wholeSegmentsCount],
			x: Math.cos(segmentOffset + finalSegmentSize),
			y: Math.sin(segmentOffset + finalSegmentSize)
		}
	});

	// draw circle
	const overlap = 0.0025;
	
	for (let i=0; i<segments.length; i++) {

		const segment = segments[i];
		
		ctx.beginPath();

		const gradient = ctx.createLinearGradient(
			x + segment.from.x * radius, 
			y + segment.from.y * radius, 
			x + segment.to.x * radius, 
			y + segment.to.y * radius
		);
		gradient.addColorStop(0, segment.from.color);
		gradient.addColorStop(1.0, segment.to.color);

		ctx.lineCap = cap;
		ctx.strokeStyle = gradient;
		ctx.arc(
			x, 
			y, 
			radius, 
			segment.from.offset - overlap,
			segment.to.offset + overlap
		);
		ctx.lineWidth = width;
		ctx.stroke();
		ctx.closePath();
		
	}

};

const drawArc = (ctx,x,y,radius,offset,length,from,to,width,color,shadow,cap) => {

	if (to < from) {
		return;
	}

	if (typeof color === 'object' && color.type === 'follow-gradient') {

		drawGradientArc(
			ctx,
			x,
			y,
			radius,

			offset,
			length,
			from,
			to,

			width,
			color.colors,
			shadow,

			cap
		);

		return;
	}

	if (shadow) {

		const translation = color === 'transparent' ? 9999 : 0;

		ctx.save();

		ctx.translate(translation, 0);

		setShadow(
			ctx,
			shadow[0] - translation,
			shadow[1],
			shadow[2],
			shadow[3]
		);

	}

	ctx.beginPath();
	ctx.lineWidth = width;

	ctx.arc(
		x, y, radius,
		-QUART + (CIRC * from),
		-QUART + (CIRC * to)
		, false);


	if (typeof color === 'object') {

		const grad = color.type === 'horizontal-gradient' ?
			ctx.createLinearGradient(0, radius, radius * 2, radius) :
			ctx.createLinearGradient(radius, 0, radius, radius * 2);

		let offset = 0;
		const count = color.colors.length - 1;
		color.colors.forEach((color, index) => {
			grad.addColorStop(color.offset || Math.max(index / count, offset), color.value);
			offset = color.offset || offset;
		});
		ctx.strokeStyle = grad;
	}
	else {
		ctx.strokeStyle = color === 'transparent' ? '#000' : color;
	}

	ctx.lineCap = cap;

	ctx.stroke();

	if (shadow) {
		ctx.restore();
	}

};

export const drawRing = (ctx,

						 progress,

						 offset,
						 length,
						 gap,

						 size,

						 radiusRing,
						 widthRing,
						 colorRing,
						 shadowRing,

						 radiusProgress,
						 widthProgress,
						 colorProgress,
						 shadowProgress,

						 cap,

						 invert) => {

	if (length + gap > 1) {
		length = length - (-1 + length + gap);
		offset = offset + (gap * .5);
	}
	
	var aStart = offset;
	var bEnd = offset + length;
	var mid = progress * length;
	var scale = .5 - Math.abs(-.5 + progress);
	var aEnd = offset + (mid - (scale * gap));
	var bStart = offset + (mid + ((1-scale) * gap));

	// if no radius supplied, quit
	if (!radiusRing && !radiusProgress) {return;}

	// let's draw
	if (invert) {

		drawArc(
			ctx,size,size,radiusProgress,
			offset,length,
			aStart,aEnd,
			widthProgress,colorProgress,shadowProgress,
			cap
		);
	

		drawArc(
			ctx,size,size,radiusRing,
			offset,length,
			bStart,bEnd,
			widthRing,colorRing,shadowRing,
			cap
		);

	}
	else {

		drawArc(
			ctx,size,size,radiusProgress,
			offset,length,
			bStart,bEnd,
			widthProgress,colorProgress,shadowProgress,
			cap
		);

		if (progress > .0001) {
			drawArc(
				ctx, size, size, radiusRing,
				offset, length,
				aStart, aEnd,
				widthRing, colorRing, shadowRing,
				cap
			);
		}

	}
};