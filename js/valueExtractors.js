/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
/*
 * Helper functions extract values from and objects
 * and reports conformance violations.
 */
"use strict";
import { URL } from "whatwg-url";

import {
  toLowerCase,
  none,
} from "./normalizers";


//Creates 3 capturing groups "type", "subtype", and "parameters"
const MIMERegex = /^(text|image|application|video|audio)\/(\w+),*\s*(;\s*\w+=\"*.*\"*)*/i;
export function extractMIMEType(name) {
  const extract = extractString(name, {trim: true});
  return function (object) {
    const value = extract(object);
    const [mime, type, subtype, params] = MIMERegex.exec(value);
    if (!mime || !type || !subtype) {
      const msg = `invalid MIME type: ${value}`;
      throw new Error(msg);
    }
    return `${type.toLowerCase()}/${subtype.toLowerCase()}${params || ""}`;
  };
}

export function extractSizes(name) {
  // Implementation of HTML's link@size attribute checker.
  function isValidSizeValue(aSize) {
    const size = aSize.toLowerCase();
    if (size === "any") {
      return true;
    }
    // multiple x's are not ok
    if (!size.includes('x') || size.indexOf('x') !== size.lastIndexOf('x')) {
      return false;
    }
    // Split left of x for width, after x for height.
    const [w, h] = size.split('x');
    if (w.startsWith('0') && h.startsWith('0')) {
      return false;
    }
    return Number.isFinite(parseInt(w, 10)) && Number.isFinite(parseInt(h, 10));
  }
  const extract = extractString(name, {trim: true});
  return function (object) {
    const sizes = new Set();
    const value = extract(object);
    if (value) {
      const { badSizes } = value
        .split(/\s+/)
        .map(value => value.toLowerCase())
        .reduce((collector, size) => {
          const { sizes, badSizes } = collector;
          if (!isValidSizeValue(size)) {
            badSizes.push(size);
          } else {
            sizes.add(size);
          }
          return collector;
        }, { sizes, badSizes: [] });
      if (badSizes.length) {
        const msg = `Invalid size(s): ${badSizes.join(", ")}`;
        throw new Error(msg);
      }
    }
    const result = Array.from(sizes).join(" ");
    return (result) ? result : undefined;
  };
}

const extractArrayDefaultOpts = Object.freeze({
  enforceType: "",
});
export function extractArray(name, options = {}) {
  const combinedOpts = Object.assign({}, extractArrayDefaultOpts, options);
  const extract = makeExtractor("array");
  const {enforceType} = combinedOpts;
  const isEnforcedType = (enforceType) ? checkType(enforceType) : null;
  return function (object) {
    const result = extract(object, name);
    if(enforceType && !result.every(isEnforcedType)){
      const msg = `unsupported type in ${name} member`;
      throw new TypeError(msg);
    }
    return result;
  };
}

const extractURLDefaultOptions = Object.freeze({
  allowCrossOrigin: true,
  treatMissingAs: "undefined",
  trim: true,
});
export function extractURL(name, options = {}) {
  const combinedOpts = Object.assign({}, extractURLDefaultOptions, options);
  const extract = extractString(name, combinedOpts);
  return function (object, baseURL, fallbackURL) {
    // can throw
    const result = extract(object);
    if (!result) {
      switch (options.treatMissingAs) {
      case "undefined":
        return undefined;
      case "base":
        return new URL(baseURL).href;
      case "fallback":
        return new URL(fallbackURL).href;
      default:
        throw new TypeError("Invalid switch ${options.treatMissingAs}");
      }
    }
    // can throw
    const baseURLObj = new URL(baseURL);
    const potentialURL = new URL(result, baseURLObj);
    const isSameOrigin = potentialURL.origin === baseURLObj.origin;
    if (!combinedOpts.allowCrossOrigin && !isSameOrigin) {
      const msg = `cross origin not allowed: ${potentialURL.origin}`;
      throw new Error(msg);
    }
    return potentialURL.href;
  };
}

export function extractLang(name) {
  const extract = extractString(name, {trim: true});
  // Hack around the lack of canonical form conversion
  function toCanonicalForm(locale) {
    return new Intl.Collator(locale).resolvedOptions().locale;
  }
  // We don't have direct an API to access the isStructuallyValid algo from
  // ECMAScript, so we use a date instead, which calls it internally.
  function checkIfStructuallyValid(langTag) {
    new Date().toLocaleDateString(langTag);
  }
  return function (object) {
    const result = extract(object);
    // Throws range error if not
    checkIfStructuallyValid(result);
    const canonicalForm = toCanonicalForm(result);
    return canonicalForm;
  };
}

const extractStringDefaultOpts = Object.freeze({
  trim: false,
});
export function extractString(name, options = {}) {
  const opts = Object.assign({}, extractStringDefaultOpts, options);
  const extract = makeExtractor("string");
  if (opts.hasOwnProperty("restrictTo") && !(opts.restrictTo instanceof Set)) {
    throw new TypeError("'restrictTo' needs to be a Set");
  }
  return (object) => {
    let value = extract(object, name);
    if (typeof value === "string" && opts.trim) {
      value = value.trim();
    }
    if (opts.restrictTo && !opts.restrictTo.has(value)) {
      const values = Array
        .from(opts.restrictTo)
        .join(", ");
      throw new Error(`Value is restricted to: ${values}. Got '${value}'.`);
    }
    return value;
  };
}

function checkType(type){
  return value => getType(value) === type;
}

function getType(value) {
  if (Array.isArray(value)) {
    return "array";
  }
  if (value === null) {
    return "null";
  }
  return typeof value;
}

function makeExtractor(expectedType) {
  return function (object, property) {
    const value = object[property];
    const type = getType(value);
    if (type === expectedType) {
      return value;
    }
    if (type === "undefined") {
      return undefined;
    }
    throw new TypeError(`Invalid type.`);
  };
}
