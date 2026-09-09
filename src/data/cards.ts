import { ObjectCategory } from "../types/game";

export interface ObjectCardData {
  category: ObjectCategory;
  name: string;
  description: string;
  visualDetail?: string;
}

export const OBJECT_CARDS_DATA: ObjectCardData[] = [
  // SEGURANÇA DIGITAL
  {
    category: 'SEGURANÇA DIGITAL',
    name: 'Gerenciador de Senhas',
    description: 'Cria e guarda senhas difíceis para você. Usar a mesma senha em tudo facilita invasões!',
    visualDetail: 'Um cofre digital guardando chaves coloridas.'
  },
  {
    category: 'SEGURANÇA DIGITAL',
    name: 'Token 2FA',
    description: 'Adiciona uma segunda camada de segurança. Mesmo que descubram sua senha, precisarão do seu celular.',
    visualDetail: 'Um celular exibindo um código de 6 dígitos ao lado de uma porta trancada.'
  },
  {
    category: 'SEGURANÇA DIGITAL',
    name: 'Escudo VPN',
    description: 'Criptografa sua conexão. Protege seus dados ao navegar em redes abertas de locais públicos.',
    visualDetail: 'Um escudo azul protegendo um notebook em uma rede Wi-Fi pública.'
  },
  {
    category: 'SEGURANÇA DIGITAL',
    name: 'Navegação segura',
    description: 'Indica conexão segura. Nunca digite senhas ou dados bancários em sites sem o cadeado na barra.',
    visualDetail: 'Barra de navegação do navegador destacando o endereço "https://" e o cadeado verde.'
  },
  {
    category: 'SEGURANÇA DIGITAL',
    name: 'Firewall Ativo',
    description: 'Funciona como um porteiro no dispositivo, bloqueando acessos e conexões não autorizadas.',
    visualDetail: 'Uma barreira digital bloqueando robôs maliciosos fora do computador.'
  },

  // PRIVACIDADE E PROTEÇÃO DE DADOS
  {
    category: 'PRIVACIDADE E PROTEÇÃO DE DADOS',
    name: 'Privacidade de dados',
    description: 'Esconde informações pessoais. Evite expor endereço, telefone ou documentos em perfis públicos.',
    visualDetail: 'Tarja preta cobrindo campos de endereço e telefone em documento/perfil.'
  },
  {
    category: 'PRIVACIDADE E PROTEÇÃO DE DADOS',
    name: 'Controle de localização',
    description: 'Desative a geolocalização ao terminar de usar. Nem todo app precisa saber onde você está.',
    visualDetail: 'Um mapa digital com o pino de localização travado por um cadeado.'
  },
  {
    category: 'PRIVACIDADE E PROTEÇÃO DE DADOS',
    name: 'Painel de Permissões',
    description: 'Revogue acessos desnecessários. Um jogo de cartas não precisa ver sua câmera nem ouvir seu microfone.',
    visualDetail: 'Uma tela de configurações desligando a câmera e o microfone de um aplicativo.'
  },
  {
    category: 'PRIVACIDADE E PROTEÇÃO DE DADOS',
    name: 'Bloqueador de Cookies',
    description: 'Impede que sites rastreiem sua navegação para montar um perfil dos seus hábitos.',
    visualDetail: 'Um biscoito com lupa de detetive sendo parado por uma placa de "Bloqueado".'
  },
  {
    category: 'PRIVACIDADE E PROTEÇÃO DE DADOS',
    name: 'Limpar dados',
    description: 'Seus dados pertencem a você. É seu direito apagar cadastros e históricos de plataformas que não usa mais.',
    visualDetail: 'Uma lixeira digital triturando contas antigas e registros de dados.'
  },

  // INFORMAÇÃO E PENSAMENTO CRÍTICO
  {
    category: 'INFORMAÇÃO E PENSAMENTO CRÍTICO',
    name: 'Verificação de informações',
    description: 'Antes de repassar, investigue! Confira se a notícia foi publicada em portais jornalísticos sérios.',
    visualDetail: 'Uma lupa examinando um texto impresso e destacando a palavra "Verificado".'
  },
  {
    category: 'INFORMAÇÃO E PENSAMENTO CRÍTICO',
    name: 'Pensamento crítico',
    description: 'Opinião não é fato. Além de verificar, busque refletir sobre a informação.',
    visualDetail: 'Um cérebro pesando duas informações em uma balança.'
  },
  {
    category: 'INFORMAÇÃO E PENSAMENTO CRÍTICO',
    name: 'Fontes confiáveis',
    description: 'Fontes confiáveis informam autores, datas e referências. Desconfie de correntes sem autoria.',
    visualDetail: 'Um jornal ou portal de notícias com um selo dourado de checagem.'
  },
  {
    category: 'INFORMAÇÃO E PENSAMENTO CRÍTICO',
    name: 'Filtro de Fake News',
    description: 'Títulos apelativos tentam gerar cliques pelo medo ou raiva. Leia a matéria antes de reagir.',
    visualDetail: 'Uma mão segurando uma placa de pare diante de um título exagerado.'
  },
  {
    category: 'INFORMAÇÃO E PENSAMENTO CRÍTICO',
    name: 'Divulgação responsável',
    description: 'As informações que você compartilha têm consequências, compartilhe com sabedoria',
    visualDetail: 'Um ícone de "Compartilhar" passando por um filtro antes de ser publicado.'
  },

  // COMUNICAÇÃO E CIDADANIA DIGITAL
  {
    category: 'COMUNICAÇÃO E CIDADANIA DIGITAL',
    name: 'Respeito aos direitos autorais',
    description: 'Respeite os direitos autorais. Dê os créditos ao criador original e use apenas obras autorizadas.',
    visualDetail: 'O símbolo de licença aberta sobre uma ilustração ou música.'
  },
  {
    category: 'COMUNICAÇÃO E CIDADANIA DIGITAL',
    name: 'Respeito nas interações',
    description: 'Trate as pessoas na internet com o mesmo respeito e empatia que você usa no mundo presencial.',
    visualDetail: 'Um robô simpático com proteção contra comentários tóxicos.'
  },
  {
    category: 'COMUNICAÇÃO E CIDADANIA DIGITAL',
    name: 'Consentimento alheio',
    description: 'Peça permissão antes de postar fotos ou vídeos de outras pessoas. A privacidade do amigo também importa!',
    visualDetail: 'Uma mão pedindo permissão antes de postar a foto de um colega.'
  },
  {
    category: 'COMUNICAÇÃO E CIDADANIA DIGITAL',
    name: 'Conversas conscientes',
    description: 'Pense antes de enviar por impulso. O que você envia a alguém pode ser salvo e durar para sempre.',
    visualDetail: 'Botão "Enviar" com cronômetro de pausa reflexiva.'
  },
  {
    category: 'COMUNICAÇÃO E CIDADANIA DIGITAL',
    name: 'Denúncia justa',
    description: 'Viu ataques, preconceito ou perfis falsos? Não engaje nem compartilhe: use a opção de denunciar.',
    visualDetail: 'Bandeira de alerta vermelha acionada ao lado de mensagem ofensiva.'
  },

  // COMPETÊNCIAS E FERRAMENTAS DIGITAIS
  {
    category: 'COMPETÊNCIAS E FERRAMENTAS DIGITAIS',
    name: 'Busca Avançada',
    description: 'Use palavras-chave exatas e aspas para achar respostas diretas sem perder tempo.',
    visualDetail: 'Barra de pesquisa com filtros e aspas aplicadas.'
  },
  {
    category: 'COMPETÊNCIAS E FERRAMENTAS DIGITAIS',
    name: 'Nuvem Organizada',
    description: 'Organize arquivos por nomes e pastas claras. Ter backups na nuvem evita a perda de trabalhos.',
    visualDetail: 'Nuvem com pastas coloridas e identificadas.'
  },
  {
    category: 'COMPETÊNCIAS E FERRAMENTAS DIGITAIS',
    name: 'Download responsável',
    description: 'Baixe materiais apenas de fontes oficiais. Programas e jogos piratas costumam conter vírus.',
    visualDetail: 'Laser azul escaneando arquivo recebido da web.'
  },
  {
    category: 'COMPETÊNCIAS E FERRAMENTAS DIGITAIS',
    name: 'Correio Oficial',
    description: 'O e-mail é um canal sério. Use títulos claros, linguagem adequada e saudações respeitosas.',
    visualDetail: 'Envelope de e-mail formal selado com carimbo.'
  },
  {
    category: 'COMPETÊNCIAS E FERRAMENTAS DIGITAIS',
    name: 'Trabalho Colaborativo',
    description: 'Ferramentas em nuvem permitem que várias pessoas editem o mesmo projeto juntas em tempo real.',
    visualDetail: 'Vários cursores coloridos editando o mesmo documento.'
  },

  // INTELIGÊNCIA ARTIFICIAL E USO CRÍTICO
  {
    category: 'INTELIGÊNCIA ARTIFICIAL E USO CRÍTICO',
    name: 'Prompt Estruturado',
    description: 'As IAs não leem mentes. Quanto mais clara, contextualizada e precisa for sua instrução, melhor a resposta.',
    visualDetail: 'Bloco de notas com instruções claras e contexto.'
  },
  {
    category: 'INTELIGÊNCIA ARTIFICIAL E USO CRÍTICO',
    name: 'Terminal Chatbot',
    description: 'O chatbot serve para ajudar na construção de ideias, mas não substitui a reflexão própria.',
    visualDetail: 'Tela de diálogo conversando com assistente virtual.'
  },
  {
    category: 'INTELIGÊNCIA ARTIFICIAL E USO CRÍTICO',
    name: 'Revisão Humana',
    description: 'IAs podem cometer erros ou inventar fatos (\'alucinações\'). Sempre confira os dados fornecidos.',
    visualDetail: 'Pessoa com óculos analisando folha impressa por IA.'
  },
  {
    category: 'INTELIGÊNCIA ARTIFICIAL E USO CRÍTICO',
    name: 'IA + Humano',
    description: 'A IA acelera tarefas repetitivas, mas a criatividade, o sentimento e o juízo ético dependem de você.',
    visualDetail: 'Mão humana e robótica juntas segurando um projeto.'
  },
  {
    category: 'INTELIGÊNCIA ARTIFICIAL E USO CRÍTICO',
    name: 'Transparência autoral',
    description: 'Seja ético! Sempre informe quando usar textos ou imagens gerados por inteligência artificial.',
    visualDetail: 'Marca d\'água no canto da imagem sinalizando \'Gerado por IA\'.'
  }
];

