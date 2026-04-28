import { Alert } from 'react-native'

export function showWmsError(flow: string, e: unknown, fallback: string) {
  const msg = e instanceof Error ? e.message : fallback
  Alert.alert(flow, msg)
}

export function showWmsSuccess(flow: string, message: string, onOk?: () => void) {
  Alert.alert(flow, message, [{ text: 'OK', onPress: onOk }])
}

export function showWmsConfirm(
  title: string,
  message: string,
  onConfirm: () => void,
  options?: {
    confirmText?: string
    cancelText?: string
    destructive?: boolean
  },
) {
  Alert.alert(title, message, [
    { text: options?.cancelText ?? 'Cancelar', style: 'cancel' },
    {
      text: options?.confirmText ?? 'Confirmar',
      style: options?.destructive ? 'destructive' : 'default',
      onPress: onConfirm,
    },
  ])
}
