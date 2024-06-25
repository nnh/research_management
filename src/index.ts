import { generateForm2, fillPublication } from "./codes";
import "./ctr-utils";
import { getFromHtml } from "./youshiki-data";
import { getPubmed } from "./pubmed";
import { execGetRecptNoFromHtml } from "./umin";

function onOpen() {
  var arr = [
    { name: "様式第２、別添２作成", functionName: "generateForm2" },
    /*    {name: "様式第３、別添３作成", functionName: "generateForm3"},
    {name: "様式第４", functionName: "generateForm4"},
    {name: "Publication", functionName: "fillPublication"},
*/
  ];
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  spreadsheet.addMenu("様式作成", arr);
}

declare const global: {
  [x: string]: any;
};

global.onOpen = onOpen;
global.generateForm2 = generateForm2;
//global.generateForm3 = generateForm3
//global.generateForm4 = generateForm4
global.fillPublication = fillPublication;
global.getFromHtml = getFromHtml;
global.getPubmed = getPubmed;
global.execGetRecptNoFromHtml = execGetRecptNoFromHtml;
