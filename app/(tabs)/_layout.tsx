import { Tabs, usePathname, router } from "expo-router";
import { Home, Layers, Plus, Sparkles, Settings, RefreshCw, Wand2, HelpCircle, Lock } from "lucide-react-native";
import React, { useEffect, useRef, createContext, useContext, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import { View, StyleSheet, Alert, Linking } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  Easing,
} from "react-native-reanimated";

import Colors from "@/constants/colors";
import { usePortfolio } from "@/contexts/PortfolioContext";
import { useSubscription } from "@/contexts/SubscriptionContext";

type ActiveTab = "home" | "portfolio" | "insights" | "settings" | string;

const InsightsRefreshContext = createContext<{
  refreshKey: number;
  triggerRefresh: () => void;
  showRecommendations: boolean;
  setShowRecommendations: (v: boolean) => void;
}>({ refreshKey: 0, triggerRefresh: () => {}, showRecommendations: false, setShowRecommendations: () => {} });

export function useInsightsRefresh() {
  return useContext(InsightsRefreshContext);
}

function getIconForTab(tab: ActiveTab, isPremium?: boolean) {
  switch (tab) {
    case "home":
      return <RefreshCw size={24} color="#FFFFFF" strokeWidth={2.5} />;
    case "portfolio":
      return <Plus size={24} color="#FFFFFF" strokeWidth={2.5} />;
    case "insights":
      return isPremium
        ? <Wand2 size={24} color="#FFFFFF" strokeWidth={2.5} />
        : <Lock size={22} color="rgba(255,255,255,0.5)" strokeWidth={2.5} />;
    case "settings":
      return <HelpCircle size={24} color="#FFFFFF" strokeWidth={2.5} />;
    default:
      return <RefreshCw size={24} color="#FFFFFF" strokeWidth={2.5} />;
  }
}

interface CenterButtonHandle {
  spin: () => void;
}

const CenterButton = forwardRef<CenterButtonHandle, { activeTab: ActiveTab; isPremium?: boolean }>(
  ({ activeTab, isPremium }, ref) => {
    const scale = useSharedValue(1);
    const rotate = useSharedValue(0);
    const spinRotate = useSharedValue(0);
    const prevTab = useRef(activeTab);

    useImperativeHandle(ref, () => ({
      spin: () => {
        spinRotate.value = withTiming(spinRotate.value + 360, {
          duration: 600,
          easing: Easing.out(Easing.cubic),
        });
      },
    }));

    useEffect(() => {
      if (prevTab.current !== activeTab) {
        prevTab.current = activeTab;
        scale.value = withSequence(
          withTiming(0.6, { duration: 120, easing: Easing.out(Easing.quad) }),
          withSpring(1, { damping: 10, stiffness: 200 })
        );
        rotate.value = withSequence(
          withTiming(rotate.value + 180, {
            duration: 300,
            easing: Easing.out(Easing.cubic),
          })
        );
      }
    }, [activeTab]);

    const animatedIconStyle = useAnimatedStyle(() => ({
      transform: [
        { scale: scale.value },
        { rotate: `${rotate.value + spinRotate.value}deg` },
      ],
    }));

    const isDisabled = activeTab === "insights" && !isPremium;

    return (
      <View style={[styles.addButton, isDisabled && styles.addButtonDisabled]}>
        <Animated.View style={animatedIconStyle}>
          {getIconForTab(activeTab, isPremium)}
        </Animated.View>
      </View>
    );
  }
);

export default function TabLayout() {
  const pathname = usePathname();
  const { refreshMarketPrices, isRefreshingPrices } = usePortfolio();
  const { isPremium } = useSubscription();
  const [insightsRefreshKey, setInsightsRefreshKey] = useState(0);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const centerButtonRef = useRef<CenterButtonHandle>(null);

  const triggerInsightsRefresh = useCallback(() => {
    setInsightsRefreshKey((k) => k + 1);
  }, []);

  let activeTab: ActiveTab = "home";
  if (pathname === "/portfolio") activeTab = "portfolio";
  else if (pathname === "/insights") activeTab = "insights";
  else if (pathname === "/settings") activeTab = "settings";

  return (
    <InsightsRefreshContext.Provider
      value={{ refreshKey: insightsRefreshKey, triggerRefresh: triggerInsightsRefresh, showRecommendations, setShowRecommendations }}
    >
      <Tabs
        sceneContainerStyle={{ backgroundColor: 'transparent' }}
        screenOptions={{
          tabBarActiveTintColor: Colors.accent,
          tabBarInactiveTintColor: Colors.text.tertiary,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            paddingTop: 8,
            height: 88,
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            elevation: 0,
          },
          tabBarBackground: () => (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' }} />
          ),
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginBottom: 8,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => <Home size={22} color={color} strokeWidth={2} />,
          }}
        />
        <Tabs.Screen
          name="portfolio"
          options={{
            title: "Portfolio",
            tabBarIcon: ({ color }) => <Layers size={22} color={color} strokeWidth={2} />,
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: "",
            tabBarIcon: () => <CenterButton ref={centerButtonRef} activeTab={activeTab} isPremium={isPremium} />,
            tabBarLabel: () => null,
          }}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              e.preventDefault();
              if (activeTab === "home") {
                if (!isRefreshingPrices) {
                  centerButtonRef.current?.spin();
                  refreshMarketPrices();
                }
              } else if (activeTab === "portfolio") {
                navigation.navigate('add-asset');
              } else if (activeTab === "insights") {
                if (isPremium) {
                  setShowRecommendations(true);
                } else {
                  router.push('/premium' as any);
                }
              } else if (activeTab === "settings") {
                Alert.alert(
                  "Help & Support",
                  "How can we help you?",
                  [
                    {
                      text: "Email Support",
                      onPress: () => Linking.openURL("mailto:support@investease.app?subject=Help%20Request"),
                    },
                    {
                      text: "FAQs",
                      onPress: () => {},
                    },
                    { text: "Cancel", style: "cancel" },
                  ]
                );
              } else {
                if (!isRefreshingPrices) {
                  centerButtonRef.current?.spin();
                  refreshMarketPrices();
                }
              }
            },
          })}
        />
        <Tabs.Screen
          name="insights"
          options={{
            title: "Insights",
            tabBarIcon: ({ color }) => <Sparkles size={22} color={color} strokeWidth={2} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color }) => <Settings size={22} color={color} strokeWidth={2} />,
          }}
        />
      </Tabs>
    </InsightsRefreshContext.Provider>
  );
}

const styles = StyleSheet.create({
  addButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    top: -24,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  addButtonDisabled: {
    backgroundColor: Colors.text.tertiary,
    shadowOpacity: 0.15,
  },
});
