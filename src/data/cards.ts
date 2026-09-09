import { ObjectCategory } from "../types/game";

export const OBJECT_CARDS_DATA: Array<{ category: ObjectCategory; name: string; description: string }> = [
  // SEGURANÇA DIGITAL
  { category: 'SEGURANÇA DIGITAL', name: 'Senhas fortes e únicas', description: 'Crie senhas complexas e nunca repita a mesma em vários sites.' },
  { category: 'SEGURANÇA DIGITAL', name: 'Autenticação em dois fatores (2FA)', description: 'Uma camada extra de proteção além da senha.' },
  { category: 'SEGURANÇA DIGITAL', name: 'Redes Wi-Fi seguras', description: 'Evite Wi-Fi público para acessar dados sensíveis.' },
  { category: 'SEGURANÇA DIGITAL', name: 'Antivírus e Firewall', description: 'Mantenha suas defesas ativas contra malwares.' },
  { category: 'SEGURANÇA DIGITAL', name: 'Bloqueio de Tela e Dispositivos', description: 'Sempre bloqueie suas telas ao se afastar do aparelho.' },

  // PRIVACIDADE E PROTEÇÃO DE DADOS
  { category: 'PRIVACIDADE E PROTEÇÃO DE DADOS', name: 'Dados pessoais protegidos', description: 'Não exponha RG, CPF ou endereço na internet.' },
  { category: 'PRIVACIDADE E PROTEÇÃO DE DADOS', name: 'Privacidade nas redes sociais', description: 'Ajuste quem pode ver suas postagens e fotos.' },
  { category: 'PRIVACIDADE E PROTEÇÃO DE DADOS', name: 'Permissões de aplicativos', description: 'Negue acesso à câmera ou GPS se não for necessário.' },
  { category: 'PRIVACIDADE E PROTEÇÃO DE DADOS', name: 'Configurações de privacidade', description: 'Revise regularmente as políticas de dados dos apps.' },
  { category: 'PRIVACIDADE E PROTEÇÃO DE DADOS', name: 'Navegação anônima e segura', description: 'Evite deixar rastros ao usar computadores compartilhados.' },

  // INFORMAÇÃO E PENSAMENTO CRÍTICO
  { category: 'INFORMAÇÃO E PENSAMENTO CRÍTICO', name: 'Fontes confiáveis', description: 'Busque informações em veículos de imprensa e sites oficiais.' },
  { category: 'INFORMAÇÃO E PENSAMENTO CRÍTICO', name: 'Verificação de informações', description: 'Cheque os fatos antes de acreditar em um título chamativo.' },
  { category: 'INFORMAÇÃO E PENSAMENTO CRÍTICO', name: 'Compartilhamento responsável', description: 'Não repasse correntes duvidosas no WhatsApp.' },
  { category: 'INFORMAÇÃO E PENSAMENTO CRÍTICO', name: 'Identificação de Fake News', description: 'Desconfie de notícias sensacionalistas e sem fonte.' },
  { category: 'INFORMAÇÃO E PENSAMENTO CRÍTICO', name: 'Leitura lateral de notícias', description: 'Pesquise a mesma notícia em vários sites para comparar.' },

  // COMUNICAÇÃO E CIDADANIA DIGITAL
  { category: 'COMUNICAÇÃO E CIDADANIA DIGITAL', name: 'Respeito nas interações', description: 'Trate os outros online como trataria pessoalmente.' },
  { category: 'COMUNICAÇÃO E CIDADANIA DIGITAL', name: 'Responsabilidade digital', description: 'Você é responsável por tudo que posta e compartilha.' },
  { category: 'COMUNICAÇÃO E CIDADANIA DIGITAL', name: 'Direitos autorais e atribuição', description: 'Sempre dê crédito ao autor original de fotos e textos.' },
  { category: 'COMUNICAÇÃO E CIDADANIA DIGITAL', name: 'Uso ético de conteúdos', description: 'Não plagie e respeite as licenças de uso livre.' },
  { category: 'COMUNICAÇÃO E CIDADANIA DIGITAL', name: 'Combate ao cyberbullying', description: 'Não apoie agressões virtuais e denuncie perfis tóxicos.' },

  // COMPETÊNCIAS E FERRAMENTAS DIGITAIS
  { category: 'COMPETÊNCIAS E FERRAMENTAS DIGITAIS', name: 'E-mail profissional', description: 'Mantenha uma comunicação clara e educada no e-mail.' },
  { category: 'COMPETÊNCIAS E FERRAMENTAS DIGITAIS', name: 'Organização de arquivos', description: 'Use pastas bem nomeadas para não perder seus trabalhos.' },
  { category: 'COMPETÊNCIAS E FERRAMENTAS DIGITAIS', name: 'Downloads seguros', description: 'Baixe arquivos apenas de sites oficiais e confiáveis.' },
  { category: 'COMPETÊNCIAS E FERRAMENTAS DIGITAIS', name: 'Ferramentas colaborativas', description: 'Aprenda a trabalhar em equipe usando a nuvem.' },
  { category: 'COMPETÊNCIAS E FERRAMENTAS DIGITAIS', name: 'Backup em nuvem', description: 'Salve seus arquivos importantes para nunca perdê-los.' },

  // INTELIGÊNCIA ARTIFICIAL E USO CRÍTICO
  { category: 'INTELIGÊNCIA ARTIFICIAL E USO CRÍTICO', name: 'Fundamentos de IA', description: 'Entenda como os algoritmos recomendam conteúdos para você.' },
  { category: 'INTELIGÊNCIA ARTIFICIAL E USO CRÍTICO', name: 'Verificação de respostas da IA', description: 'IAs podem errar (alucinar). Cheque os dados importantes.' },
  { category: 'INTELIGÊNCIA ARTIFICIAL E USO CRÍTICO', name: 'Engenharia de prompt', description: 'Aprenda a pedir exatamente o que você precisa.' },
  { category: 'INTELIGÊNCIA ARTIFICIAL E USO CRÍTICO', name: 'Revisão humana de conteúdo', description: 'Não copie e cole cegamente o que a IA escreveu.' },
  { category: 'INTELIGÊNCIA ARTIFICIAL E USO CRÍTICO', name: 'Identificação de deepfakes', description: 'Fique atento a vídeos e áudios que parecem artificiais.' }
];

