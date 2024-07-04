import { generateForm2 } from "./generate-form2";
import { generateForm3 } from "./generate-form3";
import { getFromHtml } from "./youshiki-data";
import { getPubmed } from "./pubmed";
import { rewriteAttachment2, rewriteAttachment3 } from "./edit-attachment";
import { generateFormAll } from "./generate-form-main";

function onOpen() {
  const arr = [
    { name: "様式第２、３、別添２、３作成", functionName: "generateFormAll" },
    { name: "様式第２、別添２作成", functionName: "generateForm2" },
    { name: "様式第３、別添３作成", functionName: "generateForm3" },
    { name: "別添２テキスト再作成", functionName: "rewriteAttachment2" },
    { name: "別添３テキスト再作成", functionName: "rewriteAttachment3" },
  ];
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  spreadsheet.addMenu("様式作成", arr);
}

declare const global: {
  [x: string]: any;
};

global.onOpen = onOpen;
global.generateForm2 = generateForm2;
global.generateForm3 = generateForm3;
global.getFromHtml = getFromHtml;
global.getPubmed = getPubmed;
global.rewriteAttachment2 = rewriteAttachment2;
global.rewriteAttachment3 = rewriteAttachment3;
global.generateFormAll = generateFormAll;
