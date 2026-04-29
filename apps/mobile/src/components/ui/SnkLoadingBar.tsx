import { useEffect, useRef, useState } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'
import { colors } from '@wms/theme'

export type SnkLoadingBarProps = {
  loading: boolean
  mode?: 'determinate' | 'indeterminate'
}

/**
 * Barra fina no topo (equivalente conceitual ao interceptor HTTP / loading-bar do Sankhya).
 * Não anima “fechar” na montagem com `loading === false`.
 */
export function SnkLoadingBar({ loading, mode = 'determinate' }: SnkLoadingBarProps) {
  const progress = useRef(new Animated.Value(0)).current
  const opacity = useRef(new Animated.Value(0)).current
  const runner = useRef(new Animated.Value(0)).current
  const loopRef = useRef<Animated.CompositeAnimation | null>(null)
  const [trackWidth, setTrackWidth] = useState(0)
  const wasLoadingRef = useRef(false)

  useEffect(() => {
    progress.stopAnimation()
    opacity.stopAnimation()
    runner.stopAnimation()
    loopRef.current?.stop()
    loopRef.current = null

    if (mode === 'indeterminate') {
      if (loading) {
        opacity.setValue(1)
        runner.setValue(0)
        const loop = Animated.loop(
          Animated.timing(runner, {
            toValue: 1,
            duration: 900,
            easing: Easing.linear,
            // JS driver evita conflito com estilos de largura nesta mesma view.
            useNativeDriver: false,
          }),
        )
        loopRef.current = loop
        loop.start()
      } else {
        opacity.setValue(0)
        runner.setValue(0)
      }
      wasLoadingRef.current = loading
      return () => {
        progress.stopAnimation()
        opacity.stopAnimation()
        runner.stopAnimation()
        loopRef.current?.stop()
      }
    }

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

  const indeterminateSegmentWidth = Math.max(trackWidth * 0.35, 40)
  const indeterminateTranslateX = runner.interpolate({
    inputRange: [0, 1],
    outputRange: [-indeterminateSegmentWidth, trackWidth],
  })

  return (
    <View
      style={styles.track}
      pointerEvents="box-none"
      onLayout={(evt) => setTrackWidth(evt.nativeEvent.layout.width)}
    >
      {mode === 'indeterminate' ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.bar,
            {
              width: indeterminateSegmentWidth,
              opacity,
              transform: [{ translateX: indeterminateTranslateX }],
            },
          ]}
        />
      ) : (
        <Animated.View pointerEvents="none" style={[styles.bar, { width, opacity }]} />
      )}
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
