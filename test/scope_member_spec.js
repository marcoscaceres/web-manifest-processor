/**
 * Manifest scope
 * https://w3c.github.io/manifest/#scope-member
 **/
"use strict";
import { URL } from "whatwg-url";
import { expect } from "chai";
import {
  makeData,
  makeTypeTest,
  makeURLResolveTests,
  manifestURL,
} from "./common";
import processManifest from "../js/manifestprocessor";
describe("scope member", () => {
  const typeTests = makeTypeTest("scope");
  typeTests("string", undefined);

  const resolveTests = makeURLResolveTests("scope");
  const expectedURL = new URL("path", manifestURL).href;
  resolveTests(['path', '/path', '../../path'], expectedURL);

  it("converts cross-origin URLs to 'undefined'", () => {
    const data = makeData();
    data.text = JSON.stringify({
      "scope": "http://some-other-origin/"
    });
    const { manifest } = processManifest(data);
    expect(manifest.scope).to.equal(undefined);
  });

  it("treats the empty string like undefined", () => {
    const data = makeData();
    data.text = JSON.stringify({ "scope": "" });
    const { manifest } = processManifest(data);
    expect(manifest.scope).to.equal(undefined);
  });

  it("it treats bad URLs as undefined", () => {
    const data = makeData();
    data.text = JSON.stringify({ "scope": "file:///dfsa" });
    const { manifest } = processManifest(data);
    expect(manifest.scope).to.equal(undefined);
  });

});
