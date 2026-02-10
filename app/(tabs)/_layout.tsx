import { Tabs, usePathname } from "expo-router";
import { Home, Layers, Plus, Sparkles, Settings, RefreshCw } from "lucide-react-native";
import React from "react";
import { View, StyleSheet } from "react-native";

import Colors from "@/constants/colors";
import { usePortfolio } from "@/contexts/PortfolioContext";

function CenterButton({ isPortfolio }: { isPortfolio: boolean }) {
  return (
    <View style={styles.addButton}>
      {isPortfolio ? (
        <RefreshCw size={24} color="#FFFFFF" strokeWidth={2.5} />
      ) : (
        <Plus size={24} color="#FFFFFF" strokeWidth={2.5} />
      )}
    </View>
  );
}

export default function TabLayout() {
  const pathname = usePathname();
  const isPortfolio = pathname === '/portfolio';
  const { refreshMarketPrices, isRefreshingPrices } = usePortfolio();

  return (
    <Tabs
      sceneContainerStyle={{ backgroundColor: Colors.bg }}
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
          tabBarIcon: () => <CenterButton isPortfolio={isPortfolio} />,
          tabBarLabel: () => null,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            if (isPortfolio) {
              if (!isRefreshingPrices) {
                refreshMarketPrices();
              }
            } else {
              navigation.navigate('add-asset');
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
});
