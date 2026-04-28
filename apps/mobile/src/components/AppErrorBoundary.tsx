import type { ErrorInfo, ReactNode } from 'react'
import { Component } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from '@wms/theme'
import { logger } from '../services/logger'

type Props = { children: ReactNode }
type State = { hasError: boolean; message?: string }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error('Erro não tratado na árvore React.', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.wrap}>
          <Text style={styles.title}>Ocorreu um erro inesperado</Text>
          <Text style={styles.text}>{this.state.message ?? 'Feche e abra o aplicativo novamente.'}</Text>
        </View>
      )
    }
    return this.props.children
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  text: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
  },
})
