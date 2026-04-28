import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, radii, space } from '@wms/theme'
import { SnkBadge } from './SnkBadge'

export type SnkEntityCardBadge = { label: string; color?: string; textColor?: string }

export type SnkEntityCardProps = {
  title: string
  subtitle?: string
  info?: string
  badges?: SnkEntityCardBadge[]
  selected?: boolean
  onPress?: () => void
  onLongPress?: () => void
  rightIcon?: keyof typeof MaterialCommunityIcons.glyphMap
  /**
   * Quando `false`, renderiza `View` em vez de `Pressable` (ex.: linha dentro de `SnkList`, que já envolve o toque).
   */
  pressable?: boolean
}

export function SnkEntityCard({
  title,
  subtitle,
  info,
  badges,
  selected = false,
  onPress,
  onLongPress,
  rightIcon = 'chevron-right',
  pressable = true,
}: SnkEntityCardProps) {
  const body = (
    <>
      <View style={styles.content}>
        <View style={styles.main}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>

          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}

          {info ? (
            <Text style={styles.info} numberOfLines={1}>
              {info}
            </Text>
          ) : null}

          {badges && badges.length > 0 ? (
            <View style={styles.badges}>
              {badges.map((badge, i) => (
                <SnkBadge
                  key={`${badge.label}-${i}`}
                  label={badge.label}
                  color={badge.color}
                  textColor={badge.textColor}
                />
              ))}
            </View>
          ) : null}
        </View>

        <MaterialCommunityIcons name={rightIcon} size={20} color={colors.textMuted} />
      </View>

      {selected ? <View style={styles.selectedBar} pointerEvents="none" /> : null}
    </>
  )

  if (!pressable) {
    return (
      <View style={[styles.card, selected && styles.cardSelected]} accessibilityRole="none">
        {body}
      </View>
    )
  }

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}
    >
      {body}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    flexDirection: 'row',
    position: 'relative',
  },
  cardSelected: {
    backgroundColor: colors.primaryMuted,
  },
  cardPressed: { opacity: 0.75 },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  main: { flex: 1, gap: 2 },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
  },
  info: {
    fontSize: 12,
    color: colors.textMuted,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  selectedBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: colors.primary,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
})
