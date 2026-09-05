import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Tabs: undefined;
  StandingsDetail: { classId: number; className: string };
  DriverProfile: { driverId: number };
  ProductDetail: { productId: string };
  Cart: undefined;
  Checkout: undefined;
  EventGallery: { eventId: number; eventName: string };
};

export type TabParamList = {
  Home: undefined;
  Standings: undefined;
  Schedule: undefined;
  Merch: undefined;
  More: NavigatorScreenParams<MoreStackParamList>;
};

export type MoreStackParamList = {
  MoreMenu: undefined;
  Livestream: undefined;
  Drivers: undefined;
  SocialFeed: undefined;
  FoodVendors: undefined;
  Gallery: undefined;
  TrackInfo: undefined;
  Settings: undefined;
};
