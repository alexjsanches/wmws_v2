import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { colors, radii, space } from '@wms/theme'

export type SnkColumnDataType = 'S' | 'I' | 'F' | 'CUR' | 'D' | 'H' | 'T'

export type SnkColumnDef<T extends Record<string, unknown> = Record<string, unknown>> = {
  field: keyof T & string
  header: string
  dataType?: SnkColumnDataType
  width?: number
  align?: 'left' | 'right' | 'center'
  sortable?: boolean
  valueFormatter?: (value: unknown, row: T) => string
}

export type SnkSortDirection = 'asc' | 'desc' | null

export type SnkSortState = {
  field: string
  direction: SnkSortDirection
}

export type SnkTableProps<T extends Record<string, unknown>> = {
  columns: SnkColumnDef<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  loading?: boolean
  emptyText?: string
  selectedKeys?: Set<string>
  enableLongPressSelection?: boolean
  onRowPress?: (row: T) => void
  onRowLongPress?: (row: T) => void
  onSelectionChange?: (keys: Set<string>) => void
  onSortChange?: (sort: SnkSortState) => void
  sortState?: SnkSortState
  minWidth?: number
  zebra?: boolean
  summaryRow?: T | null
  summaryLabel?: string
  summaryLabelColumn?: keyof T & string
  /**
   * `true` = linhas com `map` em vez de `FlatList` — use dentro de `ScrollView` vertical
   * para evitar listas virtualizadas aninhadas.
   */
  embedded?: boolean
  style?: StyleProp<ViewStyle>
}

const DEFAULT_COL_WIDTH = 120
const ROW_HEIGHT = 36

