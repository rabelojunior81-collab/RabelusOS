
import { Bot, Wallet, PenTool, GraduationCap, BrainCircuit, Database, BookOpen, Sparkles, Eye, Fingerprint, Box, BarChart3, HardHat, Mic, Youtube, FileText, Layers, Video } from 'lucide-react';
import { AppId, StoreItem } from '../types';

// Apps essenciais que não podem ser removidos
export const SYSTEM_APP_IDS: AppId[] = ['store', 'settings', 'hub', 'youtube', 'notepad'];

// Apps que ficam fixos na Dock (Esquerda do divisor)
export const DOCK_PINNED_APPS: AppId[] = ['hub', 'youtube', 'notepad', 'store', 'settings', 'news'];

// MATRIZ DE CONHECIMENTO RABELUS (MANIFESTO)
export const RABELUS_MANIFESTO = `
*** RABELUS LAB: MATRIZ DE CONHECIMENTO E ECOSSISTEMA ***

[1. FILOSOFIA NUCLEAR: O PROTOCOLO RABELUS]
O Rabelus Lab não cria apenas "software"; cria extensões cognitivas. Nossa filosofia baseia-se na "Soberania de Borda" (Thick Client Architecture). Diferente do mercado SaaS convencional, onde os dados do usuário são reféns na nuvem, nossos aplicativos operam a lógica pesada e o armazenamento (Dexie.js) diretamente no dispositivo do usuário. A IA (Gemini) atua como um cérebro consultivo, não como um depositário de dados. Isso garante Privacidade, Velocidade Extrema e Resiliência. Cada aplicação possui uma identidade visual psico-ativa (Design System) projetada para induzir o estado mental necessário para a tarefa.

[2. O SISTEMA CENTRAL]
> Rabelus WebOS (A Fundação): Não é um site, é um computador líquido na nuvem. Uma interface operacional baseada em janelas que unifica todo o ecossistema. É o ambiente onde a multitarefa acontece, permitindo que o usuário opere um terminal financeiro (Joaca) ao lado de um atelier literário (Helena) sem atrito.

[3. DOMÍNIO DA PROSPERIDADE (FINANÇAS & MERCADO)]
> Hermes.ai (O Oráculo da Disciplina): Para quem busca paz mental financeira e organização. Proposta: Hermes não julga seus gastos; ele ilumina o caminho. Com visão computacional para ler recibos e um motor de IA que entende o contexto de vida, transforma "controle" em "design de estilo de vida". Diferencial: Privacidade absoluta (processamento local).
> Enok.ai (Engenharia de Valor): Para o estruturador, analista de FIDC e investidor matemático. Proposta: Onde a matemática fria encontra a intuição. Calculadora determinística de precisão cirúrgica para juros compostos e borderôs. Diferencial: Precisão matemática exata (TypeScript puro) assistida por IA.
> Joaca.ai (Sobrevivência de Mercado): Para o trader e operador de cripto. Proposta: O mercado nunca dorme. O Joaca é seu sentinela com latência zero. Não é sobre ficar rico rápido, é sobre não ser pego de surpresa. Diferencial: Velocidade de execução via AudioWorklet.

[4. DOMÍNIO DA CRIAÇÃO (NARRATIVA & ARTE)]
> Helena.ai (Atelier Literário): Para escritores e roteiristas. Proposta: A "Ghostwriter" que nunca esquece um detalhe. Gerencia o "Cânone" da história, garantindo consistência do capítulo 1 ao 50. Diferencial: Memória evolutiva do enredo.
> Excelsior.ai (Narrativa Visual): Para quadrinistas e diretores de arte. Proposta: A ponte entre texto e imagem. Lê roteiros e arquiteta páginas de quadrinhos e storyboards. Diferencial: Pipeline ETL criativo que entende estrutura narrativa visual.
> Logus Vision Pro (Estúdio de Ativos): Para designers. Proposta: Laboratório de DNA visual. Extrai a essência de um estilo e permite replicá-lo infinitamente. Diferencial: Consistência visual de marca.
> Tubemaster.ai (Gestão de Vídeo): Para criadores de conteúdo. Proposta: O Maestro do Algoritmo. Gestão de canais e otimização de metadados via IA.

[5. DOMÍNIO DA VERDADE & TRANSCENDÊNCIA]
> Fatima.ai (Jornalismo de Dados): Para analistas e pesquisadores. Proposta: Em um mundo de ruído, Fatima é o sinal. Ela não opina; ela verifica. Diferencial: Raciocínio profundo e visualização de dados dinâmica.
> Didata.ai (Educação Adaptativa): Para o autodidata. Proposta: O Didata constrói o curso ao seu redor, adaptando conteúdo em tempo real às suas dúvidas.
> Christian.ai (Teologia & Arte Sacra): Para o fiel. Proposta: Catedral Cibernética. Um espaço de solenidade para contemplação e estudo bíblico, desacelerando a tecnologia.
> Talia.ai (Interface de Inteligência): Para o usuário global. Proposta: A tradutora da realidade. Conecta o mundo visual ao verbal, rompendo barreiras de linguagem.
`;

