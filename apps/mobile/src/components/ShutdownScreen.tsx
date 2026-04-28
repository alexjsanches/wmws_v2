import { StyleSheet, Text, View } from 'react-native'
import { colors } from '@wms/theme'

type Props = {
  message?: string
}

export function ShutdownScreen({ message }: Props) {
  return (
    <View style={styles.shutdownWrap}>
      <Text style={styles.shutdownTitle}>Aplicativo descontinuado</Text>
      <Text style={styles.shutdownText}>
        {message ?? 'Este aplicativo foi desativado. Contate o suporte para orientacoes.'}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  shutdownWrap: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  shutdownTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  shutdownText: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    textAlign: 'center',
  },
})
