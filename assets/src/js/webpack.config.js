var webpack = require('webpack');

var config = {
  entry: {
    index: './index.jsx',
    gm: './gm.jsx',  
  },
  output: {
    filename: '../../prod/js/[name].min.js',
    path: __dirname
  }
};

module.exports = config;