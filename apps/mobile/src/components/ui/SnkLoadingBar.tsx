import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import { colors } from '@wms/theme'

export type SnkLoadingBarProps = {
  loading: boolean
}

/**
 * Barra fina no topo (equivalente conceitual ao interceptor HTTP / loading-bar do Sankhya).
 * Não anima “fechar” na montagem com `loading === false`.
 */
export function SnkLoadingBar({ loading }: SnkLoadingBarProps) {
  const progress = useRef(new Animated.Value(0)).current
  const opacity = useRef(new Animated.Value(0)).current
  const wasLoadingRef = useRef(false)

  useEffect(() => {
    progress.stopAnimation()
    opacity.stopAnimation()

    if (loading) {
      progress.setValue(0)
      opacity.setValue(0)
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: false }),
        Animated.timing(progress, { toValue: 0.85, duration: 2000, useNativeDriver: false }),
      ]).start()
    } else if (wasLoadingRef.current) {
      Animated.sequence([
        Animated.timing(progress, { toValue: 1, duration: 200, useNativeDriver: false }),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: false }),
      ]).start(() => {
        progress.setValue(0)
      })
    }

    wasLoadingRef.current = loading

    return () => {
      progress.stopAnimation()
      opacity.stopAnimation()
    }
  }, [loading, progress, opacity])

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  return (
    <View style={styles.track} pointerEvents="box-none">
      <Animated.View pointerEvents="none" style={[styles.bar, { width, opacity }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  track: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    zIndex: 9999,
    backgroundColor: 'transparent',
  },
  bar: {
    height: 3,
    backgroundColor: colors.primary,
  },
})
