const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = false;

// Ajouter cette configuration pour react-native-math-view
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs'];
config.resolver.assetExts = [...config.resolver.assetExts, 'ttf', 'glb', 'gltf', 'png', 'jpg', 'obj', 'mtl'];

// Ajouter ceci pour éviter le warning
config.resolver.blockList = [
  /\/node_modules\/react-native-math-view\/.*\.js/,
];

module.exports = config;
