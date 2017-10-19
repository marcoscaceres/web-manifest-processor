/**
 * processManifest
 * Implementation of processing algorithms from:
 * https://www.w3.org/TR/appmanifest/
 **/
"use strict";
import { URL } from "whatwg-url";
import {
  extractArray,
  extractLang,
  extractMIMEType,
  extractSizes,
  extractString,
  extractURL,
} from "./valueExtractors";

import {
  toLowerCase,
} from "./normalizers";



/**
 * A display mode represents how the web application is being presented
 * within the context of an OS.
 *
 * @see https://www.w3.org/TR/appmanifest/#display-modes
 * @type {Set}
 */
const displayModes = new Set([
  "browser",
  "fullscreen",
  "minimal-ui",
  "standalone",
]);

/**
 * Screen orientations
 *
 * @see https://www.w3.org/TR/appmanifest/#dfn-orientationlocktype
 * @type {Set}
 */
const orientations = new Set([
  "any",
  "landscape",
  "landscape-primary",
  "landscape-secondary",
  "natural",
  "portrait",
  "portrait-primary",
  "portrait-secondary",
  "",
]);

/**
 * The dir member specifies the base direction for the directionality-capable
 * members of the manifest.
 *
 * @see https://www.w3.org/TR/appmanifest/#dir-member
 * @type {Set}
 */
const directions = new Set([
  "auto",
  "ltr",
  "rtl",
]);

const imageProcessor = new Map([
  ["sizes", {
    extractor: extractSizes("sizes"),
  }],
  ["src", {
    extractor: extractURL("src", {
      allowCrossOrigin: true,
      treatMissingAs: "undefined",
    }),
  }],
  ["type", {
    extractor: extractMIMEType("type"),
  }],
]);

const defaultImageObj = makeDefaultObject(imageProcessor);
function extractImages(name) {
  const extract = extractArray(name, {
    enforceType: "object",
  });
  return function (object, manifestURL, docURL, processingErrors) {
    const imagesToProcess = extract(object)
      .map(
        potentialImage => Object.assign({}, defaultImageObj, potentialImage)
      );
    const processImage = processObject(name, imageProcessor);
    const members = processImage(imagesToProcess);
    return members;
  };
}

const memberProcessors = new Map([
  ["name", {
    extractor: extractString("name", {
      trim: true,
    }),
  }],
  ["short_name", {
    extractor: extractString("short_name", {
      trim: true,
    }),
  }],
  ["description", {
    extractor: extractString("description", {
      trim: true,
    }),
  }],
  ["lang", {
    extractor: extractLang("lang", {
      trim: true,
    }),
  }],
  ["dir", {
    extractor: extractString("dir", {
      restrictTo: directions,
      trim: true,
      normalizer: toLowerCase,
    }),
    defaultValue: "auto",
  }],
  ["display", {
    extractor: extractString("display", {
      restrictTo: displayModes,
      trim: true,
      normalizer: toLowerCase,
    }),
    defaultValue: "browser",
  }],
  ["orientation", {
    extractor: extractString("orientation", {
      restrictTo: orientations,
      trim: true,
      normalizer: toLowerCase,
    }),
    defaultValue: "",
  }],
  ["start_url", {
    extractor: extractURL("start_url", {
      allowCrossOrigin: false,
      treatMissingAs: "fallback",
    }),
  }],
  ["scope", {
    extractor: extractURL("scope", {
      allowCrossOrigin: false,
      treatMissingAs: "undefined",
    }),
  }],
  ["icons", {
    extractor: extractImages("icons"),
    get defaultValue(){
      return [];
    },
  }],
]);
const defaultManifest = makeDefaultObject(memberProcessors);

function makeDefaultObject(processor) {
  // Make the default (frozen) object based on what we can process + default values
  const defaultObject = Array
    .from(processor.entries())
    .map(
      ([key, { defaultValue }]) => ({
        [key]: defaultValue
      })
    )
    .reduce(
      (collector, defaultMember) => Object.assign(collector, defaultMember), {}
    );
  Object.freeze(defaultObject);
  return defaultObject;
}

/**
 * Performs security operations based on start URL and scope.
 *
 * @param  {Object} insecureManifest The manifest to secure.
 * @return {Object} A secured manifest
 */
