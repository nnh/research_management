import { assert } from "chai"
//import axios from 'axios'
import fs from 'fs'
import { getRecptNoFromHtml, getRecptDataFromHtml } from "../src/umin"

/*
async function searchUmin(uminId: string): Promise<string> {
  const obj: {[key: string]: string} = {
    sort: '03',
    'function': '04',
    ctrno: uminId
  }
  const params = new URLSearchParams()
  Object.keys(obj).forEach((k) => params.append(k, obj[k]))
  const res = await axios.post('https://upload.umin.ac.jp/cgi-open-bin/ctr/index.cgi', params)
  const html = res.data as string
  fs.writeFileSync('tests/fixtures/umin_UMIN000027821.html', html)
  return html
}
*/

describe('getRecptNoFromHtml', () => {
  context('valid uminId', () => {
    const uminId = 'UMIN000027821'
    it('returns valid receptNo', () => {
      //const data = await searchUmin(uminId)
      const data = fs.readFileSync(`tests/fixtures/umin_${uminId}.html`).toString()
      const recptNo = getRecptNoFromHtml(data)
      assert.equal(recptNo, 'R000031865')
    })
  })
})

describe('getUminData', () => {
  context('valid recptNo', () => {
    const recptNo = 'R000031865'
    it('returns valid data', () => {
      // curl 'https://upload.umin.ac.jp/cgi-open-bin/ctr/ctr_view.cgi?recptno=R000031865' > tests/fixtures/umin_recpt_R000031865.html
      const html = fs.readFileSync(`tests/fixtures/umin_recpt_${recptNo}.html`).toString()
      const recptData = getRecptDataFromHtml(html)
      assert.equal(recptData.target, '急性白血病')

      assert.equal(recptData.intervention,
                   "FLAMEL regimen:リン酸フルダラビン(30 mg/square meter×1回/日を4日間)と、シタラビン（2 g/square meter×1回/日を2日間）、メルファラン（60 mg/square を3日間）、全身照射（3 Gy 1ｘ1/日）\r" +
                   "移植片は骨髄、末梢血幹細胞、臍帯血のいずれも選択できる。原則的に，タクロリムスまたはシクロスポリンとメソトレキサートを用いたGVHD予防を行う。")
    })
  })
})
