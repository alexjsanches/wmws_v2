import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, radii, space } from '@wms/theme'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { API_BASE_URL } from '../config/env'

export function LoginScreen() {
  const { login } = useAuth()
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async () => {
    setError(null)
    if (!usuario.trim() || !senha) {
      setError('Informe usuário e senha.')
      return
    }
    setSubmitting(true)
    try {
      await login(usuario.trim(), senha)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível entrar.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.logo}>
              <MaterialCommunityIcons name="warehouse" size={40} color={colors.primary} />
            </View>
            <Text style={styles.title}>WMS WorldSeg</Text>
            <Text style={styles.subtitle}>Entre com seu usuário Sankhya</Text>
          </View>

          <Card style={styles.card}>
            <Text style={styles.label}>Usuário</Text>
            <Input
              value={usuario}
              onChangeText={setUsuario}
              placeholder="Usuário"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!submitting}
            />
            <Text style={[styles.label, { marginTop: space.md }]}>Senha</Text>
            <Input
              value={senha}
              onChangeText={setSenha}
              placeholder="Senha"
              secureTextEntry
              editable={!submitting}
              onSubmitEditing={onSubmit}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button
              variant="default"
              onPress={onSubmit}
              disabled={submitting}
              style={{ marginTop: space.lg, width: '100%' }}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                'Entrar'
              )}
            </Button>
          </Card>

          <Text style={styles.hint} numberOfLines={2}>
            API: {API_BASE_URL.replace(/^https?:\/\//, '')}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: space.xl,
    justifyContent: 'center',
  },
  hero: { alignItems: 'center', marginBottom: space.xl },
  logo: {
    width: 80,
    height: 80,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 15, color: colors.textMuted, marginTop: space.xs, textAlign: 'center' },
  card: { padding: space.xl },
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 6 },
  error: {
    marginTop: space.md,
    color: colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    marginTop: space.xl,
    textAlign: 'center',
    fontSize: 11,
    color: colors.textMuted,
  },
})
