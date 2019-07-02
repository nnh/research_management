function readValues(values: any[][]) {
  const headers = values[0]
  const withoutHeaders = values.filter((_a, index) => index !== 0)
  return withoutHeaders.
    map(a => a.reduce((obj, v, index) => {
      obj[headers[index]] = v;
      return obj;
    }, {}))
}

export { readValues }
