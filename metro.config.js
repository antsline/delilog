const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// watchmanを無効化してTouchableOpacity問題を解決
config.watchFolders = [];
config.resolver.useWatchman = false;

module.exports = config;