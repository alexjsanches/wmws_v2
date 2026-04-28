import { useCallback, useMemo, useState } from 'react'
import { Alert } from 'react-native'
import { postGerenciaProdutosExtrato, type ExtratoLinha } from '../../../services/snkGerenciaProdutosApi'
import { DATA_INICIAL_AMPLA_API, dataDeHojeBr, formatarDataBr, inicioDoDia } from '../../../utils/dateBr'

export type SentimentoLinha = 'entrada' | 'saida' | 'neutro'

export function parseQuantidadeExtrato(qtd: string | undefined): number {
  if (qtd === undefined || qtd === '') return Number.NaN
  let t = String(qtd).trim().replace(/\s/g, '')
  if (t === '' || t === '—') return Number.NaN
  let sign = 1
  if (/^-/.test(t)) {
    sign = -1
    t = t.slice(1)
  }
  if (/,/.test(t)) {
    t = t.replace(/\./g, '').replace(',', '.')
  } else {
    t = t.replace(/,/g, '.')
  }
  const n = parseFloat(t)
  return Number.isFinite(n) ? sign * n : Number.NaN
}

export function sentimentoLinhaExtrato(linha: ExtratoLinha): SentimentoLinha {
  const q = parseQuantidadeExtrato(linha.QTDNEG)
  if (Number.isNaN(q) || q === 0) return 'neutro'
  return q > 0 ? 'entrada' : 'saida'
}

export function ultimoSaldoExibicaoExtrato(linhas: ExtratoLinha[]): string {
  for (let i = linhas.length - 1; i >= 0; i -= 1) {
    const s = linhas[i].SALDO
    if (s !== undefined && s !== '') return s
  }
  return '—'
}

export function useGerenciaProdutosExtrato() {
  const [dateIni, setDateIni] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return inicioDoDia(d)
  })
  const [dateFin, setDateFin] = useState(() => inicioDoDia(new Date()))
  const [codProd, setCodProd] = useState('')
  const [descrProd, setDescrProd] = useState('')
  const [controle, setControle] = useState(' ')
  const [codLocal, setCodLocal] = useState('')
  const [descrLocal, setDescrLocal] = useState('')
  const [codEmp, setCodEmp] = useState('')
  const [descrEmp, setDescrEmp] = useState('')
  const [periodoDias, setPeriodoDias] = useState('0')
  const [visualizarSaldo, setVisualizarSaldo] = useState(true)
  const [vlrNegPos, setVlrNegPos] = useState(false)
  const [naoInformarDatas, setNaoInformarDatas] = useState(false)
  const [linhas, setLinhas] = useState<ExtratoLinha[]>([])
  const [loading, setLoading] = useState(false)
  const [consultou, setConsultou] = useState(false)

  const saldoAtual = useMemo(() => ultimoSaldoExibicaoExtrato(linhas), [linhas])

  const consultar = useCallback(async () => {
    const prod = Number(String(codProd).trim())
    if (!Number.isFinite(prod) || prod <= 0) {
      Alert.alert('Validação', 'Código de produto inválido.')
      return
    }
    if (!naoInformarDatas && dateIni.getTime() > dateFin.getTime()) {
      Alert.alert('Validação', 'Data inicial maior que a final.')
      return
    }
    const pd = Number(String(periodoDias).trim())
    const periodoDiasNum = Number.isFinite(pd) ? pd : 0

    setLoading(true)
    setConsultou(true)
    try {
      const { linhas: data } = await postGerenciaProdutosExtrato({
        codProd: prod,
        dtIni: naoInformarDatas ? DATA_INICIAL_AMPLA_API : formatarDataBr(dateIni),
        dtFin: naoInformarDatas ? dataDeHojeBr() : formatarDataBr(dateFin),
        controle: controle === '' ? ' ' : controle,
        codLocal: codLocal.trim(),
        codEmp: String(codEmp).trim(),
        codEmp2: String(codEmp).trim(),
        periodoDias: periodoDiasNum,
        visualizarSaldo,
        vlrNegPos,
        filtro: {},
      })
      setLinhas(data)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao consultar.'
      Alert.alert('Extrato', msg)
      setLinhas([])
    } finally {
      setLoading(false)
    }
  }, [
    codProd,
    naoInformarDatas,
    dateIni,
    dateFin,
    periodoDias,
    controle,
    codLocal,
    codEmp,
    visualizarSaldo,
    vlrNegPos,
  ])

  return {
    dateIni,
    setDateIni,
    dateFin,
    setDateFin,
    codProd,
    setCodProd,
    descrProd,
    setDescrProd,
    controle,
    setControle,
    codLocal,
    setCodLocal,
    descrLocal,
    setDescrLocal,
    codEmp,
    setCodEmp,
    descrEmp,
    setDescrEmp,
    periodoDias,
    setPeriodoDias,
    visualizarSaldo,
    setVisualizarSaldo,
    vlrNegPos,
    setVlrNegPos,
    naoInformarDatas,
    setNaoInformarDatas,
    linhas,
    loading,
    consultou,
    saldoAtual,
    consultar,
  }
}
