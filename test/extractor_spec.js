"use strict";
import { expect } from "chai";
import {
  extractArray,
  extractMIMEType,
  extractSizes,
  extractString,
  extractURL,
} from "../js/valueExtractors";

describe("Value extractor", () => {
  describe("extractSizes", () => {
    const extract = extractSizes("sizes");
    it("treats 'any' as a valid type irrespective of case", () => {
      const data = { "sizes": " AnY aNy ANY any " };
      const result = extract(data);
      expect(result).to.equal("any");
    });

    it("handles valid sizes", () => {
      const data = { "sizes": " 1x1 2x2 3x3 " };
      const result = extract(data);
      expect(result).to.equal("1x1 2x2 3x3");
    });

    it("handles valid sizes, even when in upper case", () => {
      const data = { "sizes": " 10X11 2X22 3X333 " };
      const result = extract(data);
      expect(result).to.equal("10x11 2x22 3x333");
    });

    it("treats sizes as a set", () => {
      const result = extract({ sizes: "123x123 123x123 123x123 9x9" });
      expect(result).to.equal("123x123 9x9");
    });

    it("treats throws on invalid sizes", () => {
      expect(() => {
        extract({ sizes: " 0x0" });
      }).to.throw;
      expect(() => {
        extract({ sizes: " 01x01 " });
      }).to.throw;
      expect(() => {
        extract({ sizes: " -1x-1 01xxx01 01x01 1x1" });
      }).to.throw;
      expect(() => {
        extract({ sizes: " 123" });
      }).to.throw;
      expect(() => {
        extract({ sizes: " 123xAbC" });
      }).to.throw;
      expect(() => {
        extract({ sizes: " Infintyx132" });
      }).to.throw;
    });

    it("treats empty as undefined", () => {
      expect(extract({})).to.equal(undefined);
      expect(extract({ sizes: "" })).to.equal(undefined);
      expect(extract({ sizes: "\n\n\t" })).to.equal(undefined);
    });
  });


  describe("extractMIMEType function", () => {

    it("extracts MIMETypes", () => {
      const extract = extractMIMEType("type");
      const data = { "type": " image/jpeg " };
      const result = extract(data);
      expect(result).to.equal("image/jpeg");
    });

    it("does canonicalization on type and subtype", () => {
      const extract = extractMIMEType("type");
      const data = { "type": " IMAGE/PNG;lower=UPPER" };
      const result = extract(data);
      expect(result).to.equal("image/png;lower=UPPER");
    });

    it("throws on invalid MIME type", () => {
      const extract = extractMIMEType("type");
      ["invalid", "not/ok", "just;bad=fail"]
      .map(type => ({ type }))
        .forEach(data => {
          expect(() => {
            extract(data);
          }).to.throw;
        });
    });
  });

  describe("arrayExtractor function", () => {
    const extract = extractArray("list");
    it("extracts lists", () => {
      const data = { list: ["1", "2", "3"] };
      const result = extract(data);
      expect(result).be.an.instanceof(Array);
      expect(result).to.eql(["1", "2", "3"]);
    });

    it("throws if the type is wrong", () => {
      expect(() => {
        extract({ list: { "1": 1, "2": 2, "3": 3 } });
      }).to.throw;
      expect(() => {
        extract("not ok");
      }).to.throw;
      expect(() => {
        extract(123);
      }).to.throw;
    });

    it("enforces the number type", () => {
      const extract = extractArray("list", { enforceType: "number" });
      const badData = { list: ["1", "2", "3"] };
      expect(() => {
        extract(badData);
      }).to.throw(TypeError);
      const goodData = { list: [1, 2, 3] };
      const result = extract(goodData);
      expect(() => {
        extract(goodData);
      }).to.not.throw;
      expect(result).to.eql([1, 2, 3]);
    });

    it("enforces the string type", () => {
      const extract = extractArray("list", { enforceType: "string" });
      const badData = { list: [1, 2, 3] };
      expect(() => {
        extract(badData);
      }).to.throw(TypeError);
      const goodData = { list: ["test", "test"] };
      const result = extract(goodData);
      expect(() => {
        extract(goodData);
      }).to.not.throw;
      expect(result).to.eql(["test", "test"]);
    });

    it("enforces the object type", () => {
      const extract = extractArray("list", { enforceType: "object" });
      const badData = { list: [{}, 123] };
      expect(() => {
        extract(badData);
      }).to.throw(TypeError);
      const goodData = { list: [{ a: "a" }, { "b": "b" }] };
      const result = extract(goodData);
      expect(() => {
        extract(goodData);
      }).to.not.throw;
      expect(result[1]).to.deep.equal({ "b": "b" });
    });

    it("enforces the array type", () => {
      const extract = extractArray("list", { enforceType: "array" });
      const badData = { list: [1, 2, 3] };
      expect(() => {
        extract(badData);
      }).to.throw(TypeError);
      const goodData = { list: [
          [],
          [],
          [],
        ] };
      const result = extract(goodData);
      expect(() => {
        extract(goodData);
      }).to.not.throw;
      expect(result).to.eql([
        [],
        [],
        [],
      ]);
    });

    it("by default, it allows any type", () => {
      const data = { list: [
          [], 1, "test", null
        ] };
      const result = extract(data);
      expect(result).to.eql([
        [], 1, "test", null
      ]);
    });

    it("throws when the type is enforced", () => {
      const extract = extractArray("list", { enforceType: "number" });
      const badData = { list: [
          [], 1, "test", null
        ] };
      expect(() => {
        extract(badData);
      }).to.throw(TypeError);
      const goodData = { list: [1, 1000, 100000] };
      const result = extract(goodData);
      expect(() => {
        extract(goodData);
      }).to.not.throw;
      expect(result).to.eql([1, 1000, 100000]);
    });
  });

  describe("urlExtractor function", () => {
    it("honors the treatMissingAs directive", () => {
      const baseURL = "http://foo.com/";
      const treatAsUndefined = extractURL("emptyStringURL", { treatMissingAs: "undefined" });
      const treatAsBase = extractURL("emptyStringURL", { treatMissingAs: "base" });
      const thisWillThrow = extractURL("emptyStringURL", { treatMissingAs: "foobar" });
      const data = {
        emptyStringURL: ""
      };
      const test1 = treatAsUndefined(data, baseURL);
      expect(test1).to.equal(undefined);
      const test2 = treatAsBase(data, baseURL);
      expect(test2).to.equal(baseURL);
      expect(() => {
        thisWillThrow(data);
      }).to.throw;
    });

    it("extracts absolute urls", () => {
      const testURL = "http://foo.com/";
      const urlExtractor = extractURL("url");
      const data = { url: testURL };
      const result = urlExtractor(data, "http://bar.com");
      expect(result).to.equal(testURL);
    });

    it("extracts relative urls", () => {
      const testURL = "some/relative/url";
      const urlExtractor = extractURL("url");
      const data = { url: testURL };
      const result = urlExtractor(data, "http://foo.com:8080/");
      expect(result).to.equal(`http://foo.com:8080/${testURL}`);
    });

    it("allows cross origin by default", () => {
      const testURL = "http://bar.com/";
      const urlExtractor = extractURL("url");
      const data = { url: testURL };
      const result = urlExtractor(data, "http://foo.com:8080/");
      expect(result).to.equal(testURL);
    });

    it("forbids cross origin when told to", () => {
      const testURL = "http://bar.com";
      const urlExtractor = extractURL("url");
      const data = { url: testURL, allowCrossOrigin: false };
      expect(() => {
        urlExtractor(data, "http://foo.com");
      }).to.throw;
    });

    it("throws on trying to resolve invalid URLs", () => {
      const urlExtractor = extractURL("url");
      expect(() => {
        const data = { url: "://" };
        urlExtractor(data, "http://foo.com");
      }).to.throw;
      expect(() => {
        const data = { url: "http://foo.com" };
        urlExtractor(data, "://");
      }).to.throw;
    });
  });

  describe("extractString function", () => {

    it("throws when restrictTo is not a Set instance", () => {
      expect(() => {
        extractString({}, { restrictTo: new Set() });
      }).to.not.throw(TypeError);

      expect(() => {
        extractString({}, { restrictTo: "" });
      }).to.throw(TypeError);

      expect(() => {
        extractString({}, { restrictTo: new Map() });
      }).to.throw(TypeError);

      expect(() => {
        extractString({}, { restrictTo: "a string" });
      }).to.throw(TypeError);

      expect(() => {
        extractString({}, { restrictTo: 123 });
      }).to.throw(TypeError);
    });

    it("extracts strings and does not trim", () => {
      const expected = " \tpass\t \n\n\n"
      const data = {
        "a": expected,
      };
      const extractA = extractString("a");
      const result = extractA(data);
      expect(result).to.equal(expected);
    });

    it("trim when trim option is set to true", () => {
      const data = {
        "a": "\tpass\t\n",
      };
      const extractA = extractString("a", { trim: true });
      const result = extractA(data);
      expect(result).to.equal("pass");
    });


    it("doesn't trim when trim option is set to false", () => {
      const data = {
        "a": "\tpass\t\n",
      };
      const extractA = extractString("a", { trim: false });
      const result = extractA(data);
      expect(result).to.equal("\tpass\t\n");
    });

    it("restricts value to a set of values", () => {
      const restrictTo = new Set(["bar", "baz", "foo"]);
      const extractTest = extractString("test", { restrictTo });
      for (const test of restrictTo) {
        const result = extractTest({ test });
        expect(result).to.equal(test);
      }
      expect(() => {
        extractTest({ test: "will throw" });
      }).to.throw;
    });
  });
});
