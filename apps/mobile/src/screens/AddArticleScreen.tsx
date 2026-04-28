import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import { ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, space } from '@wms/theme'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { SelectField } from '../components/ui/SelectField'
import { SnkField } from '../components/ui/SnkField'
import { SnkSuggestionLookup } from '../components/ui/SnkSuggestionLookup'
import { useAddArticle } from '../features/ferramentas/addArticle/useAddArticle'
import type { MainTabParamList } from '../navigation/types'

type Props = BottomTabScreenProps<MainTabParamList, 'Adicionar'>

const tipoOptions = [
  { label: 'Recebimento', value: 'recebimento' },
  { label: 'Separação', value: 'separacao' },
]

export function AddArticleScreen({ navigation }: Props) {
  const {
    tipo,
    nunota,
    descrNunota,
    criando,
    setNunota,
    setDescrNunota,
    onTipoChange,
    criarRecebimentoEAbrir,
  } = useAddArticle(navigation)

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Adicionar" onBack={() => navigation.navigate('Home', { screen: 'Dashboard' })} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Card style={{ padding: space.lg, gap: space.md }}>
          <SelectField
            label="Tipo"
            value={tipo}
            options={tipoOptions}
            onChange={onTipoChange}
            placeholder="Selecionar"
          />

          {tipo === 'recebimento' ? (
            <>
              <SnkField label="Nota (NUNOTA)">
                <SnkSuggestionLookup
                  entityName="CabecalhoNota"
                  fieldName="NUNOTA"
                  keyboardType="numeric"
                  code={nunota}
                  onChangeCode={setNunota}
                  description={descrNunota}
                  onChangeDescription={setDescrNunota}
                />
              </SnkField>
              <Button
                variant="default"
                onPress={() => void criarRecebimentoEAbrir()}
                disabled={criando}
                style={{ marginTop: space.sm }}
              >
                {criando ? 'A criar…' : 'Criar e abrir recebimento'}
              </Button>
            </>
          ) : tipo === 'separacao' ? (
            <Button
              variant="default"
              onPress={() =>
                navigation.navigate('Home', {
                  screen: 'SeparacaoLista',
                })
              }
            >
              Abrir separação
            </Button>
          ) : null}
        </Card>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: space.lg, paddingBottom: space.xl * 2 },
})
