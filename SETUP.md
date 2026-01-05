# Setup Guide

This guide will help you set up the Weather Forest app on your development machine.

## Prerequisites

### Required Software

1. **Node.js** (version 16 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **npm** or **yarn**
   - npm comes with Node.js
   - Verify installation: `npm --version`

3. **React Native CLI**
   ```bash
   npm install -g react-native-cli
   ```

### Platform-Specific Requirements

#### For iOS Development (macOS only)

1. **Xcode** (latest version)
   - Download from Mac App Store
   - Install Xcode Command Line Tools:
     ```bash
     xcode-select --install
     ```

2. **CocoaPods**
   ```bash
   sudo gem install cocoapods
   ```

3. **iOS Simulator**
   - Comes with Xcode

#### For Android Development

1. **Java Development Kit (JDK)**
   - JDK 11 or higher
   - Download from [Oracle](https://www.oracle.com/java/technologies/downloads/) or use OpenJDK

2. **Android Studio**
   - Download from [developer.android.com](https://developer.android.com/studio)
   - Install Android SDK, Android SDK Platform, and Android Virtual Device

3. **Android Environment Variables**
   Add to your `~/.bash_profile` or `~/.zshrc`:
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd app-weather-forest
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. iOS Setup (macOS only)

```bash
cd ios
pod install
cd ..
```

### 4. Android Setup

1. Open Android Studio
2. Open the `android` folder
3. Let Gradle sync complete
4. Create an Android Virtual Device (AVD) if needed

### 5. Run the App

#### iOS
```bash
npm run ios
# or
react-native run-ios
```

#### Android
```bash
npm run android
# or
react-native run-android
```

## Troubleshooting

### Common Issues

#### Metro Bundler Issues
```bash
# Clear Metro cache
npm start -- --reset-cache
```

#### iOS Build Issues
```bash
# Clean build folder
cd ios
rm -rf build
pod deintegrate
pod install
cd ..
```

#### Android Build Issues
```bash
# Clean Gradle cache
cd android
./gradlew clean
cd ..
```

#### Node Modules Issues
```bash
# Remove and reinstall
rm -rf node_modules
npm install
```

### Permission Issues

#### iOS Location Permissions
Add to `ios/YourApp/Info.plist`:
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to provide accurate weather forecasts</string>
```

#### Android Location Permissions
Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

## Environment Variables

Create a `.env` file in the root directory for API keys:

```env
WEATHER_API_KEY=your_api_key_here
WEATHER_API_URL=https://api.weather.com
```

## Testing on Physical Devices

### iOS
1. Connect your iPhone via USB
2. Trust the computer on your iPhone
3. Open Xcode
4. Select your device from the device list
5. Run: `npm run ios`

### Android
1. Enable Developer Options on your Android device
2. Enable USB Debugging
3. Connect via USB
4. Run: `npm run android`

## Next Steps

1. Review the [README.md](./README.md) for app features
2. Check [QUICKSTART.md](./QUICKSTART.md) for quick usage guide
3. Explore the codebase structure
4. Integrate a real weather API (see README.md)

## Need Help?

- Check React Native documentation: [reactnative.dev](https://reactnative.dev/)
- React Navigation docs: [reactnavigation.org](https://reactnavigation.org/)
- Open an issue on GitHub



