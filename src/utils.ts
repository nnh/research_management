type TableType = { [key: string]: any }

export function readValues(values: any[][]): TableType[] {
  const headers = values[0].map((h) => String(h))
  const withoutHeaders = values.filter((_a, index) => index !== 0)
  return withoutHeaders.
    map(a => a.reduce((obj, v, index) => {
      const key = headers[index]
      return {...obj, ...{[key]: v}};
    }, {}))
}
