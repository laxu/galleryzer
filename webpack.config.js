// webpack.config.js
var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    galleryzer: path.resolve(__dirname, 'src/js/content-script/galleryzer.js')
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
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
        loader: ExtractTextPlugin.extract('css', ['css', 'sass'])
      },
      { 
        test: /\.html$/, 
        loader: 'html-loader'
      },
    ]
  },
  plugins: [
    new ExtractTextPlugin('galleryzer.css', { allChunks: true }),
    new CopyWebpackPlugin([
      { from: './src/manifest.json', flatten: true },
      { from: './src/js/main.js', flatten: true },
      { from: './src/js/background.js', flatten: true },
      { from: './src/js/options.js', flatten: true },
      { from: './src/html/*.html', flatten: true },
      { from: './src/images/*', to:'images', flatten: true }
    ])
  ]
}
