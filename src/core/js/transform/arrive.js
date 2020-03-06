import { createTranslator } from '../animate';

export default (
    maxVelocity,
    friction,
    resetToBegin = false,
    catchUp = true
) => {
    let initial = null;
    let previous = null;
    let translator = null;
    let current = null;

    return (value, cb) => {
        value = parseFloat(value);

        if (initial === null) {
            initial = value;
            cb(value);
            return;
        }

        if (resetToBegin && previous !== null && initial === value) {
            translator.cancel();
            translator = null;
        }

        if (
            catchUp &&
            previous !== null &&
            value - translator.getPosition() > 1
        ) {
            translator.cancel();
            translator = null;
            previous = null;
            initial = value;
            cb(value);
            return;
        }

        if (!translator) {
            translator = createTranslator('arrive', maxVelocity, friction);
            translator.update(cb, initial, value);
        } else {
            translator.update(cb, value);
        }

        previous = value;
    };
};
