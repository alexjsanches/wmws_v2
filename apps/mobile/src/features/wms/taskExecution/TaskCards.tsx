import { StyleSheet, Text } from 'react-native'
import { colors, space } from '@wms/theme'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import type { ItemTarefaWms } from '../../../types/wms'
import { statusLabel } from './domain'

type TaskProgressoCardProps = {
  titulo: string
  totais: { total: number; ok: number; diverg: number; pend: number }
}

export function TaskProgressoCard({ titulo, totais }: TaskProgressoCardProps) {
  return (
    <Card style={styles.cardResumo}>
      <Text style={styles.metaStrong}>{titulo}</Text>
      <Text style={styles.meta}>
        Pendentes: {totais.pend} · OK: {totais.ok} · Divergentes: {totais.diverg} · Total: {totais.total}
      </Text>
    </Card>
  )
}

type CurrentItemCardProps = {
  item: ItemTarefaWms | null
  emptyLabel?: string
  primaryActionLabel: string
  secondaryActionLabel: string
  actionLoading?: boolean
  onPrimaryAction: (item: ItemTarefaWms) => void | Promise<void>
  onSecondaryAction: (item: ItemTarefaWms) => void | Promise<void>
}

export function CurrentItemCard({
  item,
  emptyLabel = 'Nenhum item disponível.',
  primaryActionLabel,
  secondaryActionLabel,
  actionLoading = false,
  onPrimaryAction,
  onSecondaryAction,
}: CurrentItemCardProps) {
  if (!item) {
    return (
      <Card style={styles.cardItemAtual}>
        <Text style={styles.metaStrong}>{emptyLabel}</Text>
      </Card>
    )
  }

  return (
    <Card style={styles.cardItemAtual}>
      <Text style={styles.tituloAtual}>Item atual</Text>
      <Text style={styles.prod}>{item.descrprod}</Text>
      <Text style={styles.meta}>Status: {statusLabel(item)}</Text>
      <Text style={styles.meta}>
        Item {item.nuitem} · Prev. {item.qtdprevista}
        {item.qtdrealizada != null ? ` · Realizado ${item.qtdrealizada}` : ''}
      </Text>
      <Text style={styles.meta}>
        End.: {item.local || '-'} {item.modulo ? `· M${item.modulo}` : ''} {item.rua ? `· R${item.rua}` : ''}{' '}
        {item.predio ? `· P${item.predio}` : ''} {item.nivel ? `· N${item.nivel}` : ''}{' '}
        {item.posicao ? `· POS ${item.posicao}` : ''}
      </Text>
      <Text style={styles.meta}>
        Ref: {item.referencia || '—'} · Barras: {item.codbarra || '—'} · Est. disp: {item.estdisp ?? 0}
      </Text>

      <Button variant="default" onPress={() => void onPrimaryAction(item)} loading={actionLoading} style={{ marginTop: space.md }}>
        {primaryActionLabel}
      </Button>
      <Button variant="outline" onPress={() => void onSecondaryAction(item)} disabled={actionLoading} style={{ marginTop: space.sm }}>
        {secondaryActionLabel}
      </Button>
    </Card>
  )
}

const styles = StyleSheet.create({
  cardResumo: { padding: space.md },
  cardItemAtual: { padding: space.md },
  tituloAtual: { fontSize: 12, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase' },
  prod: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: 6 },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  metaStrong: { fontSize: 14, color: colors.text, fontWeight: '700' },
})
