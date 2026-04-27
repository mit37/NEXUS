import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Globe, Terminal, Database } from 'lucide-react-native';

import CommandScreen from './src/screens/CommandScreen';
import GlobeScreen from './src/screens/GlobeScreen';
import NodesScreen from './src/screens/NodesScreen';
import LoginScreen from './src/screens/LoginScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#050505',
            borderTopColor: 'rgba(0,255,65,0.3)',
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 10,
            paddingTop: 10,
          },
          tabBarActiveTintColor: '#00FF41',
          tabBarInactiveTintColor: 'rgba(0,255,65,0.3)',
          tabBarLabelStyle: {
            fontFamily: 'monospace',
            fontSize: 10,
            letterSpacing: 1,
          },
        }}
      >
        <Tab.Screen 
          name="Globe" 
          component={GlobeScreen} 
          options={{
            tabBarLabel: 'ASSETS',
            tabBarIcon: ({ color, size }) => <Globe color={color} size={size} />
          }}
        />
        <Tab.Screen 
          name="Command" 
          component={CommandScreen} 
          options={{
            tabBarLabel: 'COMMAND',
            tabBarIcon: ({ color, size }) => <Terminal color={color} size={size} />
          }}
        />
        <Tab.Screen 
          name="Nodes" 
          component={NodesScreen} 
          options={{
            tabBarLabel: 'NODES',
            tabBarIcon: ({ color, size }) => <Database color={color} size={size} />
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
