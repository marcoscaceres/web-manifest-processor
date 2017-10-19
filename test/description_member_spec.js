"use strict";
import {makeTrimTest, makeTypeTest, makeExpectedValueTest} from "./common";

describe("description member", function(){
  const trimTest = makeTrimTest("description");
  trimTest("this should be trimmed");
  const typeTest = makeTypeTest("description");
  typeTest("string", undefined);

  const acceptableDescriptions = [
    'pass',
    `pass pass pass pass pass pass pass pass pass pass pass pass pass pass
     pass pass pass pass pass pass pass pass pass pass pass pass pass pass
     pass pass pass pass pass pass pass pass pass pass pass pass pass pass
     pass pass pass pass pass pass pass pass pass pass pass pass`,
    'これは許容できる名前です',
    'ນີ້ແມ່ນຊື່ທີ່ຍອມຮັບໄດ້'
  ];
  const expectedTest = makeExpectedValueTest("description");
  expectedTest(acceptableDescriptions);
});
