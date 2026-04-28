import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { colors, space } from '@wms/theme'

export type SnkLoadingOverlayProps = {
  visible: boolean
  /** Texto abaixo do spinner; omitir ou `''` para só o indicador. */
  label?: string
}

export function SnkLoadingOverlay({ visible, label = 'Carregando...' }: SnkLoadingOverlayProps) {
  if (!visible) return null

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <View style={styles.box}>
        <ActivityIndicator size="large" color={colors.primary} />
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9998,
  },
  box: {
    alignItems: 'center',
    gap: space.sm,
  },
  label: {
    fontSize: 14,
    color: colors.textMuted,
  },
})
