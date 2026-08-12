module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo"],
      // ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      // "nativewind/babel",
    ],
    plugins: [
      // Must stay last in the plugins array — this is a hard requirement
      // from react-native-reanimated (used under the hood by
      // @gorhom/bottom-sheet, already relied on throughout this app).
      "react-native-reanimated/plugin",
    ],
  };
};
