import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { colors, space } from '@wms/theme'
import { subscribeApiMutations } from '../../services/apiActivity'

export function GlobalApiBusyOverlay() {
  const [count, setCount] = useState(0)

  useEffect(() => subscribeApiMutations(setCount), [])

  if (count <= 0) return null

  return (
    <View style={styles.root} pointerEvents="auto">
      <View style={styles.box}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.text}>Processando...</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  box: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  text: { color: colors.text, fontWeight: '600' },
})
