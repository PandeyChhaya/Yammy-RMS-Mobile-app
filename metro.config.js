// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);


config.resolver.blockList = [
  /app\/modules\/pos\/.*/,  // Exclude entire POS directory
];

module.exports = config;