// Learn more: https://docs.expo.dev/guides/customizing-metro/
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');

const config = getDefaultConfig(__dirname);

// Keep Metro's transform cache inside the project (F: drive) instead of the
// system temp folder on C:. Delete `.metro-cache` any time to reclaim space.
config.cacheStores = [new FileStore({ root: path.join(__dirname, '.metro-cache') })];

module.exports = config;
