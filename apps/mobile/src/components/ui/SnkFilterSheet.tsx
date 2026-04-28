import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { colors, radii, space } from '@wms/theme'
import { Input } from './Input'
import { SnkCheckboxList, type SnkCheckboxOption } from './SnkCheckboxList'
import { SnkDatePeriodInput, type DatePeriod } from './SnkDatePeriodInput'

export type SnkFilterFieldType = 'text' | 'options' | 'date_period'

export type SnkFilterField = {
  key: string
  label: string
  type: SnkFilterFieldType
  options?: SnkCheckboxOption[]
  placeholder?: string
}

export type SnkFilterValues = Record<string, unknown>

export function snkFilterValueIsEmpty(v: unknown): boolean {
  if (v === undefined || v === null) return true
  if (typeof v === 'string') return v.trim() === ''
  if (Array.isArray(v)) return v.length === 0
  if (typeof v === 'object' && v !== null && 'dtIni' in v && 'dtFin' in v) {
    const p = v as DatePeriod
    return p.dtIni == null && p.dtFin == null
  }
  return false
}

export function snkFilterValuesHaveActive(values: SnkFilterValues): boolean {
  return Object.values(values).some((v) => !snkFilterValueIsEmpty(v))
}

export type SnkFilterSheetProps = {
  visible: boolean
  onClose: () => void
  fields: SnkFilterField[]
  values: SnkFilterValues
  onApply: (values: SnkFilterValues) => void
  onClear: () => void
}

function shallowCopyValues(v: SnkFilterValues): SnkFilterValues {
  const out: SnkFilterValues = {}
  for (const k of Object.keys(v)) {
    const val = v[k]
    if (val != null && typeof val === 'object' && !Array.isArray(val) && 'dtIni' in val) {
      const p = val as DatePeriod
      out[k] = { dtIni: p.dtIni, dtFin: p.dtFin }
    } else if (Array.isArray(val)) {
      out[k] = [...val]
    } else {
      out[k] = val
    }
  }
  return out
}

export function SnkFilterSheet({
  visible,
  onClose,
  fields,
  values,
  onApply,
  onClear,
}: SnkFilterSheetProps) {
  const [draft, setDraft] = useState<SnkFilterValues>(() => shallowCopyValues(values))

  useEffect(() => {
    if (visible) {
      setDraft(shallowCopyValues(values))
    }
  }, [visible, values])

  const handleChange = useCallback((key: string, value: unknown) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleApply = useCallback(() => {
    onApply(shallowCopyValues(draft))
    onClose()
  }, [draft, onApply, onClose])

  const handleClear = useCallback(() => {
    setDraft({})
    onClear()
    onClose()
  }, [onClear, onClose])

  const activeCount = useMemo(
    () => Object.values(draft).filter((v) => !snkFilterValueIsEmpty(v)).length,
    [draft],
  )

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissArea} onPress={onClose} accessibilityLabel="Fechar filtros" />
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <Text style={styles.title}>Filtros{activeCount > 0 ? ` (${activeCount})` : ''}</Text>
            <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Fechar">
              <MaterialCommunityIcons name="close" size={22} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentInner}
            keyboardShouldPersistTaps="handled"
          >
            {fields.map((field) => (
              <View key={field.key} style={styles.fieldWrap}>
                {field.type === 'options' && field.options ? (
                  <>
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                    <SnkCheckboxList
                      embedded
                      options={field.options}
                      selected={(draft[field.key] as Array<string | number>) ?? []}
                      onChangeSelected={(v) => handleChange(field.key, v)}
                    />
                  </>
                ) : field.type === 'date_period' ? (
                  <>
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                    <SnkDatePeriodInput
                      value={
                        (draft[field.key] as DatePeriod) ?? {
                          dtIni: undefined,
                          dtFin: undefined,
                        }
                      }
                      onChangeValue={(v) => handleChange(field.key, v)}
                    />
                  </>
                ) : field.type === 'text' ? (
                  <>
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                    <Input
                      value={String(draft[field.key] ?? '')}
                      onChangeText={(t) => handleChange(field.key, t)}
                      placeholder={field.placeholder}
                      returnKeyType="done"
                    />
                  </>
                ) : null}
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable onPress={handleClear} style={styles.btnClear} accessibilityRole="button">
              <Text style={styles.btnClearText}>Limpar</Text>
            </Pressable>
            <Pressable onPress={handleApply} style={styles.btnApply} accessibilityRole="button">
              <Text style={styles.btnApplyText}>Aplicar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.md,
    borderTopRightRadius: radii.md,
    maxHeight: '80%',
    paddingBottom: space.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  content: {},
  contentInner: {
    padding: space.md,
    gap: space.lg,
    paddingBottom: space.xl,
  },
  fieldWrap: { gap: space.xs },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingTop: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  btnClear: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingVertical: space.sm,
    alignItems: 'center',
  },
  btnClearText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
  },
  btnApply: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingVertical: space.sm,
    alignItems: 'center',
  },
  btnApplyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
})
