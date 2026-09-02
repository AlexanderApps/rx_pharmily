export default ({ config }) => ({
  ...config,
  extra: {
    apiKey: "YOUR_API_KEY",
    apiUrl: "https://your-api-url.com",
    // {/* googleMapsApiKey: "AIzaSyC-Yt2lPsqPVY1gzloCnVwqWkJy1yUOhgo",*/}
    eas: {
      projectId: "f194ccf8-7c6d-4334-834d-fa77bd87424c",
    },
  },
  plugins: [
    ...(config.plugins ?? []),
    "expo-video",
    "expo-sharing",
    [
      "react-native-maps",
      {
        androidGoogleMapsApiKey: "AIzaSyC-Yt2lPsqPVY1gzloCnVwqWkJy1yUOhgo",
      },
    ],
  ],
});
