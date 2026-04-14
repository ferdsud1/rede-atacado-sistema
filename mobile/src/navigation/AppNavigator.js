import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import EncartesScreen from '../screens/EncartesScreen';
import EncarteDetalheScreen from '../screens/EncarteDetalheScreen';
import HistoriaScreen from '../screens/HistoriaScreen';
import TrabalheConoscoScreen from '../screens/TrabalheConoscoScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#ff6600' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function EncartesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#ff6600' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name="EncartesList"
        component={EncartesScreen}
        options={{ title: 'Encartes' }}
      />
      <Stack.Screen
        name="EncarteDetalhe"
        component={EncarteDetalheScreen}
        options={({ route }) => ({ title: route.params?.titulo || 'Encarte' })}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Início') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Encartes') {
            iconName = focused ? 'newspaper' : 'newspaper-outline';
          } else if (route.name === 'Nossa História') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Trabalhe Conosco') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#ff6600',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#ff6600',
          borderTopWidth: 2,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Início" component={HomeStack} />
      <Tab.Screen name="Encartes" component={EncartesStack} />
      <Tab.Screen name="Nossa História" component={HistoriaScreen} />
      <Tab.Screen name="Trabalhe Conosco" component={TrabalheConoscoScreen} />
    </Tab.Navigator>
  );
}
