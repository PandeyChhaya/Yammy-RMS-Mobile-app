module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required for Expo Router
      'expo-router/babel',
      // Optional: React Native Reanimated plugin (if you use animations)
      // 'react-native-reanimated/plugin',
    ],
  };
};