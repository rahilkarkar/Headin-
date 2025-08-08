import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

// Import main tab screens
import HomeScreen from '../screens/home/HomeScreen';
import EventFeedScreen from '../screens/events/EventFeedScreen';
import PostEventScreen from '../screens/events/PostEventScreen';
import MapScreen from '../screens/map/MapScreen';
import SocialScreen from '../screens/social/SocialScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Import modal/detail screens
import CommentsScreen from '../screens/events/CommentsScreen';
import SavedEventsScreen from '../screens/events/SavedEventsScreen';
import NotificationsScreen from '../screens/profile/NotificationsScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import FollowListScreen from '../screens/profile/FollowListScreen';
import UserProfileScreen from '../screens/profile/UserProfileScreen';
import SplashScreen from '../screens/auth/SplashScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Tab Navigator Component
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Events') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Post') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Social') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          paddingTop: 8,
          paddingBottom: 8,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: theme.typography.fontSize.xs,
          fontWeight: theme.typography.fontWeight.medium,
          marginTop: 4,
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        headerTitleStyle: {
          color: theme.colors.text,
          fontSize: theme.typography.fontSize.xl,
          fontWeight: theme.typography.fontWeight.bold,
        },
        headerTintColor: theme.colors.primary,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: 'Headin\'',
          headerTitleStyle: {
            color: theme.colors.primary,
            fontSize: theme.typography.fontSize['2xl'],
            fontWeight: theme.typography.fontWeight.black,
            textShadowColor: theme.colors.primary,
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 8,
          }
        }}
      />
      <Tab.Screen 
        name="Events" 
        component={EventFeedScreen}
        options={{
          title: 'Events',
        }}
      />
      <Tab.Screen 
        name="Post" 
        component={PostEventScreen}
        options={{
          title: 'Create Event',
        }}
      />
      <Tab.Screen 
        name="Social" 
        component={SocialScreen}
        options={{
          title: 'Social',
        }}
      />
      <Tab.Screen 
        name="Map" 
        component={MapScreen}
        options={{
          title: 'Event Map',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

// Main App Navigator with Stack
export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        headerTitleStyle: {
          color: theme.colors.text,
          fontSize: theme.typography.fontSize.xl,
          fontWeight: theme.typography.fontWeight.bold,
        },
        headerTintColor: theme.colors.primary,
      }}
    >
      {/* Main tab navigator */}
      <Stack.Screen 
        name="MainTabs" 
        component={TabNavigator} 
        options={{ headerShown: false }} 
      />
      
      {/* Modal/Detail screens */}
      <Stack.Screen 
        name="Comments" 
        component={CommentsScreen}
        options={{
          title: 'Comments',
          headerBackTitleVisible: false,
        }}
      />
      
      <Stack.Screen 
        name="SavedEvents" 
        component={SavedEventsScreen}
        options={{
          title: 'Saved Events',
          headerBackTitleVisible: false,
        }}
      />
      
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{
          title: 'Notifications',
          headerBackTitleVisible: false,
        }}
      />
      
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{
          title: 'Edit Profile',
          headerBackTitleVisible: false,
        }}
      />
      
      <Stack.Screen 
        name="FollowList" 
        component={FollowListScreen}
        options={({ route }) => ({
          title: route.params?.title || 'Follow List',
          headerBackTitleVisible: false,
        })}
      />
      
      <Stack.Screen 
        name="UserProfile" 
        component={UserProfileScreen}
        options={{
          title: 'Profile',
          headerBackTitleVisible: false,
        }}
      />
      
      {/* Test Splash Screen - only in development */}
      {__DEV__ && (
        <Stack.Screen 
          name="TestSplash" 
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        >
          {({ navigation }) => (
            <SplashScreen onComplete={() => navigation.goBack()} />
          )}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}