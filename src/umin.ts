export function execGetRecptNoFromHtml(): string[] {
  const uminIdList: string[] = ["UMIN000007237"];
  const recptNoList: string[] = uminIdList.map((uminId) => {
    const res: string = getRecptNoFromHtml_(uminId);
    Utilities.sleep(1000);
    return res;
  });
  console.log(recptNoList);
  return recptNoList;
}
function getRecptNoFromHtml_(uminId: string): string {
  const url: string = `https://center6.umin.ac.jp/cgi-open-bin/ctr/index.cgi?sort=03&function=04&ctrno=${uminId}`;
  const data: string = UrlFetchApp.fetch(url).getContentText("UTF-8");
  // Extract all <a> tags from the data
  const anchorTags: RegExpMatchArray | null = data.match(
    /<a\s+[^>]*href="([^"]*?recptno=[^"]*)"/gi
  );
  if (!anchorTags) {
    return "";
  }
  const recptnoList: (RegExpExecArray | null)[] = anchorTags
    .map((text) => /R[0-9]{9}/.exec(text))
    .filter((x) => x !== null);
  if (recptnoList.length === 0) {
    return "";
  }
  const recptNo: string[] = Array.from(new Set(recptnoList.map((x) => x![0])));
  return recptNo[0];
}
