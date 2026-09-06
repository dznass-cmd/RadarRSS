/**
 * Automated test suite for News Deduplication and Multi-Source Story Clustering.
 * Validates the 10 critical test requirements specified by user.
 */

import { NewsItem } from '../src/types';
import { clusterNewsItems } from '../src/services/clustering/newsClusterService';
import { normalizeCanonicalUrl } from '../src/services/clustering/textUtils';

function createMockArticle(data: Partial<NewsItem>): NewsItem {
  const now = Date.now();
  return {
    id: data.id || `mock-${Math.random().toString(36).slice(2, 8)}`,
    title: data.title || 'Título da Notícia',
    link: data.link || `https://news.example.com/article-${Math.random().toString(36).slice(2, 6)}`,
    contentSnippet: data.contentSnippet || 'Resumo do conteúdo da notícia relevante.',
    pubDate: data.pubDate || new Date().toISOString(),
    timestamp: data.timestamp !== undefined ? data.timestamp : now,
    sourceId: data.sourceId || 'https://news.example.com/rss',
    sourceName: data.sourceName || 'Fonte Exemplo',
    sourceCategory: data.sourceCategory || 'tech',
    imageUrl: data.imageUrl,
    isBreaking: data.isBreaking,
  };
}

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
    throw new Error(`Test failed: ${testName} (${detail || ''})`);
  }
}

