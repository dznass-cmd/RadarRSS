export interface GlobalFeedItem {
  countryCode: string;
  countryName: string;
  flag: string;
  title: string;
  url: string;
  category: 'brazil' | 'world' | 'tech' | 'finance' | 'sports' | 'entertainment' | 'ai';
  description: string;
}

export const GLOBAL_FEEDS_BY_COUNTRY: GlobalFeedItem[] = [
  // 🇧🇷 BRASIL
  {
    countryCode: 'BR',
    countryName: 'Brasil',
    flag: '🇧🇷',
    title: 'CNN Brasil - Últimas Notícias',
    url: 'https://www.cnnbrasil.com.br/feed/',
    category: 'brazil',
    description: 'Cobertura completa de notícias do Brasil e política nacional.'
  },
  {
    countryCode: 'BR',
    countryName: 'Brasil',
    flag: '🇧🇷',
    title: 'B9 - Cultura & Mídia',
    url: 'https://www.b9.com.br/feed/',
    category: 'entertainment',
    description: 'Criatividade, cultura pop, cinema, podcasts e mídias sociais.'
  },
  {
    countryCode: 'BR',
    countryName: 'Brasil',
    flag: '🇧🇷',
    title: 'Valor Econômico',
    url: 'https://valor.globo.com/rss/valor/',
    category: 'finance',
    description: 'Mercado financeiro, negócios e indicadores econômicos.'
  },

  // 🇺🇸 ESTADOS UNIDOS
  {
    countryCode: 'US',
    countryName: 'Estados Unidos',
    flag: '🇺🇸',
    title: 'CNN World News',
    url: 'http://rss.cnn.com/rss/edition_world.rss',
    category: 'world',
    description: 'Coletânea global de notícias e grandes destaques internacionais.'
  },
  {
    countryCode: 'US',
    countryName: 'Estados Unidos',
    flag: '🇺🇸',
    title: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    category: 'tech',
    description: 'Startups, investimentos, tecnologia de ponta e novas empresas.'
  },
  {
    countryCode: 'US',
    countryName: 'Estados Unidos',
    flag: '🇺🇸',
    title: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
    category: 'tech',
    description: 'Cultura digital, gadgets, inteligência artificial e ciência.'
  },
  {
    countryCode: 'US',
    countryName: 'Estados Unidos',
    flag: '🇺🇸',
    title: 'WIRED Top Stories',
    url: 'https://www.wired.com/feed/rss',
    category: 'tech',
    description: 'Análises profundas sobre o impacto da tecnologia na sociedade.'
  },

  // 🇬🇧 REINO UNIDO
  {
    countryCode: 'GB',
    countryName: 'Reino Unido',
    flag: '🇬🇧',
    title: 'BBC World News',
    url: 'http://feeds.bbci.co.uk/news/world/rss.xml',
    category: 'world',
    description: 'Principais manchetes e reportagens investigativas globais da BBC.'
  },
  {
    countryCode: 'GB',
    countryName: 'Reino Unido',
    flag: '🇬🇧',
    title: 'The Guardian - World News',
    url: 'https://www.theguardian.com/world/rss',
    category: 'world',
    description: 'Jornalismo independente britânico com cobertura global.'
  },

  // 🇪🇸 ESPANHA
  {
    countryCode: 'ES',
    countryName: 'Espanha',
    flag: '🇪🇸',
    title: 'El País - Titulares',
    url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada',
    category: 'world',
    description: 'O maior jornal da Espanha com análises da Europa e América Latina.'
  },
  {
    countryCode: 'ES',
    countryName: 'Espanha',
    flag: '🇪🇸',
    title: 'Xataka - Tecnologia',
    url: 'https://feeds.weblogssl.com/xataka',
    category: 'tech',
    description: 'Portal espanhol referência em tecnologia, inovação e mobile.'
  },

  // 🇵🇹 PORTUGAL
  {
    countryCode: 'PT',
    countryName: 'Portugal',
    flag: '🇵🇹',
    title: 'Público - ÚLTIMAS',
    url: 'https://www.publico.pt/api/ops/rss',
    category: 'world',
    description: 'Jornal diário português sobre política europeia e lusofonia.'
  },
  {
    countryCode: 'PT',
    countryName: 'Portugal',
    flag: '🇵🇹',
    title: 'Pplware - Inovação',
    url: 'https://pplware.sapo.pt/feed/',
    category: 'tech',
    description: 'Portal de tecnologia, gadgets e software em Portugal.'
  },

  // 🇫🇷 FRANÇA
  {
    countryCode: 'FR',
    countryName: 'França',
    flag: '🇫🇷',
    title: 'France 24 - International',
    url: 'https://www.france24.com/fr/rss',
    category: 'world',
    description: 'Notícias da França, União Europeia e política internacional.'
  },
  {
    countryCode: 'FR',
    countryName: 'França',
    flag: '🇫🇷',
    title: 'Le Monde - Une',
    url: 'https://www.lemonde.fr/rss/une.xml',
    category: 'world',
    description: 'As principais notícias do renomado jornal francês.'
  },

  // 🇩🇪 ALEMANHA
  {
    countryCode: 'DE',
    countryName: 'Alemanha',
    flag: '🇩🇪',
    title: 'Deutsche Welle (DW)',
    url: 'https://rss.dw.com/rdf/rss-en-world',
    category: 'world',
    description: 'Visão alemã e europeia dos acontecimentos mundiais.'
  },

  // 🇮🇹 ITÁLIA
  {
    countryCode: 'IT',
    countryName: 'Itália',
    flag: '🇮🇹',
    title: 'ANSA Notizie',
    url: 'https://www.ansa.it/sito/ansait_rss.xml',
    category: 'world',
    description: 'Agência nacional de notícias da Itália.'
  },

  // 🇯🇵 JAPÃO
  {
    countryCode: 'JP',
    countryName: 'Japão',
    flag: '🇯🇵',
    title: 'NHK WORLD-JAPAN',
    url: 'https://www3.nhk.or.jp/rss/news/cat0.xml',
    category: 'world',
    description: 'A emissora pública do Japão trazendo notícias da Ásia e inovação.'
  },

  // 🇦🇷 ARGENTINA
  {
    countryCode: 'AR',
    countryName: 'Argentina',
    flag: '🇦🇷',
    title: 'Clarín - Ultimas Noticias',
    url: 'https://www.clarin.com/rss/lo-ultimo/',
    category: 'world',
    description: 'Notícias da Argentina, América Latina e economia regional.'
  },

  // 🇲🇽 MÉXICO
  {
    countryCode: 'MX',
    countryName: 'México',
    flag: '🇲🇽',
    title: 'El Universal - Portada',
    url: 'https://www.eluniversal.com.mx/rss.xml',
    category: 'world',
    description: 'O maior diário do México com notícias das Américas.'
  },

  // 🇨🇦 CANADÁ
  {
    countryCode: 'CA',
    countryName: 'Canadá',
    flag: '🇨🇦',
    title: 'CBC News - World',
    url: 'https://www.cbc.ca/cmlink/rss-world',
    category: 'world',
    description: 'Rede pública canadense de jornalismo e análises globais.'
  },

  // 🇦🇺 AUSTRÁLIA
  {
    countryCode: 'AU',
    countryName: 'Austrália',
    flag: '🇦🇺',
    title: 'ABC News Australia',
    url: 'https://www.abc.net.au/news/feed/51120/rss.xml',
    category: 'world',
    description: 'Notícias da Austrália, região Pacífico e cobertura global.'
  }
];
