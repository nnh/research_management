import { assert } from "chai"
//import axios from 'axios'
import fs from 'fs'
import { getRecptNoFromData } from "../src/umin"

/*
async function getUmin(uminId: string): Promise<string> {
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

describe('getRecptNo', () => {
  context('valid uminId', () => {
    const uminId = 'UMIN000027821'
    it('returns valid receptNo', () => {
      //const data = await getUmin(uminId)
      const data = fs.readFileSync(`tests/fixtures/umin_${uminId}.html`).toString()
      const recptNo = getRecptNoFromData(data)
      assert.equal(recptNo, 'R000031865')
    })
  })
})