async function runAllClusteringTests() {
  console.log('\n=== INICIANDO BATERIA DE TESTES DE CLUSTERIZAÇÃO E DEDUPLICAÇÃO ===\n');

  const now = Date.now();

  // -------------------------------------------------------------
  // Test 1: Mesma notícia com títulos quase idênticos -> AGRUPAR
  // -------------------------------------------------------------
  {
    const art1 = createMockArticle({
      sourceName: 'G1',
      title: 'Apple anuncia novo iPhone 16 com recursos de inteligência artificial',
      timestamp: now,
    });
    const art2 = createMockArticle({
      sourceName: 'Folha',
      title: 'Apple revela novo iPhone 16 com foco em inteligência artificial',
      timestamp: now - 15 * 60 * 1000,
    });

    const clusters = clusterNewsItems([art1, art2]);
    assert(clusters.length === 1, 'Caso 1: Títulos quase idênticos agrupam em 1 história', `Recebido ${clusters.length} clusters`);
    assert(clusters[0].articles.length === 2, 'Caso 1: Cluster contém os 2 artigos');
    assert(clusters[0].sourcesCount === 2, 'Caso 1: Cluster registra 2 fontes distintas');
  }

  // -------------------------------------------------------------
  // Test 2: Mesma notícia com títulos diferentes mas conteúdo indica mesma história -> AGRUPAR
  // -------------------------------------------------------------
  {
    const art1 = createMockArticle({
      sourceName: 'The Verge',
      title: 'A big milestone in Cupertino today',
      contentSnippet: 'Apple officially unveiled the new iPhone 16 equipped with the A18 chip and Apple Intelligence in Cupertino.',
      timestamp: now,
    });
    const art2 = createMockArticle({
      sourceName: 'TechCrunch',
      title: 'Hardware flagship arrives with A18 processor',
      contentSnippet: 'Apple announced the iPhone 16 equipped with the A18 chip and Apple Intelligence at its headquarters in Cupertino.',
      timestamp: now - 30 * 60 * 1000,
    });

    const clusters = clusterNewsItems([art1, art2]);
    assert(clusters.length === 1, 'Caso 2: Títulos diferentes agrupam com base no conteúdo/snippet convergente', `Recebido ${clusters.length} clusters`);
    assert(clusters[0].articles.length === 2, 'Caso 2: Cluster contém os 2 artigos convergentes');
  }

  // -------------------------------------------------------------
  // Test 3: Notícias sobre mesmo assunto, mas acontecimentos diferentes -> NÃO AGRUPAR
  // Exemplo do prompt: "Apple lança novo iPhone" vs "Apple aumenta preço do iPhone no Brasil"
  // -------------------------------------------------------------
  {
    const art1 = createMockArticle({
      sourceName: 'Reuters',
      title: 'Apple lança novo iPhone no mercado global',
      contentSnippet: 'A gigante Apple apresentou oficialmente sua nova linha de smartphones com inovações de câmera e chip.',
      timestamp: now,
    });
    const art2 = createMockArticle({
      sourceName: 'Valor Econômico',
      title: 'Apple aumenta preço do iPhone no Brasil',
      contentSnippet: 'A empresa de tecnologia reajustou em 15% os valores de venda no território brasileiro devido à taxa cambial.',
      timestamp: now - 60 * 60 * 1000,
    });

    const clusters = clusterNewsItems([art1, art2]);
    assert(clusters.length === 2, 'Caso 3: Acontecimentos distintos sobre mesmo assunto NÃO são agrupados (Zero Falso Positivo)', `Recebido ${clusters.length} clusters`);
  }

  // -------------------------------------------------------------
  // Test 4: Mesma notícia publicada por 3 fontes -> 1 cluster com 3 artigos
  // Reuters, The Verge, TechCrunch
  // -------------------------------------------------------------
  {
    const art1 = createMockArticle({
      sourceName: 'Reuters',
      title: 'Apple announces new iPhone',
      link: 'https://reuters.com/tech/apple-iphone',
      timestamp: now,
    });
    const art2 = createMockArticle({
      sourceName: 'The Verge',
      title: 'Apple unveils its new iPhone',
      link: 'https://theverge.com/apple/iphone-unveil',
      timestamp: now - 10 * 60 * 1000,
    });
    const art3 = createMockArticle({
      sourceName: 'TechCrunch',
      title: 'Apple launches new iPhone',
      link: 'https://techcrunch.com/apple-iphone-launch',
      timestamp: now - 20 * 60 * 1000,
    });

    const clusters = clusterNewsItems([art1, art2, art3]);
    assert(clusters.length === 1, 'Caso 4: 3 fontes cobrindo o mesmo evento geram exatamente 1 cluster', `Recebido ${clusters.length} clusters`);
    assert(clusters[0].articles.length === 3, 'Caso 4: O cluster contém os 3 artigos originais');
    assert(clusters[0].sourcesCount === 3, 'Caso 4: Contagem de fontes é 3');
    const sourceNames = clusters[0].uniqueSources.map((s) => s.sourceName).sort();
    assert(sourceNames.join(', ') === 'Reuters, TechCrunch, The Verge', 'Caso 4: Todas as 3 fontes preservadas corretamente');
  }

  // -------------------------------------------------------------
  // Test 5: Mesma notícia publicada em horários diferentes dentro da janela configurada -> AGRUPAR
  // -------------------------------------------------------------
  {
    const windowHours = 24;
    const art1 = createMockArticle({
      sourceName: 'BBC News',
      title: 'Governo anuncia novo plano de transição energética',
      timestamp: now,
    });
    const art2 = createMockArticle({
      sourceName: 'The Guardian',
      title: 'Governo revela plano histórico de transição energética',
      timestamp: now - 18 * 60 * 60 * 1000, // 18 horas depois (dentro de 24h)
    });

    const clusters = clusterNewsItems([art1, art2], { timeWindowHours: windowHours });
    assert(clusters.length === 1, 'Caso 5: Artigos em horários diferentes dentro da janela temporal são agrupados');
    assert(clusters[0].articles.length === 2, 'Caso 5: Artigos preservados no cluster');
  }

  // -------------------------------------------------------------
  // Test 6: Notícias antigas sobre o mesmo assunto fora da janela -> NÃO AGRUPAR
  // -------------------------------------------------------------
  {
    const windowHours = 24;
    const art1 = createMockArticle({
      sourceName: 'CNN',
      title: 'NVIDIA anuncia novos chips de inteligência artificial',
      timestamp: now,
    });
    const art2 = createMockArticle({
      sourceName: 'Bloomberg',
      title: 'NVIDIA anuncia novos chips de inteligência artificial',
      timestamp: now - 72 * 60 * 60 * 1000, // 72 horas atrás (fora da janela de 24h)
    });

    const clusters = clusterNewsItems([art1, art2], { timeWindowHours: windowHours });
    assert(clusters.length === 2, 'Caso 6: Notícias fora da janela de tempo NÃO são agrupadas', `Recebido ${clusters.length} clusters`);
  }

  // -------------------------------------------------------------
  // Test 7: Artigos em idiomas diferentes sobre o mesmo acontecimento (PT e EN) -> AGRUPAR
  // -------------------------------------------------------------
  {
    const artPt = createMockArticle({
      sourceName: 'G1 Tech',
      title: 'Apple lança novo iPhone com inteligência artificial',
      contentSnippet: 'Dispositivo vem equipado com chip avançado e recursos inovadores de IA generativa.',
      timestamp: now,
    });
    const artEn = createMockArticle({
      sourceName: 'Reuters',
      title: 'Apple launches new iPhone with artificial intelligence',
      contentSnippet: 'The handset features next generation silicon and generative AI capabilities.',
      timestamp: now - 5 * 60 * 1000,
    });

    const clusters = clusterNewsItems([artPt, artEn]);
    assert(clusters.length === 1, 'Caso 7: Suporte cross-lingual agrupa notícias do mesmo fato em PT e EN', `Recebido ${clusters.length} clusters`);
    assert(clusters[0].articles.length === 2, 'Caso 7: Ambos artigos mantidos');
  }

  // -------------------------------------------------------------
  // Test 8: Feeds com títulos muito curtos -> EVITAR AGRUPAMENTOS INCORRETOS
  // -------------------------------------------------------------
  {
    const short1 = createMockArticle({
      sourceName: 'Feed A',
      title: 'Apple',
      contentSnippet: 'Balanço financeiro do terceiro trimestre surpreende analistas de Wall Street.',
      timestamp: now,
    });
    const short2 = createMockArticle({
      sourceName: 'Feed B',
      title: 'Apple',
      contentSnippet: 'Fim do suporte técnico para versões legadas do sistema macOS antigo.',
      timestamp: now - 10 * 60 * 1000,
    });

    const clusters = clusterNewsItems([short1, short2]);
    assert(clusters.length === 2, 'Caso 8: Títulos curtos com assuntos distintos no conteúdo NÃO agrupam', `Recebido ${clusters.length} clusters`);
  }

  // -------------------------------------------------------------
  // Test 9: Grande volume de artigos -> Verificar performance
  // -------------------------------------------------------------
  {
    const itemCount = 500;
    const mockItems: NewsItem[] = [];
    const topics = [
      'Lançamento de satélite espacial',
      'Descoberta arqueológica no Egito',
      'Nova vacina entra em testes clínicos',
      'Acordo comercial entre nações europeias',
      'Copa do Mundo de Futebol agenda de jogos',
    ];

    for (let i = 0; i < itemCount; i++) {
      const topicIdx = i % topics.length;
      mockItems.push(
        createMockArticle({
          id: `perf-item-${i}`,
          title: `${topics[topicIdx]} variação editorial número ${i}`,
          contentSnippet: `Detalhes sobre ${topics[topicIdx]} analisados pelo repórter de número ${i}.`,
          timestamp: now - (i * 5 * 60 * 1000),
          sourceName: `Fonte ${i % 10}`,
        })
      );
    }

    const tStart = performance.now();
    const clusters = clusterNewsItems(mockItems);
    const duration = performance.now() - tStart;

    console.log(`⏱️ Performance para ${itemCount} artigos: ${duration.toFixed(2)}ms (Clusters gerados: ${clusters.length})`);
    assert(duration < 250, 'Caso 9: Performance aceitável (menor que 250ms para 500 artigos)', `Levou ${duration.toFixed(2)}ms`);
    assert(clusters.length > 0, 'Caso 9: Clusters gerados com sucesso');
  }

  // -------------------------------------------------------------
  // Test 10: Feed duplicado ou mesma URL -> Tratar corretamente
  // -------------------------------------------------------------
  {
    const url1 = 'https://tecnoblog.net/noticias/openai-anuncia-gpt-5/?utm_source=rss&utm_medium=feed';
    const url2 = 'https://tecnoblog.net/noticias/openai-anuncia-gpt-5/'; // mesma URL canônica sem UTM

    const art1 = createMockArticle({
      sourceName: 'Tecnoblog',
      title: 'OpenAI anuncia GPT-5 com superinteligência',
      link: url1,
      timestamp: now,
    });
    const art2 = createMockArticle({
      sourceName: 'Tecnoblog RSS Repetido',
      title: 'OpenAI anuncia GPT-5 com superinteligência',
      link: url2,
      timestamp: now - 2 * 60 * 1000,
    });

    const clusters = clusterNewsItems([art1, art2]);
    assert(clusters.length === 1, 'Caso 10: URLs duplicadas e com parâmetros de tracking são perfeitamente deduplicadas', `Recebido ${clusters.length} clusters`);
    assert(clusters[0].articles.length === 2, 'Caso 10: Ambos registros absorvidos no mesmo cluster');
  }

  // -------------------------------------------------------------
  // Test 11: Desativação do recurso nas configurações
  // -------------------------------------------------------------
  {
    const art1 = createMockArticle({ sourceName: 'A', title: 'Mesmo Fato Noticioso', timestamp: now });
    const art2 = createMockArticle({ sourceName: 'B', title: 'Mesmo Fato Noticioso', timestamp: now });

    const disabledClusters = clusterNewsItems([art1, art2], { enabled: false });
    assert(disabledClusters.length === 2, 'Caso 11: Quando deduplicação está desativada, retorna 1:1 sem agrupar');
  }

  console.log(`\n🎉 SUCESSO TOTAL! ${passedTests}/${totalTests} TESTES PASSARAM COM ÊXITO!\n`);
}

runAllClusteringTests().catch((err) => {
  console.error('\n❌ Erro durante a execução dos testes:', err);
  process.exit(1);
});
