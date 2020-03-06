export default ({
    Data: { request },
    Date: { performance },
    View: { rooter, destroyer, drawer, updater, styler }
} = API) => {
    const AudioContext =
        typeof window !== 'undefined'
            ? window.AudioContext || window.webkitAudioContext
            : null;
    const context = AudioContext ? new AudioContext() : null;

    const getBuffer = (context, data, cb) => {
        context.decodeAudioData(data, function(buffer) {
            cb(buffer);
        });
    };

    const preload = (context, files, cb) => {
        (Array.isArray(files) ? files : [files]).forEach(file => {
            // load source files
            request(
                file,
                res => {
                    // handle success response
                    getBuffer(context, res, cb);
                },
                err => {
                    // handle error
                },
                xhr => {
                    // dress up xhr
                    xhr.responseType = 'arraybuffer';
                }
            );
        });
    };

    const createSound = (context, buffer) => {
        const source = context.createBufferSource();
        source.buffer = buffer;
        return source;
    };

    const draw = state => {
        if (
            !context ||
            state.style.sample === null ||
            !state.style.sample.length
        ) {
            return;
        }

        if (!state.audioLoaded) {
            // create volume node
            state.volume = context.createGain();
            state.volume.connect(context.destination);

            // load audio
            preload(context, state.style.sample, buffer => {
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
        const sound = createSound(context, state.buffer);
        sound.connect(state.volume);
        state.volume.gain.value = state.style.volume;

        const currentDraw = performance();
        const dist = currentDraw - state.lastDraw;
        if (dist < state.style.pitchThreshold) {
            state.currentPitch = Math.min(
                state.style.pitchMax,
                state.currentPitch + state.style.pitchStep
            );
        } else {
            state.currentPitch = 1;
        }
        state.lastDraw = currentDraw;
        sound.playbackRate.value = state.currentPitch;
        sound.start(context.currentTime);

        // remember this value
        state.lastValue = state.value;
    };

    return root => {
        const state = {
            audioLoaded: false,
            buffer: null,
            lastDraw: 0,
            currentPitch: 1,
            volume: null,
            lastValue: null
        };

        return Object.assign(
            {},
            rooter(state, root, 'boom'),
            updater(state),
            styler(state, {
                sample: null,
                volume: 0.5, // range from 0 to 1,
                pitchThreshold: 1000,
                pitchStep: 0.05,
                pitchMax: 1.35
            }),
            destroyer(state),
            drawer(state, draw)
        );
    };
};
