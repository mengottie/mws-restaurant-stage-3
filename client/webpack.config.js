const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const webpack = require('webpack');
const autoprefixer = require('autoprefixer');

module.exports = [
  {
    entry: './src/sass/styles.scss',
    output: {
      // This is necessary for webpack to compile
      // But we never use style-bundle.js
      filename: './tmp/style-bundle.js',
    },
    module: {
      rules: [{
        test: /\.scss$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: './src/css/styles-bundle.min.css',
            },
          },
          { loader: 'extract-loader' },
          { loader: 'css-loader',
            options: {
              minimize: true || {/* CSSNano Options */}
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              plugins: () => [autoprefixer()],
            },
          },
          {
            loader: 'sass-loader',
            options: {
              includePaths: ['./node_modules'],
            }
          },
        ]
      }]
    },
  },
  {
    entry: {
    main: './src/js/main.js',
    restaurant: './src/js/restaurant_info.js'
    },
    devtool: 'inline-source-map',
    devServer: {
      contentBase: './dist',
      hot: true
    },
    plugins: [
      new CleanWebpackPlugin(['dist']),
      new HtmlWebpackPlugin({
        title: 'Development'
      }),
      new webpack.HotModuleReplacementPlugin()
    ],
    output: {
      filename: 'main.js',
      path: path.resolve(__dirname, 'dist')
    }
  }
];