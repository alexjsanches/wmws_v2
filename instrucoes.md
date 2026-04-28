# WMS WorldSeg — Blueprint v1

> Documento de referência para o Cursor iniciar o projeto `wms_v2`.  
> Stack: React Native + Expo / Node.js + Fastify / Oracle (Sankhya)

---

## 1. Estrutura do Monorepo

```
wms_v2/
├── apps/
│   ├── mobile/          # React Native + Expo
│   └── api/             # Node.js + Fastify (já existe no Render — só adicionar endpoints)
├── packages/
│   └── types/           # Contratos TypeScript compartilhados
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

### pnpm-workspace.yaml
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### turbo.json
```json
{
  "pipeline": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "dev": { "cache": false, "persistent": true }
  }
}
```

---

## 2. Stack Definitiva

| Camada | Tecnologia | Observação |
|---|---|---|
| Mobile | React Native + Expo (dev client) | TypeScript |
| Navegação | React Navigation | Stack + Bottom Tabs |
| Estado | TanStack Query (React Query) | Cache de API, sem Redux |
| Formulários | react-hook-form + zod | Validação tipada |
| Scanner | Input HID (Eyoyo via OTG) + fallback manual | Campo de texto focado recebe scan como teclado |
| Backend | Node.js + Fastify | Já existe no Render |
| Banco (driver) | `oracledb` (driver oficial Oracle) | SQL puro, sem ORM |
| Auth | Sankhya como provedor | Não reescrever gestão de usuários |
| Build | EAS Build | Android prioritário |
| Lint | ESLint + Prettier + Husky | |

---

## 3. Modelo de Dados — Construtor de Telas Sankhya

> Tabelas criadas via **Configurações > Avançado > Construtor de Telas**.  
> O Sankhya gerencia o DDL automaticamente — não executar scripts SQL.  
> Todas as tabelas recebem prefixo `AD_` automaticamente.

---

### 3.1 AD_WMSTAREFA — Tarefa principal

**Tipo:** Tela Mestre  
**Nome da tabela:** `WMSTAREFA` → criada como `AD_WMSTAREFA`

**Chave Primária:**

| Nome do Campo | Descrição | Tipo | Autonumerado |
|---|---|---|---|
| NUTAREFA | Número da Tarefa | Número Inteiro | ✅ Sim |

**Campos:**

| Nome do Campo | Descrição | Tipo de Dados | Apresentação | Permite Nulo | Opções (se lista) |
|---|---|---|---|---|---|
| TIPO | Tipo da Tarefa | Texto | Lista de Opções | ❌ Não | REC=Recebimento; ARM=Armazenagem; SEP=Separação; CON=Conferência |
| NUNOTA | Número Único Nota | Número Inteiro | Padrão | ❌ Não | — |
| CODEMP | Código Empresa | Número Inteiro | Padrão | ❌ Não | — |
| CODUSU_CRIOU | Usuário Criou | Número Inteiro | Padrão | ❌ Não | — |
| CODUSU_EXEC | Usuário Executor | Número Inteiro | Padrão | ✅ Sim | — |
| DTHCRIACAO | Data/Hora Criação | Data e Hora | Padrão | ❌ Não | — |
| DTHINI | Data/Hora Início | Data e Hora | Padrão | ✅ Sim | — |
| DTHFIM | Data/Hora Conclusão | Data e Hora | Padrão | ✅ Sim | — |
| STATUS | Status da Tarefa | Texto | Lista de Opções | ❌ Não | P=Pendente; A=Aberta; C=Concluída; D=Divergência |
| NUTAREFA_ORIG | Tarefa de Origem | Número Inteiro | Padrão | ✅ Sim | — |
| OBSINTERNO | Observação Interna | Texto | Caixa de Texto | ✅ Sim | — |

> **NUTAREFA_ORIG** referencia a própria `AD_WMSTAREFA`. Conecta ARM→REC e CON→SEP.  
> **DTHCRIACAO** — configurar expressão de UPDATE: `SYSDATE` para preenchimento automático.

---

### 3.2 AD_WMSTAREFAITE — Itens da tarefa

**Tipo:** Tela Detalhe de `AD_WMSTAREFA`  
**Nome da tabela:** `WMSTAREFAITE` → criada como `AD_WMSTAREFAITE`

**Chave Primária:**

| Nome do Campo | Descrição | Tipo | Autonumerado |
|---|---|---|---|
| NUTAREFA | Número da Tarefa (herdado da mestre) | Número Inteiro | ❌ (herda) |
| NUITEM | Número do Item | Número Inteiro | ✅ Sim |

**Campos:**

| Nome do Campo | Descrição | Tipo de Dados | Apresentação | Permite Nulo | Opções (se lista) |
|---|---|---|---|---|---|
| CODPROD | Código do Produto | Número Inteiro | Padrão | ❌ Não | — |
| CONTROLE | Controle/Lote | Texto | Padrão | ✅ Sim | — |
| QTDPREVISTA | Quantidade Prevista | Número Decimal | Padrão | ❌ Não | — |
| QTDREALIZADA | Quantidade Realizada | Número Decimal | Padrão | ✅ Sim | — |
| CODLOCAL_ORIG | Local de Origem | Número Inteiro | Padrão | ✅ Sim | — |
| CODLOCAL_DEST | Local de Destino | Número Inteiro | Padrão | ✅ Sim | — |
| LOCAL_LIVRE | Local Livre (texto) | Texto | Padrão | ✅ Sim | — |
| STATUS | Status do Item | Texto | Lista de Opções | ❌ Não | P=Pendente; C=Confirmado; D=Divergência; N=Não encontrado |

> **LOCAL_LIVRE** — usado quando não há endereço estruturado: "Área de Conferência", "Elevador 2", "Doca 3".  
> **CODLOCAL_ORIG / CODLOCAL_DEST** — importar campo de `TGFLOC` (CODLOCAL) para habilitar pesquisa de locais.

---

### 3.3 AD_WMSDIVERG — Divergências

**Tipo:** Tela Detalhe de `AD_WMSTAREFA`  
**Nome da tabela:** `WMSDIVERG` → criada como `AD_WMSDIVERG`

**Chave Primária:**

| Nome do Campo | Descrição | Tipo | Autonumerado |
|---|---|---|---|
| NUTAREFA | Número da Tarefa (herdado da mestre) | Número Inteiro | ❌ (herda) |
| NUDIVERG | Número da Divergência | Número Inteiro | ✅ Sim |

**Campos:**

| Nome do Campo | Descrição | Tipo de Dados | Apresentação | Permite Nulo | Opções (se lista) |
|---|---|---|---|---|---|
| NUITEM | Número do Item | Número Inteiro | Padrão | ❌ Não | — |
| TIPO | Tipo de Divergência | Texto | Lista de Opções | ❌ Não | F=Falta; S=Sobra; E=Erro de Produto |
| QTDPREVISTA | Quantidade Prevista | Número Decimal | Padrão | ❌ Não | — |
| QTDENCONTRADA | Quantidade Encontrada | Número Decimal | Padrão | ❌ Não | — |
| RESOLUCAO | Resolução | Texto | Lista de Opções | ✅ Sim | P=Pendente; C=Corte; R=Recontagem; A=Aceito |
| OBSRESOLUCAO | Observação da Resolução | Texto | Caixa de Texto | ✅ Sim | — |
| DTHRESOLUCAO | Data/Hora Resolução | Data e Hora | Padrão | ✅ Sim | — |
| CODUSU_RESOLV | Usuário que Resolveu | Número Inteiro | Padrão | ✅ Sim | — |

---

## 4. Encadeamento de Tarefas

```
NF de Compra
    ↓
