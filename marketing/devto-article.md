# Artigo Dev.to

---

# Como Criei um Agregador de Noticias com IA que Monitora Portais em Tempo Real

## Introducao

Voce ja sentiu falta de um lugar unico para acompanhar todas as noticias, sem precisar visitar 10 sites diferentes? Eu tambem. E foi assim que nasceu o **Radar RSS**.

Neste artigo, vou compartilhar como criei um agregador de noticias que nao so coleta feeds RSS, mas tambem usa Inteligencia Artificial para fazer curadoria e organizar automaticamente por categorias.

## O Problema

Todo dia eu visitava:
- Google News
- Tecnologia (Tudocelular, Olhar Digital)
- Economia (InfoMoney, Exame)
- Sites de nicho

Era tedioso e eu perdia noticias importantes porque nao tinha tempo de visitar tudo.

## A Solucao: Radar RSS

O Radar RSS resolve isso de forma simples:

```
┌─────────────────────────────────────────────────┐
│                  RADAR RSS                       │
├─────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ Portal 1│  │ Portal 2│  │ Portal N│   ...   │
│  └────┬────┘  └────┬────┘  └────┬────┘        │
│       │            │            │              │
│       ▼            ▼            ▼              │
│  ┌─────────────────────────────────────┐      │
│  │         Motor de Coleta RSS         │      │
│  └─────────────────────────────────────┘      │
│                      │                         │
│                      ▼                         │
│  ┌─────────────────────────────────────┐      │
│  │      IA de Curadoria e Filtro       │      │
│  └─────────────────────────────────────┘      │
│                      │                         │
│                      ▼                         │
│  ┌─────────────────────────────────────┐      │
│  │   Organizacao por Categorias        │      │
│  │   - Manchetes                       │      │
│  │   - Tecnologia                      │      │
│  │   - Economia                        │      │
│  │   - Mais...                         │      │
│  └─────────────────────────────────────┘      │
└─────────────────────────────────────────────────┘
```

## Stack Tecnica

### Backend (Python)
```python
# Exemplo de coleta de feeds
import feedparser

def coletar_noticias(url):
    feed = feedparser.parse(url)
    noticias = []
    
    for entry in feed.entries:
        noticia = {
            'titulo': entry.title,
            'link': entry.link,
            'resumo': entry.summary,
            'data': entry.published
        }
        noticias.append(noticia)
    
    return noticias
```

### IA para Curadoria
O sistema usa IA para:
- Classificar noticias por relevancia
- Filtrar conteudo duplicado
- Gerar resumos automaticos
- Sugerir categorias

### Automacao (PowerShell)
Scripts para:
- Atualizacao automatica
- Configuracao do sistema
- Gerenciamento de feeds

## Funcionalidades

### 1. Monitoramento em Tempo Real
O Radar RSS verifica novos articles a cada 5 minutos e notifica quando ha algo relevante.

### 2. Organizacao por Categorias
As noticias sao automaticamente classificadas:
- **Manchetes**: Noticias principais do dia
- **Tecnologia**: Novos gadgets, softwares, startups
- **Economia**: Mercado, investimentos, empresas
- **Personalizado**: Crie suas proprias categorias

### 3. Curadoria com IA
A IA aprende com suas preferencias e prioriza noticias que sao mais relevantes para voce.

## Como Instalar

### Windows
1. Acesse https://github.com/dznass-cmd/RadarRSS/releases
2. Baixe `RSS.Radar.Setup.1.0.5.exe`
3. Execute e siga as instrucoes

### Para Desenvolvedores
```bash
git clone https://github.com/dznass-cmd/RadarRSS.git
cd RadarRSS
python -m pip install -r requirements.txt
python main.py
```

## Aprendizados

### O que funcionou:
- **Simplicidade**: Mantive a interface limpa e focada
- **IA util**: Nao e IA por IA, ela resolve um problema real
- **Comunidade**: Pessoas adoram ferramentas de produtividade

### O que eu faria diferente:
- **Testes**: Comecei com testes desde o inicio
- **Documentacao**: Escreva docs antes de publicar
- **Feedback**: Colete feedback antes de lançar

## Proximos Passos

- [ ] Suporte a Linux e Mac
- [ ] App mobile
- [ ] Integracao com Telegram/Discord
- [ ] Compartilhamento de feeds entre usuarios
- [ ] API para desenvolvedores

## Contribuindo

O projeto e open source e aceita contribuicoes!

1. Fork o repositorio
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudancas (`git commit -m 'feat: add nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Conclusao

Criar o Radar RSS me mostrou que as melhores ferramentas sao as que resolvem problemas reais do dia a dia. Nao precisamos de IA complicada, precisamos de IA que facilite a vida.

Se voce tambem sente falta de um agregador de noticias inteligente, experimente o Radar RSS e me conte o que achou!

---

**Links:**
- GitHub: https://github.com/dznass-cmd/RadarRSS
- Releases: https://github.com/dznass-cmd/RadarRSS/releases
- Issues: https://github.com/dznass-cmd/RadarRSS/issues

---

**Tags:** `opensource` `python` `ai` `rss` `news` `productivity`

---

## Dicas para Dev.to:

1. **Titulo**: Use numeros e palavras-chave ("Como Criei", "IA", "Tempo Real")
2. **Cover Image**: Crie uma imagem 1200x675px com logo e titulo
3. **Tags**: Use max 4 tags relevantes
4. **Horario**: Poste entre 8h-10h ou 14h-16h (EST)
5. **Engajamento**: Responda comentarios rapidamente
6. **Cross-post**: Compartilhe no Twitter e LinkedIn
