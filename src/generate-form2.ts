import * as ssUtils from "./ss-utils";
import * as utils from "./utils";
import * as youshikiData from "./youshiki-data";
import * as generateForm from "./generate-form-utils";
import * as pbmd from "./pubmed";
import { rewriteAttachment2 } from "./edit-attachment";

function generateForm2_1_(form2: generateForm.GenerateForm2_1) {
  const youshiki2_1_2: string[][] = form2.getYoushikiInputValues();
  const inputValues: string[][] = form2.getOutputValues_(youshiki2_1_2);
  const inputValuesYoushiki2_1_2 = form2.editInputYoushiki(inputValues);
  form2.generateForm(
    utils.outputYoushiki2SheetNames.get("youshiki2_1_2")!,
    inputValuesYoushiki2_1_2,
    utils.specificClinicalStudyKey
  );
  const inputValuesAttachment2_1_1 = form2.editInputAttachment(
    inputValues,
    [
      utils.seqColName,
      utils.trialNameLabel,
      utils.idLabel,
      utils.attachment_2_1_1,
    ],
    form2.inputColnames
  );
  form2.generateForm(
    utils.outputYoushiki2SheetNames.get("attachment2_1_1")!,
    inputValuesAttachment2_1_1,
    utils.specificClinicalStudyKey
  );
  const overAgeColIdx = inputValues[0].findIndex((label) =>
    label.includes(utils.overAgeLabel)
  );
  const attachment2_1_2_Values: string[][] = inputValues.filter(
    (values) =>
      !new RegExp(`^.${utils.overAgeNoLimit}$`).test(values[overAgeColIdx])
  );
  const inputValuesAttachment2_1_2 = form2.editInputAttachment(
    attachment2_1_2_Values,
    [
      utils.seqColName,
      utils.trialNameLabel,
      utils.idLabel,
      utils.attachment_2_1_2,
    ],
    form2.inputColnames
  );
  form2.generateForm(
    utils.outputYoushiki2SheetNames.get("attachment2_1_2")!,
    inputValuesAttachment2_1_2,
    utils.specificClinicalStudyKey
  );
}

function generateForm2_2() {
  const form2 = new generateForm.GenerateForm2_2();
  const inputValuesYoushiki2_2: string[][] = form2.mergePubmedAndHtml_();
  const inputValuesAttachment2_2 = form2.editInputAttachment(
    inputValuesYoushiki2_2,
    [
      utils.seqColName,
      utils.trialNameLabel,
      utils.idLabel,
      utils.attachment_2_1_1,
      utils.attachment_2_2,
    ],
    inputValuesYoushiki2_2[utils.headerRowIndex]
  );
  form2.generateForm(
    utils.outputYoushiki2SheetNames.get("attachment2_2")!,
    inputValuesAttachment2_2,
    utils.publicationKey
  );
  const pubmed = new pbmd.GetPubmedData();
  const colnamesMap: Map<string, string> = pubmed.getColnamesMap();
  const youshiki2_2Colnames = new Map([
    [utils.seqColName, utils.seqColName],
    [utils.titlePubmedLabel, utils.titlePubmedLabel],
    [colnamesMap.get("authorName")!, colnamesMap.get("authorName")!],
    [
      colnamesMap.get("authorFacilities")!,
      colnamesMap.get("authorFacilities")!,
    ],
    [colnamesMap.get("role")!, colnamesMap.get("role")!],
    [colnamesMap.get("vancouver")!, colnamesMap.get("vancouver")!],
    [colnamesMap.get("type")!, colnamesMap.get("type")!],
    [utils.drugLabel, utils.drugLabel],
    [utils.ageLabel, utils.ageLabel],
    [utils.diseaseCategoryLabel, utils.diseaseCategoryLabel],
    [utils.facilityLabel, utils.facilityLabel],
    [utils.phaseLabel, utils.phaseOutputLabel],
  ]);
  form2.generateForm2_2(
    utils.outputYoushiki2SheetNames.get("youshiki2_2_2")!,
    inputValuesYoushiki2_2,
    youshiki2_2Colnames
  );
}

export function generateForm2() {
  const sheetNames = Array.from(utils.outputYoushiki2SheetNames.values());
  new ssUtils.GetSheet_().targetSheetsClearContents_(sheetNames);
  youshikiData.getFromHtml();
  pbmd.getPubmed();
  rewriteAttachment2();
  generateForm2_1_(
    new generateForm.GenerateForm2_1([
      utils.attachment_2_1_1,
      utils.attachment_2_1_2,
      utils.overAgeLabel,
    ])
  );
  generateForm2_2();
}
