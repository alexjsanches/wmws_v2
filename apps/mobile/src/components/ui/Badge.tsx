import { StyleSheet, Text, View, type TextProps, type ViewStyle } from 'react-native'
import { colors, radii, space } from '@wms/theme'

type Tone = 'success' | 'warning' | 'danger' | 'muted'

const toneMap: Record<Tone, { bg: string; fg: string }> = {
  success: { bg: colors.successMuted, fg: '#166534' },
  warning: { bg: colors.warningMuted, fg: '#92400E' },
  danger: { bg: colors.dangerMuted, fg: '#991B1B' },
  muted: { bg: '#F3F4F6', fg: colors.textMuted },
}

type BadgeProps = Omit<TextProps, 'style'> & {
  tone?: Tone
  style?: ViewStyle
}

export function Badge({ children, tone = 'muted', style, ...rest }: BadgeProps) {
  const t = toneMap[tone]
  return (
    <View style={[styles.wrap, { backgroundColor: t.bg }, style]}>
      <Text style={[styles.text, { color: t.fg }]} {...rest}>
        {children}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
    paddingHorizontal: space.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  text: { fontSize: 12, fontWeight: '600' },
})
