import { useCallback, useMemo, useState } from 'react'
import { Alert } from 'react-native'
import { getWmsProdutoConsulta, type ConsultaProdutoWmsResposta } from '../../../services/wmsApi'

export type AbaConsultaProduto = 'produto' | 'estoque' | 'reservas' | 'entradas'

export function useConsultaProduto() {
  const [codProd, setCodProd] = useState('')
  const [descrProd, setDescrProd] = useState('')
  const [aba, setAba] = useState<AbaConsultaProduto>('produto')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ConsultaProdutoWmsResposta | null>(null)

  const consultar = useCallback(async () => {
    const prod = Number(String(codProd).trim())
    if (!Number.isFinite(prod) || prod <= 0) {
      Alert.alert('Validação', 'Informe um código de produto válido.')
      return
    }
    setLoading(true)
    setData(null)
    try {
      const res = await getWmsProdutoConsulta(prod)
      setData(res)
      setAba('produto')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao consultar.'
      Alert.alert('Consulta', msg)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [codProd])

  const consultarOnBlur = useCallback(() => {
    if (loading) return
    const c = String(codProd).trim()
    if (!c) return
    void consultar()
  }, [codProd, consultar, loading])

  const hasData = useMemo(() => data != null, [data])

  return {
    codProd,
    setCodProd,
    descrProd,
    setDescrProd,
    aba,
    setAba,
    loading,
    data,
    hasData,
    consultar,
    consultarOnBlur,
  }
}