export interface EffectCardData {
  name: string;
  desc: string;
  tip?: string;
  fact?: string;
}

export const EFFECTS_CARDS_DATA: EffectCardData[] = [
  // 1. Senha Forte
  {
    name: 'Senha Forte',
    desc: 'Compra 2 cartas do baralho.',
    tip: 'Busque usar senhas com letras, números e símbolos, proteja seus dados e seja recompensado.'
  },
  // 2. Senha Fraca Detectada
  {
    name: 'Senha Fraca Detectada',
    desc: 'Escolha 1 jogador. Ele revela a mão para todos os jogadores + compre 1 carta.',
    tip: "Senhas como '123456' ou datas de aniversário são descobertas mais facilmente deixando dados em risco."
  },
  // 3. Rede de Apoio
  {
    name: 'Rede de Apoio',
    desc: 'Compre 3 cartas do baralho e escolha outro jogador para comprar 1 carta.',
    tip: 'Ajudar colegas online ajuda a tornar a rede mais segura para todos.'
  },
  // 4. Prompt Perfeito
  {
    name: 'Prompt Perfeito',
    desc: 'Compre 2 cartas. Se achar um Objeto novo (categoria que você ainda não tenha na mesa), baixe-o imediatamente como ação extra.',
    tip: 'Comandos (prompts) claros e específicos geram as melhores respostas da IA.'
  },
  // 5. Alerta de Phishing
  {
    name: 'Alerta de Phishing',
    desc: 'Escolha 1 jogador. Ele perdeu dados e deve escolher 1 carta da própria mão para descartar.',
    fact: 'Phishing é um golpe que usa e-mails e sites falsos de lojas ou bancos para enganar o usuário e roubar suas senhas.'
  },
  // 6. Vazamento de Dados
  {
    name: 'Vazamento de Dados',
    desc: 'Todos os jogadores jogam com as mãos reveladas até o seu próximo turno + compre 1 carta.',
    tip: 'Evite usar a mesma senha em sites ou aplicativos diferentes.'
  },
  // 7. Six Seven
  {
    name: 'Six Seven',
    desc: 'Todos os jogadores passam suas mãos inteiras de cartas para o jogador à esquerda.',
    fact: 'Piadinha sem graça também tem o seu valor.'
  },
  // 8. Tomou Block!
  {
    name: 'Tomou Block!',
    desc: 'Escolha 1 jogador: ele perde a vez e não joga no próximo turno + compre 1 carta.',
    tip: 'Bloquear e denunciar perfis desrespeitosos é o melhor jeito de manter sua rede saudável.'
  },
  // 9. Vídeo Deepfake
  {
    name: 'Vídeo Deepfake',
    desc: 'Troque toda a sua mão de cartas com a mão de qualquer outro jogador à sua escolha.',
    fact: 'A tecnologia Deepfake troca rostos e vozes em vídeos. Tome cuidado com as mídias.'
  },
  // 10. Agência de Checagem
  {
    name: 'Agência de Checagem',
    desc: 'Todos os jogadores (exceto você) retornam a última carta-objeto jogada na mesa para a mão.',
    fact: 'Agências de checagem são especialistas em desmentir boatos que circulam na internet.'
  },
  // 11. Limpeza de Cache
  {
    name: 'Limpeza de Cache',
    desc: 'Se você estiver com apenas 1 ou 0 cartas na mão, compre 3 cartas.',
    tip: 'Limpar arquivos temporários e fotos repetidas deixa o seu dispositivo muito mais rápido.'
  },
  // 12. Engajamento Merecido
  {
    name: 'Engajamento Merecido',
    desc: 'Compre 1 carta do baralho para cada Carta-Objeto que você já tiver na sua mesa.',
    tip: 'Criar conteúdos úteis e respeitosos atrai seguidores reais sem precisar apelar para o clickbait.'
  },
  // 13. Esqueceu a Senha
  {
    name: 'Esqueceu a Senha',
    desc: 'Escolha 1 jogador. Sem olhar a mão dele, force-o a descartar 1 carta aleatória.',
    tip: 'Usar um gerenciador de senhas confiável evita que você perca o acesso às suas próprias contas.'
  },
  // 14. Formatar o Sistema
  {
    name: 'Formatar o Sistema',
    desc: 'Todos os jogadores descartam suas mãos inteiras e compram 3 cartas novas do baralho.',
    tip: 'Fazer uma formatação de fábrica apaga todos os dados mas pode remover vírus difíceis do aparelho.'
  },
  // 15. LI E ACEITO!
  {
    name: 'LI E ACEITO!',
    desc: 'Escolha 1 jogador. Ele aceitou os termos de serviços e deve te entregar 1 carta da mão à escolha dele.',
    fact: "Os 'Termos de Uso' são contratos reais; ao clicar em aceitar, você assina digitalmente."
  },
  // 16. Plágio Detectado
  {
    name: 'Plágio Detectado',
    desc: 'Escolha 1 jogador. Ele deve descartar 1 Carta-Objeto da mesa dele.',
    tip: 'Entregar um texto inteiro feito por IA como se fosse seu é desonesto e prejudica seu aprendizado.'
  },
];
