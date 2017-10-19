"use strict";
import { expect } from "chai";
import processManifest from "../js/manifestprocessor";
import {makeTextMapper, makeTrimTest, makeTypeTest} from "./common";

/**
 * lang member
 * https://w3c.github.io/manifest/#lang-member
 **/
describe("lang member", function(){
  const toTextData = makeTextMapper("lang");
  const trimTest = makeTrimTest("lang");
  trimTest("en", "en");

  const typeTest = makeTypeTest("lang");
  typeTest("string", undefined);

  it("handles valid language tags as per BCP-47", ()=>{
    const validTags = [
      "en", "fr", "ja"
    ];
    validTags
      .map(toTextData)
      .forEach((data) => {
        const tag = JSON.parse(data.text).lang;
        const {manifest} = processManifest(data);
        expect(manifest.lang).to.equal(tag);
      });
  });

  it("treats invalid tags as undefined", ()=>{
    var invalidTags = [
      "de-419-DE", " a-DE ", "ar-a-aaa-b-bbb-a-ccc", "sdafsdfaadsfdsf", "i",
      "i-phone", "en US", "EN-*-US-JP", "JA-INVALID-TAG", "123123123"
    ];
    invalidTags
      .map(toTextData)
      .forEach((data) => {
        const {manifest} = processManifest(data);
        expect(manifest.lang).to.equal(undefined);
      });
  });

  it("converts tags into canonical form", function(){
    var canonicalTags = new Map([
      ["NO-nyn", "nn"],
      ["EN", "en"],
    ]);
    Array
      .from(canonicalTags.entries())
      .map(([lang, canonical]) => ({canonical, lang: lang.toUpperCase()}))
      .map(testData => Object.assign(testData, {data: toTextData(testData.lang)}))
      .forEach(({data, canonical})=>{
        const {manifest} = processManifest(data);
        expect(manifest.lang).to.equal(canonical);
      });
  });
});
