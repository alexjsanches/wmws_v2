import { Alert } from 'react-native'

export function alertEmBreve(titulo: string, mensagem = 'Este módulo ainda será integrado ao backend.') {
  Alert.alert(titulo, mensagem, [{ text: 'OK' }])
}
