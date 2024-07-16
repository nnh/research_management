import * as testPubmed from "./test-pubmed";
import * as testDc from "./test-dc";
import * as testYoushiki from "./test-youshiki";

export function execTest() {
  new testDc.TestDatacenter().execTest();
  execTestPubmed();
  new testYoushiki.TestYoushiki().execTest();
}
function execTestPubmed(): void {
  new testPubmed.WritePubmed().getPubmed();
  new testPubmed.FetchPubmed().getPubmed();
  new testPubmed.WriteTestData().writeAbstract();
  new testPubmed.WriteTestData().writeFacility();
  new testPubmed.CheckValues().execCheck();
}
