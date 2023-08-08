import { toFunctionOutline } from "./utils";
import { toBoolean } from "./utils/toBoolean";
import { capitalizeFirstLetter } from "./utils/capitalizeFirstLetter";
import { trim } from "./utils/trim";
import cache from "../../shared/cache";

const isInt = new RegExp("^[0-9]+$");
const isBoolean = new RegExp("^(true|false)$");
const isFloat = new RegExp("^[0-9.]+$");
const isColor = new RegExp("color");
const isShadow = new RegExp("shadow");
const isGradient = new RegExp(
  "^(follow-gradient|horizontal-gradient|vertical-gradient)"
);
const isDuration = new RegExp("^[.0-9]+(?:ms|s){1}$");
const isTransition = new RegExp("^transition-?(?:in|out)?$");
const isURL = new RegExp("^url\\(");

export const toDuration = (string) =>
  string ? parseFloat(string) * (/ms$/.test(string) ? 1 : 1000) : 0;

const toTransition = (string) =>
  string
    .match(
      /[a-z]+(?:\(.*?\))?\s?(?:origin\(.*?\))?\s?(?:[a-z]+\(.*?\))?[ .a-z-0-9]*/g
    )
    .map(toTransitionPartial);

const toTransitionPartial = (string) => {
  const parts = string.match(
    /([a-z]+(?:\(.*?\))?)\s?(?:origin\((.*?)\))?\s?([a-z]+(?:\(.*?\))?)?\s?(?:([.0-9ms]+)?\s?(?:(ease-[a-z-]+))?\s?([.0-9ms]+)?)?/
  );

  // get transition function definition
  const fn = toFunctionOutline(parts[1]);

  // get duration and easing
  let origin = undefined;
  let duration = undefined;
  let ease = undefined;
  let delay = undefined;
  let resolver = undefined;

  // skip function and figure out what other parts are
  parts
    .slice(2)
    .filter((part) => typeof part !== "undefined")
    .forEach((part) => {
      // is either duration or delay
      if (isDuration.test(part)) {
        if (typeof duration === "undefined") {
          duration = toDuration(part);
        } else {
          delay = toDuration(part);
        }
      }

      // is origin if contains a space
      else if (/ /.test(part)) {
        origin = part;
      }

      // should be ease
      else if (/^ease-[a-z-]+$/.test(part)) {
        ease = part;
      }

      // should be transform
      else if (/^[a-z]+/.test(part)) {
        resolver = toFunctionOutline(part);
      }
    });

  // reset easing and duration when transform is defined, these settings don't work together
  if (resolver) {
    duration = undefined;
    ease = undefined;
  }

  // return transition object
  return {
    name: fn.name,
    parameters: fn.parameters,
    duration,
    ease,
    delay,
    origin,
    resolver,
  };
};

/**
 * toGradient
 * @param string { string } - string should be in format <type>(color, color)
 * @returns { {type: *, colors: *} }
 */
