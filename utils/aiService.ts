
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { STORE_CATALOG, SYSTEM_APP_IDS, RABELUS_MANIFESTO } from '../utils/constants';

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

  // 2. Format Installed Apps
  const appsContext = installedApps.join(', ');

  return `
=== ESTADO ATUAL DO SISTEMA (RABELUS OS) ===
APPS INSTALADOS PELO USUÁRIO: [${appsContext}]

=== BIBLIA DO ECOSSISTEMA (Referência Absoluta) ===
${RABELUS_MANIFESTO}

Utilize esse conhecimento para conectar o problema do usuário à solução correta.
`;
};

// --- LEGACY NEWS ANALYSIS (Mantido para compatibilidade com NewsScreen) ---

export interface NewsAnalysis {
  summary: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  sarcastic_comment: string;
  tags: string[];
}

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "Resumo executivo da notícia traduzido para Português.",
    },
    sentiment: {
      type: Type.STRING,
      enum: ["BULLISH", "BEARISH", "NEUTRAL"],
      description: "O sentimento do mercado.",
    },
    sarcastic_comment: {
      type: Type.STRING,
      description: "Insight técnico ou comercial curto.",
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
    if (!apiKey) throw new Error("API Key not found.");

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Analise este dado:\n\nTítulo: ${headline}\nFragmento: ${content}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "Você é um analista de mercado cripto sênior.",
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      },
    });

    if (response.text) return JSON.parse(response.text) as NewsAnalysis;
    throw new Error("No response text generated.");

  } catch (error) {
    console.error("Error analyzing news:", error);
    return {
      summary: "Falha na análise neural.",
      sentiment: "NEUTRAL",
      sarcastic_comment: "Erro de comunicação com o núcleo.",
      tags: ["ERROR"]
    };
  }
};
