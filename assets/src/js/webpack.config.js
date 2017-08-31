var webpack = require('webpack');

var config = {
  entry: {
    player: './player.jsx',
    gm: './gm.jsx',
    pile: './pile.jsx'
  },
  output: {
    filename: '../../prod/js/[name].min.js',
    path: __dirname
  },
  module: {
    loaders: [
      {
        test: /\.jsx$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015', 'react']
        }
      },
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    }),
    new webpack.optimize.UglifyJsPlugin({ minimize: true }),
  ]
};

module.exports = config;