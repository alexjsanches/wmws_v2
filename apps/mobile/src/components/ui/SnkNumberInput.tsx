import { useCallback, useEffect, useRef, useState } from 'react'
import {
  StyleSheet,
  TextInput,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
} from 'react-native'
import { colors, radii, space } from '@wms/theme'

export type SnkNumberInputProps = {
  value: string
  onChangeValue: (value: string) => void
  precision?: number
  enabled?: boolean
  placeholder?: string
  keyboardType?: TextInputProps['keyboardType']
  onBlur?: () => void
  onFocus?: () => void
  style?: StyleProp<TextStyle>
}

const DECIMAL_SEPARATOR = ','
const THOUSAND_SEPARATOR = '.'

/** Valor normalizado (ponto decimal) → apenas dígitos para o motor de formatação. */
function valueToDigits(value: string, precision: number): string {
  const t = String(value ?? '').trim()
  if (!t) return ''
  const n = Number(t.replace(',', '.'))
  if (!Number.isFinite(n)) return ''
  const scaled = Math.round(Math.abs(n) * 10 ** precision)
  return String(scaled)
}

function formatSnkNumberDigits(raw: string, precision: number): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''

  if (precision === 0) {
    return Number(digits).toLocaleString('pt-BR')
  }

  const padded = digits.padStart(precision + 1, '0')
  const intPart = padded.slice(0, padded.length - precision)
  const decPart = padded.slice(padded.length - precision)
  const intFormatted = Number(intPart).toLocaleString('pt-BR')
  return `${intFormatted}${DECIMAL_SEPARATOR}${decPart}`
}

function parseSnkNumberFormatted(formatted: string, precision: number): number {
  if (!String(formatted).trim()) return 0
  const clean = formatted
    .replace(new RegExp(`\\${THOUSAND_SEPARATOR}`, 'g'), '')
    .replace(DECIMAL_SEPARATOR, '.')
  const n = parseFloat(clean)
  return Number.isFinite(n) ? n : 0
}

export function SnkNumberInput({
  value,
  onChangeValue,
  precision = 0,
  enabled = true,
  placeholder,
  keyboardType = 'numeric',
  onBlur,
  onFocus,
  style,
}: SnkNumberInputProps) {
  const rawRef = useRef(valueToDigits(value, precision))
  const focusedRef = useRef(false)
  const [displayValue, setDisplayValue] = useState(() =>
    rawRef.current ? formatSnkNumberDigits(rawRef.current, precision) : '',
  )

  useEffect(() => {
    if (focusedRef.current) return
    const digits = valueToDigits(value, precision)
    rawRef.current = digits
    setDisplayValue(digits ? formatSnkNumberDigits(digits, precision) : '')
  }, [value, precision])

  const handleChangeText = useCallback(
    (text: string) => {
      const digits = text.replace(/\D/g, '')
      rawRef.current = digits
      const formatted = formatSnkNumberDigits(digits, precision)
      setDisplayValue(formatted)
      const numeric = parseSnkNumberFormatted(formatted, precision)
      onChangeValue(digits ? String(numeric) : '')
    },
    [precision, onChangeValue],
  )

  const handleFocus = useCallback(() => {
    focusedRef.current = true
    setDisplayValue(rawRef.current)
    onFocus?.()
  }, [onFocus])

  const handleBlur = useCallback(() => {
    focusedRef.current = false
    const formatted = formatSnkNumberDigits(rawRef.current, precision)
    setDisplayValue(formatted)
    onBlur?.()
  }, [precision, onBlur])

  return (
    <TextInput
      value={displayValue}
      onChangeText={handleChangeText}
      onFocus={handleFocus}
      onBlur={handleBlur}
      editable={enabled}
      keyboardType={keyboardType}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      style={[styles.input, !enabled && styles.inputDisabled, style]}
      textAlign="right"
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
    backgroundColor: colors.surface,
  },
  inputDisabled: {
    backgroundColor: colors.background,
    opacity: 0.6,
  },
})
