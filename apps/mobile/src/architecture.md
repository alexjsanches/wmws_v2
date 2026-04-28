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

- `screens/` e `components/`
  - UI/presentação.
  - Aciona use cases e exibe estado/feedback.
  - Evitar regra de negócio complexa aqui.

## Convenções

- Nome de use case: `<acao><Contexto>UseCase.ts`
  - Ex.: `assignWmsTaskUseCase`, `registerPushDeviceUseCase`.
- Import de use cases deve usar o barrel:
  - `application/use-cases/index.ts`
- Use case deve:
  - receber parâmetros explícitos em objeto quando fizer sentido;
  - validar pré-condições;
  - delegar I/O para `services`;
  - retornar resultado simples ou lançar erro de domínio.

## Regras práticas

1. Tela não chama API diretamente quando houver regra de negócio.
2. Se dois fluxos repetem lógica, extrair para use case.
3. Mensagens de erro amigáveis ficam na camada de UI; validação e causa técnica ficam no use case.
4. Ao criar novo módulo WMS, iniciar por:
   - tipos (`types/`),
   - use cases (`application/use-cases/`),
   - só então conectar na tela.

