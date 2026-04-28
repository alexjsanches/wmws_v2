import { DomainError } from '../DomainError'
import type { HistoricoEnderecoProduto, ProdutoEndereco } from '../../types/movimentacaoProativa'
import {
  getMpVerificarDesaparecimento,
  postMpHistoricoEnderecos,
  postMpLogMovimentacao,
  postMpProdutosPorEndereco,
  postMpRegistrarMovimentacao,
  putMpEnderecoCadastroProduto,
} from '../../services/movimentacaoProativaApi'
import { formatarEndereco, parseEnderecoLocal, validarEnderecoCompleto } from '../../utils/formatarEndereco'

export type ProdutoComFlag = ProdutoEndereco & { desaparecido: boolean }

export async function searchProdutosByEnderecoUseCase(params: {
  enderecoInput: string
  codemp: number
}): Promise<{ endereco: string; produtos: ProdutoComFlag[] }> {
  const endereco = formatarEndereco(params.enderecoInput).trim()
  if (!validarEnderecoCompleto(endereco)) {
    throw new DomainError(
      'SEPARACAO_ENDERECO_REQUIRED',
      'Informe o endereço no formato Módulo.Rua.Prédio.Nível (ex.: 01.21.08.004).',
    )
  }

  const lista = await postMpProdutosPorEndereco({ endereco, codemp: params.codemp })
  const produtos: ProdutoComFlag[] = await Promise.all(
    lista.map(async (p) => {
      const st = await getMpVerificarDesaparecimento(p.codprod)
      return { ...p, desaparecido: st.desaparecido }
    }),
  )
  return { endereco, produtos }
}

export async function loadHistoricoEnderecoProdutoUseCase(params: {
  codprod: number
  codemp: number
}): Promise<HistoricoEnderecoProduto[]> {
  return postMpHistoricoEnderecos(params)
}

export async function markProdutoDesaparecidoUseCase(params: {
  codusu?: number | null
  enderecoAtual: string
  produto: ProdutoEndereco
}): Promise<void> {
  if (!params.codusu) {
    throw new DomainError('WMS_TASK_ASSIGN_USER_REQUIRED', 'Perfil sem CODUSU — não é possível registrar o log.')
  }
  await postMpLogMovimentacao({
    codusu: params.codusu,
    endlido: params.enderecoAtual,
    endcadastro: params.produto.enderecoCadastro,
    acao: `Produto não encontrado no endereço ${params.enderecoAtual} (desaparecimento)`,
    codprod: params.produto.codprod,
    controle: params.produto.controle || ' ',
    desaparecido: 'S',
  })
}

export async function moveProdutoCadastroUseCase(params: {
  codusu?: number | null
  codemp: number
  enderecoAtual: string
  novoEnderecoInput: string
  produto: ProdutoEndereco
  confirmPolicyWarnings: (warnings: string, fallbackMessage: string) => Promise<boolean>
}): Promise<void> {
  if (!params.codusu) {
    throw new DomainError('WMS_TASK_ASSIGN_USER_REQUIRED', 'Perfil sem CODUSU — não é possível registrar o log.')
  }
  const enderecoNovo = formatarEndereco(params.novoEnderecoInput).trim()
  if (!validarEnderecoCompleto(enderecoNovo)) {
    throw new DomainError('SEPARACAO_ENDERECO_REQUIRED', 'Novo endereço inválido.')
  }

  const partes = parseEnderecoLocal(enderecoNovo)
  if (!partes) {
    throw new DomainError('SEPARACAO_ENDERECO_REQUIRED', 'Não foi possível interpretar o endereço.')
  }

  await putMpEnderecoCadastroProduto({
    codprod: params.produto.codprod,
    modulo: partes.modulo,
    rua: partes.rua,
    predio: partes.predio,
    nivel: partes.nivel,
  })
  await postMpLogMovimentacao({
    codusu: params.codusu,
    endlido: params.enderecoAtual,
    endcadastro: enderecoNovo,
    acao: `Moveu produto de ${params.enderecoAtual} para ${enderecoNovo}`,
    codprod: params.produto.codprod,
    controle: params.produto.controle || ' ',
    desaparecido: 'N',
  })

  const basePayload = {
    codemp: params.codemp,
    codprod: params.produto.codprod,
    codvol: params.produto.codvol || undefined,
    qtd: 1,
    enderecoOrigem: params.enderecoAtual,
    enderecoDestino: enderecoNovo,
    qtdMovimentada: 1,
    acao: 'atualizarCadastroPorEndereco' as const,
  }

  const primeira = await postMpRegistrarMovimentacao(basePayload)
  if (!primeira.success && 'requireConfirmation' in primeira && primeira.requireConfirmation) {
    const warnings = primeira.policy.warnings.length
      ? primeira.policy.warnings.map((w) => `- ${w}`).join('\n')
      : primeira.message
    const confirmou = await params.confirmPolicyWarnings(warnings || '', primeira.message || 'Movimentação exige confirmação.')
    if (!confirmou) {
      throw new Error('Movimentação cancelada pelo usuário.')
    }
    const segunda = await postMpRegistrarMovimentacao({
      ...basePayload,
      confirmarComAlerta: true,
    })
    if (!segunda.success) {
      throw new Error(segunda.policy.errors.join('\n') || segunda.message || 'Movimentação bloqueada.')
    }
    return
  }

  if (!primeira.success) {
    throw new Error(primeira.policy.errors.join('\n') || primeira.message || 'Movimentação bloqueada.')
  }
}
