// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// expo-sqlite's web implementation loads its SQLite engine as a .wasm asset
// (wa-sqlite.wasm). Metro doesn't treat .wasm as an asset by default, which
// breaks bundling for the web target with "Unable to resolve module
// ./wa-sqlite/wa-sqlite.wasm".
config.resolver.assetExts.push('wasm');

module.exports = config;
