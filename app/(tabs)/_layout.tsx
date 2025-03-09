import { Tabs } from 'expo-router';
import { Camera, Chrome as Home, History } from 'lucide-react-native';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#1a1a1a',
        },
        tabBarActiveTintColor: '#60a5fa',
        tabBarInactiveTintColor: '#6b7280',
        headerStyle: {
          backgroundColor: '#1a1a1a',
        },
        headerTintColor: '#fff',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Scan',
          tabBarIcon: ({ size, color }) => <Camera size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ size, color }) => <History size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}