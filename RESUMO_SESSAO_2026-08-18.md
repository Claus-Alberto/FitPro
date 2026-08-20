# FitPro — Resumo da Sessão

**Data:** 18 de agosto de 2026
**Repositório:** `FitPro` (Expo Router / React Native, SQLite local)

Sessão longa cobrindo desde a inicialização do projeto até a reconstrução completa do módulo de Treino, com backend real, testes automatizados e um catálogo de exercícios importado e traduzido.

---

## 1. Inicialização (`/init`)

Criado o `CLAUDE.md` do zero — não existia nenhum antes. Documentou:

- Arquitetura de rotas (`/app`, fino) vs. lógica de domínio (`/src/features`, onde a implementação real mora).
- Camada de dados (`src/database/db.ts` + services por feature).
- Convenções de estilo, strings centralizadas (pt-BR) e as 4 regras always-on em `.agents/rules/`.
- Observação: Tailwind/NativeWind está no `package.json` mas não é usado em lugar nenhum do código — tratado como vestigial.

---

## 2. Colocando o app pra rodar

- `npm install` (dependências nunca tinham sido instaladas).
- Primeiro erro: **SDK mismatch** — Expo Go do celular era SDK 56, o projeto SDK 54. Resolvido reinstalando as libs Expo na versão correta do SDK 54 (`expo@~54.0.37` etc.) e corrigindo uma dependência (`babel-preset-expo`) que sumiu no meio do caminho.
- Servidor `expo start` (porta 8081) conectado ao celular via Expo Go — confirmado funcionando com dados reais de SQLite nativo.

---

## 3. Varredura de bugs e mocks

Agente dedicado mapeou **todo o app** atrás de dados mockados/fake — praticamente todas as telas (dashboard, dieta, stats, conquistas, social, mercado, perfil, onboarding) dependem de dados fixos, sem persistência real. Esse mapa guiou a priorização do resto da sessão.

Três bugs visuais reais encontrados e corrigidos na hora:

| Bug | Causa | Correção |
|---|---|---|
| Encoding quebrado na tela Dieta ("RefeiÃ§Ã£o") | String salva com encoding duplicado no arquivo-fonte | Reescrita da string |
| Campos Idade/Altura/Peso sobrepostos no onboarding | `TextInput` com `flex:1` sem `minWidth:0` no RN Web | `minWidth: 0` |
| Gráfico da tela Conquistas quebrando (`<svg width="-100">`) | `Dimensions.get('window')` lido uma única vez no escopo do módulo, podendo capturar `0` | Trocado por `useWindowDimensions()` dentro do componente |

---

## 4. Infraestrutura de teste visual

Sem emulador disponível no ambiente do agente — a solução ficou em duas pernas:

- **Celular via Expo Go** — fonte da verdade (SQLite nativo real).
- **Alvo Web + Playwright headless** — como o agente valida sozinho, sem depender do usuário.

Problema seríssimo descoberto no meio do caminho: o driver SQLite do Expo no alvo Web (`AccessHandlePoolVFS`, baseado em OPFS) trava sob Chromium headless sem os headers de isolamento cross-origin que o Metro não envia — erros aleatórios tipo `unable to open database file`, `Access Handle` já aberto, `xFileControl` undefined.

**A virada:** o usuário sugeriu usar o cache do navegador pra simular o SQLite. Investigando o próprio `expo-sqlite`, achamos que o nome especial `:memory:` roteia pra um motor 100% em RAM (`MemoryVFS`), sem OPFS — zero travamentos. Aplicado **só no alvo Web** (`Platform.OS === 'web'`); o nativo continua com o arquivo físico persistente de sempre. Isso destravou testes ponta-a-ponta completos pela primeira vez.

---

## 5. Módulo de Treino — de mock pra real

Reescrita completa do backend de treino:

**Schema novo** (`src/database/db.ts`): `WorkoutExercises` (exercícios por divisão A/B/C, com `target_sets`/`target_reps`/`library_id`), `WorkoutLogs` + `SetLogs` (registro real de cada treino/série concluída), colunas `total_weeks`/`created_at` em `WorkoutPrograms`.

**`WorkoutService.ts`**: `completeWorkout()` (persiste o treino e avança a fila), `getWorkoutLogByDate/ById`, `getMonthHistory`, `getLastPerformance` (peso/reps "fantasma" real). Reescrita de `getWeeklySchedule()` pra usar datas reais + cursor de fila persistido, em vez da rotação ingênua que não gravava nada.

**Telas religadas**: `CreateProgramScreen` (criação de ficha com exercícios), `ActiveWorkoutScreen` (carrega exercícios reais, persiste ao finalizar), `WorkoutSummaryScreen` (números reais de duração/volume/PRs), `WorkoutDetailScreen` + `history/[date].tsx` + `HistoryCalendarModal` (buscam o treino de verdade por data, em vez dos dicionários fixos de novembro/2023 que existiam antes).

**Bugs reais encontrados e corrigidos no processo:**

