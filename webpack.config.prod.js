// webpack.config.js
var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  entry: {
    galleryzer: path.join(__dirname, 'src/js/content-script/galleryzer.js'),
    main: path.join(__dirname, 'src/js/main.js'),
    background: path.join(__dirname, 'src/js/background.js'),
    options: path.join(__dirname, 'src/js/options.js')
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015']
        }
      },
      {
        test: /\.scss$/,
        loaders: ['css', 'sass']
      },
      { 
        test: /\.css$/, 
        loader: ExtractTextPlugin.extract({
          fallbackLoader: 'style-loader',
          loader: 'css-loader'
        })
      },
      { 
        test: /\.html$/, 
        loader: 'html-loader'
      },

    ],

    plugins: [
      new ExtractTextPlugin('gallery.css'),
      new webpack.optimize.UglifyJsPlugin({
        compressor: {
          warnings: false
        },
      })
    ]
  }
}
