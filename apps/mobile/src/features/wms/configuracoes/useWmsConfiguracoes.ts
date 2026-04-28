import { useCallback, useEffect, useMemo, useState } from 'react'
import { showWmsError, showWmsSuccess } from '../ui/feedback'
import { getWmsConfigMe, putWmsConfigMe } from '../../../services/wmsApi'
import type { WmsConfigCatalogItem } from '../../../types/wms'

export type LocalField = {
  key: string
  type: WmsConfigCatalogItem['type']
  description?: string
  valueText: string
  valueBool: boolean
}

function jsonToText(v: unknown): string {
  if (v == null) return ''
  try {
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}

export function itemLabelWmsConfig(key: string): string {
  return key
    .toLowerCase()
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}

export function useWmsConfiguracoes() {
  const [codempText, setCodempText] = useState('1')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [storageReady, setStorageReady] = useState<boolean | null>(null)
  const [fields, setFields] = useState<LocalField[]>([])

  const codemp = useMemo(() => {
    const n = Number(codempText)
    return Number.isFinite(n) && n > 0 ? Math.trunc(n) : 1
  }, [codempText])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getWmsConfigMe(codemp)
      const next: LocalField[] = (res.catalog ?? []).map((c) => {
        const incoming = res.values?.[c.key]
        const effective = incoming ?? c.defaultValue
        const type = c.type ?? 'string'
        if (type === 'boolean') {
          return {
            key: c.key,
            type,
            description: c.description,
            valueText: '',
            valueBool: Boolean(effective),
          }
        }
        return {
          key: c.key,
          type,
          description: c.description,
          valueText: type === 'json' ? jsonToText(effective) : effective == null ? '' : String(effective),
          valueBool: false,
        }
      })
      setFields(next)
      setStorageReady(Boolean(res.storageReady))
    } catch (e) {
      showWmsError('Configurações WMS', e, 'Erro ao carregar configurações.')
      setFields([])
      setStorageReady(null)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [codemp])

  useEffect(() => {
    void load()
  }, [load])

  const salvar = useCallback(async () => {
    const values: Record<string, unknown> = {}
    for (const f of fields) {
      if (f.type === 'boolean') {
        values[f.key] = f.valueBool
        continue
      }
      if (f.type === 'number') {
        const n = Number(String(f.valueText).replace(',', '.'))
        if (!Number.isFinite(n)) {
          showWmsError('Configurações WMS', new Error(`Valor inválido em "${itemLabelWmsConfig(f.key)}".`), 'Número inválido.')
          return
        }
        values[f.key] = n
        continue
      }
      if (f.type === 'json') {
        try {
          values[f.key] = f.valueText.trim() ? JSON.parse(f.valueText) : null
        } catch {
          showWmsError('Configurações WMS', new Error(`JSON inválido em "${itemLabelWmsConfig(f.key)}".`), 'JSON inválido.')
          return
        }
        continue
      }
      values[f.key] = f.valueText
    }

    setSaving(true)
    try {
      await putWmsConfigMe({ codemp, values })
      showWmsSuccess('Configurações WMS', 'Preferências salvas com sucesso.')
      await load()
    } catch (e) {
      showWmsError('Configurações WMS', e, 'Erro ao salvar configurações.')
    } finally {
      setSaving(false)
    }
  }, [codemp, fields, load])

  return {
    codempText,
    setCodempText,
    loading,
    saving,
    refreshing,
    setRefreshing,
    storageReady,
    fields,
    setFields,
    load,
    salvar,
  }
}
