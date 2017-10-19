/**
 * dir member
 * https://w3c.github.io/manifest/#dir-member
 **/
"use strict";
import {
  makeExpectedValueTest,
  makeInvalidValueTest,
  makeTrimTest,
  makeTypeTest,
  makeNormalizedValueTest,
} from "./common";

describe("dir member", function() {
  const expectedValues = ["ltr", "rtl", "auto"];

  const trimTest = makeTrimTest("dir");
  trimTest("ltr");

  const typeTest = makeTypeTest("dir");
  typeTest("string", "auto");

  const expectedValueTests = makeExpectedValueTest("dir");
  expectedValueTests(expectedValues);

  const normalizeTests = makeNormalizedValueTest("dir");
  normalizeTests(expectedValues.map(value => value.toUpperCase()));

  const invalidValuesTest = makeInvalidValueTest("dir");
  invalidValuesTest([
    "",
    "bar baz",
    "ltr rtl auto",
    "some value",
    `fooo rtl`,
  ], "auto");
});
