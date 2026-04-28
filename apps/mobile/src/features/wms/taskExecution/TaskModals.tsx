import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, space } from '@wms/theme'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import type { ItemTarefaWms } from '../../../types/wms'
import { statusLabel } from './domain'
import { BaseActionModal } from '../ui/BaseActionModal'

type ItemPickerModalProps = {
  visible: boolean
  items: ItemTarefaWms[]
  onPick: (nuitem: number) => void
  onClose: () => void
}

export function ItemPickerModal({ visible, items, onPick, onClose }: ItemPickerModalProps) {
  return (
    <BaseActionModal
      visible={visible}
      title="Escolha outro item"
      onClose={onClose}
      footer={
        <Button variant="outline" onPress={onClose}>
          Fechar
        </Button>
      }
    >
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.nuitem)}
        contentContainerStyle={{ paddingTop: space.sm }}
        renderItem={({ item }) => (
          <Pressable onPress={() => onPick(item.nuitem)} style={({ pressed }) => [styles.itemLista, pressed && { opacity: 0.75 }]}>
            <Text style={styles.itemListaTitulo}>
              {item.nuitem} · {item.descrprod}
            </Text>
            <Text style={styles.itemListaMeta}>
              Status: {statusLabel(item)} · Prev: {item.qtdprevista}
            </Text>
            <Text style={styles.itemListaMeta}>
              End.: {item.local || '-'} · M{item.modulo || '-'} · R{item.rua || '-'}
            </Text>
          </Pressable>
        )}
      />
    </BaseActionModal>
  )
}

type QtyInputModalProps = {
  visible: boolean
  item: ItemTarefaWms | null
  value: string
  onChange: (v: string) => void
  title: string
  loading?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function QtyInputModal({
  visible,
  item,
  value,
  onChange,
  title,
  loading = false,
  onCancel,
  onConfirm,
}: QtyInputModalProps) {
  return (
    <BaseActionModal
      visible={visible}
      title={title}
      onClose={onCancel}
      footer={
        <View style={styles.modalBtns}>
          <Button variant="outline" onPress={onCancel} disabled={loading} style={{ flex: 1 }}>
            Cancelar
          </Button>
          <Button variant="default" onPress={onConfirm} loading={loading} style={{ flex: 1 }}>
            Salvar
          </Button>
        </View>
      }
    >
      {item ? (
        <Text style={styles.modalSub} numberOfLines={3}>
          {item.descrprod} · previsto {item.qtdprevista}
        </Text>
      ) : null}
      <Input value={value} onChangeText={onChange} keyboardType="decimal-pad" style={{ marginTop: space.md }} />
    </BaseActionModal>
  )
}

const styles = StyleSheet.create({
  modalSub: { fontSize: 14, color: colors.textMuted, marginTop: space.sm },
  modalBtns: { flexDirection: 'row', gap: space.md },
  itemLista: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: space.sm,
    marginBottom: space.sm,
    backgroundColor: colors.background,
  },
  itemListaTitulo: { fontSize: 14, fontWeight: '700', color: colors.text },
  itemListaMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
})
