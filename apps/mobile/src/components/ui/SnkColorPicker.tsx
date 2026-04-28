import { useCallback, useEffect, useState } from 'react'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { colors, radii, space } from '@wms/theme'

const DEFAULT_COLORS = [
  '#000000',
  '#333333',
  '#666666',
  '#999999',
  '#CCCCCC',
  '#FFFFFF',
  '#FF0000',
  '#00FF00',
  '#0000FF',
  '#FFFF00',
  '#00FFFF',
  '#FF00FF',
  '#FF3333',
  '#33FF33',
  '#3333FF',
  '#FFFF33',
  '#33FFFF',
  '#FF33FF',
  '#CC0000',
  '#00CC00',
  '#0000CC',
  '#CCCC00',
  '#00CCCC',
  '#CC00CC',
  '#990000',
  '#009900',
  '#000099',
  '#999900',
  '#009999',
  '#990099',
]

/** RRGGBB sem `#`, uppercase. */
export function normalizeHexKey(raw: string | undefined): string | undefined {
  if (raw == null || !String(raw).trim()) return undefined
  let t = String(raw).trim().toUpperCase()
  if (t.startsWith('#')) t = t.slice(1)
  if (t.startsWith('0X')) t = t.slice(2)
  if (!/^[0-9A-F]{6}$/.test(t)) return undefined
  return t
}

function toCssColor(hexKey: string | undefined): string | undefined {
  const k = normalizeHexKey(hexKey)
  return k ? `#${k}` : undefined
}

function paletteEntryToCss(c: string): string {
  const t = c.trim()
  if (t.toLowerCase().startsWith('0x')) {
    const rest = t.slice(2)
    return `#${rest.length >= 6 ? rest.slice(0, 6) : rest}`
  }
  return t.startsWith('#') ? t : `#${t}`
}

export type SnkColorPickerProps = {
  value: string | undefined
  onChangeValue: (color: string | undefined) => void
  enabled?: boolean
  dataProvider?: string[]
  squareMode?: boolean
  allowClear?: boolean
}

const SWATCH_SIZE = 28

export function SnkColorPicker({
  value,
  onChangeValue,
  enabled = true,
  dataProvider,
  squareMode = false,
  allowClear = true,
}: SnkColorPickerProps) {
  const [open, setOpen] = useState(false)
  const [inputHex, setInputHex] = useState('')

  const palette = dataProvider ?? DEFAULT_COLORS
  const displayCss = toCssColor(value)
  const valueKey = normalizeHexKey(value)

  useEffect(() => {
    if (open) {
      setInputHex(valueKey ?? '')
    }
  }, [open, valueKey])

  const handleOpen = useCallback(() => {
    if (!enabled) return
    setOpen(true)
  }, [enabled])

  const handleSelect = useCallback(
    (color: string) => {
      const css = paletteEntryToCss(color)
      const key = normalizeHexKey(css)
      if (key) onChangeValue(key)
      setOpen(false)
    },
    [onChangeValue],
  )

  const handleClear = useCallback(() => {
    onChangeValue(undefined)
    setOpen(false)
  }, [onChangeValue])

  const handleInputConfirm = useCallback(() => {
    const key = normalizeHexKey(inputHex)
    if (key) {
      onChangeValue(key)
      setOpen(false)
    }
  }, [inputHex, onChangeValue])

  const previewStyle = [
    styles.preview,
    squareMode ? styles.square : styles.circle,
    displayCss ? { backgroundColor: displayCss } : styles.empty,
  ]

  return (
    <>
      <Pressable
        onPress={handleOpen}
        disabled={!enabled}
        accessibilityRole="button"
        accessibilityLabel={displayCss ? `Cor ${displayCss}` : 'Selecionar cor'}
        style={({ pressed }) => [styles.trigger, !enabled && styles.triggerDisabled, pressed && enabled && styles.triggerPressed]}
      >
        <View style={previewStyle} />
        <Text style={[styles.hex, !enabled && styles.disabled]} numberOfLines={1}>
          {displayCss ?? 'Selecionar'}
        </Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.title}>Selecione uma cor</Text>

            <ScrollView
              contentContainerStyle={styles.palette}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {palette.map((color, i) => {
                const css = paletteEntryToCss(color)
                const key = normalizeHexKey(css)
                const selected = key != null && key === valueKey
                return (
                  <Pressable
                    key={`${css}-${i}`}
                    onPress={() => handleSelect(css)}
                    accessibilityRole="button"
                    accessibilityLabel={`Cor ${css}`}
                    style={[
                      styles.swatch,
                      { backgroundColor: css },
                      selected && styles.swatchSelected,
                    ]}
                  />
                )
              })}
            </ScrollView>

            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>#</Text>
              <TextInput
                value={inputHex}
                onChangeText={(t) => setInputHex(t.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6))}
                onSubmitEditing={handleInputConfirm}
                placeholder="RRGGBB"
                placeholderTextColor={colors.textMuted}
                maxLength={6}
                autoCapitalize="characters"
                style={styles.hexInput}
              />
              <Pressable onPress={handleInputConfirm} style={styles.confirmBtn}>
                <Text style={styles.confirmText}>OK</Text>
              </Pressable>
            </View>

            {allowClear ? (
              <Pressable onPress={handleClear} style={styles.clearBtn}>
                <Text style={styles.clearText}>Limpar cor</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    backgroundColor: colors.surface,
    alignSelf: 'stretch',
  },
  triggerDisabled: { opacity: 0.5 },
  triggerPressed: { opacity: 0.85 },
  preview: { width: 24, height: 24 },
  circle: { borderRadius: 12 },
  square: { borderRadius: radii.sm },
  empty: { backgroundColor: colors.border },
  hex: { flex: 1, fontSize: 14, color: colors.text },
  disabled: { opacity: 0.5 },
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: space.md,
    width: 320,
    maxWidth: '92%',
    gap: space.sm,
    zIndex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  palette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
  },
  swatchSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    marginTop: space.xs,
  },
  inputLabel: { fontSize: 16, color: colors.text },
  hexInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: space.sm,
    paddingVertical: 6,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingHorizontal: space.md,
    paddingVertical: 6,
  },
  confirmText: { color: '#fff', fontWeight: '600' },
  clearBtn: { alignItems: 'center', paddingVertical: space.xs },
  clearText: { fontSize: 13, color: colors.danger, fontWeight: '600' },
})