function formatCell(value: unknown, dataType?: SnkColumnDataType): string {
  if (value === undefined || value === null || value === '') return ''

  switch (dataType) {
    case 'I':
      return String(value)
    case 'F':
    case 'CUR': {
      const n = Number(value)
      return Number.isNaN(n) ? String(value) : n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
    case 'D': {
      if (value instanceof Date) {
        return value.toLocaleDateString('pt-BR')
      }
      const d = new Date(String(value))
      return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('pt-BR')
    }
    case 'H': {
      if (value instanceof Date) {
        return value.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
      }
      const dt = new Date(String(value))
      return Number.isNaN(dt.getTime())
        ? String(value)
        : dt.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    }
    case 'T': {
      const t = String(value).padStart(4, '0')
      return `${t.slice(0, 2)}:${t.slice(2)}`
    }
    default:
      return String(value)
  }
}

function resolveAlign<T extends Record<string, unknown>>(col: SnkColumnDef<T>): 'left' | 'right' | 'center' {
  if (col.align) return col.align
  if (col.dataType === 'I' || col.dataType === 'F' || col.dataType === 'CUR') return 'right'
  if (col.dataType === 'D' || col.dataType === 'H' || col.dataType === 'T') return 'center'
  return 'left'
}

type HeaderCellProps<T extends Record<string, unknown>> = {
  col: SnkColumnDef<T>
  sort: SnkSortState | undefined
  onPress: () => void
  width: number
}

function HeaderCell<T extends Record<string, unknown>>({ col, sort, onPress, width }: HeaderCellProps<T>) {
  const align = resolveAlign(col)
  const isSorted = sort?.field === col.field
  const iconName: keyof typeof MaterialCommunityIcons.glyphMap =
    isSorted && sort?.direction === 'asc'
      ? 'sort-ascending'
      : isSorted && sort?.direction === 'desc'
        ? 'sort-descending'
        : 'sort'

  const iconColor = isSorted ? colors.primary : colors.textMuted
  const sortable = col.sortable !== false

  return (
    <Pressable
      onPress={sortable ? onPress : undefined}
      disabled={!sortable}
      style={[styles.headerCell, { width }]}
      accessibilityRole={sortable ? 'button' : 'header'}
    >
      <Text
        style={[
          styles.headerText,
          align === 'right' && styles.headerTextRight,
          align === 'center' && styles.headerTextCenter,
        ]}
        numberOfLines={1}
      >
        {col.header}
      </Text>
      {sortable ? (
        <MaterialCommunityIcons name={iconName} size={13} color={iconColor} style={styles.sortIcon} />
      ) : null}
    </Pressable>
  )
}

type DataCellProps = {
  value: string
  align: 'left' | 'right' | 'center'
  width: number
}

function DataCell({ value, align, width }: DataCellProps) {
  return (
    <View style={[styles.dataCell, { width }]}>
      <Text
        style={[
          styles.cellText,
          align === 'right' && styles.cellTextRight,
          align === 'center' && styles.cellTextCenter,
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  )
}

export function SnkTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyText = 'Nenhum registro encontrado',
  selectedKeys,
  enableLongPressSelection = false,
  onRowPress,
  onRowLongPress,
  onSelectionChange,
  onSortChange,
  sortState,
  minWidth,
  zebra = true,
  summaryRow = null,
  summaryLabel = 'Total',
  summaryLabelColumn,
  embedded = false,
  style,
}: SnkTableProps<T>) {
  const [internalSelected, setInternalSelected] = useState<Set<string>>(() => new Set())
  const [multiSelectActive, setMultiSelectActive] = useState(false)

  const controlled = selectedKeys !== undefined
  const selected = controlled ? selectedKeys : internalSelected

  const updateSelection = useCallback(
    (next: Set<string>) => {
      if (!controlled) {
        setInternalSelected(next)
      }
      onSelectionChange?.(next)
    },
    [controlled, onSelectionChange],
  )

  const handleRowPress = useCallback(
    (row: T) => {
      const key = keyExtractor(row)

      if (multiSelectActive) {
        const next = new Set(selected)
        if (next.has(key)) next.delete(key)
        else next.add(key)
        updateSelection(next)
        return
      }

      onRowPress?.(row)
    },
    [multiSelectActive, selected, keyExtractor, onRowPress, updateSelection],
  )

  const handleRowLongPress = useCallback(
    (row: T) => {
      if (!enableLongPressSelection) {
        onRowLongPress?.(row)
        return
      }
      if (!multiSelectActive) {
        setMultiSelectActive(true)
        const key = keyExtractor(row)
        updateSelection(new Set([key]))
      }
      onRowLongPress?.(row)
    },
    [enableLongPressSelection, multiSelectActive, keyExtractor, onRowLongPress, updateSelection],
  )

  const exitMultiSelect = useCallback(() => {
    setMultiSelectActive(false)
    updateSelection(new Set())
  }, [updateSelection])

  useEffect(() => {
    setMultiSelectActive(false)
    if (!controlled) {
      setInternalSelected(new Set())
    }
  }, [data, controlled])

  const handleSort = useCallback(
    (field: string) => {
      if (!onSortChange) return
      const current = sortState
      let direction: SnkSortDirection = 'asc'
      if (current?.field === field) {
        direction = current.direction === 'asc' ? 'desc' : 'asc'
      }
      onSortChange({ field, direction })
    },
    [sortState, onSortChange],
  )

  const colWidths = useMemo(() => columns.map((col) => col.width ?? DEFAULT_COL_WIDTH), [columns])
  const totalWidth = useMemo(() => colWidths.reduce((a, b) => a + b, 0), [colWidths])
  const tableWidth = useMemo(() => Math.max(totalWidth, minWidth ?? 0), [totalWidth, minWidth])

  const renderRowContent = useCallback(
    (item: T, isSummary = false) => {
      const key = keyExtractor(item)
      const isSelected = selected.has(key)

      return (
        <>
          {multiSelectActive ? (
            <View style={styles.checkWrap}>
              <MaterialCommunityIcons
                name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={18}
                color={isSelected ? colors.primary : colors.textMuted}
              />
            </View>
          ) : null}
          {columns.map((col, i) => {
            const raw = item[col.field]
            const text =
              isSummary && summaryLabelColumn && col.field === summaryLabelColumn
                ? summaryLabel
                : col.valueFormatter
                  ? col.valueFormatter(raw, item)
                  : formatCell(raw, col.dataType)
            return <DataCell key={col.field} value={text} align={resolveAlign(col)} width={colWidths[i]} />
          })}
        </>
      )
    },
    [columns, colWidths, selected, multiSelectActive, keyExtractor, summaryLabel, summaryLabelColumn],
  )

  const renderRow = useCallback<ListRenderItem<T>>(
    ({ item, index }) => {
      const key = keyExtractor(item)
      const isSelected = selected.has(key)
      return (
        <Pressable
          onPress={() => handleRowPress(item)}
          onLongPress={() => handleRowLongPress(item)}
          style={[
            styles.row,
            zebra && (index % 2 === 0 ? styles.rowEven : styles.rowOdd),
            isSelected && styles.rowSelected,
          ]}
          accessibilityRole="button"
        >
          {renderRowContent(item)}
        </Pressable>
      )
    },
    [handleRowLongPress, handleRowPress, keyExtractor, renderRowContent, selected, zebra],
  )

  const ListEmpty = useCallback(
    () => (
      <View style={styles.empty}>
        {loading ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.emptyText}>{emptyText}</Text>}
      </View>
    ),
    [loading, emptyText],
  )

  const headerRow = useMemo(
    () => (
      <View style={[styles.headerRow, { width: tableWidth }]}>
        {multiSelectActive ? <View style={styles.checkWrap} /> : null}
        {columns.map((col, i) => (
          <HeaderCell<T>
            key={col.field}
            col={col}
            sort={sortState}
            onPress={() => handleSort(col.field)}
            width={colWidths[i]}
          />
        ))}
      </View>
    ),
    [columns, colWidths, handleSort, multiSelectActive, sortState, tableWidth],
  )

  const bodyEmbedded = useMemo(
    () =>
      data.map((item, index) => (
        <Pressable
          key={keyExtractor(item)}
          onPress={() => handleRowPress(item)}
          onLongPress={() => handleRowLongPress(item)}
          style={({ pressed }) => [
            styles.row,
            zebra && (index % 2 === 0 ? styles.rowEven : styles.rowOdd),
            selected.has(keyExtractor(item)) && styles.rowSelected,
            pressed && styles.rowPressed,
          ]}
          accessibilityRole="button"
        >
          {renderRowContent(item)}
        </Pressable>
      )),
    [data, handleRowLongPress, handleRowPress, keyExtractor, renderRowContent, selected, zebra],
  )

  return (
    <View style={[styles.container, style]}>
      {multiSelectActive && selected.size > 0 ? (
        <View style={styles.selectionBar}>
          <Text style={styles.selectionText}>{selected.size} selecionado(s)</Text>
          <Pressable onPress={exitMultiSelect} hitSlop={8} accessibilityLabel="Sair da seleção múltipla">
            <MaterialCommunityIcons name="close" size={18} color={colors.text} />
          </Pressable>
        </View>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator nestedScrollEnabled>
        <View style={{ width: tableWidth }}>
          {headerRow}
          {loading && data.length === 0 ? (
            <ListEmpty />
          ) : embedded ? (
            <View>
              {data.length === 0 ? <ListEmpty /> : bodyEmbedded}
              {summaryRow ? (
                <View style={[styles.row, styles.summaryRow]}>
                  {multiSelectActive ? <View style={styles.checkWrap} /> : null}
                  {renderRowContent(summaryRow, true)}
                </View>
              ) : null}
            </View>
          ) : (
            <FlatList
              data={data}
              keyExtractor={keyExtractor}
              renderItem={renderRow}
              ListEmptyComponent={ListEmpty}
              ListFooterComponent={
                summaryRow ? (
                  <View style={[styles.row, styles.summaryRow]}>
                    {multiSelectActive ? <View style={styles.checkWrap} /> : null}
                    {renderRowContent(summaryRow, true)}
                  </View>
                ) : null
              }
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              scrollEventThrottle={16}
            />
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerCell: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.sm,
    height: ROW_HEIGHT,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
  },
  headerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  headerTextRight: { textAlign: 'right' },
  headerTextCenter: { textAlign: 'center' },
  sortIcon: {
    marginLeft: 2,
  },
  row: {
    flexDirection: 'row',
    minHeight: ROW_HEIGHT,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowEven: { backgroundColor: colors.surface },
  rowOdd: { backgroundColor: colors.background },
  rowSelected: {
    backgroundColor: colors.primaryMuted,
  },
  summaryRow: {
    backgroundColor: colors.primaryMuted,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowPressed: { opacity: 0.88 },
  dataCell: {
    justifyContent: 'center',
    paddingHorizontal: space.sm,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
    minHeight: ROW_HEIGHT,
  },
  cellText: {
    fontSize: 13,
    color: colors.text,
  },
  cellTextRight: { textAlign: 'right' },
  cellTextCenter: { textAlign: 'center' },
  checkWrap: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    padding: space.xl,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    backgroundColor: colors.primaryMuted,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  selectionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
})
