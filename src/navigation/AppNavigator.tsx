import React from 'react';
import {View, Text} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Ionicons} from '@expo/vector-icons';
import {HomeScreen} from '../screens/HomeScreen';
import {HourlyScreen} from '../screens/HourlyScreen';
import {WeeklyScreen} from '../screens/WeeklyScreen';
import {OverviewScreen} from '../screens/OverviewScreen';
import {FloodRiskScreen} from '../screens/FloodRiskScreen';
import {COLORS} from '../utils/colors';
import {FONT_SIZE} from '../utils/constants';

const Tab = createBottomTabNavigator();

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textSecondary,
          tabBarStyle: {
            backgroundColor: COLORS.cardBackground,
            borderTopColor: COLORS.border,
            borderTopWidth: 0.5,
            paddingBottom: 8,
            paddingTop: 8,
            height: 60,
          },
          tabBarLabelStyle: {
            fontSize: FONT_SIZE.xs,
            fontWeight: '500',
            marginTop: 4,
          },
          tabBarIconStyle: {
            marginTop: 4,
          },
        }}>
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({color, size}) => (
              <Ionicons name="home" size={size} color={color} />
            ),
            tabBarLabel: 'Trang chủ',
          }}
        />
        <Tab.Screen
          name="FloodRisk"
          component={FloodRiskScreen}
          options={{
            tabBarIcon: ({color, size}) => (
              <Ionicons name="water-outline" size={size} color={color} />
            ),
            tabBarLabel: 'Nguy cơ lũ',
          }}
        />
        <Tab.Screen
          name="Hourly"
          component={HourlyScreen}
          options={{
            tabBarIcon: ({color, size}) => (
              <Ionicons name="time-outline" size={size} color={color} />
            ),
            tabBarLabel: 'Theo giờ',
          }}
        />
        <Tab.Screen
          name="Weekly"
          component={WeeklyScreen}
          options={{
            tabBarIcon: ({color, size}) => (
              <Ionicons name="calendar-outline" size={size} color={color} />
            ),
            tabBarLabel: 'Theo ngày',
          }}
        />
        <Tab.Screen
          name="Overview"
          component={OverviewScreen}
          options={{
            tabBarIcon: ({color, size}) => (
              <Ionicons name="stats-chart-outline" size={size} color={color} />
            ),
            tabBarLabel: 'Tổng quan',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

