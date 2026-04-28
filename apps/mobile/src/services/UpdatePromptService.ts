import { Alert, Linking } from 'react-native'

export type UpdatePromptPayload = {
  mandatory?: boolean
  latestVersion?: string
  changelog?: string
  downloadUrl: string
}

export function showUpdatePrompt(payload: UpdatePromptPayload): void {
  const messageParts = [`Nova versao ${payload.latestVersion ?? ''} disponivel.`.trim()]
  if (payload.changelog?.trim()) messageParts.push(payload.changelog.trim())
  if (payload.mandatory) messageParts.push('Atualizacao obrigatoria.')

  Alert.alert('Atualizacao disponivel', messageParts.join('\n\n'), [
    ...(payload.mandatory ? [] : [{ text: 'Agora nao', style: 'cancel' as const }]),
    {
      text: 'Baixar',
      onPress: () => {
        void Linking.openURL(payload.downloadUrl)
      },
    },
  ])
}
