import { StyleSheet, TextInput, type TextInputProps } from 'react-native'
import { colors, radii, space } from '@wms/theme'

export function Input({ style, placeholderTextColor, ...rest }: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={placeholderTextColor ?? colors.textMuted}
      style={[styles.input, style]}
      {...rest}
    />
  )
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
})
