"use strict";
import { expect } from 'chai';
import processManifest from "../js/manifestprocessor";
import { makeData } from "./common";

describe("JSON parsing/processing", function () {

  it("throws when docURL is invalid", function () {
    const data = makeData({
      "docURL": "this is not ok",
    });
    expect(() => {
      processManifest(data);
    }).to.throw;
  });

  it("throws when manifest URL invalid", function () {
    const data = makeData({
      "manifestURL": "file:///",
    });
    expect(() => {
      processManifest(data);
    }).to.throw;
  });

  it("recovers from invalid JSON", function () {
    const invalidJson = ["", " \t \n ", "{", "{[[}"];
    invalidJson.forEach((text) => {
      const data = makeData({ text });
      const { errors, manifest } = processManifest(data);
      expect(manifest).to.be.an('object');
      expect(manifest.display).to.equal('browser');
      expect(errors.length).to.equal(1);
    });
  });

  it("recovers from valid, but unhelpful, JSON", function () {
    const validButUnhelpful = ["1", 1, `"test"`, "[{}]", "null"];
    validButUnhelpful.forEach((text) => {
      const data = makeData({ text });
      const { manifest, errors } = processManifest(data);
      expect(manifest.display).to.equal("browser");
      expect(errors.length).to.equal(1);
    });
  });
});
