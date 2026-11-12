import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';
import DOMPurify from 'dompurify';

console.log('=== TESTE DO ENGINE DE LEITURA COMPLETA ===\n');

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`✅ [PASS] ${message}`);
}

const mockNewsHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Avanço Histórico em Fusão Nuclear Promete Energia Limpa Infinita</title>
  <meta name="author" content="Dra. Helena Vasconcelos">
  <meta property="og:site_name" content="Radar Ciência & Tech">
  <meta property="og:image" content="https://images.unsplash.com/photo-fusion.jpg">
</head>
<body>
  <nav class="site-nav">
    <a href="/">Home</a>
    <a href="/tecnologia">Tecnologia</a>
    <div class="ads-banner">PROPAGANDA BANNER QUE DEVE SUMIR</div>
  </nav>

  <aside class="sidebar">
    <h3>Mais Lidas</h3>
    <ul>
      <li>Notícia 1</li>
      <li>Notícia 2</li>
    </ul>
    <div class="banner-ad">ADVERTISEMENT</div>
  </aside>

  <main>
    <article class="news-article">
      <header>
        <h1 class="headline">Avanço Histórico em Fusão Nuclear Promete Energia Limpa Infinita</h1>
        <p class="byline">Por Dra. Helena Vasconcelos · Publicado em 11 de Novembro de 2026</p>
      </header>

      <figure>
        <img src="https://images.unsplash.com/photo-fusion.jpg" alt="Reator de fusão tokamak em operação" />
        <figcaption>Reator tokamak atingiu temperatura de 100 milhões de graus Celsius por 20 minutos.</figcaption>
      </figure>

      <div class="article-body">
        <p>Cientistas do consórcio global anunciaram nesta quarta-feira que conseguiram manter uma reação de fusão nuclear estável com ganho líquido de energia sustentado por mais de vinte minutos consecutivos.</p>
        
        <div class="inline-ad">CLIQUE AQUI PARA GANHAR DINHEIRO FÁCIL</div>

        <p>O experimento utilizou um reator do tipo tokamak aprimorado com novos supercondutores de alta temperatura, superando todas as metas anteriores estabelecidas pelo setor científico.</p>

        <blockquote>
          "Este é o momento divisor de águas que a humanidade esperou por sete décadas", declarou o coordenador da pesquisa.
        </blockquote>

        <p>Com esse marco alcançado, as primeiras usinas-piloto conectadas à rede elétrica comercial devem iniciar os testes operacionais nos próximos anos.</p>
      </div>

      <div class="comments-section">
        <h3>Comentários (42)</h3>
        <p>Usuário 1: Incrível!</p>
      </div>
    </article>
  </main>

  <footer>
    <p>Todos os direitos reservados © 2026</p>
  </footer>

  <script>
    console.log("malicious tracker script");
    alert("xss");
  </script>
</body>
</html>
`;

// 1. Testa extração do artigo
const { document, window } = parseHTML(mockNewsHtml);
const reader = new Readability(document as any);
const article = reader.parse();

assert(article !== null, 'Readability parseou o documento mock com sucesso');
assert(article!.title.includes('Avanço Histórico em Fusão Nuclear'), 'Título extraído corretamente');
assert(article!.textContent.includes('Cientistas do consórcio global'), 'Texto do corpo do artigo foi preservado');
assert(article!.textContent.includes('reator do tipo tokamak'), 'Segundo parágrafo preservado');
assert(article!.textContent.includes('momento divisor de águas'), 'Citação em blockquote preservada');

// 2. Testa remoção de elementos indesejados
assert(!article!.textContent.includes('PROPAGANDA BANNER'), 'Banners de propaganda do topo foram removidos');
assert(!article!.textContent.includes('Mais Lidas'), 'Sidebar e links de navegação foram removidos');
assert(!article!.textContent.includes('Comentários (42)'), 'Seção de comentários foi removida');

// 3. Testa sanitização com DOMPurify
const purify = DOMPurify(window);
const cleanHtml = purify.sanitize(article!.content);

assert(!cleanHtml.includes('<script>'), 'Scripts foram completamente eliminados pelo DOMPurify');
assert(!cleanHtml.includes('alert('), 'Conteúdo malicioso de scripts foi neutralizado');
assert(cleanHtml.includes('<p>'), 'Tags de parágrafo <p> foram mantidas para formatação');
assert(cleanHtml.includes('<blockquote>'), 'Tags semânticas <blockquote> foram mantidas');

// 4. Testa cálculo de tempo de leitura
const wordCount = (article!.textContent || '').trim().split(/\s+/).length;
const readingTime = Math.max(1, Math.ceil(wordCount / 200));
assert(wordCount > 30, `Contagem de palavras calculada com precisão (${wordCount} palavras)`);
assert(readingTime === 1, `Tempo estimado de leitura correto para texto curto (${readingTime} min)`);

console.log('\n🎉 SUCESSO TOTAL! TODOS OS TESTES DO ENGINE DE LEITURA PASSARAM COM ÊXITO!\n');