// Catálogo da Loja (Dados atualizados com o Ecossistema)
export const STORE_CATALOG: StoreItem[] = [
    {
        id: 'tubemaster_ai',
        label: 'Tubemaster.ai',
        icon: Video,
        description: 'O Maestro do Algoritmo. Gestão de canais e otimização de conteúdo via IA para dominar o YouTube.',
        price: 0,
        category: 'lab',
        rating: 4.9,
        downloads: '1.2k',
        screenshots: ['#1e293b', '#0f172a', '#020617']
    },
    {
        id: 'excelsior_ai',
        label: 'Excelsior.ai',
        icon: Layers,
        description: 'Narrativa Visual. Transforma roteiros em arquitetura de quadrinhos e storyboards.',
        price: 0,
        category: 'lab',
        rating: 5.0,
        downloads: '850',
        screenshots: ['#2e1065', '#4c1d95', '#5b21b6']
    },
    {
        id: 'talia_ai',
        label: 'Talia AI',
        icon: Sparkles,
        description: 'Interface de Inteligência. Tradutora multimodal da realidade (Dev Channel).',
        price: 0,
        category: 'ai',
        rating: 4.7,
        downloads: '2.5k',
        screenshots: ['#701a75', '#86198f', '#a21caf']
    },
    {
        id: 'logus_ai',
        label: 'Logus Vision',
        icon: BrainCircuit,
        description: 'Estúdio de Ativos. DNA visual para replicação de estilos artísticos.',
        price: 0,
        category: 'lab',
        rating: 4.8,
        downloads: '3.1k',
        screenshots: ['#172554', '#1e3a8a', '#1e40af']
    },
    {
        id: 'enok_ai',
        label: 'Enok.ai',
        icon: Fingerprint,
        description: 'Engenharia de Valor. Matemática cirúrgica para juros compostos, FIDC e borderôs.',
        price: 0,
        category: 'lab',
        rating: 5.0,
        downloads: '920',
        screenshots: ['#042f2e', '#115e59', '#0d9488']
    },
    {
        id: 'joaca_pro',
        label: 'Joaca.ai',
        icon: Bot,
        description: 'Sobrevivência de Mercado. Terminal de alerta vermelho e latência zero para traders.',
        price: 0,
        category: 'app',
        rating: 4.9,
        downloads: '10k+',
        screenshots: ['#450a0a', '#7f1d1d', '#991b1b']
    },
    {
        id: 'hermes_ai',
        label: 'Hermes.ai',
        icon: Wallet,
        description: 'O Oráculo da Disciplina. Organização financeira com privacidade absoluta e visão computacional.',
        price: 0,
        category: 'lab',
        rating: 4.8,
        downloads: '5.4k',
        screenshots: ['#064e3b', '#065f46', '#047857']
    },
    {
        id: 'helena_ai',
        label: 'Helena.ai',
        icon: PenTool,
        description: 'Atelier Literário. Gestão de Cânone e consistência narrativa para escritores.',
        price: 0,
        category: 'lab',
        rating: 4.9,
        downloads: '2.1k',
        screenshots: ['#4a044e', '#701a75', '#86198f']
    },
    {
        id: 'fatima_ai',
        label: 'Fatima AI',
        icon: Eye,
        description: 'Jornalismo de Dados. Verificação de fatos e análise de ruído informacional.',
        price: 0,
        category: 'ai',
        rating: 4.6,
        downloads: '1.8k',
        screenshots: ['#1f2937', '#374151', '#4b5563']
    },
    {
        id: 'didata_ai',
        label: 'Didata.ai',
        icon: Database,
        description: 'Educação Adaptativa. Currículos gerados sob demanda em tempo real.',
        price: 0,
        category: 'ai',
        rating: 4.7,
        downloads: '4.2k',
        screenshots: ['#1e1b4b', '#312e81', '#3730a3']
    },
    {
        id: 'christian_ai',
        label: 'Christian AI',
        icon: BookOpen,
        description: 'Catedral Cibernética. Espaço litúrgico para estudo bíblico e arte sacra.',
        price: 0,
        category: 'ai',
        rating: 5.0,
        downloads: '6.7k',
        screenshots: ['#3f2c22', '#5D4037', '#795548']
    }
];
