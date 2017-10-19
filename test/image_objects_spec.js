"use strict";
import { expect } from "chai";
import {
  docURL,
  makeData,
  makeTypeTest,
  makeURLResolveTests,
  manifestURL,
} from "./common";

import { URL } from "whatwg-url";
import {processImageObjects} from "../js/manifestprocessor";

const images = [{src: "test", type: "image/png", sizes: "12x12"}, {}]
const memberName = "icons"
const result = processImageObjects({memberName, images, manifestURL, docURL})
console.log(result);