- Corrida de inicialização: `getDBConnection()` não garantia que as tabelas existiam antes de outras partes do app consultarem. Corrigido centralizando a garantia de schema dentro do próprio `getDBConnection()`.
- Duas queries usavam aspas duplas pra string literal em SQL (ambíguo entre string e identificador) — trocado por parâmetros.
- `useWorkout` só buscava dados uma vez, no mount — voltar pra aba Treino depois de criar uma ficha ou terminar um treino mostrava dado velho. Trocado por `useFocusEffect`.
- `router.back()` em `CreateProgramScreen` pousava na aba **Social** em vez de Treino — a tela é uma aba "escondida" solta no navigator, não uma rota empilhada, então `back()` cai no fallback (primeira aba da lista). Trocado por `router.replace()` explícito.
- Card de treino concluído com texto sobreposto — o mesmo campo guardava a letra da divisão (A/B) *e* o id do log; separados.
- Numeração de série errada ("Série 0") — índice salvo em base 0, exibido sem `+1`.
- **Migração de schema**: `CREATE TABLE IF NOT EXISTS` não adiciona coluna nova numa tabela que já existe no banco persistente do celular do usuário. Esse bug apareceu **duas vezes** (`WorkoutExercises.library_id`/`target_reps`, depois `WorkoutPrograms.total_weeks`/`created_at`) antes de virar um array de migrações (`ALTER TABLE ... ADD COLUMN`, ignorando erro de "coluna duplicada") em `ensureSchema()`.

**Teste ponta-a-ponta confirmado**: criar ficha → iniciar treino → preencher peso/reps de uma série → marcar concluída → finalizar → resumo com números reais (40kg × 10 reps = 400kg de volume, batendo exato) → dia marcado como concluído no calendário → detalhe do treino mostrando os dados reais.

---

## 6. Catálogo de exercícios (pedido do usuário)

Pedido: importar o dataset público [**exercises-dataset**](https://github.com/hasaneyldrm/exercises-dataset) (hasaneyldrm, MIT) e usá-lo no fluxo de montar ficha.

- Dataset: 1.324 exercícios, categorias/músculos/equipamento bem definidos, instruções em 10 idiomas — **nenhum é português**.
- Mídia (fotos/gifs) é "© Gym Visual", com licença **separada** do MIT do texto — decisão consciente de **não** bundlar nem hotlinkar essa mídia sem licenciamento próprio.
- Os 1.324 nomes de exercício foram traduzidos pra pt-BR (terminologia de academia brasileira) via agentes em paralelo, mais as ~60 categorias/músculos/equipamentos traduzidos à mão. Zero nomes ficaram sem tradução.
- Entra no app como: tabela `ExerciseLibrary` (seedada uma vez de `src/data/exercises.json`, ~1MB, sem mídia), `WorkoutService.searchExerciseLibrary()`, componente `ExercisePickerModal` (busca + filtro por categoria), botão "Buscar Exercício" em `CreateProgramScreen` (mantendo a digitação livre como alternativa pra exercício fora do catálogo).
- Bônus: o modal de "informações" do treino ativo agora mostra o músculo-alvo real do catálogo em vez do texto fixo genérico, quando o exercício veio de lá.

---

## 7. Ajustes de UI (feedback direto do celular do usuário)

Três rodadas de polimento a partir de screenshots reais do Android:

1. **Botão "Buscar no Catálogo de Exercícios"** com ícone sobrepondo o texto → encurtado pra "Buscar Exercício", `gap` trocado por `marginRight` explícito.
2. **Chips de filtro por categoria "quebrados" visualmente** → causa raiz real: o contêiner rolável estava sendo espremido pelo flexbox pra ~10px de altura (contra os 48px pedidos), porque faltava `flexShrink: 0` — o irmão de baixo (`flex: 1`) puxava todo o espaço. Confirmado via inspeção do layout renderizado antes de corrigir, não só tentativa e erro.
3. **Séries e reps sem UI editável** → adicionados dois steppers por exercício (`− 3 +` / `− 12 +`), com coluna nova no banco (`target_reps`). Primeira versão (texto inline "3x séries") estourava a largura em celular real; redesenhada como dois cartõezinhos com label em cima ("SÉRIES"/"REPS") e `flex: 1`, testada numa viewport de 360px com nome de exercício propositalmente longo pra garantir que não quebra mais.

**Padrão identificado e documentado**: a propriedade `gap` do flexbox causou dois bugs reais e reproduzíveis no Android nesta sessão (sobreposição de ícone+texto, e espremimento de altura). Registrado no `CLAUDE.md` pra não ser redescoberto.

---

## 8. Documentação atualizada

`CLAUDE.md` ganhou três seções novas com os aprendizados da sessão, pra próximas sessões não perderem esse contexto:

- **Data layer** ampliada — regra de migração de schema, tabelas novas, nota sobre o `:memory:` no Web e a citação completa da fonte do catálogo de exercícios (nome, autor, URL).
- **Testing & visual verification workflow** — os dois jeitos de validar (celular = fonte da verdade; web + Playwright = iteração autônoma do agente), com as armadilhas práticas (nunca `page.goto()` no meio do fluxo, `Alert.alert` não funciona no RN Web, paths com barra invertida quebram em heredoc, processos `chrome.exe` órfãos).
- **RN / Expo Router gotchas** — `router.back()` em aba escondida, `useEffect([])` que não recarrega ao voltar pra aba, e o `gap` do flexbox.

---

## Estado atual

- `tsc --noEmit`: 10 erros pré-existentes no projeto (nenhum introduzido nesta sessão), verificado em cada rodada de mudança.
- Módulo de Treino funcional de ponta a ponta, testado tanto no preview web quanto no celular real.
- Catálogo de 1.324 exercícios em pt-BR integrado à criação de fichas.
- Ainda mockados (fora do escopo desta sessão): autenticação/onboarding, dashboard, dieta, stats, conquistas/gamificação, perfil, social, mercado — todos dependem da mesma base (sessão de usuário real) que ficou pra uma próxima etapa.
