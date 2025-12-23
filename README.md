# Go Rumo

Um aplicativo desktop de **Pomodoro Timer** com **lista de tarefas integrada**, construído com Electron e React. O app possui uma interface moderna, semi-transparente com efeito glassmorphism, projetado para ficar sempre visível sobre outras janelas durante sessões de trabalho focado.

---

## 📋 Visão Geral

### Funcionalidades Principais

- **Timer Pomodoro**: Ciclos de 25 min (foco), 5 min (pausa curta) e 15 min (pausa longa)
- **Lista de Tarefas**: Criar, deletar e gerenciar status de tarefas (pending → in_progress → completed)
- **Tarefa Focada**: Destacar uma tarefa específica para manter o foco
- **Always on Top**: Janela flutuante que permanece visível sobre outras aplicações
- **Notificações Nativas**: Alertas ao fim de cada ciclo
- **Persistência de Dados**: Todos e configurações salvos localmente via `electron-store`
- **System Tray**: Controle do app via ícone na bandeja do sistema

---

## 🏗️ Arquitetura do Projeto

### Stack Tecnológica

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Electron | ^39.2.6 | Framework desktop |
| React | ^19.2.1 | UI components |
| Vite | ^7.2.6 | Bundler |
| electron-vite | ^5.0.0 | Build tool para Electron |
| electron-store | ^11.0.2 | Persistência local |
| pnpm | - | Package manager |

### Estrutura de Diretórios

```
src/
├── main/                    # Processo Principal (Electron)
│   └── index.js            # Entry point, window management, IPC handlers, tray
│
├── preload/                 # Bridge entre Main e Renderer
│   └── index.js            # API exposta via contextBridge
│
└── renderer/                # Interface React
    ├── index.html          # HTML template
    └── src/
        ├── App.jsx         # Componente raiz
        ├── main.jsx        # Entry point React
        ├── assets/
        │   └── main.css    # Estilos globais (488 linhas)
        ├── components/
        │   ├── FocusedTask.jsx   # Exibe tarefa em destaque
        │   ├── Timer.jsx         # Timer Pomodoro com controles
        │   ├── TitleBar.jsx      # Barra de título customizada
        │   └── TodoList.jsx      # Lista de tarefas
        └── hooks/
            ├── useTimer.js       # Lógica do timer Pomodoro
            └── useTodos.js       # Gerenciamento de tarefas
```

---

## 🔧 Detalhes Técnicos Importantes

### Processo Principal (`src/main/index.js`)

**Configurações da Janela:**
```javascript
{
  width: 320, height: 500,
  minWidth: 280, minHeight: 400,
  frame: false,              // Sem borda nativa
  transparent: true,         // Fundo transparente
  alwaysOnTop: true,         // Sempre visível
  vibrancy: 'hud',           // Efeito macOS
  titleBarStyle: 'hiddenInset' // Traffic lights nativos
}
```

**IPC Handlers Disponíveis:**

| Handler | Tipo | Descrição |
|---------|------|-----------|
| `get-always-on-top` | invoke | Retorna estado de always-on-top |
| `set-always-on-top` | send | Define always-on-top |
| `minimize-window` | send | Minimiza janela |
| `close-window` | send | Esconde janela (não fecha) |
| `show-notification` | send | Exibe notificação nativa |
| `get-todos` | invoke | Retorna lista de todos salvos |
| `save-todos` | send | Salva lista de todos |
| `get-focused-todo-id` | invoke | Retorna ID da tarefa focada |
| `save-focused-todo-id` | send | Salva ID da tarefa focada |

### Preload API (`src/preload/index.js`)

A API exposta para o renderer via `window.api`:

```javascript
window.api = {
  getAlwaysOnTop: () => Promise<boolean>,
  setAlwaysOnTop: (value: boolean) => void,
  minimizeWindow: () => void,
  closeWindow: () => void,
  showNotification: (title: string, body: string) => void,
  getTodos: () => Promise<Todo[]>,
  saveTodos: (todos: Todo[]) => void,
  getFocusedTodoId: () => Promise<string | null>,
  saveFocusedTodoId: (id: string | null) => void
}
```

### Modelo de Dados

**Todo Object:**
```javascript
{
  id: string,           // UUID gerado via crypto.randomUUID()
  text: string,         // Texto da tarefa
  status: 'pending' | 'in_progress' | 'completed'
}
```

**Status Flow:** `pending` → `in_progress` → `completed` → `pending` (ciclo)

### Timer Hook (`src/renderer/src/hooks/useTimer.js`)

**Modos do Timer:**

| Modo | Duração | Cor |
|------|---------|-----|
| `focus` | 25 min | `#e74c3c` |
| `shortBreak` | 5 min | `#27ae60` |
| `longBreak` | 15 min | `#3498db` |