const toGradient = (string) => {
  const type = string.match(
    /follow-gradient|horizontal-gradient|vertical-gradient/
  )[0];
  const colors = string
    .substring(type.length)
    .match(
      /(?:transparent|rgb\(.*?\)|hsl\(.*?\)|hsla\(.*?\)|rgba\(.*?\)|[a-z]+|#[abcdefABCDEF\d]+)\s?(?:[\d]{1,3}%?)?/g
    )
    .map(toGradientColor);
  return {
    type,
    colors,
  };
};

const gradientOffsetRegex = /\s([\d]{1,3})%?$/;
const toGradientColor = (string) => {
  const offset = string.match(gradientOffsetRegex);
  return {
    offset: offset ? parseFloat(offset[1]) / 100 : null,
    value: toColor(string.replace(gradientOffsetRegex, "")),
  };
};

/**
 * Returns the pixels amount for the given value
 */
const pipetteCache = [];

const getPipette = (id, root) => {
  if (!pipetteCache[id]) {
    return null;
  }
  return pipetteCache[id].find((p) => p.node.parentNode === root);
};

const setPipette = (id, pipette) => {
  if (!pipetteCache[id]) {
    pipetteCache[id] = [];
  }
  pipetteCache[id].push(pipette);
};

export const toPixels =
  typeof document === "undefined"
    ? (value) => 0
    : (value, root = document.body, id = null) => {
        if (value == 0) {
          return 0;
        }

        if (id) {
          const pipette = getPipette(id, root) || {};
          if (!pipette.node) {
            pipette.node = document.createElement("span");
            pipette.node.style.cssText =
              "position:absolute;padding:0;visibility:hidden;";
            root.appendChild(pipette.node);
          }

          // update value
          pipette.node.style.marginTop = value;

          // compute style for first time
          if (!pipette.style) {
            pipette.style = window.getComputedStyle(pipette.node);
          }

          setPipette(id, pipette);

          return parseInt(pipette.style.marginTop, 10);
        }

        // old method
        const pipette = document.createElement("span");
        pipette.style.cssText =
          "position:absolute;padding:0;visibility:hidden;margin-top:" + value;
        root.appendChild(pipette);
        requestAnimationFrame(() => {
          pipette.parentNode.removeChild(pipette);
        });
        return parseInt(window.getComputedStyle(pipette).marginTop, 10);
      };

/**
 * @param string { string } - any valid CSS color value
 * @returns { string }
 */
export const toColor =
  typeof document === "undefined"
    ? (string) => string
    : (string) => {
        if (string === "transparent") {
          return "rgba(0,0,0,0)";
        }
        const pipette = document.createElement("span");
        pipette.style.cssText =
          "position:absolute;visibility:hidden;color:" + string;
        document.body.appendChild(pipette);
        requestAnimationFrame(() => {
          pipette.parentNode.removeChild(pipette);
        });
        return window.getComputedStyle(pipette).getPropertyValue("color");
      };

const toShadow = (style) => {
  if (typeof style !== "string") {
    return style;
  }

  return style.match(
    /([-.\d]+(?:%|ms|s|deg|cm|em|ch|ex|q|in|mm|pc|pt|px|vh|vw|vmin|vmax)?)|[%#A-Za-z0-9,.()]+/g
  );
};

const toURL = (style) => {
  const urls = style
    .match(/url\((.*?)\)/g)
    .map((url) => url.substring(4, url.length - 1));
  return urls.length === 1 ? urls[0] : urls;
};

const toStyleProperty = (key) =>
  key
    .trim()
    .split("-")
    .map((key, index) => (index > 0 ? capitalizeFirstLetter(key) : key))
    .join("");

const toStyleValue = (value, property) => {
  if (isBoolean.test(value)) {
    return toBoolean(value);
  }

  if (isInt.test(value)) {
    return parseInt(value, 10);
  }

  if (isFloat.test(value)) {
    return parseFloat(value);
  }

  if (isURL.test(value)) {
    return toURL(value);
  }

  if (isColor.test(property)) {
    if (isGradient.test(value)) {
      return cache(value, toGradient);
    }
    return cache(value, toColor);
  }

  if (isShadow.test(property)) {
    return cache(value, toShadow);
  }

  if (isTransition.test(property)) {
    if (value === "none") {
      return value;
    }
    return cache(value, toTransition);
  }

  return value;
};

const toStyle = (string) => {
  const parts = string.split(":").map(trim);
  const property = toStyleProperty(parts[0]);
  const value = toStyleValue(parts[1], parts[0]);
  if (!property || value === null || typeof value === "undefined") {
    return null;
  }
  return {
    property,
    value,
  };
};

export const toStyles = (string) =>
  string
    .split(";")

    // remove empty values
    .filter((style) => style.trim().length)

    // turn into objects
    .map(toStyle)

    // remove invalid styles
    .filter((style) => style !== null)

    // create styles object
    .reduce((styles, style) => {
      styles[style.property] = style.value;
      return styles;
    }, {});
