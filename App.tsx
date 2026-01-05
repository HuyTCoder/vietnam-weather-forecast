import React from 'react';
import {StatusBar, StyleSheet} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {WeatherProvider} from './src/providers/WeatherProvider';
import {LocationProvider} from './src/providers/LocationProvider';
import {AlertProvider} from './src/providers/AlertProvider';
import {AppNavigator} from './src/navigation/AppNavigator';
import {COLORS} from './src/utils/colors';

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <LocationProvider>
        <WeatherProvider>
          <AlertProvider>
            <AppNavigator />
          </AlertProvider>
        </WeatherProvider>
      </LocationProvider>
    </SafeAreaProvider>
  );
};

export default App;