function toSecureManifest(insecureManifest) {
  // https://www.w3.org/TR/appmanifest/#dfn-within-scope
  function isWithinScope(scopeURL, targetURL) {
    if (!scopeURL) {
      return true; // is unbounded
    }
    const scope = new URL(scopeURL);
    const target = new URL(targetURL);
    if (scope.origin === target.origin && target.pathname.startsWith(scope.pathname)) {
      return true;
    }
    return false;
  }
  const securedProps = {
    start_url: undefined
  };
  const inStartURLInScope = isWithinScope(insecureManifest.scope, insecureManifest.start_url);
  if (inStartURLInScope) {
    securedProps.start_url = insecureManifest.start_url;
  }
  const secureManifest = Object.assign({}, defaultManifest, insecureManifest, securedProps);
  return secureManifest;
}

export function processImageObjects({memberName, images, manifestURL: aManifestURL, docURL: aDocURL }) {
  const processingErrors = [];
  // Can throw
  const docURL = new URL(aDocURL).href;
  // Can throw
  const manifestURL = new URL(aManifestURL, docURL).href;
  const extractMember = processObject(memberName, imageProcessor);
  const members = images
    .map(
      image => Object.assign({}, defaultImageObj, image)
    )
    .map(
      image => {
        console.log(image);
        return image;
      }
    )
    .map(
      image => extractMember(image, manifestURL, docURL, processingErrors)
    );
  return {
    errors: processingErrors,
    images: members,
  };
}

//  () function processes JSON text into a clean manifest
// that conforms with the W3C specification. Takes an object
// expecting the following dictionary items:
//  * text: the JSON string to be processed.
//  * manifestURL: the URL of the manifest, to resolve URLs.
//  * docURL: the URL of the owner doc, for security checks
export default function processManifest({ text, manifestURL: aManifestURL, docURL: aDocURL }) {
  const processingErrors = [];
  // Can throw
  const docURL = new URL(aDocURL).href;
  // Can throw
  const manifestURL = new URL(aManifestURL, docURL).href;
  let rawManifest = Object.assign({}, defaultManifest);
  let parsedManifest;
  try {
    parsedManifest = JSON.parse(text);
  } catch (e) {
    processingErrors.push(new Error(`Error parsing JSON: ${e.message}`));
  } finally {
    // Both null and array are "object", because JavaScript(tm)
    const isObject = typeof parsedManifest === "object";
    const canBeAssigned = isObject && parsedManifest !== null && !Array.isArray(parsedManifest);
    if (canBeAssigned) {
      Object.assign(rawManifest, parsedManifest);
    } else if (parsedManifest !== undefined) {
      processingErrors.push(new Error("Expected root of manifest to be an object"));
    }
  }
  // Dynamically set the default value for start_url to the docURL
  memberProcessors.get("start_url").defaultValue = docURL;
  // Create the final manifest by reducing the parsed manifest into the default manifest
  // and filter out things the manifest processor doesn't know anything about
  const processRawManifest = processObject("manifest", memberProcessors);
  const members = processRawManifest(rawManifest, manifestURL, docURL, processingErrors);
  const insecureManifest = members


  // Secure manifest, by checking start_url and scope
  const secureManifest = toSecureManifest(insecureManifest);
  // Reset the default value for start_url
  memberProcessors.get("start_url").defaultValue = "";
  return {
    errors: processingErrors,
    manifest: secureManifest,
  };
}

function processObject(name, processor) {
  return function (object, manifestURL, docURL, processingErrors) {
    console.log("processing", object, manifestURL, docURL, processingErrors)
    const members = [];
    Array
      .from(
        Object.keys(object)
      )
      .filter(
        key => processor.has(key)
      )
      // collect the declared members + any processing errors generated along the way
      .reduce((collector, key) => {
        const { members, processingErrors } = collector;
        const { extractor, defaultValue } = processor.get(key);
        let value;
        try {
          value = extractor(object, manifestURL, docURL, processingErrors);
        } catch (err) {
          const msg = `Error processing '${key}' in ${name}: ${err.message}`;
          processingErrors.push(new Error(msg));
          value = defaultValue;
        } finally {
          members.push({[key]: value });
        }
        return collector;
      }, { processingErrors, members });
    // Boil the found members into an object
    return members.reduce(
      (obj, nextObj) => Object.assign({}, obj, nextObj), {}
    );
  };
}
