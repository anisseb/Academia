const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = false;

// Ajouter cette configuration pour react-native-math-view
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs'];
config.resolver.assetExts = [...config.resolver.assetExts, 'ttf', 'glb', 'gltf', 'png', 'jpg', 'obj', 'mtl'];

// Configuration pour résoudre les problèmes de modules ES
config.resolver.platforms = ['ios', 'android', 'native', 'web'];
config.resolver.unstable_enableSymlinks = false;

// Ajouter ceci pour éviter le warning
config.resolver.blockList = [
  /\/node_modules\/react-native-math-view\/.*\.js/,
];

// Configuration pour expo-modules-core
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

module.exports = config;
