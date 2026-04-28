import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ArmazenagemListScreen } from '../screens/wms/ArmazenagemListScreen'
import { ArmazenagemTarefaItensScreen } from '../screens/wms/ArmazenagemTarefaItensScreen'
import { ConferenciaListaScreen } from '../screens/wms/ConferenciaListaScreen'
import { ConferenciaPedidoItensScreen } from '../screens/wms/ConferenciaPedidoItensScreen'
import { ConferenciaTarefaItensScreen } from '../screens/wms/ConferenciaTarefaItensScreen'
import { MovimentacaoPorEnderecoScreen } from '../screens/wms/MovimentacaoPorEnderecoScreen'
import { MovimentacaoPorProdutoScreen } from '../screens/wms/MovimentacaoPorProdutoScreen'
import { MovimentacaoProativaHubScreen } from '../screens/wms/MovimentacaoProativaHubScreen'
import { SeparacaoListaScreen } from '../screens/wms/SeparacaoListaScreen'
import { SeparacaoOrdemItensScreen } from '../screens/wms/SeparacaoOrdemItensScreen'
import { SeparacaoTarefaItensScreen } from '../screens/wms/SeparacaoTarefaItensScreen'
import { RecebimentoListScreen } from '../screens/wms/RecebimentoListScreen'
import { RecebimentoNotaItensScreen } from '../screens/wms/RecebimentoNotaItensScreen'
import { DashboardScreen } from '../screens/DashboardScreen'
import { ShowcaseComponentsScreen } from '../screens/ShowcaseComponentsScreen'
import type { HomeStackParamList } from './types'

const Stack = createNativeStackNavigator<HomeStackParamList>()

export function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="ShowcaseComponents" component={ShowcaseComponentsScreen} />
      <Stack.Screen name="RecebimentoLista" component={RecebimentoListScreen} />
      <Stack.Screen name="RecebimentoNotaItens" component={RecebimentoNotaItensScreen} />
      <Stack.Screen name="ArmazenagemLista" component={ArmazenagemListScreen} />
      <Stack.Screen name="ArmazenagemTarefaItens" component={ArmazenagemTarefaItensScreen} />
      <Stack.Screen name="MovimentacaoProativaHub" component={MovimentacaoProativaHubScreen} />
      <Stack.Screen name="MovimentacaoPorEndereco" component={MovimentacaoPorEnderecoScreen} />
      <Stack.Screen name="MovimentacaoPorProduto" component={MovimentacaoPorProdutoScreen} />
      <Stack.Screen name="SeparacaoLista" component={SeparacaoListaScreen} />
      <Stack.Screen name="SeparacaoOrdemItens" component={SeparacaoOrdemItensScreen} />
      <Stack.Screen name="SeparacaoTarefaItens" component={SeparacaoTarefaItensScreen} />
      <Stack.Screen name="ConferenciaLista" component={ConferenciaListaScreen} />
      <Stack.Screen name="ConferenciaPedidoItens" component={ConferenciaPedidoItensScreen} />
      <Stack.Screen name="ConferenciaTarefaItens" component={ConferenciaTarefaItensScreen} />
    </Stack.Navigator>
  )
}
