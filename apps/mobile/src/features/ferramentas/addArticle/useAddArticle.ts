import { useCallback, useState } from 'react'
import { Alert } from 'react-native'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { MainTabParamList } from '../../../navigation/types'
import { postRecebimentoTarefa } from '../../../services/wmsApi'

type Props = BottomTabScreenProps<MainTabParamList, 'Adicionar'>

export function useAddArticle(navigation: Props['navigation']) {
  const [tipo, setTipo] = useState('')
  const [nunota, setNunota] = useState('')
  const [descrNunota, setDescrNunota] = useState('')
  const [criando, setCriando] = useState(false)

  const onTipoChange = useCallback((v: string) => {
    setTipo(v)
  }, [])

  const criarRecebimentoEAbrir = useCallback(async () => {
    const n = Number(String(nunota).trim())
    if (!Number.isFinite(n) || n <= 0) {
      Alert.alert('Recebimento', 'Informe a nota (NUNOTA) e use a lupa para validar.')
      return
    }
    setCriando(true)
    try {
      const { nutarefa, codemp } = await postRecebimentoTarefa({ nunota: n })
      navigation.navigate('Home', {
        screen: 'RecebimentoNotaItens',
        params: { nunota: n, codemp, nutarefa },
      })
    } catch (e) {
      Alert.alert('Recebimento', e instanceof Error ? e.message : 'Não foi possível criar a tarefa.')
    } finally {
      setCriando(false)
    }
  }, [navigation, nunota])

  return {
    tipo,
    setTipo,
    nunota,
    setNunota,
    descrNunota,
    setDescrNunota,
    criando,
    onTipoChange,
    criarRecebimentoEAbrir,
  }
}
