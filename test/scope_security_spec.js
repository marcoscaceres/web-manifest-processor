"use strict";
import { expect } from "chai";
import processManifest from "../js/manifestprocessor";
import { URL } from "whatwg-url";
import {
  docURL,
  makeData,
} from "./common";

describe("scope and start_url interactions", () => {
  it("respects the start URL when it is in scope", () => {
    const data = makeData();
    data.text = JSON.stringify({
      "scope": "/scope/",
      "start_url": "/scope/inscope",
    });
    const { manifest } = processManifest(data);
    expect(manifest.scope).to.equal(`${docURL}scope/`);
    expect(manifest.start_url).to.equal(`${docURL}scope/inscope`);
  });

  it("respects the start URL when it exactly matches the scope", () => {
    const data = makeData();
    data.text = JSON.stringify({
      "scope": "scope/",
      "start_url": "/scope/",
    });
    const { manifest } = processManifest(data);
    expect(manifest.scope).to.equal(`${docURL}scope/`);
    expect(manifest.start_url).to.equal(`${docURL}scope/`);
  });

  it("respects the start URL when it resolves to the scope", () => {
    const data = makeData();
    const path = "/./../scope/i_am_in_scope";
    const expectedURL = new URL(`${docURL}${path}`).href;
    data.text = JSON.stringify({
      "scope": "../../../scope/", // https://test.com/scope
      "start_url": path, // https://test.com/scope/test
    });
    const { manifest } = processManifest(data);
    expect(manifest.scope).to.equal(`${docURL}scope/`);
    expect(manifest.start_url).to.equal(expectedURL);
  });

  it("treats the start URL as undefined when not in scope", () => {
    const data = makeData();
    data.text = JSON.stringify({
      "scope": "/scope/",
      "start_url": "/not_in_scope/",
    });
    const { manifest } = processManifest(data);
    expect(manifest.scope).to.equal(`${docURL}scope/`);
    expect(manifest.start_url).to.equal(undefined);
  });
});
