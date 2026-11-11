import { exportFeedsToOpml, parseOpml, normalizeCategory, escapeXml, unescapeXml } from '../src/services/opmlService';
import { RssFeed } from '../src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ [PASS] ${message}`);
  }
}

console.log('\n=== INICIANDO BATERIA DE TESTES DE SUPORTE A OPML ===\n');

// --- Caso 1: Escaping e Unescaping de XML ---
const originalString = 'Tech & Science <AI> "Breakthrough" \'2026\'';
const escaped = escapeXml(originalString);
assert(escaped === 'Tech &amp; Science &lt;AI&gt; &quot;Breakthrough&quot; &apos;2026&apos;', 'Caso 1: XML escaping substitui &, <, >, " e \'');
assert(unescapeXml(escaped) === originalString, 'Caso 1: XML unescaping recupera a string original intacta');

// --- Caso 2: Normalização de Categorias ---
assert(normalizeCategory('Technology News') === 'tech', 'Caso 2: "Technology News" normaliza para "tech"');
assert(normalizeCategory('Inteligência Artificial') === 'ai', 'Caso 2: "Inteligência Artificial" normaliza para "ai"');
assert(normalizeCategory('Economia e Negócios') === 'finance', 'Caso 2: "Economia e Negócios" normaliza para "finance"');
assert(normalizeCategory('Futebol e Basquete') === 'sports', 'Caso 2: "Futebol e Basquete" normaliza para "sports"');
assert(normalizeCategory('Cinema e Games') === 'entertainment', 'Caso 2: "Cinema e Games" normaliza para "entertainment"');
assert(normalizeCategory('Notícias do Brasil') === 'brazil', 'Caso 2: "Notícias do Brasil" normaliza para "brazil"');
assert(normalizeCategory('World Geopolitics') === 'world', 'Caso 2: "World Geopolitics" normaliza para "world"');
assert(normalizeCategory('Outros') === 'custom', 'Caso 2: Desconhecido normaliza para "custom"');

// --- Caso 3: Exportação para OPML 2.0 ---
const sampleFeeds: RssFeed[] = [
  {
    id: 'f1',
    title: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
    category: 'tech',
    icon: '⚡',
    active: true,
    status: 'ok',
  },
  {
    id: 'f2',
    title: 'G1 Brasil',
    url: 'https://g1.globo.com/rss/g1/',
    category: 'brazil',
    icon: '🇧🇷',
    active: true,
    status: 'ok',
  },
  {
    id: 'f3',
    title: 'CoinDesk',
    url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
    category: 'finance',
    icon: '📈',
    active: true,
    status: 'ok',
  },
];

const opmlExported = exportFeedsToOpml(sampleFeeds, 'Minhas Assinaturas Radar RSS');
assert(opmlExported.includes('<opml version="2.0">'), 'Caso 3: Exportação gera tag <opml version="2.0">');
assert(opmlExported.includes('<title>Minhas Assinaturas Radar RSS</title>'), 'Caso 3: Título customizado é preservado no <head>');
assert(opmlExported.includes('xmlUrl="https://www.theverge.com/rss/index.xml"'), 'Caso 3: xmlUrl do The Verge está presente');
assert(opmlExported.includes('xmlUrl="https://g1.globo.com/rss/g1/"'), 'Caso 3: xmlUrl do G1 está presente');
assert(opmlExported.includes('xmlUrl="https://www.coindesk.com/arc/outboundfeeds/rss/"'), 'Caso 3: xmlUrl do CoinDesk está presente');
assert(opmlExported.includes('text="Technology"'), 'Caso 3: Feeds agrupados por pastas de categoria (Technology)');
assert(opmlExported.includes('text="Brazil News"'), 'Caso 3: Feeds agrupados por pastas de categoria (Brazil News)');

// --- Caso 4: Importação / Parsing de OPML Plano ---
const flatOpml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="1.0">
  <head><title>Flat Feed List</title></head>
  <body>
    <outline type="rss" text="Hacker News" title="Hacker News" xmlUrl="https://news.ycombinator.com/rss" htmlUrl="https://news.ycombinator.com" />
    <outline type="rss" text="Ars Technica" title="Ars Technica" xmlUrl="https://feeds.arstechnica.com/arstechnica/index" htmlUrl="https://arstechnica.com" category="tech" />
  </body>
