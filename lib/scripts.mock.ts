import { Script, Category } from '../types';

export const SCRIPT_CATEGORIES: Category[] = [
  'Abordagem',
  'Qualificação',
  'Contorno de Objeções',
  'Fechamento',
  'Follow-up'
];

export const MOCK_SCRIPTS: Script[] = [
  {
    id: 'script-1',
    title: 'Abordagem Inicial (Lead Frio)',
    content: 'Olá, [Nome]! Meu nome é [Seu Nome], sou consultor educacional na Cruzeiro do Sul Virtual. Vi que você demonstrou interesse em nossos cursos. Qual seria a melhor forma de conversarmos por 2 minutos?',
    category: 'Abordagem',
    tags: [{ text: 'Urgente', color: 'red' }],
    type: 'phone',
    isFavorite: true,
  },
  {
    id: 'script-2',
    title: 'Qualificação - Entendendo a Necessidade',
    content: 'Excelente, [Nome]. Para eu poder te ajudar a encontrar o curso ideal, você poderia me contar um pouco sobre seus objetivos de carreira no momento?',
    category: 'Qualificação',
    tags: [],
    type: 'email',
  },
  {
    id: 'script-3',
    title: 'Objeção: "Está caro"',
    content: 'Eu entendo sua preocupação com o valor, [Nome]. Muitos dos nossos melhores alunos também pensaram assim no início. Por isso, gostaria de detalhar o que está incluso no investimento: [Listar benefícios como tutoria, material, plataforma, etc.]. Isso não é apenas um custo, mas um investimento direto no seu futuro profissional.',
    category: 'Contorno de Objeções',
    tags: [{ text: 'Negociação', color: 'yellow' }],
    type: 'person',
    isFavorite: true,
  },
  {
    id: 'script-4',
    title: 'Fechamento por Alternativas',
    content: 'Com base no que conversamos, [Nome], a matrícula pode ser feita por cartão de crédito ou boleto. Qual das duas opções fica melhor para você dar o próximo passo na sua carreira hoje?',
    category: 'Fechamento',
    tags: [],
    type: 'phone',
  },
  {
    id: 'script-5',
    title: 'Follow-up (Pós-contato)',
    content: 'Olá, [Nome], tudo bem? Passando para saber se você conseguiu analisar a proposta que te enviei. Ficou alguma dúvida que eu possa te ajudar a esclarecer?',
    category: 'Follow-up',
    tags: [],
    type: 'email',
  },
  {
    id: 'script-6',
    title: 'Abordagem (Lead Quente)',
    content: 'Oi, [Nome]! Sou [Seu Nome] da Cruzeiro do Sul Virtual. Vi que você baixou nosso e-book sobre carreiras em tecnologia. O que mais te chamou atenção no material?',
    category: 'Abordagem',
    tags: [],
    type: 'email',
    isFavorite: false,
  },
  {
    id: 'script-7',
    title: 'Objeção: "Não tenho tempo"',
    content: 'Essa é a realidade de muitos, [Nome]. É exatamente por isso que o nosso modelo EAD foi desenhado. Ele te dá a flexibilidade de estudar nos horários que se encaixam na sua rotina, sem comprometer seu trabalho ou família. Quanto tempo por dia você acredita que conseguiria dedicar aos seus estudos?',
    category: 'Contorno de Objeções',
    tags: [{ text: 'Negociação', color: 'yellow' }, { text: 'Favorito', color: 'blue' }],
    type: 'phone',
    isFavorite: true,
  },
  {
    id: 'script-8',
    title: 'Fechamento Direto',
    content: 'Parece que o curso de [Nome do Curso] está perfeitamente alinhado com seus objetivos. Podemos prosseguir com a sua matrícula para garantir sua vaga na próxima turma?',
    category: 'Fechamento',
    tags: [],
    type: 'person',
  },
];