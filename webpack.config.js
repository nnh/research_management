const fs = require('fs')
const path = require('path')

const entry = fs.readdirSync("src").filter(s => s.match(/\.ts$/)).reduce((obj, str) => ({...obj, ...{[path.basename(str, '.ts')]: './src/' + str}}), {})

module.exports = {
  mode: "development",
  entry,
  output: {
    filename: '[name].js',
    path: __dirname + '/dist'
  },
  devtool: 'inline-source-map',
  resolve: {
    modules: [
      "node_modules",
    ],
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      { test: /\.tsx?$/, loader: "ts-loader" },
    ],
  },
  plugins: [],
};
