const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure that all platform-specific extensions are resolved
config.resolver.platforms = ['native', 'web', 'ios', 'android'];

// Clear the Metro cache on startup
config.resetCache = true;

module.exports = config;