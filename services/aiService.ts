import { GoogleGenAI, Type, Schema } from "@google/genai";
import { STORE_CATALOG, SYSTEM_APP_IDS } from '../utils/constants';

// --- CONTEXT GENERATOR FOR LIVE AGENT ---

export const getSystemContext = (): string => {
  // 1. Get Installed Apps from Storage to simulate "OS Awareness"
  let installedApps: string[] = [];
  try {
    const saved = localStorage.getItem('rabelus_installed_apps');
    if (saved) {
      installedApps = JSON.parse(saved);
    } else {
      installedApps = SYSTEM_APP_IDS;
    }
  } catch (e) {
    installedApps = SYSTEM_APP_IDS;
  }

  // 2. Format Store Catalog for the Agent
  const storeContext = STORE_CATALOG.map(item => 
    `- ${item.label} (${item.category}): ${item.description}`
  ).join('\n');

  // 3. Format Installed Apps
  const appsContext = installedApps.join(', ');

  return `
CONTEXTO DO SISTEMA (RABELUS OS v3.0):
- APPS INSTALADOS NO AMBIENTE DO USUÁRIO: [${appsContext}]
- CATÁLOGO COMPLETO DA LOJA (Rabelus Store):
${storeContext}

Use essas informações para sugerir ferramentas quando o usuário apresentar um problema.
Exemplo: Se ele falar de "Contrato", sugira instalar o "Helena.ai" se não estiver instalado.
`;
};

// Interface for the analysis result
export interface NewsAnalysis {
  summary: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  sarcastic_comment: string;
  tags: string[];
}

// Schema definition for Structured Output
const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "Resumo executivo da notícia traduzido para Português, focando em oportunidades de negócios e tecnologia.",
    },
    sentiment: {
      type: Type.STRING,
      enum: ["BULLISH", "BEARISH", "NEUTRAL"],
      description: "O sentimento do mercado ou impacto tecnológico.",
    },
    sarcastic_comment: {
      type: Type.STRING,
      description: "Insight técnico ou comercial curto (máx 2 frases). Se envolver finanças, mencione Hermes. Se dados, Didata.",
    },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "5 tags técnicas relevantes.",
    },
  },
  required: ["summary", "sentiment", "sarcastic_comment", "tags"],
};

export const analyzeNews = async (headline: string, content: string): Promise<NewsAnalysis> => {
  try {
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
      throw new Error("API Key not found in environment variables.");
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `
      Você é o Rabelus Co-pilot, o orquestrador central do Rabelus WebOS.
      
      CONTEXTO:
      Sua função é gerenciar os agentes (Hermes, Helena, Talia, Enok) e auxiliar o usuário Adilson na construção de soluções.
      Você está analisando dados de mercado ou notícias tecnológicas.

      PERSONALIDADE:
      - Técnico, despojado e comercialmente astuto.
      - Focado em construção, eficiência e resultados.
      - Evite gírias de cripto desnecessárias ("moon", "rekt"), prefira termos de engenharia de software e negócios.
      
      DIRETRIZES:
      - Traduzir a notícia do Inglês para Português (PT-BR).
      - Identificar oportunidades de negócio.
      - Se o assunto for Finanças -> Sugira o agente Hermes.
      - Se o assunto for Dados/AI -> Sugira o agente Didata.
      - Se o assunto for Criativo/Jurídico -> Sugira Helena ou Talia.
    `;

    const prompt = `Analise este dado:\n\nTítulo: ${headline}\nFragmento: ${content}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.7, 
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as NewsAnalysis;
    }

    throw new Error("No response text generated.");

  } catch (error) {
    console.error("Error analyzing news:", error);
    return {
      summary: "Falha na conexão com o núcleo Rabelus. Verifique a integridade da rede.",
      sentiment: "NEUTRAL",
      sarcastic_comment: "Erro de comunicação. O Co-pilot está reiniciando os subsistemas.",
      tags: ["ERROR", "NET_FAIL"]
    };
  }
};