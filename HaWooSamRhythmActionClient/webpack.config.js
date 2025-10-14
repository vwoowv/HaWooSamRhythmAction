const path = require('path');

module.exports = {
  mode: 'development',
  entry: './assets/scripts/main.ts',
  output: {
    path: path.resolve(__dirname, 'assets/bundles'),
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.webpack.json'
            }
          }
        ],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  externals: {
    'cc': 'cc'
  }
};