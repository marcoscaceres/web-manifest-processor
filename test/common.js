/**
 * Common infrastructure for manifest tests.
 **/
"use strict";
import { URL } from "whatwg-url";
import processManifest from "../js/manifestprocessor";
import { expect } from "chai";
export const docURL = "https://test.com/";
export const manifestURL = "https://test.com/manifest.json";
export const seperators = "\u2028\u2029\u0020\u00A0\u1680\u2000" 
  + "\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A"
  + "\u202F\u205F\u3000";
export const lineTerminators = "\u000D\u000A\u2028\u2029";
export const whiteSpace = `${seperators}${lineTerminators}`;
export const typeTests = [1, null, {}, [], false, ""];
const data = {
  text: `{}`,
  manifestURL,
  docURL,
};

function makeDataObject(override = {}){
  return Object.assign({}, data, override);
}

export function makeData(){
  return makeDataObject(...arguments);
}

export function makeTextMapper(prop){
  return function toText(value){
    return makeDataObject({text: JSON.stringify({[prop]: value})});
  };
}

export function padWithWhitespace(value){
  return [
    `${seperators}${value}${seperators}`,
    `${lineTerminators}${value}${lineTerminators}`,
    `${whiteSpace}${value}${whiteSpace}`,
    `\uFEFF${value}\uFEFF`
  ];
}

export function makeTrimTest(member){
  const toTextData = makeTextMapper(member);
  return function(untrimmedValue, expectedValue = ""){
    it(`trims the member`, () => {
      const trimNamesTests = padWithWhitespace(untrimmedValue);
      if(!expectedValue){
        expectedValue = untrimmedValue;
      }
      trimNamesTests
        .map(toTextData)
        .forEach(data => {
          const {manifest} = processManifest(data);
          expect(manifest[member]).to.equal(expectedValue);
        });
    });
  };
}

export function makeTypeTest(member){
  return function(excludedType, expectedValue){
    const invalidTypes = typeTests
      .filter(
        type => (typeof type !== excludedType)
      );
    const invalidValueTest = makeInvalidValueTest(member);
    invalidValueTest(invalidTypes, expectedValue);
  };
}

export function makeNormalizedValueTest(member){
  const toTextData = makeTextMapper(member);
  return function(expectedValues){
    it("normalizes values to lower-case", function(){
      expectedValues
        .map(toTextData)
        .forEach((data) => {
          const expectedValue = JSON.parse(data.text)[member];
          const {manifest} = processManifest(data);
          expect(manifest[member]).to.equal(expectedValue.toLowercase());
        });
    });
  };
}

export function makeExpectedValueTest(member){
  const toTextData = makeTextMapper(member);
  return function(expectedValues){
    it("processes valid/expected values", function(){
      expectedValues
        .map(toTextData)
        .forEach((data) => {
          const expectedValue = JSON.parse(data.text)[member];
          const {manifest} = processManifest(data);
          expect(manifest[member]).to.equal(expectedValue);
        });
    });
  };
}

export function makeInvalidValueTest(member){
  const toTextData = makeTextMapper(member);
  return function(invalidValues, defaultValue){
    it(`treats invalid value as '${defaultValue}'`, function(){
      invalidValues
        .map(toTextData)
        .forEach((data) => {
          const {manifest} = processManifest(data);
          expect(manifest[member]).to.equal(defaultValue);
        });
    });
  };
}

export function makeURLResolveTests(member){
  const toTextData = makeTextMapper(member);
  return function(URLs){
    it("resolves relative to the manifest URL", () => {
      URLs
        .concat(padWithWhitespace("path"))
        .map(toTextData)
        .forEach(data => {
          const testedPath = JSON.parse(data.text)[member].trim();
          const expectedURL = new URL(testedPath, manifestURL).href;
          const {manifest} = processManifest(data);
          expect(manifest[member]).to.equal(expectedURL);
        });
    });
  };
}
