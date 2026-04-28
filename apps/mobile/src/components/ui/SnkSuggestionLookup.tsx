import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native'
import { colors, radii, space } from '@wms/theme'
import { extrairDescricaoDaResposta, postGetSuggestion } from '../../services/snkPesquisaApi'
import { Input } from './Input'

export type SnkSuggestionLookupProps = {
  entityName: string
  fieldName: string
  code: string
  onChangeCode: (code: string) => void
  description: string
  onChangeDescription: (description: string) => void
  showInactives?: boolean
  keyboardType?: TextInputProps['keyboardType']
  onBlurCode?: () => void
}

export function SnkSuggestionLookup({
  entityName,
  fieldName,
  code,
  onChangeCode,
  description,
  onChangeDescription,
  showInactives = true,
  keyboardType = 'default',
  onBlurCode,
}: SnkSuggestionLookupProps) {
  const [lookupLoading, setLookupLoading] = useState(false)
  const oldValueRef = useRef('')
  const lastLoadedPkRef = useRef('')
  const codeRef = useRef(code)

  useEffect(() => {
    codeRef.current = code
  }, [code])

  const onCodeChange = useCallback(
    (t: string) => {
      onChangeCode(t)
      onChangeDescription('')
      if (!t.trim()) {
        lastLoadedPkRef.current = ''
      }
    },
    [onChangeCode, onChangeDescription],
  )

  const executarPesquisa = useCallback(async (opts?: { silent?: boolean; codeOverride?: string }) => {
    const silent = opts?.silent === true
    const pk = String(opts?.codeOverride ?? codeRef.current).trim()
    if (!pk) {
      if (!silent) {
        Alert.alert('Pesquisa', 'Informe o código.')
      }
      return
    }
    if (!silent && lastLoadedPkRef.current === pk) {
      return
    }
    setLookupLoading(true)
    try {
      const res = await postGetSuggestion({
        pk,
        entityName,
        fieldName,
        showInactives,
      })
      const desc = extrairDescricaoDaResposta(res, fieldName)
      if (desc) {
        onChangeDescription(desc)
        lastLoadedPkRef.current = pk
      } else {
        onChangeCode('')
        onChangeDescription('')
        lastLoadedPkRef.current = ''
        if (!silent) {
          Alert.alert('Pesquisa', 'Nenhuma descrição encontrada.')
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Falha na pesquisa.'
      if (!silent) {
        Alert.alert('Pesquisa', msg)
      }
      onChangeDescription('')
      // Em erro de rede/infra mantém o código digitado para o usuário tentar de novo.
    } finally {
      setLookupLoading(false)
    }
  }, [entityName, fieldName, showInactives, onChangeCode, onChangeDescription])

  const onCodeFocus = useCallback(() => {
    oldValueRef.current = String(codeRef.current || '').trim()
  }, [])

  const onCodeBlurInternal = useCallback(() => {
    onBlurCode?.()
    const current = String(codeRef.current || '').trim()
    if (!current) return
    if (current === oldValueRef.current) return
    if (current === lastLoadedPkRef.current) return
    void executarPesquisa({ silent: true, codeOverride: current })
  }, [executarPesquisa, onBlurCode])

  return (
    <View style={styles.row}>
      <View style={styles.codeBlock}>
        <Input
          keyboardType={keyboardType}
          value={code}
          onChangeText={onCodeChange}
          onFocus={onCodeFocus}
          onBlur={onCodeBlurInternal}
          style={styles.codeInput}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => void executarPesquisa()}
          disabled={lookupLoading}
          hitSlop={8}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
        >
          {lookupLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <MaterialCommunityIcons name="magnify" size={22} color={colors.textMuted} />
          )}
        </Pressable>
      </View>
      <TextInput
        value={description}
        editable={false}
        placeholder=""
        placeholderTextColor={colors.textMuted}
        style={styles.descInput}
        multiline={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'stretch', gap: space.sm },
  codeBlock: {
    flex: 0.34,
    minWidth: 96,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    paddingLeft: space.xs,
  },
  codeInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
    minWidth: 0,
  },
  iconBtn: {
    paddingHorizontal: space.sm,
    paddingVertical: space.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnPressed: { opacity: 0.65 },
  descInput: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
})
