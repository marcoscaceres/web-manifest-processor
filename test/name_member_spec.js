"use strict";
import {makeTrimTest, makeTypeTest, makeExpectedValueTest} from "./common";

describe("name member", function(){
  const trimTest = makeTrimTest("name");
  trimTest("this should be trimmed");
  const typeTest = makeTypeTest("name");
  typeTest("string", undefined);

  const acceptableNames = [
    'pass',
    `pass pass pass pass pass pass pass pass pass pass pass pass pass pass
     pass pass pass pass pass pass pass pass pass pass pass pass pass pass
     pass pass pass pass pass pass pass pass pass pass pass pass pass pass
     pass pass pass pass pass pass pass pass pass pass pass pass`,
    'これは許容できる名前です',
    'ນີ້ແມ່ນຊື່ທີ່ຍອມຮັບໄດ້'
  ];
  const expectedTest = makeExpectedValueTest("name");
  expectedTest(acceptableNames);
});
