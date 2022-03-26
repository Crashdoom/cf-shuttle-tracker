const path = require('path');

module.exports = {
  entry: {
    'index': path.resolve(__dirname, 'src/index.ts'),
  },
  /*devtool: 'inline-source-map',*/
  module: {
    rules: [{
      test: /\.tsx?$/,
      use: 'ts-loader',
      exclude: /node_modules/
    }]
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },
};
