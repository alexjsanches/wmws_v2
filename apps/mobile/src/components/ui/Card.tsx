import type { ReactNode } from 'react'
import { Pressable, StyleSheet, View, type ViewProps } from 'react-native'
import { colors, radii, space } from '@wms/theme'

type CardProps = ViewProps & {
  children: ReactNode
  /** Se definido, o cartão inteiro fica clicável (como no mockup web). */
  onPress?: () => void
}

export function Card({ children, style, onPress, ...rest }: CardProps) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
        {...rest}
      >
        {children}
      </Pressable>
    )
  }
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
  },
  pressed: { opacity: 0.92 },
})
