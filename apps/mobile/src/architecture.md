# Padrão de Arquitetura (Mobile WMS)

Objetivo: manter o código modular, previsível e fácil de evoluir.

## Camadas

- `application/use-cases/`
  - Regras de negócio orientadas a ação (`assignWmsTaskUseCase`, `runStartupPoliciesUseCase`).
  - Não renderiza UI.
  - Não usa componentes React.
- `application/DomainError.ts`
  - Erros de domínio tipados por `code`.
  - UI decide comportamento por `code`, não por texto.

- `services/`
  - Infraestrutura e integrações (HTTP, push SDK, storage).
  - Pode ser usada por use cases.

- `features/<modulo>/use*.ts` (hooks de apresentação/orquestração)
  - Orquestram estado de tela, fluxo assíncrono e interação entre use cases/services.
  - Podem chamar `showWmsError/showWmsSuccess/showWmsConfirm` para feedback de fluxo.
  - Não devem conter layout JSX de tela.

- `screens/` e `components/`
  - UI/presentação.
  - Preferir componente declarativo: render + binding de eventos.
  - Evitar regra de negócio e parsing complexo diretamente na tela.

## Convenções

- Nome de use case: `<acao><Contexto>UseCase.ts`
  - Ex.: `assignWmsTaskUseCase`, `registerPushDeviceUseCase`.
- Nome de hook de feature: `use<ContextoOuFluxo>.ts`
  - Ex.: `useConferenciaTaskScreen`, `useMovimentacaoPorProduto`, `useWmsConfiguracoes`.
- Import de use cases deve usar o barrel:
  - `application/use-cases/index.ts`
- Use case deve:
  - receber parâmetros explícitos em objeto quando fizer sentido;
  - validar pré-condições;
  - delegar I/O para `services`;
  - retornar resultado simples ou lançar erro de domínio.
- Hook de feature deve expor API estável e sem aliases legados.
  - Padrões de nomes:
    - `reload` para recarregar dados;
    - `isStarting` / `isSaving` para flags de ação;
    - `startTaskFlow`, `concludeTask`, `saveItem` para ações de fluxo.

## Regras práticas

1. Tela não chama API diretamente quando houver regra de negócio.
2. Se dois fluxos repetem lógica de negócio, extrair para use case.
3. Se dois fluxos repetem orquestração de UI/estado, extrair para hook em `features/`.
4. Mensagens amigáveis ficam na UI/hook; validação e causa técnica ficam no use case.
5. Ao criar novo módulo WMS, seguir ordem:
   - tipos (`types/`),
   - use cases (`application/use-cases/`),
   - hook de feature (`features/.../use*.ts`),
   - tela (`screens/`).

## Fluxo recomendado (checklist)

1. Definir contrato de entrada/saída no use case.
2. Implementar validações com `DomainError` quando aplicável.
3. Criar hook de feature com estado da tela e ações (`reload`, `save*`, `conclude*`).
4. Deixar a screen apenas com renderização, navegação e binding.
5. Validar com `tsc --noEmit` e linter.

