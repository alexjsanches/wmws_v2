import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ConsultaProdutoScreen } from '../screens/ConsultaProdutoScreen'
import { FerramentasInicioScreen } from '../screens/FerramentasInicioScreen'
import { GerenciaProdutosExtratoScreen } from '../screens/GerenciaProdutosExtratoScreen'
import { WmsConfiguracoesScreen } from '../screens/WmsConfiguracoesScreen'
import type { FerramentasStackParamList } from './types'

const Stack = createNativeStackNavigator<FerramentasStackParamList>()

export function FerramentasStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="FerramentasInicio">
      <Stack.Screen name="FerramentasInicio" component={FerramentasInicioScreen} />
      <Stack.Screen name="ConsultaProduto" component={ConsultaProdutoScreen} />
      <Stack.Screen name="GerenciaExtrato" component={GerenciaProdutosExtratoScreen} />
      <Stack.Screen name="WmsConfiguracoes" component={WmsConfiguracoesScreen} />
    </Stack.Navigator>
  )
}
