import { useEffect, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { colors, space } from '@wms/theme'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { SelectField } from '../../../components/ui/SelectField'
import { getTemplates, type TemplateInfo } from '../../../services/impressaoApi'
import { BaseActionModal } from './BaseActionModal'

type ContextoEtiqueta = {
  codprod?: number
  descrprod?: string
  endereco?: string
}

type Props = {
  visible: boolean
  title: string
  contexto?: ContextoEtiqueta
  onClose: () => void
  onSubmit: (payload: { template: string; parametros: Record<string, unknown>; quantidade: number }) => Promise<void>
}

function autoParamValue(paramName: string, contexto?: ContextoEtiqueta): string {
  const n = paramName.toLowerCase()
  if (contexto?.codprod != null && (n.includes('codprod') || n.includes('produto') || n.includes('codigo'))) {
    return String(contexto.codprod)
  }
  if (contexto?.endereco && n.includes('endereco')) {
    return contexto.endereco
  }
  if (contexto?.descrprod && (n.includes('descr') || n.includes('produto'))) {
    return contexto.descrprod
  }
  return ''
}

export function EtiquetaPrintModal({ visible, title, contexto, onClose, onSubmit }: Props) {
  const [templates, setTemplates] = useState<TemplateInfo[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [sending, setSending] = useState(false)
  const [templateId, setTemplateId] = useState('')
  const [quantidade, setQuantidade] = useState('1')
  const [params, setParams] = useState<Record<string, string>>({})

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === templateId) ?? null,
    [templates, templateId],
  )

  useEffect(() => {
    if (!visible) return
    setLoadingTemplates(true)
    void getTemplates()
      .then((res) => {
        const list = Array.isArray(res.templates) ? res.templates : []
        setTemplates(list)
        setTemplateId((prev) => (prev && list.some((t) => t.id === prev) ? prev : list[0]?.id ?? ''))
      })
      .finally(() => setLoadingTemplates(false))
  }, [visible])

  useEffect(() => {
    if (!selectedTemplate) return
    setParams((prev) => {
      const next: Record<string, string> = {}
      for (const p of selectedTemplate.parametrosEntrada) {
        next[p.nome] = prev[p.nome] ?? autoParamValue(p.nome, contexto)
      }
      return next
    })
  }, [contexto, selectedTemplate])

  const enviar = async () => {
    if (!selectedTemplate) return
    const qtd = Number(String(quantidade).replace(',', '.'))
    if (!Number.isFinite(qtd) || qtd <= 0) return
    const payload: Record<string, unknown> = {}
    for (const p of selectedTemplate.parametrosEntrada) {
      const raw = (params[p.nome] ?? '').trim()
      if (p.obrigatorio && raw.length === 0) return
      if (raw.length === 0) continue
      payload[p.nome] = p.tipo === 'number' ? Number(raw.replace(',', '.')) : raw
    }
    setSending(true)
    try {
      await onSubmit({ template: selectedTemplate.id, parametros: payload, quantidade: Math.trunc(qtd) })
      onClose()
    } finally {
      setSending(false)
    }
  }

  const templateOptions = templates.map((t) => ({ label: t.nome, value: t.id }))

  return (
    <BaseActionModal
      visible={visible}
      title={title}
      onClose={onClose}
      footer={
        <View style={styles.rowBtns}>
          <Button variant="outline" onPress={onClose} style={{ flex: 1 }}>
            Cancelar
          </Button>
          <Button onPress={() => void enviar()} disabled={sending || loadingTemplates || !selectedTemplate} style={{ flex: 1 }}>
            {sending ? 'Enviando...' : 'Imprimir'}
          </Button>
        </View>
      }
    >
      <ScrollView>
        <SelectField
          label="Template"
          value={templateId}
          options={templateOptions}
          onChange={setTemplateId}
          placeholder={loadingTemplates ? 'Carregando templates...' : 'Selecionar template'}
        />
        <Text style={styles.label}>Quantidade de cópias</Text>
        <Input value={quantidade} onChangeText={setQuantidade} keyboardType="number-pad" placeholder="1" />
        {selectedTemplate ? (
          <View style={styles.paramsWrap}>
            {selectedTemplate.parametrosEntrada.map((p) => (
              <View key={p.nome}>
                <Text style={styles.label}>
                  {p.nome}
                  {p.obrigatorio ? ' *' : ''}
                </Text>
                <Input
                  value={params[p.nome] ?? ''}
                  onChangeText={(t) => setParams((prev) => ({ ...prev, [p.nome]: t }))}
                  keyboardType={p.tipo === 'number' ? 'numeric' : 'default'}
                  placeholder={p.descricao}
                />
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </BaseActionModal>
  )
}

const styles = StyleSheet.create({
  rowBtns: { flexDirection: 'row', gap: space.sm },
  label: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginBottom: 6, marginTop: space.sm },
  paramsWrap: { gap: space.sm, marginTop: space.sm },
})
