# Radar RSS — Manual de Desenvolvimento e Atualizações

Manual completo para rodar, gerar o programa Windows e publicar novas versões.
Este arquivo fica junto do código-fonte — se precisar, recrie com qualquer editor de texto.

---

## 1. Visão geral do projeto

Leitor de notícias RSS em tempo real com blocos dinâmicos, feeds brasileiros e
internacionais, resumos de IA (Gemini) e alertas de breaking news.

| Camada | Tecnologia |
|---|---|
| Interface | React 19 + TypeScript + Vite + Tailwind CSS 4 |
| Backend | Node.js + Express (servidor embutido, porta local) |
| IA | Google Gemini (`@google/genai`) |
| Desktop | Electron (janela nativa) + electron-builder |
| Atualizações | electron-updater via GitHub Releases |

### Estrutura de pastas

```
Radar Rss/
├── electron/main.cjs        ← janela do desktop + auto-update
├── scripts/
│   ├── build-server.mjs     ← empacota o servidor para produção
│   └── make-icon.js         ← gera o ícone (build/icon.ico)
├── src/                     ← código da interface (React)
├── server.ts                ← backend Express (RSS + Gemini)
├── package.json             ← dependências, scripts e config de build
├── INSTRUCOES.md            ← este arquivo
├── release/                 ← executáveis gerados (ver seção 4)
└── build/icon.ico           ← ícone do programa
```

---

## 2. Onde está tudo neste PC

| Item | Caminho |
|---|---|
| Código-fonte | Pasta raiz do projeto |
| Programa Windows (instalador) | `release\Radar RSS Setup X.Y.Z.exe` |
| Programa Windows (portátil) | `release\Radar RSS X.Y.Z.exe` |
| Programa sem instalar (pasta) | `release\win-unpacked\Radar RSS.exe` |
| Backup do código-fonte | `radar-rss-fonte-vX.Y.Z.zip` |
| Chave da API Gemini | `.env.local` (desenvolvimento) / `.env` ao lado do .exe (produção) |

---

## 3. Rodar em desenvolvimento

**Pré-requisito:** Node.js (versão 18 ou superior).

```bash
npm install          # só na primeira vez (ou após mexer nas dependências)
npm run dev          # abre em http://localhost:3000
```

Outros comandos úteis:

```bash
npm run desktop      # roda em janela do Electron (sem empacotar)
npm run lint         # verifica tipos (TypeScript)
npm run build        # gera a pasta dist/ (site + servidor)
```

**IA (Gemini):** crie o arquivo `.env.local` na raiz com:

```
GEMINI_API_KEY=SUA_CHAVE_AQUI
```

Sem a chave, o app funciona normalmente, mas os recursos de IA
(resumos, curadoria, tradução) mostram erro.

---

## 4. Gerar o programa Windows (.exe)

```bash
npm run build:win
```

Resultado na pasta `release\`:

| Arquivo | Uso |
|---|---|
| `Radar RSS Setup X.Y.Z.exe` | **Instalador** — recomendado (suporta atualização automática) |
| `Radar RSS X.Y.Z.exe` | **Portátil** — roda sem instalar (não se auto-atualiza) |

> Na versão atual, os arquivos são `Radar RSS Setup 2.0.4.exe` e `Radar RSS 2.0.4.exe`.
| `win-unpacked\Radar RSS.exe` | Versão em pasta, sem empacotar |

> O ícone do programa é gerado automaticamente por `npm run make-icon`
> (`scripts/make-icon.js` → `build/icon.ico`). Para outro ícone, basta
> substituir o `build/icon.ico` e rebuildar.

---

## 5. Publicar uma atualização (GitHub Releases)

O app instalado verifica atualizações sozinho ao abrir. Para lançar uma versão nova:

### 5.1. Na primeira vez (configuração única)

1. **Crie um repositório no GitHub** (público ou privado) — este projeto usa `dznass-cmd/RadarRSS`.
2. No `package.json`, em `build.publish`, confira o usuário e repositório (já configurados):

   ```json
   "publish": [
     { "provider": "github", "owner": "dznass-cmd", "repo": "RadarRSS" }
   ]
   ```

3. **Gere um token** em github.com → Settings → Developer settings → Personal access tokens
   (escopo `repo`). No PowerShell, exporte:

   ```powershell
   $env:GH_TOKEN="ghp_..."
   ```

### 5.2. A cada nova versão

1. **Aumente a versão** no `package.json` (ex.: `"version": "1.1.0"`).
2. Rode:

   ```bash
   npm run publish:win
   ```

3. Pronto! O instalador, o `.blockmap` e o `latest.yml` são enviados como uma
   **release publicada** no GitHub, e todos os apps instalados se atualizam sozinhos.

### 5.3. Apontar o app para o repositório sem recompilar

Crie um arquivo `.env` **ao lado do .exe** (na mesma pasta) com uma das opções:

```
# Opção A — GitHub Releases (troca de repositório sem rebuild):
GH_OWNER=SEU_USUARIO_GITHUB
GH_REPO=RadarRSS

