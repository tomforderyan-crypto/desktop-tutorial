import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';
import RootNavigator from './src/navigation/RootNavigator';
import { CartProvider } from './src/context/CartContext';
import { SubscriptionProvider } from './src/context/SubscriptionContext';

// A blank publishable key disables live Stripe calls but still lets
// PaymentSheet's own error handling take over gracefully (see
// CheckoutScreen), rather than crashing at provider init.
const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';

export default function App() {
  return (
    <SafeAreaProvider>
      <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY} merchantIdentifier="merchant.com.wakecountyspeedway.app">
        <SubscriptionProvider>
          <CartProvider>
            <StatusBar style="light" />
            <RootNavigator />
          </CartProvider>
        </SubscriptionProvider>
      </StripeProvider>
    </SafeAreaProvider>
  );
}
