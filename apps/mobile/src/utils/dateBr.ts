/** Início de período amplo usado na API quando o utilizador não informa datas. */
export const DATA_INICIAL_AMPLA_API = '01/01/2000'

/** Formato enviado à API Sankhya (DD/MM/AAAA). */
export function formatarDataBr(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

export function inicioDoDia(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function dataDeHojeBr(): string {
  return formatarDataBr(inicioDoDia(new Date()))
}
