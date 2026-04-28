import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, radii, space } from '@wms/theme'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { SelectField } from '../components/ui/SelectField'
import type { MainTabParamList } from '../navigation/types'

type Props = BottomTabScreenProps<MainTabParamList, 'Scanner'>

const stateOptions = [
  { label: 'Bom estado', value: 'Bom estado' },
  { label: 'Danificado', value: 'Danificado' },
  { label: 'A reparar', value: 'A reparar' },
  { label: 'Obsoleto', value: 'Obsoleto' },
]

const bureauOptions = [
  { label: 'TI', value: 'TI' },
  { label: 'Financeiro', value: 'Financeiro' },
  { label: 'Operações', value: 'Operações' },
  { label: 'Diretoria', value: 'Diretoria' },
]

const serviceOptions = [
  { label: 'TI', value: 'TI' },
  { label: 'Financeiro', value: 'Financeiro' },
  { label: 'Logística', value: 'Logística' },
  { label: 'Administrativo', value: 'Administrativo' },
]

const agencyOptions = [
  { label: 'Matriz', value: 'Matriz' },
  { label: 'Filial Sul', value: 'Filial Sul' },
  { label: 'Filial Nordeste', value: 'Filial Nordeste' },
]

export function ScannerScreen({ navigation }: Props) {
  const [scanned, setScanned] = useState<{
    name: string
    barcode: string
  } | null>(null)
  const [editing, setEditing] = useState(false)
  const [itemState, setItemState] = useState('Bom estado')
  const [location, setLocation] = useState('TI')
  const [service, setService] = useState('TI')
  const [agency, setAgency] = useState('Matriz')
  const [comment, setComment] = useState('')
  const [manual, setManual] = useState('')
  const [manualOpen, setManualOpen] = useState(false)

  const simulateScan = () => {
    setScanned({
      name: 'Notebook HP EliteBook',
      barcode: 'HP-ELB-2024-001',
    })
    setItemState('Bom estado')
    setLocation('TI')
    setService('TI')
    setAgency('Matriz')
    setComment('')
  }

  const applyManual = () => {
    const code = manual.trim()
    if (!code) return
    setScanned({
      name: 'Item encontrado pelo código',
      barcode: code,
    })
    setItemState('Bom estado')
    setLocation('TI')
    setService('TI')
    setAgency('Matriz')
    setManual('')
    setManualOpen(false)
  }

  const save = () => {
    setScanned(null)
    setEditing(false)
    setComment('')
  }

  const cancelScan = () => {
    setScanned(null)
    setEditing(false)
    setManual('')
    setManualOpen(false)
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Scanner de item" onBack={() => navigation.navigate('Home', { screen: 'Dashboard' })} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {!scanned ? (
          <>
            <Card style={styles.camera}>
              <View style={styles.cameraOverlay} />
              <View style={styles.cameraInner}>
                <MaterialCommunityIcons name="camera" size={48} color="#FFF" />
                <Text style={styles.cameraTitle}>Posicione o código de barras na área</Text>
                <View style={styles.frame}>
                  <Text style={styles.frameHint}>Área do código</Text>
                </View>
              </View>
            </Card>
            <Button onPress={simulateScan} style={styles.fullBtn}>
              <MaterialCommunityIcons name="camera" size={20} color="#FFF" />
              <Text style={styles.btnLight}> Iniciar leitura (simulado)</Text>
            </Button>
            <Card style={styles.manualCard}>
              {!manualOpen ? (
                <Button variant="outline" onPress={() => setManualOpen(true)} style={styles.fullBtn}>
                  <MaterialCommunityIcons name="keyboard" size={18} color={colors.textMuted} />
                  <Text style={styles.btnDark}> Digitar código manualmente</Text>
                </Button>
              ) : (
                <View style={{ gap: space.sm }}>
                  <Input
                    placeholder="Digite o código de barras..."
                    value={manual}
                    onChangeText={setManual}
                    onSubmitEditing={applyManual}
                  />
                  <View style={styles.row}>
                    <Button variant="default" onPress={applyManual} disabled={!manual.trim()} style={{ flex: 1 }}>
                      OK
                    </Button>
                    <Button
                      variant="ghost"
                      onPress={() => {
                        setManualOpen(false)
                        setManual('')
                      }}
                    >
                      Cancelar
                    </Button>
                  </View>
                </View>
              )}
            </Card>
            <Text style={styles.hint}>Garanta boa iluminação e foco no código.</Text>
          </>
        ) : (
          <>
            <Card style={{ padding: space.lg }}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>Item lido</Text>
                <Button variant="outline" onPress={() => setEditing(!editing)}>
                  {editing ? 'Cancelar' : 'Editar'}
                </Button>
              </View>
              <Text style={styles.label}>Nome</Text>
              <Text style={styles.readonly}>{scanned.name}</Text>
              <Text style={styles.label}>Código de barras</Text>
              <Text style={styles.readonlyMono}>{scanned.barcode}</Text>
              {editing ? (
                <>
                  <SelectField label="Estado" value={itemState} options={stateOptions} onChange={setItemState} />
                  <SelectField label="Setor / local" value={location} options={bureauOptions} onChange={setLocation} />
                  <SelectField label="Serviço" value={service} options={serviceOptions} onChange={setService} />
                  <SelectField label="Unidade" value={agency} options={agencyOptions} onChange={setAgency} />
                  <Text style={styles.label}>Comentário (opcional)</Text>
                  <Input
                    multiline
                    numberOfLines={3}
                    value={comment}
                    onChangeText={setComment}
                    placeholder="Observações..."
                    style={{ minHeight: 80, textAlignVertical: 'top' }}
                  />
                </>
              ) : (
                <>
                  <Text style={styles.label}>Estado</Text>
                  <Text style={styles.readonly}>{itemState}</Text>
                  <Text style={styles.label}>Setor / local</Text>
                  <Text style={styles.readonly}>{location}</Text>
                  <Text style={styles.label}>Serviço</Text>
                  <Text style={styles.readonly}>{service}</Text>
                  <Text style={styles.label}>Unidade</Text>
                  <Text style={styles.readonly}>{agency}</Text>
                </>
              )}
            </Card>
            <View style={styles.row}>
              <Button variant="success" onPress={save} style={{ flex: 1 }}>
                Salvar
              </Button>
              <Button variant="outline" onPress={cancelScan} style={{ flex: 1 }}>
                Descartar
              </Button>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: space.lg, paddingBottom: space.xl * 2, gap: space.md },
  camera: {
    minHeight: 280,
    overflow: 'hidden',
    padding: 0,
    borderWidth: 0,
    backgroundColor: '#0f172a',
  },
  cameraOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.55)' },
  cameraInner: {
    padding: space.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 280,
  },
  cameraTitle: { color: '#FFF', fontSize: 16, textAlign: 'center', marginTop: space.md, marginBottom: space.lg },
  frame: {
    width: 200,
    height: 100,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
    borderStyle: 'dashed',
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameHint: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  fullBtn: { width: '100%' },
  btnLight: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  btnDark: { color: colors.text, fontWeight: '700', fontSize: 15 },
  manualCard: { padding: space.lg },
  hint: { textAlign: 'center', color: colors.textMuted, fontSize: 13 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.md,
  },
  cardTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 4, marginTop: space.sm },
  readonly: {
    backgroundColor: colors.background,
    padding: space.sm,
    borderRadius: radii.sm,
    fontSize: 16,
    color: colors.text,
  },
  readonlyMono: {
    backgroundColor: colors.background,
    padding: space.sm,
    borderRadius: radii.sm,
    fontSize: 15,
    fontFamily: 'monospace',
    color: colors.text,
  },
  row: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
})
