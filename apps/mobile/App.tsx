import { NavigationContainer, DefaultTheme } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { colors } from '@wms/theme'
import { AppErrorBoundary } from './src/components/AppErrorBoundary'
import { NotificationBootstrap } from './src/components/NotificationBootstrap'
import { ShutdownScreen } from './src/components/ShutdownScreen'
import { GlobalApiBusyOverlay } from './src/components/ui/GlobalApiBusyOverlay'
import { AuthProvider, useAuth } from './src/context/AuthContext'
import { consumeInitialNotificationNavigation } from './src/navigation/consumeInitialNotificationNavigation'
import { navigationRef } from './src/navigation/navigationRef'
import { MainTabs } from './src/navigation/MainTabs'
import { LoginScreen } from './src/screens/LoginScreen'
import { runAppBootstrap } from './src/services/AppBootstrapService'
import { showUpdatePrompt } from './src/services/UpdatePromptService'

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
}

export default function App() {
  const [shutdownState, setShutdownState] = useState<{ active: boolean; message?: string }>({ active: false })

  useEffect(() => {
    void runAppBootstrap().then((result) => {
      setShutdownState({ active: result.shutdown, message: result.shutdownMessage })
      if (result.updateAvailable && result.downloadUrl) {
        showUpdatePrompt({
          mandatory: result.mandatory,
          latestVersion: result.latestVersion,
          changelog: result.changelog,
          downloadUrl: result.downloadUrl,
        })
      }
    })
  }, [])

  if (shutdownState.active) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <ShutdownScreen message={shutdownState.message} />
      </SafeAreaProvider>
    )
  }

  return (
    <AppErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <Root />
        </AuthProvider>
      </SafeAreaProvider>
    </AppErrorBoundary>
  )
}

function Root() {
  const { loading, isAuthenticated } = useAuth()

  if (loading) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (!isAuthenticated) {
    return (
      <>
        <StatusBar style="dark" />
        <LoginScreen />
      </>
    )
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navTheme}
      onReady={() => {
        void consumeInitialNotificationNavigation()
      }}
    >
      <StatusBar style="dark" />
      <NotificationBootstrap />
      <MainTabs />
      <GlobalApiBusyOverlay />
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
})