[TAREFA REC] Recebimento
    → ao concluir, cria automaticamente:
    ↓
[TAREFA ARM] Armazenagem
    → itens com pedido reservado → LOCAL_LIVRE = "Área de Conferência" (cross-docking)
    → demais itens → operador informa endereço de prateleira
    → pode ser outro operador (tarefa fica STATUS='P')

Pedido de Venda
    ↓
[TAREFA SEP] Separação
    → ao concluir, cria automaticamente:
    ↓
[TAREFA CON] Conferência
    → valida físico vs pedido
    → trata divergências (corte)
    → informa local deixado
    → libera para faturamento
```

**NUTAREFA_ORIG** conecta o encadeamento:
- `ARM.NUTAREFA_ORIG = REC.NUTAREFA`
- `CON.NUTAREFA_ORIG = SEP.NUTAREFA`

---

## 5. Contratos de Endpoint

> Prefixo base: `/api/wms`  
> Auth: token Sankhya repassado no header `Authorization: Bearer <token>`

### 5.1 Auth (Sprint 1)

```
POST /auth/login
  body: { usuario: string, senha: string }
  res:  { token: string, codusu: number, nomeusu: string }

GET  /auth/me
  res: { codusu: number, nomeusu: string, perfil: string }
```

### 5.2 Recebimento (Sprint 2)

```
GET  /recebimento/notas-pendentes
  res: TarefaResumo[]
  desc: NFs de compra sem tarefa REC concluída

GET  /recebimento/nota/:nunota/itens
  res: ItemNota[]
  desc: Itens da NF para conferência item a item

POST /recebimento/tarefa
  body: { nunota: number, codemp: number }
  res:  { nutarefa: number }
  desc: Cria tarefa REC e retorna o ID

PATCH /recebimento/tarefa/:nutarefa/item/:nuitem
  body: { qtdrealizada: number, controle?: string }
  res:  { ok: boolean }
  desc: Grava conferência de um item

POST /recebimento/tarefa/:nutarefa/concluir
  body: { divergencias?: Divergencia[] }
  res:  { nutarefa_arm: number }
  desc: Conclui REC, cria tarefa ARM, retorna ID da ARM
```

### 5.3 Armazenagem (Sprint 3)

```
GET  /armazenagem/tarefas-pendentes
  res: TarefaResumo[]

