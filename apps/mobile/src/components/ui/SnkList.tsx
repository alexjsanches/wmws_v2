import type { ReactNode } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
  type ListRenderItem,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { colors } from '@wms/theme'

export type SnkListProps<T> = {
  data: T[]
  keyExtractor: (item: T) => string
  renderItem: (item: T, selected: boolean) => ReactNode
  onSelectionChange?: (selected: T[]) => void
  /** Tap no item (navegação / ação), independentemente da seleção. */
  onItemPress?: (item: T) => void
  /** Com `true`, tap alterna item (equivalente a Ctrl+clique); long press entre dois itens seleciona o intervalo (Shift+clique). */
  multipleSelection?: boolean
  /**
   * `true` = renderiza `View` + `map` em vez de `FlatList` — use dentro de `ScrollView` vertical
   * para evitar o aviso “VirtualizedLists should never be nested inside plain ScrollViews”.
   */
  embedded?: boolean
  style?: StyleProp<ViewStyle>
  contentContainerStyle?: StyleProp<ViewStyle>
}

export function SnkList<T>({
  data,
  keyExtractor,
  renderItem,
  onSelectionChange,
  onItemPress,
  multipleSelection = false,
  embedded = false,
  style,
  contentContainerStyle,
}: SnkListProps<T>) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set())
  const lastPressedRef = useRef<string | null>(null)
  const skipNotifyRef = useRef(true)

  const notifySelection = useCallback(
    (keys: Set<string>) => {
      const selected = data.filter((i) => keys.has(keyExtractor(i)))
      onSelectionChange?.(selected)
    },
    [data, keyExtractor, onSelectionChange],
  )

  useEffect(() => {
    if (skipNotifyRef.current) {
      skipNotifyRef.current = false
      return
    }
    notifySelection(selectedKeys)
  }, [selectedKeys, notifySelection])

  const handlePress = useCallback(
    (item: T) => {
      const key = keyExtractor(item)
      lastPressedRef.current = key

      setSelectedKeys((prev) => {
        const next = new Set(prev)
        if (multipleSelection) {
          if (next.has(key)) next.delete(key)
          else next.add(key)
        } else {
          next.clear()
          next.add(key)
        }
        return next
      })

      onItemPress?.(item)
    },
    [keyExtractor, multipleSelection, onItemPress],
  )

  const handleLongPress = useCallback(
    (item: T) => {
      if (!multipleSelection) return
      const key = keyExtractor(item)
      const last = lastPressedRef.current
      if (!last || last === key) {
        handlePress(item)
        return
      }
      const i0 = data.findIndex((i) => keyExtractor(i) === last)
      const i1 = data.findIndex((i) => keyExtractor(i) === key)
      if (i0 < 0 || i1 < 0) {
        handlePress(item)
        return
      }
      const [a, b] = i0 <= i1 ? [i0, i1] : [i1, i0]
      lastPressedRef.current = key

      setSelectedKeys((prev) => {
        const next = new Set(prev)
        for (let i = a; i <= b; i++) {
          next.add(keyExtractor(data[i] as T))
        }
        return next
      })
    },
    [data, keyExtractor, multipleSelection, handlePress],
  )

  const listRender: ListRenderItem<T> = useCallback(
    ({ item }) => {
      const key = keyExtractor(item)
      const selected = selectedKeys.has(key)
      return (
        <Pressable
          accessibilityRole="button"
          onPress={() => handlePress(item)}
          onLongPress={() => handleLongPress(item)}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        >
          {renderItem(item, selected)}
        </Pressable>
      )
    },
    [handleLongPress, handlePress, keyExtractor, renderItem, selectedKeys],
  )

  const renderRow = useCallback(
    (item: T) => {
      const key = keyExtractor(item)
      const selected = selectedKeys.has(key)
      return (
        <Pressable
          key={key}
          accessibilityRole="button"
          onPress={() => handlePress(item)}
          onLongPress={() => handleLongPress(item)}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        >
          {renderItem(item, selected)}
        </Pressable>
      )
    },
    [handleLongPress, handlePress, keyExtractor, renderItem, selectedKeys],
  )

  if (embedded) {
    return (
      <View style={[style, contentContainerStyle]}>
        {data.map((item) => renderRow(item))}
      </View>
    )
  }

  return (
    <FlatList
      data={data}
      keyExtractor={keyExtractor}
      renderItem={listRender}
      extraData={selectedKeys}
      style={style}
      contentContainerStyle={contentContainerStyle}
    />
  )
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surface,
  },
  rowPressed: { opacity: 0.85 },
})