export interface EffectCardData {
  name: string;
  desc: string;
  tip?: string;
  fact?: string;
}

export const EFFECTS_CARDS_DATA: EffectCardData[] = [
  // Grupo 1: Efeitos de Resolução Direta e Imediata
  {
    name: 'Senha Forte',
    desc: 'Compra 2 cartas do baralho.',
    tip: 'Busque usar senhas com letras, números e símbolos, proteja seus dados e seja recompensado.'
  },
  {
    name: 'Vazamento de Dados',
    desc: 'Todos os jogadores jogam com as mãos reveladas até o seu próximo turno + compre 1 carta.',
    tip: 'Evite usar a mesma senha em sites ou aplicativos diferentes.'
  },
  {
    name: 'Six Seven',
    desc: 'Todos os jogadores passam suas mãos inteiras de cartas para o jogador à esquerda.',
    fact: 'Piadinha sem graça também tem o seu valor.'
  },
  {
    name: 'Limpeza de Cache',
    desc: 'Se você estiver com apenas 1 ou 0 cartas na mão, compre 3 cartas.',
    tip: 'Limpar arquivos temporários e fotos repetidas deixa o seu dispositivo muito mais rápido.'
  },
  {
    name: 'Engajamento Merecido',
    desc: 'Compre 1 carta do baralho para cada Carta-Objeto que você já tiver na sua mesa.',
    tip: 'Criar conteúdos úteis e respeitosos atrai seguidores reais sem precisar apelar para o clickbait.'
  },
  {
    name: 'Formatar o Sistema',
    desc: 'Todos os jogadores descartam suas mãos inteiras e compram 3 cartas novas do baralho.',
    tip: 'Fazer uma formatação de fábrica apaga todos os dados mas pode remover vírus difíceis do aparelho.'
  },
  // Grupo 2: Efeitos com Alvo
  { name: 'Rede de Apoio', desc: 'Compre 3 cartas e escolha outro jogador para comprar 1.' },
  { name: 'Alerta de Phishing', desc: 'Escolha um jogador. Ele deve descartar 1 carta da mão à escolha dele.' },
  { name: 'Tomou Block!', desc: 'Escolha um jogador. Ele perde o próximo turno.' },
  { name: 'Vídeo Deepfake', desc: 'Troque toda a sua mão com a mão de outro jogador.' },
  { name: 'Esqueceu a Senha', desc: 'Escolha um jogador. Ele descarta 1 carta aleatória da mão.' },
];
