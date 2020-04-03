import { assert } from "chai"
import fs from 'fs'
import { getDescriptionByHtml } from "../src/jrct"

describe('getDescriptionByHtml', () => {
  context('valid recptNo', () => {
    const jRctId = 'jRCTs051180190'
    it('returns valid data', () => {
      // curl 'https://jrct.niph.go.jp/latest-detail/jRCTs051180190' > tests/fixtures/jrct_jRCTs051180190.html
      const html = fs.readFileSync(`tests/fixtures/jrct_${jRctId}.html`).toString()
      const data = getDescriptionByHtml(html)
      assert.equal(data.condition, '急性白血病')

      const expected =
        "FLAMEL regimen:リン酸フルダラビン(30 mg/square meter×1回/日を4日間)と、シタラビン（2 g/square meter×1回/日を2日間）、メルファラン（60 mg/square を3日間）、全身照射（3 Gy 1ｘ1/日） \r\n" +
        "移植片は骨髄、末梢血幹細胞、臍帯血のいずれも選択できる。原則的に，タクロリムスまたはシクロスポリンとメソトレキサートを用いたGVHD予防を行う。\r\n" +
        "副次的項目の評価のために、コントロールとして骨髄髄破壊的量のブスルファン（> 8 mg/kg）または全身照射（>= 8 Gy, fractionated）を用いた前処置後の造血細胞移植を受けた症例が登録される。 \r\n" +
        "移植片は骨髄、末梢血幹細胞、臍帯血のいずれも選択できる。原則的に，タクロリムスまたはシクロスポリンとメソトレキサートを用いたGVHD予防を行う。"

      assert.equal(data.interventions, expected)
    })
  })
})
