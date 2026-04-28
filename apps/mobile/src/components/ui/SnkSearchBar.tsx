import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useCallback, useRef } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'
import { colors, radii, space } from '@wms/theme'

export type SnkSearchBarProps = {
  value: string
  onChangeValue: (text: string) => void
  placeholder?: string
  onSubmit?: () => void
  onFilterPress?: () => void
  hasActiveFilters?: boolean
  enabled?: boolean
}

export function SnkSearchBar({
  value,
  onChangeValue,
  placeholder = 'Pesquisar…',
  onSubmit,
  onFilterPress,
  hasActiveFilters = false,
  enabled = true,
}: SnkSearchBarProps) {
  const inputRef = useRef<TextInput>(null)

  const handleClear = useCallback(() => {
    onChangeValue('')
    inputRef.current?.focus()
  }, [onChangeValue])

  return (
    <View style={styles.wrap}>
      <View style={[styles.inputWrap, !enabled && styles.inputWrapDisabled]}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} style={styles.searchIcon} />

        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeValue}
          onSubmitEditing={onSubmit}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          editable={enabled}
          returnKeyType="search"
          style={styles.input}
        />

        {value.length > 0 ? (
          <Pressable onPress={handleClear} hitSlop={8} style={styles.clearBtn} accessibilityLabel="Limpar pesquisa">
            <MaterialCommunityIcons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {onFilterPress ? (
        <Pressable
          onPress={onFilterPress}
          disabled={!enabled}
          style={({ pressed }) => [
            styles.filterBtn,
            hasActiveFilters && styles.filterBtnActive,
            pressed && enabled && styles.filterBtnPressed,
          ]}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel="Filtros"
          accessibilityState={{ selected: hasActiveFilters }}
        >
          <MaterialCommunityIcons
            name="filter-variant"
            size={22}
            color={hasActiveFilters ? colors.primary : colors.textMuted}
          />
          {hasActiveFilters ? <View style={styles.filterDot} pointerEvents="none" /> : null}
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: space.sm,
    minHeight: 44,
  },
  inputWrapDisabled: { opacity: 0.55 },
  searchIcon: { marginRight: 4 },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: space.sm,
  },
  clearBtn: {
    paddingLeft: space.xs,
    justifyContent: 'center',
  },
  filterBtn: {
    padding: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    position: 'relative',
  },
  filterBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  filterBtnPressed: { opacity: 0.85 },
  filterDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
})
