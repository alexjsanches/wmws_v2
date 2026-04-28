/**
 * Formata endereço WMS XX.XX.XX.XXX (módulo, rua, prédio, nível).
 * Remove não dígitos e limita a 9 dígitos — alinhado ao app wmsws.
 */
export function formatarEndereco(texto: string): string {
  const numeros = texto.replace(/\D/g, '')
  const numerosLimitados = numeros.slice(0, 9)
  if (numerosLimitados.length <= 2) {
    return numerosLimitados
  }
  if (numerosLimitados.length <= 4) {
    return `${numerosLimitados.slice(0, 2)}.${numerosLimitados.slice(2)}`
  }
  if (numerosLimitados.length <= 6) {
    return `${numerosLimitados.slice(0, 2)}.${numerosLimitados.slice(2, 4)}.${numerosLimitados.slice(4)}`
  }
  return `${numerosLimitados.slice(0, 2)}.${numerosLimitados.slice(2, 4)}.${numerosLimitados.slice(4, 6)}.${numerosLimitados.slice(6)}`
}

export function validarEnderecoCompleto(end: string): boolean {
  const partes = end.split('.')
  return partes.length === 4 && partes.every((p) => p.length > 0)
}

export function parseEnderecoLocal(endereco: string): {
  modulo: number
  rua: number
  predio: number
  nivel: number
} | null {
  try {
    const partes = endereco.split('.')
    if (partes.length !== 4) return null
    return {
      modulo: parseInt(partes[0], 10),
      rua: parseInt(partes[1], 10),
      predio: parseInt(partes[2], 10),
      nivel: parseInt(partes[3], 10),
    }
  } catch {
    return null
  }
}