</opml>`;

const flatResult = parseOpml(flatOpml);
assert(flatResult.totalParsed === 2, 'Caso 4: 2 feeds extraídos do OPML plano');
assert(flatResult.feeds[0].title === 'Hacker News', 'Caso 4: Primeiro feed tem título "Hacker News"');
assert(flatResult.feeds[0].url === 'https://news.ycombinator.com/rss', 'Caso 4: URL do Hacker News correta');
assert(flatResult.feeds[1].title === 'Ars Technica', 'Caso 4: Segundo feed tem título "Ars Technica"');
assert(flatResult.feeds[1].category === 'tech', 'Caso 4: Categoria "tech" respeitada');

// --- Caso 5: Importação / Parsing de OPML Hierárquico com Pastas (Feedly/Inoreader style) ---
const hierarchicalOpml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head><title>Feedly Subscriptions</title></head>
  <body>
    <outline text="Technology" title="Technology">
      <outline type="rss" text="TechCrunch" title="TechCrunch" xmlUrl="https://techcrunch.com/feed/" htmlUrl="https://techcrunch.com" />
      <outline type="rss" text="Engadget" title="Engadget" xmlUrl="https://www.engadget.com/rss.xml" htmlUrl="https://www.engadget.com" />
    </outline>
    <outline text="Finanças e Investimentos" title="Finanças e Investimentos">
      <outline type="rss" text="Bloomberg" title="Bloomberg" xmlUrl="https://bloomberg.com/feed" htmlUrl="https://bloomberg.com" />
    </outline>
  </body>
</opml>`;

const hierResult = parseOpml(hierarchicalOpml);
assert(hierResult.totalParsed === 3, 'Caso 5: 3 feeds extraídos do OPML com pastas');
const tcFeed = hierResult.feeds.find(f => f.title === 'TechCrunch');
assert(Boolean(tcFeed && tcFeed.category === 'tech'), 'Caso 5: TechCrunch herdou categoria "tech" da pasta Technology');
const bbFeed = hierResult.feeds.find(f => f.title === 'Bloomberg');
assert(Boolean(bbFeed && bbFeed.category === 'finance'), 'Caso 5: Bloomberg herdou categoria "finance" da pasta Finanças');

// --- Caso 6: Deduplicação Interna do OPML ---
const duplicateOpml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="1.0">
  <body>
    <outline text="Feed 1" xmlUrl="https://example.com/rss" />
    <outline text="Feed 1 Duplicado" xmlUrl="https://example.com/rss" />
    <outline text="Feed 2" xmlUrl="https://example.com/rss2" />
  </body>
</opml>`;

const dupResult = parseOpml(duplicateOpml);
assert(dupResult.totalParsed === 2, 'Caso 6: Feeds repetidos dentro do mesmo OPML são deduplicados');

// --- Caso 7: Roundtrip (Exportar -> Importar) ---
const roundtripResult = parseOpml(opmlExported);
assert(roundtripResult.totalParsed === sampleFeeds.length, 'Caso 7: Roundtrip preserva todos os feeds');
assert(roundtripResult.feeds.some(f => f.url === sampleFeeds[0].url), 'Caso 7: URL do The Verge preservada no roundtrip');
assert(roundtripResult.feeds.some(f => f.url === sampleFeeds[1].url), 'Caso 7: URL do G1 preservada no roundtrip');
assert(roundtripResult.feeds.some(f => f.url === sampleFeeds[2].url), 'Caso 7: URL do CoinDesk preservada no roundtrip');

// --- Caso 8: Resiliência a Entradas Vazias ou Inválidas ---
assert(parseOpml('').totalParsed === 0, 'Caso 8: String vazia retorna lista vazia');
assert(parseOpml('<not-an-opml></not-an-opml>').totalParsed === 0, 'Caso 8: XML sem outlines retorna 0 feeds sem travar');

console.log('\n🎉 SUCESSO TOTAL! TODOS OS TESTES DE OPML PASSARAM COM ÊXITO!\n');
