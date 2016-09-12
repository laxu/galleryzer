// webpack.config.js
var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    galleryzer: path.join(__dirname, 'src/js/content-script/galleryzer.js'),
    galleryzerCss: path.join(__dirname, 'src/sass/galleryzer.scss')
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
    ]
  },  
  plugins: [
    new ExtractTextPlugin('galleryzer.css'),
    new CopyWebpackPlugin([
      { from: './src/js/main.js', flatten: true },
      { from: './src/js/background.js', flatten: true },
      { from: './src/js/options.js', flatten: true },
      { from: './src/html/*.html', flatten: true }
    ])
  ]
}
