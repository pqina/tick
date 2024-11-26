/* eslint-disable */

/*
 * @pqina/tick v1.8.3 - Counters Made Easy
 * Copyright (c) 2024 PQINA - https://github.com/pqina/tick/
 */
(function($) {
	'use strict';

	if (!$) { return; }

	// only create tick extensions queue if not already available
	if (!$.tick) {
		$.tick = [];
	}

	// add this extension
	$.tick.push(['view', 'boom', (function() {
	if (!module) {
		var module = {};
	}
'use strict';

var index = (function () {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : API,
        request = _ref.Data.request,
        performance = _ref.Date.performance,
        _ref$View = _ref.View,
        rooter = _ref$View.rooter,
        destroyer = _ref$View.destroyer,
        drawer = _ref$View.drawer,
        updater = _ref$View.updater,
        styler = _ref$View.styler;

    var AudioContext = typeof window !== 'undefined' ? window.AudioContext || window.webkitAudioContext : null;
    var context = AudioContext ? new AudioContext() : null;

    var getBuffer = function getBuffer(context, data, cb) {
        context.decodeAudioData(data, function (buffer) {
            cb(buffer);
        });
    };

    var preload = function preload(context, files, cb) {
        (Array.isArray(files) ? files : [files]).forEach(function (file) {
            // load source files
            request(file, function (res) {
                // handle success response
                getBuffer(context, res, cb);
            }, function (err) {
                // handle error
            }, function (xhr) {
                // dress up xhr
                xhr.responseType = 'arraybuffer';
            });
        });
    };

    var createSound = function createSound(context, buffer) {
        var source = context.createBufferSource();
        source.buffer = buffer;
        return source;
    };

    var draw = function draw(state) {
        if (!context || state.style.sample === null || !state.style.sample.length) {
            return;
        }

        if (!state.audioLoaded) {
            // create volume node
            state.volume = context.createGain();
            state.volume.connect(context.destination);

            // load audio
            preload(context, state.style.sample, function (buffer) {
                if (!buffer || state.buffer) {
                    return;
                }
                state.buffer = buffer;
                state.audioLoaded = true;
            });

            // don't play sounds on first draw
            return;
        }

        // don't play sound if value has not changed
        if (state.value === state.lastValue) {
            return;
        }

        // play sound
        var sound = createSound(context, state.buffer);
        sound.connect(state.volume);
        state.volume.gain.value = state.style.volume;

        var currentDraw = performance();
        var dist = currentDraw - state.lastDraw;
        if (dist < state.style.pitchThreshold) {
            state.currentPitch = Math.min(state.style.pitchMax, state.currentPitch + state.style.pitchStep);
        } else {
            state.currentPitch = 1;
        }
        state.lastDraw = currentDraw;
        sound.playbackRate.value = state.currentPitch;
        sound.start(context.currentTime);

        // remember this value
        state.lastValue = state.value;
    };

    return function (root) {
        var state = {
            audioLoaded: false,
            buffer: null,
            lastDraw: 0,
            currentPitch: 1,
            volume: null,
            lastValue: null
        };

        return Object.assign({}, rooter(state, root, 'boom'), updater(state), styler(state, {
            sample: null,
            volume: 0.5, // range from 0 to 1,
            pitchThreshold: 1000,
            pitchStep: 0.05,
            pitchMax: 1.35
        }), destroyer(state), drawer(state, draw));
    };
});

module.exports = index;

	module.exports.identifier = {
		name:'boom',
		type:'view'
	};
    return module.exports;
}())]);

}(window.jQuery));