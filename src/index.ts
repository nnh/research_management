import { generateForm2 } from "./generate-form2";
import { generateForm3 } from "./generate-form3";
import { getFromHtml } from "./youshiki-data";
import { getPubmed } from "./pubmed";

function onOpen() {
  const arr = [
    { name: "様式第２、別添２作成", functionName: "generateForm2" },
    { name: "様式第３、別添３作成", functionName: "generateForm3" },
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
