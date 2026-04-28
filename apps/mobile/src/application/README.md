# Application Layer

Esta camada concentra regras de negócio e orquestração de casos de uso.

## Estrutura

- `DomainError.ts`
  - erro tipado da camada de domínio/aplicação.
  - use `code` para decisões de UI, evitando comparação por texto.
- `use-cases/`
  - ações de negócio (`*UseCase`) consumidas por screens/components/services.
  - `index.ts` atua como barrel para imports padronizados.

## Regras de contribuição

1. **UI não chama API direto** quando houver regra de negócio.
2. **Use case lança `DomainError`** para validações de domínio.
3. **Tela trata por código** (`isDomainError(error) && error.code === ...`).
4. **Importe use-cases via barrel**:
   - `import { loadRecebimentoListUseCase } from '../../application/use-cases'`
5. Cada use case deve ser:
   - pequeno,
   - explícito em parâmetros,
   - sem dependência de componentes React.

## Checklist para novo use-case

- [ ] Nome termina com `UseCase`
- [ ] Parâmetros tipados
- [ ] Sem lógica de apresentação (Alert/Toast/UI)
- [ ] Erros de domínio com `DomainError` quando aplicável
- [ ] Exportado no `use-cases/index.ts`
