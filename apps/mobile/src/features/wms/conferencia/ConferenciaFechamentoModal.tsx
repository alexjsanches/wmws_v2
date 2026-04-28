import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { colors, space } from '@wms/theme'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import type { DivergenciaConcluirPayload } from '../../../types/wms'
import { BaseActionModal } from '../ui/BaseActionModal'

type Props = {
  visible: boolean
  onClose: () => void
  onConfirm: () => void
  enderecoExpedicao: string
  setEnderecoExpedicao: (v: string) => void
  pesoBruto: string
  setPesoBruto: (v: string) => void
  volumes: string
  setVolumes: (v: string) => void
  altura: string
  setAltura: (v: string) => void
  largura: string
  setLargura: (v: string) => void
  profundidade: string
  setProfundidade: (v: string) => void
  divergenciasBase: DivergenciaConcluirPayload[]
  divergenciaMeta: Record<number, { motivo: string; subtipo: string }>
  setDivergenciaMeta: (
    fn: (old: Record<number, { motivo: string; subtipo: string }>) => Record<number, { motivo: string; subtipo: string }>,
  ) => void
  corteMeta: Record<number, { qtdcorte: string; motivo: string }>
  setCorteMeta: (
    fn: (old: Record<number, { qtdcorte: string; motivo: string }>) => Record<number, { qtdcorte: string; motivo: string }>,
  ) => void
}

export function ConferenciaFechamentoModal({
  visible,
  onClose,
  onConfirm,
  enderecoExpedicao,
  setEnderecoExpedicao,
  pesoBruto,
  setPesoBruto,
  volumes,
  setVolumes,
  altura,
  setAltura,
  largura,
  setLargura,
  profundidade,
  setProfundidade,
  divergenciasBase,
  divergenciaMeta,
  setDivergenciaMeta,
  corteMeta,
  setCorteMeta,
}: Props) {
  return (
    <BaseActionModal
      visible={visible}
      title="Fechamento da conferência"
      onClose={onClose}
      footer={
        <View style={styles.modalBtns}>
          <Button variant="outline" onPress={onClose} style={{ flex: 1 }}>
            Cancelar
          </Button>
          <Button variant="success" onPress={onConfirm} style={{ flex: 1 }}>
            Confirmar fechamento
          </Button>
        </View>
      }
    >
      <ScrollView contentContainerStyle={{ gap: space.sm, paddingTop: space.sm }}>
        <Text style={styles.metaStrong}>Endereço de expedição (opcional)</Text>
        <Input value={enderecoExpedicao} onChangeText={setEnderecoExpedicao} placeholder="Ex: Doca 3" />

        <Text style={styles.metaStrong}>Dimensões (opcional)</Text>
        <Input value={pesoBruto} onChangeText={setPesoBruto} keyboardType="decimal-pad" placeholder="Peso bruto" />
        <Input value={volumes} onChangeText={setVolumes} keyboardType="decimal-pad" placeholder="Volumes" />
        <Input value={altura} onChangeText={setAltura} keyboardType="decimal-pad" placeholder="Altura" />
        <Input value={largura} onChangeText={setLargura} keyboardType="decimal-pad" placeholder="Largura" />
        <Input value={profundidade} onChangeText={setProfundidade} keyboardType="decimal-pad" placeholder="Profundidade" />

        {divergenciasBase.length ? <Text style={styles.metaStrong}>Divergências e cortes</Text> : null}
        {divergenciasBase.map((d) => (
          <Card key={d.nuitem} style={{ padding: space.sm }}>
            <Text style={styles.itemListaTitulo}>Item {d.nuitem}</Text>
            <Text style={styles.itemListaMeta}>
              Prev: {d.qtdprevista} · Encontrado: {d.qtdencontrada}
            </Text>
            <Input
              value={divergenciaMeta[d.nuitem]?.motivo ?? ''}
              onChangeText={(v) =>
                setDivergenciaMeta((old) => ({ ...old, [d.nuitem]: { motivo: v, subtipo: old[d.nuitem]?.subtipo ?? '' } }))
              }
              placeholder="Motivo da divergência (opcional)"
              style={{ marginTop: space.xs }}
            />
            <Input
              value={divergenciaMeta[d.nuitem]?.subtipo ?? ''}
              onChangeText={(v) =>
                setDivergenciaMeta((old) => ({ ...old, [d.nuitem]: { motivo: old[d.nuitem]?.motivo ?? '', subtipo: v } }))
              }
              placeholder="Subtipo (opcional)"
              style={{ marginTop: space.xs }}
            />
            <Input
              value={corteMeta[d.nuitem]?.qtdcorte ?? ''}
              onChangeText={(v) =>
                setCorteMeta((old) => ({ ...old, [d.nuitem]: { qtdcorte: v, motivo: old[d.nuitem]?.motivo ?? '' } }))
              }
              keyboardType="decimal-pad"
              placeholder="Qtd corte (opcional)"
              style={{ marginTop: space.xs }}
            />
            <Input
              value={corteMeta[d.nuitem]?.motivo ?? ''}
              onChangeText={(v) =>
                setCorteMeta((old) => ({ ...old, [d.nuitem]: { qtdcorte: old[d.nuitem]?.qtdcorte ?? '', motivo: v } }))
              }
              placeholder="Motivo do corte (opcional)"
              style={{ marginTop: space.xs }}
            />
          </Card>
        ))}
      </ScrollView>
    </BaseActionModal>
  )
}

const styles = StyleSheet.create({
  modalBtns: { flexDirection: 'row', gap: space.md, marginTop: space.lg },
  itemListaTitulo: { fontSize: 14, fontWeight: '700', color: colors.text },
  itemListaMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  metaStrong: { fontSize: 14, color: colors.text, fontWeight: '700' },
})
