import * as ssUtils from "./ss-utils";
import * as utils from "./utils";
import * as youshikiData from "./youshiki-data";
import * as generateForm from "./generate-form-utils";
import { rewriteAttachment3 } from "./edit-attachment";

function generateForm3_1_(form3: generateForm.GenerateForm2_1) {
  const youshiki3: string[][] = form3.getYoushikiInputValues();
  const inputValues: string[][] = form3.getOutputValues_(youshiki3);
  const inputValuesYoushiki3 = form3.editInputYoushiki(inputValues);
  form3.generateForm(
    utils.outputYoushiki3SheetNames.get("youshiki3_1")!,
    inputValuesYoushiki3,
    utils.specificClinicalStudyKey
  );
  const inputValuesAttachment3 = form3.editInputAttachment(
    inputValues,
    [utils.seqColName, utils.trialNameLabel, utils.idLabel, utils.attachment_3],
    form3.inputColnames
  );
  form3.generateForm(
    utils.outputYoushiki3SheetNames.get("attachment3")!,
    inputValuesAttachment3,
    utils.specificClinicalStudyKey
  );
}
export function generateForm3() {
  const sheetNames = Array.from(utils.outputYoushiki3SheetNames.values());
  new ssUtils.GetSheet_().targetSheetsClearContents_(sheetNames);
  youshikiData.getFromHtml();
  rewriteAttachment3();
  generateForm3_1_(new generateForm.GenerateForm2_1([utils.attachment_3]));
}
