import { easeLinear } from './easing';
import { now } from './utils';

/**
 * animate a certain amount of time (between 0 and 1)
 * @param cb - update function
 * @param complete
 * @param duration - duration in milliseconds
 * @param ease - easing function
 * @param delay
 */
export const animate = (
    cb,
    complete,
    duration = 500,
    ease = easeLinear,
    delay = 0
) => {
    return interpolate(
        t => {
            cb(ease(t));
        },
        complete,
        duration,
        delay
    );
};

/**
 * interpolate between 0 and 1 over x amount of frames
 * @param update - update function
 * @param complete
 * @param duration - duration in milliseconds
 * @param delay - milliseconds to wait before starting
 */
export const interpolate = (
    update,
    complete = null,
    duration = 500,
    delay = 0
) => {
    // no update function supplied -> exit
    if (!update) {
        return null;
    }

    // set start time
    let start = null;
    let t;
    let frame = null;

    // animation loop
    const tick = ts => {
        if (start === null) {
            start = ts;
        }

        t = ts - start - delay;

        if (t < duration) {
            update(t >= 0 ? t / duration : 0);
            frame = requestAnimationFrame(tick);
            return null;
        }

        update(1);

        if (complete) {
            complete();
        }
    };

    tick(now());

    // return cancel function
    return () => {
        cancelAnimationFrame(frame);
    };
};

/**
 * Translates movements values
 */
const translator = () => {
    const fps = 24;
    const interval = 1000 / fps;

    let frame = null;

    const state = {
        velocity: 0,
        origin: 0,
        position: 0,
        destination: 1
    };

    const cancel = () => {
        cancelAnimationFrame(frame);
    };

    const translate = (cb, from, to, update) => {
        // cancel previous animations if are running
        cancel();

        // 'to' not supplied, so 'from' is destination
        if (to === null) {
            state.destination = from;
        } else {
            // both supplied, also reset velocity
            state.position = from;
            state.destination = to;
            state.velocity = 0;
        }

        // always set origin to current position
        state.origin = state.position;

        let last = null;
        const tick = ts => {
            // queue next tick
            frame = requestAnimationFrame(tick);

            // limit fps
            if (!last) {
                last = ts;
            }

            const delta = ts - last;

            if (delta <= interval) {
                // skip frame
                return;
            }

            // align next frame
            last = ts - delta % interval;

            update(state, cancel);

            cb(state.position);
        };

        tick(now());
    };

    return {
        getPosition: () => state.position,
        cancel,
        translate
    };
};

/**
 * Translator builder
 * @param type
 * @param options
 * @returns {*}
 */
export const createTranslator = (type, ...options) => {
    const t = translator();
    const updater = {
        update: null,
        cancel: t.cancel,
        getPosition: t.getPosition
    };

    if (type === 'arrive') {
        updater.update = arrive(t.translate, ...options);
    } else if (type === 'spring') {
        updater.update = spring(t.translate, ...options);
    } else if (type === 'step') {
        updater.update = step(t.translate, ...options);
    }

    return updater;
};

/**
 * Arrive at destination
 * @param update
 * @param maxVelocity
 * @param friction
 */
const arrive = (update, maxVelocity = 1, friction = 0.01) => {
    return (cb, from = null, to = null) => {
        update(cb, from, to, (state, cancel) => {
            // distance to target
            const distance = state.destination - state.position;
            const halfway =
                state.origin + (state.destination - state.origin) * 0.5;

            // update velocity based on distance
            state.velocity +=
                (-(halfway - state.origin) + distance) * 2 * friction;

            // update position by adding velocity
            state.position +=
                state.velocity < 0
                    ? Math.max(state.velocity, -maxVelocity)
                    : Math.min(state.velocity, maxVelocity);

            // we've arrived if we're near target and our velocity is near zero
            if (
                (state.origin < state.destination &&
                    state.position >= state.destination) ||
                (state.origin >= state.destination &&
                    state.position <= state.destination)
            ) {
                cancel();
                state.velocity = 0;
                state.position = state.destination;
            }
        });
    };
};

const step = (update, velocity = 0.01) => {
    return (cb, from = null, to = null) => {
        update(cb, from, to, (state, cancel) => {
            // update velocity based on distance
            state.velocity = velocity;

            // update position by adding velocity
            state.position += state.velocity;

            // we've arrived if we're near target and our velocity is near zero
            if (
                (state.origin < state.destination &&
                    state.position >= state.destination) ||
                (state.origin >= state.destination &&
                    state.position <= state.destination)
            ) {
                cancel();
                state.velocity = 0;
                state.position = state.destination;
            }
        });
    };
};

/**
 * Animate movement based no spring physics
 * @param update
 * @param stiffness - the higher the more intense the vibration
 * @param damping - a factor that slows down the calculated velocity by a percentage, needs to be less than 1
 * @param mass - the higher the slower the spring springs in action
 * @returns {function(*=, *=)}
 */
const spring = (update, stiffness = 0.5, damping = 0.75, mass = 10) => {
    return (cb, from = null, to = null) => {
        update(cb, from, to, (state, cancel) => {
            // calculate spring force
            const f = -(state.position - state.destination) * stiffness;

            // update velocity by adding force based on mass
            state.velocity += f / mass;

            // update position by adding velocity
            state.position += state.velocity;

            // slow down based on amount of damping
            state.velocity *= damping;

            // we've arrived if we're near target and our velocity is near zero
            if (thereYet(state.position, state.destination, state.velocity)) {
                cancel();
                state.position = state.destination;
                state.velocity = 0;
            }
        });
    };
};

const thereYet = (position, destination, velocity, errorMargin = 0.001) => {
    return (
        Math.abs(position - destination) < errorMargin &&
        Math.abs(velocity) < errorMargin
    );
};
