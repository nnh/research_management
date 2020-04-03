const GasPlugin = require('gas-webpack-plugin')

module.exports = {
  mode: "development",
  entry: './src/index.ts',
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
  plugins: [
    new GasPlugin()
  ],
};
