<p align="center">
  <img src="./assets/header.svg" alt="Go Rumo - Timer Pomodoro minimalista" width="100%"/>
</p>

<p align="center">
  <strong>Simples. Focado. Gratuito.</strong>
</p>

<p align="center">
  Um timer Pomodoro bonito e sem distrações, com gerenciamento de tarefas integrado.<br/>
  Design glassmorphism inspirado na estética moderna da Apple.
</p>

---

## Funcionalidades

- **Timer Pomodoro** — Ciclos de 25 min foco / 5 min pausa / 15 min pausa longa
- **Gerenciamento de Tarefas** — Crie, acompanhe e complete tarefas sem sair do app
- **Always on Top** — Fica visível enquanto você trabalha, nunca perca a noção do tempo
- **Interface Glassmorphism** — Visual translúcido e elegante que se integra ao seu desktop
- **Notificações Nativas** — Receba alertas quando os ciclos terminarem
- **Offline e Privado** — Dados armazenados localmente, sem contas, sem rastreamento
- **Multiplataforma** — macOS, Windows e Linux

---

## Screenshots

<p align="center">
  <img src="./assets/screenshots/showcase.svg" alt="Go Rumo - Timer e Estatísticas" width="100%"/>
</p>

---

## Instalação

### Download

Baixe a versão mais recente para sua plataforma:

- **macOS** — `.dmg`
- **Windows** — `.exe`
- **Linux** — `.AppImage`

> [Baixar última versão](https://github.com/omarcusdev/go-rumo/releases)

### Compilar do código fonte

```bash
# Clone o repositório
git clone https://github.com/omarcusdev/go-rumo.git
cd go-rumo

# Instale as dependências
pnpm install

# Execute em modo desenvolvimento
pnpm dev

# Compile para sua plataforma
pnpm build:mac    # macOS
pnpm build:win    # Windows
pnpm build:linux  # Linux
```

---

## Stack

| Tecnologia | Função |
|------------|--------|
| Electron | Framework desktop |
| React 19 | Componentes UI |
| Vite | Build tool |
| electron-store | Persistência local |

---

## Filosofia

Go Rumo foi criado com uma ideia simples: **um timer Pomodoro deve ajudar você a focar, não distrair**.

- Sem contas ou cadastros
- Sem sincronização na nuvem ou assinaturas
- Sem funcionalidades desnecessárias
- Sem rastreamento ou analytics

Apenas um timer limpo e bonito que não atrapalha.

---

## Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer fork do repositório
2. Criar uma branch (`git checkout -b feature/nova-feature`)
3. Commitar suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abrir um Pull Request

---

## Desenvolvimento

```bash
pnpm dev          # Inicia com hot reload
pnpm build        # Build de produção
pnpm lint         # Executa ESLint
pnpm format       # Formata com Prettier
```

---

## Licença

MIT License — use, modifique, compartilhe.

---

<p align="center">
  Feito com foco por <a href="https://github.com/omarcusdev">@omarcusdev</a>
</p>
