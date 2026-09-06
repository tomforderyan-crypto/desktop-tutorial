import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { colors } from '../theme/theme';
import type { RootStackParamList, TabParamList, MoreStackParamList } from './types';

import HomeScreen from '../screens/HomeScreen';
import StandingsScreen from '../screens/StandingsScreen';
import StandingsDetailScreen from '../screens/StandingsDetailScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import DriverListScreen from '../screens/DriverListScreen';
import DriverProfileScreen from '../screens/DriverProfileScreen';
import MoreMenuScreen from '../screens/MoreMenuScreen';
import LivestreamScreen from '../screens/LivestreamScreen';
import SocialFeedScreen from '../screens/SocialFeedScreen';
import FoodVendorsScreen from '../screens/FoodVendorsScreen';
import GalleryScreen from '../screens/GalleryScreen';
import EventGalleryScreen from '../screens/EventGalleryScreen';
import TrackInfoScreen from '../screens/TrackInfoScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CatalogScreen from '../screens/merch/CatalogScreen';
import ProductDetailScreen from '../screens/merch/ProductDetailScreen';
import CartScreen from '../screens/merch/CartScreen';
import CheckoutScreen from '../screens/merch/CheckoutScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const MoreStack = createNativeStackNavigator<MoreStackParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '700' as const },
  contentStyle: { backgroundColor: colors.background },
};

function tabIcon(label: string) {
  return () => <Text style={{ fontSize: 18 }}>{label}</Text>;
}

function MoreNavigator() {
  return (
    <MoreStack.Navigator screenOptions={screenOptions}>
      <MoreStack.Screen name="MoreMenu" component={MoreMenuScreen} options={{ title: 'More' }} />
      <MoreStack.Screen name="Livestream" component={LivestreamScreen} options={{ title: 'Livestream' }} />
      <MoreStack.Screen name="Drivers" component={DriverListScreen} options={{ title: 'Drivers' }} />
      <MoreStack.Screen name="SocialFeed" component={SocialFeedScreen} options={{ title: 'Social' }} />
      <MoreStack.Screen name="FoodVendors" component={FoodVendorsScreen} options={{ title: 'Food Vendors' }} />
      <MoreStack.Screen name="Gallery" component={GalleryScreen} options={{ title: 'Gallery' }} />
      <MoreStack.Screen name="TrackInfo" component={TrackInfoScreen} options={{ title: 'Track Info & Rules' }} />
      <MoreStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Notifications' }} />
    </MoreStack.Navigator>
  );
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: tabIcon('🏁') }} />
      <Tab.Screen name="Standings" component={StandingsScreen} options={{ tabBarIcon: tabIcon('🏆') }} />
      <Tab.Screen name="Schedule" component={ScheduleScreen} options={{ tabBarIcon: tabIcon('📅') }} />
      <Tab.Screen name="Merch" component={CatalogScreen} options={{ tabBarIcon: tabIcon('🛍️'), title: 'Merch Store' }} />
      <Tab.Screen name="More" component={MoreNavigator} options={{ tabBarIcon: tabIcon('☰'), headerShown: false }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer
      theme={{
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          primary: colors.primary,
        },
      }}
    >
      <RootStack.Navigator screenOptions={screenOptions}>
        <RootStack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
        <RootStack.Screen
          name="StandingsDetail"
          component={StandingsDetailScreen}
          options={({ route }) => ({ title: route.params.className })}
        />
        <RootStack.Screen name="DriverProfile" component={DriverProfileScreen} options={{ title: 'Driver Profile' }} />
        <RootStack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Product' }} />
        <RootStack.Screen name="Cart" component={CartScreen} options={{ title: 'Cart' }} />
        <RootStack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
        <RootStack.Screen
          name="EventGallery"
          component={EventGalleryScreen}
          options={({ route }) => ({ title: route.params.eventName })}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