GET  /armazenagem/tarefa/:nutarefa/itens
  res: ItemArmazenagem[]
  desc: Inclui flag cross_docking=true para itens com pedido reservado

PATCH /armazenagem/tarefa/:nutarefa/item/:nuitem
  body: { codlocal_dest?: number, local_livre?: string, qtdrealizada: number }
  res:  { ok: boolean }
  desc: Registra guarda do item e atualiza endereço no cadastro do produto

POST /armazenagem/tarefa/:nutarefa/concluir
  res: { ok: boolean }
```

### 5.4 Separação (Sprint 4)

```
GET  /separacao/ordens-pendentes
  res: TarefaResumo[]

GET  /separacao/ordem/:nunota/itens
  res: ItemSeparacao[]
  desc: Itens com endereço atual do produto

POST /separacao/tarefa
  body: { nunota: number, codemp: number }
  res:  { nutarefa: number }

PATCH /separacao/tarefa/:nutarefa/item/:nuitem
  body: { qtdrealizada: number, status: 'C' | 'N' }
  res:  { ok: boolean }
  desc: C=Confirmado, N=Não encontrado

POST /separacao/tarefa/:nutarefa/concluir
  body: { local_deixado: string, divergencias?: Divergencia[] }
  res:  { nutarefa_con: number }
  desc: Conclui SEP, cria tarefa CON
```

### 5.5 Conferência (Sprint 5)

```
GET  /conferencia/tarefas-pendentes
  res: TarefaResumo[]

GET  /conferencia/tarefa/:nutarefa/itens
  res: ItemConferencia[]

PATCH /conferencia/tarefa/:nutarefa/item/:nuitem
  body: { qtdrealizada: number, status: 'C' | 'D' }
  res:  { ok: boolean }

POST /conferencia/tarefa/:nutarefa/concluir
  body: { local_deixado: string, divergencias?: Divergencia[] }
  res:  { ok: boolean }
  desc: Trata cortes, libera pedido para faturamento no Sankhya
```

---

## 6. Tipos Compartilhados (packages/types)

```typescript
// packages/types/src/index.ts

export type TipoTarefa = 'REC' | 'ARM' | 'SEP' | 'CON'
export type StatusTarefa = 'P' | 'A' | 'C' | 'D'
export type StatusItem = 'P' | 'C' | 'D' | 'N'
export type TipoDivergencia = 'F' | 'S' | 'E'
export type ResolucaoDivergencia = 'P' | 'C' | 'R' | 'A'

export interface TarefaResumo {
  nutarefa: number
  tipo: TipoTarefa
  nunota: number
  numnota: string
  codemp: number
  nomeemp: string
  parceiro: string
  status: StatusTarefa
  dthcriacao: string
  total_itens: number
  itens_pendentes: number
}

export interface ItemNota {
  nuitem: number
  codprod: number
  descrprod: string
  marca: string
  referencia: string
  ca: string
  codbarra: string
  codvol: string
  qtdprevista: number
  qtdrealizada?: number
  controle?: string
  status: StatusItem
}

export interface ItemSeparacao extends ItemNota {
  modulo: string
  rua: string
  predio: string
  nivel: string
  posicao: string
  estdisp: number
}

export interface ItemArmazenagem extends ItemNota {
  cross_docking: boolean   // true = já tem pedido reservado, não guardar na prateleira
  codlocal_dest?: number
  local_livre?: string
}

export interface Divergencia {
  nuitem: number
  codprod: number
  tipo: TipoDivergencia
  qtdprevista: number
  qtdencontrada: number
  resolucao: ResolucaoDivergencia
  obsresolucao?: string
}
```

---

## 7. Sprints

| Sprint | Entrega | Pré-requisito |
|---|---|---|
| 1 | Monorepo + auth Sankhya + navegação base + scanner base | — |
| 2 | Módulo Recebimento completo com divergências | Sprint 1 |
| 3 | Módulo Armazenagem + cross-docking | Sprint 2 rodando na operação |
| 4 | Módulo Separação | Sprint 3 |
| 5 | Módulo Conferência + liberar faturamento | Sprint 4 |
| 6 | Movimentação proativa (portar do app atual) | Sprint 5 |

> **Regra:** não avançar para a próxima sprint sem validar a anterior na operação real do armazém.

---

## 8. Decisões Registradas

| Decisão | Escolha | Motivo |
|---|---|---|
| Auth | Sankhya como provedor | Operadores já têm usuário, não reescrever gestão |
| Estado mobile | TanStack Query | Fluxos lineares não precisam de Redux |
| Acesso ao banco | `oracledb` direto, SQL puro | Sem ORM — queries no backend, mobile só consome JSON |
| Tabelas | AD_* via Construtor de Telas Sankhya | Sankhya gerencia DDL — sem scripts SQL manuais |
| Endereço | Estruturado (00.00.00.000) + local livre | Nem tudo é prateleira (elevador, doca, área conf.) |
| Scanner | HID via OTG | Eyoyo EY-015 funciona como teclado em qualquer campo |
| Escopo inicial | 5 módulos sequenciais | WMS real, mas construído sprint a sprint |