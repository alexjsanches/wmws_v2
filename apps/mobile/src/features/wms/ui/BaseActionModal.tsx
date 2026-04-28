import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, space } from '@wms/theme'
import type { ReactNode } from 'react'
import { wmsUiTokens } from './tokens'

type Props = {
  visible: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

export function BaseActionModal({ visible, title, onClose, children, footer }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalRoot}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>{title}</Text>
          <View style={styles.content}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, justifyContent: 'center', padding: wmsUiTokens.modalPadding },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalBox: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: wmsUiTokens.modalPadding,
    maxHeight: wmsUiTokens.modalMaxHeight,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  content: { marginTop: space.sm },
  footer: { marginTop: space.lg },
})
