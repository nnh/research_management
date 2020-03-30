import { generateForm2, generateForm3, generateForm4, fillPublication } from './codes'
import './ctr-utils'
import { exportSupports } from './exportSupports'
import './jrct'
import './showStatus'
import './utils'
import './xml'

function onOpen() {
  var arr = [
    {name: "様式第２、別添２作成", functionName: "generateForm2"},
    {name: "様式第３、別添３作成", functionName: "generateForm3"},
    {name: "様式第４", functionName: "generateForm4"},
    {name: "Publication", functionName: "fillPublication"},
    {name: "ARO支援一覧test", functionName: "exportSupports"},
  ];
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  spreadsheet.addMenu("様式作成", arr);
}

declare const global: {
  [x: string]: any ;
}

global.onOpen = onOpen
global.generateForm2 = generateForm2
global.generateForm3 = generateForm3
global.generateForm4 = generateForm4
global.fillPublication = fillPublication
global.exportSupports = exportSupports
