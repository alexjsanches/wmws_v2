import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { View } from 'react-native'
import { colors, radii } from '@wms/theme'
import { AddArticleScreen } from '../screens/AddArticleScreen'
import { ProfileScreen } from '../screens/ProfileScreen'
import { ScannerScreen } from '../screens/ScannerScreen'
import { FerramentasStackNavigator } from './FerramentasStack'
import { HomeStackNavigator } from './HomeStack'
import type { MainTabParamList } from './types'

const Tab = createBottomTabNavigator<MainTabParamList>()

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingTop: 6,
          paddingBottom: 8,
          height: 62,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          title: 'Início',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} name="home" color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Ferramentas"
        component={FerramentasStackNavigator}
        options={{
          title: 'Ferramentas',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} name="toolbox-outline" color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Adicionar"
        component={AddArticleScreen}
        options={{
          title: 'Adicionar',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} name="plus-circle-outline" color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{
          title: 'Scanner',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} name="barcode-scan" color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} name="account-outline" color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  )
}

function TabIcon({
  name,
  color,
  focused,
}: {
  name: keyof typeof MaterialCommunityIcons.glyphMap
  color: string
  focused: boolean
}) {
  const icon = <MaterialCommunityIcons name={name} size={22} color={color} />
  if (!focused) {
    return icon
  }
  return (
    <View
      style={{
        backgroundColor: colors.tabActiveBg,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radii.md,
      }}
    >
      {icon}
    </View>
  )
}
