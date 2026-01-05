# Windows Setup Guide

## Important Notes

⚠️ **iOS Development**: iOS apps can only be built and run on macOS. On Windows, you can only develop for Android.

## Current Situation

Your project has all the source code, but it's missing the native React Native project structure (android/ and ios/ folders). You have two options:

## Option 1: Use Expo (Recommended for Quick Start)

Expo is the easiest way to run React Native on Windows and test on both iOS (via Expo Go app) and Android.

### Steps:

1. **Install Expo CLI globally:**
   ```bash
   npm install -g expo-cli
   ```

2. **Initialize a new Expo project:**
   ```bash
   npx create-expo-app WeatherForestExpo
   cd WeatherForestExpo
   ```

3. **Copy your source files:**
   - Copy the `src/` folder to the new project
   - Copy `App.tsx` and update it
   - Copy configuration files (babel.config.js, tsconfig.json, etc.)

4. **Install dependencies:**
   ```bash
   npm install
   ```

5. **Run the app:**
   ```bash
   npx expo start
   ```
   Then scan the QR code with Expo Go app on your phone.

## Option 2: Initialize React Native CLI Project

### Steps:

1. **Install React Native CLI globally:**
   ```bash
   npm install -g react-native-cli
   ```

2. **Create a new React Native project:**
   ```bash
   npx react-native init WeatherForestNative --version 0.72.6
   cd WeatherForestNative
   ```

3. **Copy your source files:**
   - Copy the entire `src/` folder
   - Copy `App.tsx` and replace the default
   - Copy configuration files

4. **Install your dependencies:**
   ```bash
   npm install
   ```

5. **For Android setup:**
   - Install Android Studio
   - Set up Android SDK
   - Create an Android Virtual Device (AVD)
   - Set ANDROID_HOME environment variable

6. **Run on Android:**
   ```bash
   npm run android
   ```

## Option 3: Quick Test with Metro Bundler

You can at least start the Metro bundler to verify your code:

```bash
npm start
```

This will start the Metro bundler, but you'll need a device/emulator to actually run the app.

## Recommended: Use Expo for Development

For the fastest setup on Windows:
1. Use Expo (Option 1)
2. Test on your Android phone with Expo Go app
3. Test on iOS using Expo Go app (if you have an iPhone)
4. No need for Android Studio or Xcode setup

## Next Steps

1. Choose an option above
2. Follow the steps
3. Copy your source code
4. Run the app

## Troubleshooting

### If Metro bundler won't start:
```bash
npm start -- --reset-cache
```

### If you get module resolution errors:
Make sure babel.config.js has the module-resolver plugin configured correctly.

### For Android development:
- Make sure Android Studio is installed
- Android SDK is configured
- AVD (Android Virtual Device) is created
- Environment variables are set

## Need Help?

- Expo Docs: https://docs.expo.dev/
- React Native Docs: https://reactnative.dev/docs/getting-started
- React Native Windows: https://microsoft.github.io/react-native-windows/



