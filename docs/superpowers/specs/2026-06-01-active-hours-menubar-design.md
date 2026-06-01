# Design: "Tempo ativo" — horas ativas do Mac na barra de menu + histórico de 7 dias

- **Data:** 2026-06-01
- **Status:** Aprovado (aguardando revisão da spec)
- **Plataforma alvo:** macOS (a barra de menu via `tray.setTitle` é macOS-only)

## Objetivo

Mostrar, fixo na barra de menu do macOS, quanto tempo o Mac foi usado **ativamente hoje**, e
guardar um histórico dos dias anteriores exibido na tela de Estatísticas que já existe. Entregue
como feature do Go Rumo (não um app novo), reaproveitando a casca Electron, o tray, a persistência
(electron-store) e o padrão de IPC já existentes.

## Decisões (definidas no brainstorming)

| Tema | Decisão |
|------|---------|
| Convivência na barra | **Mostrar os dois**: horas ativas sempre fixas; countdown do Pomodoro aparece junto quando rodando (`3h24m · 25:00`). |
| O que conta como "ativo" | **Uso real (interação)**: conta enquanto há teclado/mouse; pausa após ~5 min ocioso; retoma ao voltar. Não conta Mac parado/sleep/bloqueado. |
| Limiar de ociosidade | **5 minutos** (300s), constante fixa (sem toggle em settings — YAGNI). |
| Escopo | Barra + **histórico de dias** (últimos 7 dias) na seção de Estatísticas existente. |
| Abordagem de UI | **A**: bloco "Tempo ativo" reaproveitando o `StatisticsChart` generalizado. |
| Testes | **vitest** (novo devDependency + script `test`). |
| Estilo na barra | **Texto puro** (`3h24m`), sem ícone/emoji. |

## Comportamento e definições

- **Ativo:** a cada tick (30s), lê `powerMonitor.getSystemIdleTime()` (segundos desde o último
  input). Se `idle < 300s`, o intervalo do tick conta como ativo; caso contrário, não conta. Assim,
  ficar ocioso ≥ 5 min pausa a contagem; voltar a usar retoma.
- **"Hoje":** dia do calendário local, chave `YYYY-MM-DD` derivada do horário local — mesma fronteira
  de dia que o `useRumos` usa (`setHours(0,0,0,0)`). Na virada da meia-noite, o valor da barra zera
  porque passa a escrever em uma nova chave.
- **Barra de menu (sempre visível):**
  - Timer parado: `3h24m`
  - Pomodoro rodando: `3h24m · 25:00`
  - Formato: `Xh YYm` quando há horas (minutos com zero à esquerda, ex. `3h04m`); `YYm` quando < 1h;
    `0m` no começo do dia.
- Sleep, lock e shutdown não contam. O total sobrevive a reinício do app.

## Arquitetura

### Processo principal

**`src/main/activity.js` — `createActivityTracker(deps)`** (novo)

Fábrica baseada em closures, espelhando o estilo de `createTimer`. Dependências injetadas para
manter o núcleo **puro e testável sem Electron**:

```
createActivityTracker({
  onUpdate,                 // ({ today: number, dayKey: string }) => void
  getIdleSeconds,           // () => number   (real: powerMonitor.getSystemIdleTime)
  now,                      // () => Date     (real: () => new Date())
  loadDays,                 // () => Record<string, number>  (real: store.get('activeSeconds', {}))
  saveDays,                 // (Record<string, number>) => void (real: store.set(...))
  idleThresholdSeconds = 300,
  tickMs = 30000,
  retentionDays = 90
}) => ({ start, stop, getToday, getHistory })
```

- Estado em memória: mapa `secondsByDay` (carregado de `loadDays()` na criação) e a chave do dia
  corrente.
- `start()`: agenda `setInterval(tick, tickMs)` e executa um tick imediato.
- `tick()`:
  1. `dayKey` = data local via `now()`.
  2. Se `getIdleSeconds() < idleThresholdSeconds` → `secondsByDay[dayKey] += tickMs / 1000`.
     Incremento **fixo** (não delta de relógio) → imune a sleep/lock, pois o `setInterval` não
     dispara dormindo e não há "salto" para compensar.
  3. Poda chaves além de `retentionDays`, persiste via `saveDays()` e chama
     `onUpdate({ today: secondsByDay[dayKey] ?? 0, dayKey })`.
- `getToday()` → segundos de hoje. `getHistory(days)` → **fonte da verdade** da série: array
  ordenado do mais antigo ao mais recente `[{ dayKey, seconds }]`, com dias ausentes preenchidos
  com `seconds: 0`.

**Persistência (electron-store)**

- Chave `activeSeconds`: `{ 'YYYY-MM-DD': number }` (segundos por dia).
- Gravada a cada update (cadência de 30s é barata). Poda para `retentionDays` (~90) limita o tamanho.

**Compositor da barra (em `src/main/index.js`)**

- Função pura testável: `composeTrayTitle(activeSeconds, timerString) => string`
  - sem timer: `formatActive(activeSeconds)`
  - com timer: `${formatActive(activeSeconds)} · ${timerString}`
- `renderTrayTitle()` aplica `tray.setTitle(composeTrayTitle(activeSecondsToday, timerString))`.
- Fontes passam a chamar o compositor em vez de `setTitle` direto:
  - tracker `onUpdate({ today })` → `activeSecondsToday = today; renderTrayTitle()`
  - timer `onTick(state)` → `timerString = formatTime(state.timeLeft); renderTrayTitle()`
    (e segue mandando `timer:tick` para o renderer como hoje)
  - handlers `timer:toggle` / `timer:reset` / `timer:switch-mode` → após obter o `state`,
    `timerString = state.isRunning ? formatTime(state.timeLeft) : null; renderTrayTitle()`
