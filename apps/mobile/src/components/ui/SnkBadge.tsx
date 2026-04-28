import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { colors, radii } from '@wms/theme'

export type SnkBadgeProps = {
  label: string
  /** Cor de fundo; padrão `colors.primary`. */
  color?: string
  /** Cor do texto; padrão branco em fundos escuros. */
  textColor?: string
  style?: StyleProp<ViewStyle>
}

export function SnkBadge({ label, color = colors.primary, textColor = '#fff', style }: SnkBadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: color }, style]}>
      <Text style={[styles.badgeText, { color: textColor }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.sm,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
})