# Opção B — servidor genérico próprio:
UPDATE_FEED_URL=https://seusite.com/updates/

# Para repositório PRIVADO, adicione também:
GH_TOKEN=ghp_...
```

A ordem de prioridade é: `UPDATE_FEED_URL` → `GH_OWNER`+`GH_REPO` → config do build.

### 5.5. Publicar automaticamente (GitHub Actions) — opcional

Com o workflow `.github/workflows/release.yml`, **não precisa rodar nada na sua
máquina**: basta criar uma tag com o número da versão e o GitHub builda e
publica a release sozinho (em um runner Windows).

1. Aumente a `version` no `package.json` (ex.: `"version": "2.0.4"`).
2. Envie o código para o repositório e crie a tag:

   ```bash
   git add .
   git commit -m "v2.0.4"
   git tag v2.0.4
   git push origin main --tags
   ```

3. O workflow valida que a tag bate com o `package.json`, roda
   `npm ci` + build e executa `electron-builder --publish always`.

> Requisito: o código (incluindo `package-lock.json` e a pasta
> `.github/workflows/`) precisa estar no repositório `dznass-cmd/RadarRSS`.
> O token `GITHUB_TOKEN` do Actions já tem permissão de escrita — nada a configurar.

### 5.4. Como funciona por baixo

- O app consulta as releases do GitHub e baixa o instalador em segundo plano.
- Mostra o aviso **"Reiniciar agora / Depois"** quando o download termina.
- Se o app for fechado com atualização baixada, ela instala sozinha.
- Erros de atualização (repositório errado, sem internet) **não quebram o app** —
  ficam registrados em silêncio.

---

## 6. Variáveis de ambiente (arquivo `.env` ao lado do .exe)

| Variável | Uso |
|---|---|
| `GEMINI_API_KEY` | Chave da API Gemini (recursos de IA) |
| `UPDATE_FEED_URL` | URL genérica do feed de atualizações |
| `GH_OWNER` / `GH_REPO` | Repositório GitHub para atualizações (sem recompilar) |
| `GH_TOKEN` | Token para repositórios privados |
| `PORT` | Porta do servidor interno (padrão: 3000; o desktop escolhe uma livre) |

---

## 7. Problemas comuns

| Problema | Solução |
|---|---|
| Windows avisa "Proteção do SmartScreen" | O app não tem certificado de assinatura. Clique em **Mais informações → Executar assim mesmo**. |
| Recurso de IA dá erro | Verifique a `GEMINI_API_KEY` no `.env` ao lado do .exe. |
| Porta 3000 ocupada | Feche o outro programa ou defina `PORT=outra_porta` no `.env`. |
| Atualização não chega | Confirme o repositório em `GH_OWNER`/`GH_REPO` ou no `package.json`, e que a versão nova foi publicada (`npm run publish:win`). |
| Dependências quebradas | Apague a pasta `node_modules` e o `package-lock.json` e rode `npm install` de novo. |
| Executável antigo em uso | O instalador atualiza o programa; o portátil não se atualiza sozinho — baixe a nova versão portátil manualmente. |

---

## 8. Fazer backup do código-fonte

O arquivo `radar-rss-fonte-v2.0.4.zip` (na raiz) é uma cópia limpa
do código — sem `node_modules`, `dist` e `release`, que são regeneráveis.

Para gerar um novo backup depois de mudanças:

```powershell
# PowerShell, na pasta do projeto:
tar -a -cf "radar-rss-fonte-v2.0.4.zip" `
  --exclude=node_modules --exclude=dist --exclude=release `
  --exclude=.freebuff --exclude="*.zip" --exclude=.git .
```

> Guarde também o `package-lock.json` (já incluído no zip) — ele garante que a
> instalação das dependências seja idêntica em qualquer máquina.
