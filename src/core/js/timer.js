import { mergeObjects } from './utils';

const time = (fn) => () => { setTimeout(fn, 0) };

const now = () => Date.now();

export const setTimer = (cb, interval = 1000, options = {}) => {

	const settings = mergeObjects({ autostart: true }, options);
	
	let tickExpectedTime = null;
	let tickStartTime = null;
	let sleepStartTime = null;
	let totalSleepTime = 0;
	let sleepIntervalOffset = null;
	
	let paused = false;
	
	let timer = null;
	
	const isPaused = () => paused;
	
	const isStarted = () => tickStartTime !== null;

	const isDocumentHidden = () => document.hidden;
	
	// timer tick
	const tick = () => {

		const currentTime = now();
		
		const timeoutErrorOffset = tickExpectedTime - currentTime;
		
		const timeout = interval + timeoutErrorOffset;
		
		// calculate new expected time
		tickExpectedTime = currentTime + timeout;

		// calculate total runtime
		const runtime = (currentTime - tickStartTime - totalSleepTime) + timeoutErrorOffset;

		// let others know total runtime of counter
		cb(runtime);

		// new timeout
		timer = setTimeout(tick, timeout);
	};
	
	const start = () => {
		
		// if paused, run resume instead (makes building a stopwatch easier)
		if (isPaused()) {
			resume();
			return;
		}

		// if already running we don't do anything, can't start twice need to stop first
		if (isStarted()) {
			return;
		}

		// the moment we set the timeout
		tickStartTime = now();

		// call callback immidiately with zero value
		setTimeout(() => {
			cb(0);
		}, 0);

		// listen for changes in visibility
		startListeningForVisibilityChanges();
		
		// stop here if document is hidden at start time
		if (isDocumentHidden()) {
			didHideDocument();
			return;
		}
		
		// the moment the timeout should end
		tickExpectedTime = now() + interval;
		
		// start ticking
		timer = setTimeout(() => {
			tick();
		}, interval);

	};

	const stop = () => { // can always stop
		
		clearTimeout(timer);
		timer = null;
		tickStartTime = null;
		tickExpectedTime = null;
		sleepStartTime = null;
		totalSleepTime = 0;
		sleepIntervalOffset = null;
		paused = false;

		stopListeningForVisibilityChanges();
	};
	
	const reset = () => { // can always reset
		stop();
		start();
	};

	/**
	 * Pause / Resume
	 */
	const pause = () => {
		
		// can't pause if not running or if is hidden
		if (!isStarted() || isDocumentHidden()) {
			return;
		}

		paused = true;

		stopListeningForVisibilityChanges();
		
		sleep();
	};

	const resume = () => {
		
		// can't resume if not paused if not started or if hidden
		if (!isPaused() || !isStarted() || isDocumentHidden()) {
			return;
		}

		paused = false;
		
		startListeningForVisibilityChanges();
		
		wake();
	};
	
	
	// start sleeping
	const sleep = () => {
		clearTimeout(timer);
		sleepStartTime = now();
		sleepIntervalOffset = tickExpectedTime - sleepStartTime;
	};
	
	// wake from hidden or pause stated
	const wake = () => {

		// need to remember the wait duration
		totalSleepTime += now() - sleepStartTime;
		sleepStartTime = null;

		// as we are going to call tick immidiately we expect the time to be now
		tickExpectedTime = now() + sleepIntervalOffset;

		// start ticking
		timer = setTimeout(() => {
			tick();
		}, sleepIntervalOffset);
	};

	/**
	 * Document Visibility Change
	 */
	const didHideDocument = () => {
		
		// can only be called if the timer is currently running so no checks
		sleep();
	};

	const didShowDocument = () => {
		
		// can only be called if the timer was running before (but could have been stopped in the mean time)
		if (!isStarted()) {
			return;
		}
		
		wake();
	};
	
	const stopListeningForVisibilityChanges = () => {
		document.removeEventListener('visibilitychange', handleVisibilityChange);
	};
	
	const startListeningForVisibilityChanges = () => {
		document.addEventListener('visibilitychange', handleVisibilityChange);
	};
	
	const handleVisibilityChange = () => {
		if (isDocumentHidden()) {
			didHideDocument();
		}
		else {
			didShowDocument();
		}
	};

	/**
	 * Go time! (or not)
	 */
	if (settings.autostart) {
		start();
	}

	/**
	 * API
	 */
	return {
		start,
		stop: time(stop),
		reset: time(reset),
		pause: time(pause),
		resume
	}

};