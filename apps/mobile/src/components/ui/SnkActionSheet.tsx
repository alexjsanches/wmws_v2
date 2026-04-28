import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useCallback } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, radii, space } from '@wms/theme'

export type SnkActionIconName = keyof typeof MaterialCommunityIcons.glyphMap

export type SnkActionSheetAction = {
  key: string
  label: string
  icon?: SnkActionIconName
  variant?: 'default' | 'danger'
  disabled?: boolean
  onPress: () => void
}

export type SnkActionSheetProps = {
  visible: boolean
  onClose: () => void
  title?: string
  actions: SnkActionSheetAction[]
}

export function SnkActionSheet({ visible, onClose, title, actions }: SnkActionSheetProps) {
  const handleAction = useCallback(
    (action: SnkActionSheetAction) => {
      if (action.disabled) return
      onClose()
      setTimeout(action.onPress, 150)
    },
    [onClose],
  )

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissArea} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          {title ? (
            <View style={styles.titleWrap}>
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
            </View>
          ) : null}

          {actions.map((action, index) => (
            <Pressable
              key={action.key}
              onPress={() => handleAction(action)}
              disabled={action.disabled}
              style={({ pressed }) => [
                styles.action,
                index < actions.length - 1 && styles.actionBorder,
                pressed && !action.disabled && styles.actionPressed,
                action.disabled && styles.actionDisabled,
              ]}
            >
              {action.icon ? (
                <MaterialCommunityIcons
                  name={action.icon}
                  size={20}
                  color={
                    action.disabled
                      ? colors.textMuted
                      : action.variant === 'danger'
                        ? colors.danger
                        : colors.text
                  }
                  style={styles.actionIcon}
                />
              ) : null}

              <Text
                style={[
                  styles.actionLabel,
                  action.variant === 'danger' && styles.actionLabelDanger,
                  action.disabled && styles.actionLabelDisabled,
                ]}
              >
                {action.label}
              </Text>
            </Pressable>
          ))}

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.cancelBtn, pressed && styles.actionPressed]}
          >
            <Text style={styles.cancelLabel}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.md,
    borderTopRightRadius: radii.md,
    paddingBottom: space.xl,
  },
  handle: {
    alignSelf: 'center',
    marginTop: space.sm,
    marginBottom: space.xs,
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  titleWrap: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: space.xs,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingVertical: 14,
  },
  actionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  actionPressed: {
    backgroundColor: colors.background,
  },
  actionDisabled: {
    opacity: 0.4,
  },
  actionIcon: {
    marginRight: space.sm,
    width: 24,
  },
  actionLabel: {
    fontSize: 16,
    color: colors.text,
  },
  actionLabelDanger: {
    color: colors.danger,
  },
  actionLabelDisabled: {
    color: colors.textMuted,
  },
  cancelBtn: {
    marginTop: space.sm,
    marginHorizontal: space.md,
    paddingVertical: 14,
    borderRadius: radii.sm,
    backgroundColor: colors.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
})