- Remover o `tray.setTitle('25:00')` inicial; o título inicial passa a vir do valor restaurado de
  hoje (`0m` na primeira execução).
- `formatActive(seconds)`: `h = floor(s/3600)`, `m = floor((s%3600)/60)`;
  `h > 0 ? \`${h}h${String(m).padStart(2,'0')}m\` : \`${m}m\``.

**IPC (`setupIPC` em `index.js`) + preload**

- `ipcMain.handle('get-active-today', () => tracker.getToday())`
- `ipcMain.handle('get-active-history', (_, days = 7) => tracker.getHistory(days))`
- Push dentro do `onUpdate`: `mainWindow?.webContents.send('active:update', { today, dayKey })`
- `window.api` (preload): `getActiveToday()`, `getActiveHistory(days)`,
  `onActiveUpdate(cb)` retornando função de unsubscribe (espelhando `onTimerTick`).

### Renderer (Abordagem A)

**`src/renderer/src/hooks/useActiveHours.js`** (novo)

- Carrega `getActiveToday()` + `getActiveHistory(7)` no mount; assina `onActiveUpdate` para
  atualizar "hoje" ao vivo (limpa a inscrição no unmount).
- Retorna `{ todaySeconds, history }`. Consome a série já preenchida/ordenada de `getActiveHistory(7)`
  e apenas **mapeia para adicionar `label`** de exibição (inicial do dia da semana, ex. `D S T Q Q S S`),
  resultando em `history = [{ dayKey, label, seconds }]`. Não refaz o preenchimento (isso é do tracker).

**`src/renderer/src/components/ActiveHours.jsx`** (novo)

- Bloco "Tempo ativo": valor de hoje em destaque (`3h 24m hoje`) + mini-gráfico de 7 dias.
- Renderizado dentro de `Statistics.jsx` (acima ou abaixo do gráfico de rumos).

**`src/renderer/src/components/StatisticsChart.jsx`** (generalização não-disruptiva)

- Novas props opcionais com defaults que **preservam o comportamento atual de rumos**:
  - `formatValue = (n) => \`${n} ${n === 1 ? 'rumo' : 'rumos'}\``
  - `formatTooltipLabel = formatTooltipDate` (assinatura atual)
- Para horas ativas: dados `[{ label, count: segundos }]`, `formatValue = formatActiveShort`
  (tooltip "3h 24m"), `formatTooltipLabel` = dia da semana/dia.
- A altura da barra (`count / maxValue * 120`) já é genérica — sem mudança estrutural.

**`formatActiveShort(seconds)`** — versão legível para UI ("3h 24m" / "24m" / "0m"). Helper puro;
uma cópia no renderer e a `formatActive` (compacta, sem espaço) no main. (Bundles separados; não há
diretório compartilhado configurado — duas pequenas funções puras é aceitável.)

**`src/renderer/src/assets/main.css`** — estilos do bloco "Tempo ativo".

## Edge cases

- **Sleep/wake:** incremento fixo por tick não infla na volta (o intervalo não roda dormindo).
- **Tela bloqueada:** `getSystemIdleTime()` continua crescendo (sem input) → tratado como ocioso →
  não soma.
- **Meia-noite:** nova chave de dia; "hoje" zera na barra e no gráfico.
- **Primeira execução / sem dados:** `0m` na barra; histórico com zeros.
- **Fuso/DST:** chave de dia derivada do horário local, consistente com as estatísticas existentes
  (edge menor, aceitável).
- **Crescimento do store:** poda para `retentionDays` na gravação.

## Plano de testes (vitest)

- Adicionar `vitest` como devDependency e script `"test": "vitest run"` (+ `"test:watch"`).
- `createActivityTracker` (com `getIdleSeconds`/`now`/`loadDays`/`saveDays` fakes):
  - ticks ativos acumulam `tickMs`; ticks ociosos (idle ≥ limiar) não somam.
  - virada de dia escreve em nova chave; "hoje" zera.
  - restauração após restart (re-cria com `loadDays` populado).
  - gap de sleep (vários minutos sem ticks) não causa overcount.
  - poda respeita `retentionDays`.
- `composeTrayTitle` (com/sem `timerString`).
- `formatActive` / `formatActiveShort` (`0m`, `59m`, `1h00m`, `3h24m`).
- builder de histórico (preenche dias ausentes, ordena, janela de 7).

## Arquivos

- **Novos:** `src/main/activity.js`, `src/renderer/src/hooks/useActiveHours.js`,
  `src/renderer/src/components/ActiveHours.jsx`, testes (`*.test.js`).
- **Editados:** `src/main/index.js` (wire tracker + compositor + IPC), `src/preload/index.js`
  (api), `src/renderer/src/components/Statistics.jsx` (inclui o bloco),
  `src/renderer/src/components/StatisticsChart.jsx` (generalização), `src/renderer/src/assets/main.css`
  (estilos), `package.json` (vitest + script).

## Fora de escopo (YAGNI)

- Limiar de ociosidade configurável ou toggle de "tempo desperto" nas settings.
- O que a barra exibe ser configurável (decidimos "mostrar os dois").
- Sincronização entre dispositivos / export de dados.
- Suporte a Windows/Linux para a contagem na barra (`setTitle` é macOS-only; o histórico na UI
  funciona em qualquer plataforma, mas o tracker pode rodar em todas — a barra é o que é macOS-only).
