/**
 * orientation member
 * https://w3c.github.io/manifest/#orientation-member
 **/
"use strict";
import { makeTypeTest, makeTrimTest, makeExpectedValueTest, makeInvalidValueTest } from "./common";

describe("orientation member", function () {
  const expectedValues = [
    "any",
    "landscape",
    "landscape-primary",
    "landscape-secondary",
    "natural",
    "portrait",
    "portrait-primary",
    "portrait-secondary",
  ];
  const trimTest = makeTrimTest("orientation");
  trimTest("landscape-secondary");

  const typeTest = makeTypeTest("orientation");
  typeTest("string", "");

  const expectedValueTests = makeExpectedValueTest("orientation");
  expectedValueTests(expectedValues);

  const normalizeTests = makeNormalizedValueTest("dir");
  normalizeTests(expectedValues.map(value => value.toUpperCase()));

  const invalidValuesTest = makeInvalidValueTest("orientation");
  invalidValuesTest([
    'all',
    'NaTuRal',
    'portrait-primary portrait-secondary',
    'portrait-primary,portrait-secondary',
    'any-natural',
    'portrait-landscape',
    'primary-portrait',
    'secondary-portrait',
    'landscape-landscape',
    'secondary-primary'
  ], "");
});
