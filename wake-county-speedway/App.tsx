import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { CartProvider } from './src/context/CartContext';
import { SubscriptionProvider } from './src/context/SubscriptionContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <SubscriptionProvider>
        <CartProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </CartProvider>
      </SubscriptionProvider>
    </SafeAreaProvider>
  );
}
