const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.watchFolders = [__dirname];
config.watcher = {
  additionalExts: ['mjs', 'cjs'],
  watchman: {
    deferStates: ['hg.update'],
  },
  healthCheck: {
    enabled: true,
  },
};

config.resolver.blockList = [
  /\.cache\/.*/,
  /\.git\/.*/,
];

module.exports = config;
