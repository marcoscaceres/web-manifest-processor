/**
 * Manifest start_url
 * https://w3c.github.io/manifest/#start_url-member
 **/
"use strict";
import { expect } from "chai";
import processManifest from "../js/manifestprocessor";
import {
  docURL,
  makeData,
  makeTypeTest,
  makeURLResolveTests,
  manifestURL,
} from "./common";
import { URL } from "whatwg-url";

describe("start_url member", function() {

  const resolveTests = makeURLResolveTests("start_url");
  resolveTests(['path', '/path', '../../path']);

  const typeTests = makeTypeTest("start_url");
  typeTests("string", docURL);

  it("converts cross-origin URLs to the document's URL", () => {
    const data = makeData();
    data.text = JSON.stringify({ "start_url": "http://some-other-origin/" });
    const { manifest } = processManifest(data);
    expect(manifest.start_url).to.equal(docURL);
  });

  it("treats the empty string as document URL", () => {
    const data = makeData();
    data.text = JSON.stringify({ "start_url": "" });
    const { manifest } = processManifest(data);
    expect(manifest.start_url).to.equal(docURL);
  });

  it("treats the missing start_url as the document URL", () => {
    const data = makeData();
    const { manifest } = processManifest(data);
    expect(manifest.start_url).to.equal(docURL);
  });

  it("resolves relative to the manifest URL", () => {
    const data = makeData();
    data.manifestURL = "http://test.com/foo/manifest.json";
    const expectedURL = "http://test.com/bar/start_here.html";
    data.text = JSON.stringify({ 
      "start_url": `../bar/start_here.html`,
    });
    const { manifest } = processManifest(data);
    expect(manifest.start_url).to.equal(expectedURL);
  });

});