**Lógica de Ciclos:**
- A cada 4 ciclos de foco completos → pausa longa
- Após pausa → volta para foco automaticamente
- Som e notificação ao completar cada ciclo

**Retorno do Hook:**
```javascript
{
  mode,              // 'focus' | 'shortBreak' | 'longBreak'
  timeLeft,          // Segundos restantes
  isRunning,         // Estado do timer
  completedCycles,   // Total de ciclos completos
  currentMode,       // { duration, label, color }
  progress,          // 0-1 para barra de progresso
  formattedTime,     // "MM:SS"
  toggle,            // Play/pause
  reset,             // Reinicia modo atual
  switchMode,        // Muda para outro modo
  skipToNext,        // Pula para próximo ciclo
  cyclesInCurrentSet // 0-3 (ciclos antes da pausa longa)
}
```

### Todos Hook (`src/renderer/src/hooks/useTodos.js`)

**Retorno do Hook:**
```javascript
{
  todos,           // Array de todos
  focusedTodo,     // Todo focado ou undefined
  focusedTodoId,   // ID do todo focado
  completedCount,  // Quantidade de completos
  inProgressCount, // Quantidade em progresso
  totalCount,      // Total de tarefas
  addTodo,         // (text: string) => void
  deleteTodo,      // (id: string) => void
  advanceStatus,   // (id: string) => void - avança status
  setFocusedTodo,  // (id: string) => void - toggle focus
  STATUS           // Constantes { PENDING, IN_PROGRESS, COMPLETED }
}
```

---

## 🎨 Sistema de Estilos

### CSS Variables Principais (`main.css`)

```css
:root {
  --mode-color: #10b981;           /* Cor dinâmica baseada no modo */
  --mode-color-rgb: 16, 185, 129;  /* Versão RGB para rgba() */

  --bg-primary: rgba(30, 30, 35, 0.12);
  --bg-card: rgba(255, 255, 255, 0.02);
  --bg-button: rgba(255, 255, 255, 0.06);

  --border-color: rgba(255, 255, 255, 0.18);
  --text-primary: rgba(255, 255, 255, 0.88);
  --text-secondary: rgba(255, 255, 255, 0.45);

  --radius: 24px;
  --radius-sm: 12px;
}
```

**Cores por Modo (atualizadas dinamicamente):**
```javascript
const MODE_COLORS = {
  focus: { color: '#10b981', rgb: '16, 185, 129' },
  shortBreak: { color: '#51cf66', rgb: '81, 207, 102' },
  longBreak: { color: '#339af0', rgb: '51, 154, 240' }
}
```

### Classes CSS Importantes

| Classe | Componente | Descrição |
|--------|------------|-----------|
| `.app-container` | App | Container principal com glassmorphism |
| `.title-bar` | TitleBar | Barra arrastável |
| `.timer-section` | Timer | Seção do cronômetro |
| `.todo-section` | TodoList | Seção de tarefas |
| `.todo-item` | TodoItem | Item individual |
| `.focused-task` | FocusedTask | Banner da tarefa focada |

---

## 🚀 Comandos

```bash
# Instalar dependências
pnpm install

# Desenvolvimento com hot-reload
pnpm dev

# Build de produção
pnpm build:win    # Windows
pnpm build:mac    # macOS
pnpm build:linux  # Linux

# Lint e formatação
pnpm lint
pnpm format
```

---

## ⚠️ Pontos de Atenção para Desenvolvimento

1. **Transparência da Janela**: O app usa `transparent: true` e `vibrancy` - cuidado ao modificar estilos de fundo

2. **IPC Assíncrono**: Use `invoke` para operações que retornam dados, `send` para fire-and-forget

3. **Persistência**: Dados são salvos automaticamente quando `todos` ou `focusedTodoId` mudam (via `useEffect`)

4. **Status Migration**: O hook `useTodos` migra dados antigos que usavam `completed: boolean` para o novo sistema de `status`

5. **Timer Completion**: O `useRef` `hasCompletedRef` previne execução dupla do callback de conclusão

6. **Traffic Lights macOS**: Posicionados em `{ x: 12, y: 12 }` com espaçador de 72px na title bar

7. **Close vs Hide**: O botão de fechar **esconde** a janela (vai para tray), não fecha o app

---

## 🛠️ IDE Setup Recomendado

- [VS Code](https://code.visualstudio.com/)
- [ESLint Extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier Extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

---

## 📁 Arquivos de Configuração

| Arquivo | Propósito |
|---------|-----------|
| `electron.vite.config.mjs` | Configuração Vite para Electron |
| `electron-builder.yml` | Configuração de build/empacotamento |
| `eslint.config.mjs` | Regras de linting |
| `build/entitlements.mac.plist` | Permissões macOS |
