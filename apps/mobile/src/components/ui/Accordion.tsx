/**
 * Acordeão para React Native (sem Radix/DOM).
 * O padrão de API (subcomponentes nomeados) é o mesmo do shadcn/web;
 * a implementação usa estado + LayoutAnimation, adequada para Android/iOS.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useState,
} from 'react'
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  UIManager,
  View,
  type ViewProps,
} from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors, radii, space } from '@wms/theme'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

type AccordionContextValue = {
  openValue: string | null
  setOpenValue: (value: string | null) => void
}

const AccordionContext = createContext<AccordionContextValue | null>(null)

function useAccordionContext(component: string) {
  const ctx = useContext(AccordionContext)
  if (!ctx) {
    throw new Error(`${component} deve ficar dentro de <Accordion>.`)
  }
  return ctx
}

type AccordionRootProps = ViewProps & {
  children: React.ReactNode
  /** Valor do item aberto por defeito */
  defaultValue?: string | null
  /** Modo controlado: valor aberto */
  value?: string | null
  onValueChange?: (value: string | null) => void
}

export function Accordion({
  children,
  defaultValue = null,
  value: valueProp,
  onValueChange,
  style,
  ...rest
}: AccordionRootProps) {
  const [uncontrolled, setUncontrolled] = useState<string | null>(defaultValue)
  const isControlled = valueProp !== undefined
  const openValue = isControlled ? valueProp : uncontrolled

  const setOpenValue = useCallback(
    (next: string | null) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
      if (!isControlled) {
        setUncontrolled(next)
      }
      onValueChange?.(next)
    },
    [isControlled, onValueChange],
  )

  const ctx = useMemo(
    () => ({
      openValue,
      setOpenValue,
    }),
    [openValue, setOpenValue],
  )

  return (
    <AccordionContext.Provider value={ctx}>
      <View style={style} {...rest}>
        {children}
      </View>
    </AccordionContext.Provider>
  )
}

type AccordionItemProps = ViewProps & {
  children: React.ReactNode
  /** Identificador único deste painel */
  value: string
}

export function AccordionItem({ children, style, value, ...rest }: AccordionItemProps) {
  const itemCtx = useMemo(() => ({ value }), [value])
  return (
    <AccordionItemContext.Provider value={itemCtx}>
      <View style={[styles.item, style]} {...rest}>
        {children}
      </View>
    </AccordionItemContext.Provider>
  )
}

type AccordionItemContextValue = { value: string }

const AccordionItemContext = createContext<AccordionItemContextValue | null>(null)

function useAccordionItem(component: string) {
  const ctx = useContext(AccordionItemContext)
  if (!ctx) {
    throw new Error(`${component} deve ficar dentro de <AccordionItem>.`)
  }
  return ctx
}

type AccordionTriggerProps = ViewProps & {
  children: React.ReactNode
}

export function AccordionTrigger({ children, style, ...rest }: AccordionTriggerProps) {
  const { openValue, setOpenValue } = useAccordionContext('AccordionTrigger')
  const { value } = useAccordionItem('AccordionTrigger')
  const open = openValue === value

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      onPress={() => setOpenValue(open ? null : value)}
      style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed, style]}
      {...rest}
    >
      <View style={styles.triggerInner}>
        <View style={styles.triggerLabel}>{children}</View>
        <MaterialCommunityIcons
          name="chevron-down"
          size={20}
          color={colors.textMuted}
          style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
        />
      </View>
    </Pressable>
  )
}

type AccordionContentProps = ViewProps & {
  children: React.ReactNode
}

export function AccordionContent({ children, style, ...rest }: AccordionContentProps) {
  const { openValue } = useAccordionContext('AccordionContent')
  const { value } = useAccordionItem('AccordionContent')
  const open = openValue === value
  const baseId = useId()
  const contentId = `acc-content-${value}-${baseId}`

  if (!open) {
    return null
  }

  return (
    <View nativeID={contentId} style={[styles.content, style]} {...rest}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  item: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  trigger: {
    paddingVertical: space.md,
    borderRadius: radii.sm,
  },
  triggerPressed: { opacity: 0.85 },
  triggerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  triggerLabel: { flex: 1 },
  content: {
    paddingBottom: space.md,
  },
})
