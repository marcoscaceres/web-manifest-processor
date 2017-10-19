/**
 * display member
 * https://w3c.github.io/manifest/#display-member
 **/
"use strict";
import {
  makeExpectedValueTest,
  makeInvalidValueTest,
  makeTrimTest,
  makeTypeTest,
} from "./common";

describe("display member", function() {
  const trimTest = makeTrimTest("display");
  trimTest("browser");

  const typeTest = makeTypeTest("display");
  typeTest("string","browser");

  const expectedValueTests = makeExpectedValueTest("display");
  expectedValueTests([
    "browser",
    "fullscreen",
    "minimal-ui",
    "standalone",
  ]);

  const invalidValuesTest = makeInvalidValueTest("display");
  invalidValuesTest([
    "",
    "any",
    "foo",
    "FULLSCreEN",
    "fullscreen,standalone",
    "standalone fullscreen",
  ], "browser");
});
