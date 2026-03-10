const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for .cjs files if needed
config.resolver.sourceExts.push('cjs');

// Remove the blockList completely - you need your POS files!
// If you have web-specific files, use platform extensions (.web.tsx)
// instead of blocking entire directories

module.exports = config;