import { useCallback, useMemo, useRef, useState } from 'react'
import { Alert } from 'react-native'
import {
  getMpVerificarDesaparecimento,
  postMpEnderecoProduto,
  postMpHistoricoEnderecos,
  postMpLogMovimentacao,
  postMpProdutoPorCodigo,
  postMpProdutoPorCodigoBarras,
  postMpRegistrarMovimentacao,
  putMpEnderecoCadastroProduto,
} from '../../../services/movimentacaoProativaApi'
import type { HistoricoEnderecoProduto, ProdutoEndereco } from '../../../types/movimentacaoProativa'
import { formatarEndereco, parseEnderecoLocal, validarEnderecoCompleto } from '../../../utils/formatarEndereco'
import { showWmsConfirm, showWmsError, showWmsSuccess } from '../ui/feedback'

type Step = 'produto' | 'endereco' | 'resultado'

export function useMovimentacaoPorProduto(params: { codemp: number; codusu: number | null | undefined }) {
  const { codemp, codusu } = params
  const [step, setStep] = useState<Step>('produto')
  const [codigo, setCodigo] = useState('')
  const [enderecoAtual, setEnderecoAtual] = useState('')
  const [produto, setProduto] = useState<ProdutoEndereco | null>(null)
  const produtoRef = useRef<ProdutoEndereco | null>(null)
  const lastAutoSearchRef = useRef('')
  const [enderecoCadastro, setEnderecoCadastro] = useState('')
  const [loading, setLoading] = useState(false)
  const [histOpen, setHistOpen] = useState(false)
  const [histItems, setHistItems] = useState<HistoricoEnderecoProduto[]>([])
  const [histLoading, setHistLoading] = useState(false)
  const [printModalOpen, setPrintModalOpen] = useState(false)

  const reset = useCallback(() => {
    setStep('produto')
    setCodigo('')
    setEnderecoAtual('')
    setProduto(null)
    produtoRef.current = null
    lastAutoSearchRef.current = ''
    setEnderecoCadastro('')
  }, [])

  const requireCodusu = useCallback((): number | null => {
    if (!codusu) {
      Alert.alert('Movimentação', 'Perfil sem CODUSU — não é possível gravar log.')
      return null
    }
    return codusu
  }, [codusu])

  const registrarMovimentacaoComPolitica = useCallback(async (payloadBase: {
    codprod: number
    enderecoOrigem: string
    enderecoDestino: string
    qtdMovimentada: number
    acao: string
    codvol?: string
  }) => {
    const primeira = await postMpRegistrarMovimentacao({
      ...payloadBase,
      codemp,
      codvol: payloadBase.codvol,
      qtd: payloadBase.qtdMovimentada,
    })
    if (primeira.success) return true
    if ('requireConfirmation' in primeira && primeira.requireConfirmation) {
      const avisos = primeira.policy.warnings.length
        ? primeira.policy.warnings.map((w) => `- ${w}`).join('\n')
        : primeira.message
      return await new Promise<boolean>((resolve) => {
        Alert.alert('Confirmação de política', avisos || 'Movimentação exige confirmação.', [
          { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
          {
            text: 'Confirmar e seguir',
            onPress: () => {
              void (async () => {
                const segunda = await postMpRegistrarMovimentacao({
                  ...payloadBase,
                  codemp,
                  codvol: payloadBase.codvol,
                  qtd: payloadBase.qtdMovimentada,
                  confirmarComAlerta: true,
                })
                if (!segunda.success) {
                  showWmsError(
                    'Movimentação',
                    new Error(segunda.policy.errors.join('\n') || segunda.message),
                    'Movimentação bloqueada.',
                  )
                  resolve(false)
                  return
                }
                resolve(true)
              })().catch((e) => {
                showWmsError('Movimentação', e, 'Erro ao confirmar movimentação.')
                resolve(false)
              })
            },
          },
        ])
      })
    }
    throw new Error(primeira.policy.errors.join('\n') || primeira.message || 'Movimentação bloqueada por política.')
  }, [codemp])

  const registrarEncontradoVoltarCadastro = useCallback(async (p: ProdutoEndereco, endLido: string, endCad: string) => {
    const u = requireCodusu()
    if (!u) return
    setLoading(true)
    try {
      await postMpLogMovimentacao({
        codusu: u,
        endlido: endLido,
        endcadastro: endCad,
        acao: `Produto encontrado em ${endLido} (desaparecido). Levar para cadastro ${endCad}.`,
        codprod: p.codprod,
        controle: p.controle || ' ',
        desaparecido: 'N',
      })
      showWmsSuccess('Sucesso', `Registrado. Leve fisicamente o produto para ${endCad}.`)
      reset()
    } catch (e) {
      showWmsError('Erro', e, 'Falha.')
    } finally {
      setLoading(false)
    }
  }, [requireCodusu, reset])

  const registrarEncontradoAtualizarCadastro = useCallback(async (p: ProdutoEndereco, endLido: string, endCad: string) => {
    const u = requireCodusu()
    if (!u) return
    const partes = parseEnderecoLocal(endLido)
    if (!partes) {
      Alert.alert('Endereço', 'Endereço inválido.')
      return
    }
    setLoading(true)
    try {
      await putMpEnderecoCadastroProduto({
        codprod: p.codprod,
        modulo: partes.modulo,
        rua: partes.rua,
        predio: partes.predio,
        nivel: partes.nivel,
      })
      await postMpLogMovimentacao({
        codusu: u,
        endlido: endCad,
        endcadastro: endLido,
        acao: `Produto encontrado em ${endLido} (desaparecido). Cadastro atualizado de ${endCad} para ${endLido}.`,
        codprod: p.codprod,
        controle: p.controle || ' ',
        desaparecido: 'N',
      })
      showWmsSuccess('Sucesso', 'Cadastro atualizado.')
      reset()
    } catch (e) {
      showWmsError('Erro', e, 'Falha.')
    } finally {
      setLoading(false)
    }
  }, [requireCodusu, reset])

  const buscarProduto = useCallback(async (codigoBruto?: string) => {
    const c = (codigoBruto ?? codigo).trim()
    if (!c) {
      Alert.alert('Produto', 'Informe o código ou o código de barras.')
      return
    }
    setLoading(true)
    try {
      const ehCodProd = c.length <= 5 && /^\d+$/.test(c)
      const res = ehCodProd
        ? await postMpProdutoPorCodigo({ codigo: c, codemp })
        : await postMpProdutoPorCodigoBarras({ codigoBarras: c, codemp })
      if (!res) {
        Alert.alert('Produto', ehCodProd ? 'Produto não encontrado com este código.' : 'Produto não encontrado com este EAN.')
        return
      }
      setProduto(res)
      produtoRef.current = res
      setStep('endereco')
    } catch (e) {
      showWmsError('Produto', e, 'Erro ao buscar.')
    } finally {
      setLoading(false)
    }
  }, [codemp, codigo])

  const buscarAoSairDoCampo = useCallback(() => {
    if (loading || step !== 'produto') return
    const c = codigo.trim()
    if (!c) return
    if (lastAutoSearchRef.current === c) return
    lastAutoSearchRef.current = c
    void buscarProduto(c)
  }, [buscarProduto, codigo, loading, step])

  const comparar = useCallback(async (endBruto?: string) => {
    const p = produtoRef.current ?? produto
    if (!p) return
    const end = formatarEndereco(endBruto ?? enderecoAtual).trim()
    setEnderecoAtual(end)
    if (!validarEnderecoCompleto(end)) {
      Alert.alert('Endereço', 'Formato inválido (00.00.00.000).')
      return
    }
    setLoading(true)
    try {
      const resp = await postMpEnderecoProduto({ codprod: p.codprod, codemp })
      if (!resp) {
        Alert.alert('Endereço', 'Não foi possível obter o endereço cadastrado.')
        return
      }
      const cad = resp.enderecoCadastro
      setEnderecoCadastro(cad)
      const divergente = cad.trim() !== end
      const { desaparecido } = await getMpVerificarDesaparecimento(p.codprod)

      if (divergente && desaparecido) {
        setLoading(false)
        Alert.alert('Produto estava desaparecido', `Cadastro: ${cad}\nEncontrado em: ${end}\nO que deseja fazer?`, [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Levar p/ cadastro', onPress: () => void registrarEncontradoVoltarCadastro(p, end, cad) },
          { text: 'Atualizar cadastro', onPress: () => void registrarEncontradoAtualizarCadastro(p, end, cad) },
        ])
        return
      }

      setStep('resultado')
    } catch (e) {
      showWmsError('Comparação', e, 'Erro.')
    } finally {
      setLoading(false)
    }
  }, [codemp, enderecoAtual, produto, registrarEncontradoAtualizarCadastro, registrarEncontradoVoltarCadastro])

  const moverParaCadastro = useCallback(() => {
    const p = produto
    if (!p) return
    const u = requireCodusu()
    if (!u) return
    showWmsConfirm(
      'Mover para cadastro',
      `Registrar movimentação lógica de ${enderecoAtual} → ${enderecoCadastro}?`,
      async () => {
        setLoading(true)
        try {
          await postMpLogMovimentacao({
            codusu: u,
            endlido: enderecoAtual,
            endcadastro: enderecoCadastro,
            acao: `Moveu produto de ${enderecoAtual} para ${enderecoCadastro} (cadastro)`,
            codprod: p.codprod,
            controle: p.controle || ' ',
          })
          const ok = await registrarMovimentacaoComPolitica({
            codprod: p.codprod,
            codvol: p.codvol || undefined,
            enderecoOrigem: enderecoAtual,
            enderecoDestino: enderecoCadastro,
            qtdMovimentada: 1,
            acao: 'moverParaCadastro',
          })
          if (!ok) return
          showWmsSuccess('Sucesso', 'Movimentação registrada.')
          reset()
        } catch (e) {
          showWmsError('Erro', e, 'Falha.')
        } finally {
          setLoading(false)
        }
      },
    )
  }, [enderecoAtual, enderecoCadastro, produto, registrarMovimentacaoComPolitica, requireCodusu, reset])

  const atualizarCadastro = useCallback(() => {
    const p = produto
    if (!p) return
    const u = requireCodusu()
    if (!u) return
    const partes = parseEnderecoLocal(enderecoAtual)
    if (!partes) {
      Alert.alert('Endereço', 'Endereço atual inválido.')
      return
    }
    showWmsConfirm(
      'Atualizar cadastro',
      `Atualizar endereço do produto para ${enderecoAtual}?`,
      async () => {
        setLoading(true)
        try {
          await putMpEnderecoCadastroProduto({
            codprod: p.codprod,
            modulo: partes.modulo,
            rua: partes.rua,
            predio: partes.predio,
            nivel: partes.nivel,
          })
          await postMpLogMovimentacao({
            codusu: u,
            endlido: enderecoAtual,
            endcadastro: enderecoCadastro,
            acao: `Alterou cadastro de ${enderecoCadastro} para ${enderecoAtual}`,
            codprod: p.codprod,
            controle: p.controle || ' ',
          })
          const ok = await registrarMovimentacaoComPolitica({
            codprod: p.codprod,
            codvol: p.codvol || undefined,
            enderecoOrigem: enderecoCadastro,
            enderecoDestino: enderecoAtual,
            qtdMovimentada: 1,
            acao: 'atualizarCadastro',
          })
          if (!ok) return
          showWmsSuccess('Sucesso', 'Cadastro atualizado.')
          reset()
        } catch (e) {
          showWmsError('Erro', e, 'Falha.')
        } finally {
          setLoading(false)
        }
      },
    )
  }, [enderecoAtual, enderecoCadastro, produto, registrarMovimentacaoComPolitica, requireCodusu, reset])

  const verEndCadastrado = useCallback(async () => {
    const p = produto
    if (!p) return
    setLoading(true)
    try {
      const r = await postMpEnderecoProduto({ codprod: p.codprod, codemp })
      if (r) {
        Alert.alert('Endereço cadastrado', r.enderecoCadastro)
      } else {
        Alert.alert('Endereço', 'Não foi possível consultar.')
      }
    } catch (e) {
      showWmsError('Erro', e, 'Falha.')
    } finally {
      setLoading(false)
    }
  }, [codemp, produto])

  const abrirHistorico = useCallback(async () => {
    const p = produto
    if (!p) return
    setHistOpen(true)
    setHistLoading(true)
    setHistItems([])
    try {
      const items = await postMpHistoricoEnderecos({ codprod: p.codprod, codemp })
      setHistItems(items)
    } catch {
      setHistItems([])
    } finally {
      setHistLoading(false)
    }
  }, [codemp, produto])

  const divergente = useMemo(
    () => enderecoCadastro.trim() !== enderecoAtual.trim() && step === 'resultado',
    [enderecoAtual, enderecoCadastro, step],
  )

  return {
    step,
    setStep,
    codigo,
    setCodigo,
    enderecoAtual,
    setEnderecoAtual,
    produto,
    enderecoCadastro,
    loading,
    histOpen,
    setHistOpen,
    histItems,
    histLoading,
    printModalOpen,
    setPrintModalOpen,
    reset,
    buscarProduto,
    buscarAoSairDoCampo,
    comparar,
    moverParaCadastro,
    atualizarCadastro,
    verEndCadastrado,
    abrirHistorico,
    divergente,
  }
}
