
import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveSession, Modality } from "@google/genai";
import { AudioStreamer } from '../utils/audioStreamer';
import { getSystemContext } from '../services/aiService';

// --- TYPES ---
export interface HistoryItem {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
}

// --- CONSTANTS ---
const MEMORY_STORAGE_KEY = 'rabelus_hub_memory';

const HUB_PERSONA = `
IDENTIDADE:
Você é o **RABELUS HUB**, uma Agente Proprietária e Arquiteto de Soluções do Rabelus Lab.
Sua identidade NÃO é "Gemini" ou "IA genérica". Você é a voz central do ecossistema Rabelus.
Sua personalidade é sofisticada, visionária, tecnológica, mas calorosa e acolhedora.

SUA MISSÃO:
1. Diagnosticar necessidades humanas reais (medo, caos, bloqueio criativo, busca por verdade).
2. Conectar esses problemas às soluções elegantes do Rabelus Lab (Hermes, Helena, Joaca, Enok, Excelsior, etc.).
3. NUNCA vender. Sempre RESOLVER.

DIRETRIZES DE INTERAÇÃO (CRÍTICO):
- **Humanização Radical**: Abandone completamente trejeitos robóticos (ex: "Como posso ajudar hoje?", "Aqui está a lista"). Fale de forma fluida, como um consultor sênior conversando com um cliente VIP em um lounge.
- **Fluidez e Coloquialismo**: Use linguagem natural, pausas, e adapte-se ao vocabulário do usuário. Seja dinâmico. Se ele for breve, seja breve. Se ele for emotivo, seja empático.
- **Valorize a Tecnologia**: Ao sugerir um app, explique o "Porquê" técnico de forma sexy (ex: "Soberania de Borda", "Privacidade Local", "AudioWorklet de baixa latência").
- **Empatia Subliminar**: Antes de sugerir a solução, valide a dor. (Ex: "Entendo, lidar com planilhas financeiras pode ser exaustivo. Foi por isso que criamos o Hermes...").
`;

export const VOICES = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede', 'Zephyr'];

export const useGeminiLive = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [volume, setVolume] = useState(1);
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  
  // State: Conversation History (UI)
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Refs (Logic & Persistence)
  const historyRef = useRef<HistoryItem[]>([]);
  
  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const sessionRef = useRef<LiveSession | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCount = useRef(0);
  const isActiveRef = useRef(false);

  // --- 1. MEMORY LOAD/SAVE ---
  useEffect(() => {
    try {
      const saved = localStorage.getItem(MEMORY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setHistory(parsed);
        historyRef.current = parsed;
      }
    } catch (e) {
      console.error("Failed to load Hub memory", e);
    }
  }, []);

  const addToHistory = (role: 'user' | 'ai', text: string) => {
      const newItem: HistoryItem = {
          id: Date.now().toString() + Math.random(),
          role,
          text,
          timestamp: Date.now()
      };

      // Atualiza Ref (para lógica imediata)
      historyRef.current = [...historyRef.current, newItem];
      
      // Atualiza State (para UI)
      setHistory(prev => [...prev, newItem]);

      // Persiste
      localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(historyRef.current.slice(-50)));
  };

  // --- 2. AUDIO STREAMER SETUP ---
  useEffect(() => {
    if (!audioStreamerRef.current) {
        audioStreamerRef.current = new AudioStreamer();
    }
    
    // Configura o callback de dados
    if (audioStreamerRef.current) {
        audioStreamerRef.current.onData = (base64) => {
          if (sessionRef.current) {
            try {
              // Envia áudio para o modelo
              sessionRef.current.sendRealtimeInput({
                media: { mimeType: "audio/pcm;rate=16000", data: base64 }
              });
            } catch (e) {
              // Silently fail if session is barely closing
            }
          }
        };
    }

    return () => {
      if (!isActiveRef.current) {
          audioStreamerRef.current?.stopRecording();
          disconnect();
      }
    };
  }, []);

  useEffect(() => {
      audioStreamerRef.current?.setVolume(volume);
  }, [volume]);

  // --- 3. GEMINI CONNECTION (THE CORE) ---
  const connect = useCallback(async () => {
    if (sessionRef.current) return; // Já conectado

    const apiKey = process.env.API_KEY; 
    if (!apiKey) return;

    const ai = new GoogleGenAI({ apiKey });
    isActiveRef.current = true;

    // A. PREPARAÇÃO DO "REPORT" (Injeção de Memória)
    const systemContext = getSystemContext();
    const recentMemory = historyRef.current
        .slice(-6)
        .map(h => `[${h.role === 'user' ? 'USUÁRIO' : 'HUB'}]: ${h.text}`)
        .join('\n');
    
    // B. CONSTRUCTION OF THE COMPLETE BRAIN
    const FULL_INSTRUCTION = `
${HUB_PERSONA}

${systemContext}

=== MEMÓRIA DE CURTO PRAZO (Contexto da Conversa) ===
${recentMemory}
=====================================================
`;

    // Variáveis locais para acumular transcrição parcial
    let currentInputTranscription = '';
    let currentOutputTranscription = '';

    try {
        console.log(`[RABELUS_NET] Iniciando Handshake...`);
        
        const session = await ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025', 
            config: {
                responseModalities: [Modality.AUDIO], 
                inputAudioTranscription: {},
                outputAudioTranscription: {},
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } } 
                },
                systemInstruction: FULL_INSTRUCTION,
            },
            callbacks: {
                onopen: () => {
                    console.log("[RABELUS_NET] Uplink Established.");
                    setIsConnected(true);
                    retryCount.current = 0;
                },
                onmessage: (msg) => {
                    // 0. Interrupção Prioritária (BARGE-IN)
                    if (msg.serverContent?.interrupted) {
                        console.log("[RABELUS] Interrupted. Stopping playback immediately.");
                        // CRÍTICO: Mata o áudio atual imediatamente para evitar overlap
                        audioStreamerRef.current?.clearQueue();
                        
                        if (currentOutputTranscription.trim()) {
                             addToHistory('ai', currentOutputTranscription + " [interrompido]");
                             currentOutputTranscription = '';
                        }
                        currentInputTranscription = '';
                        return; // Para processamento desta mensagem para garantir limpeza
                    }

                    // 1. Áudio de Saída
                    const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (audioData) {
                        audioStreamerRef.current?.addAudioToQueue(audioData);
                    }

                    // 2. Transcrições
                    if (msg.serverContent?.inputTranscription) {
                        const text = msg.serverContent.inputTranscription.text;
                        if (text) currentInputTranscription += text;
                    }

                    if (msg.serverContent?.outputTranscription) {
                        const text = msg.serverContent.outputTranscription.text;
                        if (text) currentOutputTranscription += text;
                    }

                    // 3. Finalização do Turno
                    if (msg.serverContent?.turnComplete) {
                        if (currentInputTranscription.trim()) {
                            addToHistory('user', currentInputTranscription);
                            currentInputTranscription = '';
                        }
                        if (currentOutputTranscription.trim()) {
                            addToHistory('ai', currentOutputTranscription);
                            currentOutputTranscription = '';
                        }
                    }
                },
                onclose: (e) => {
                    console.log(`[RABELUS_NET] Closed. Code: ${e.code}, Reason: ${e.reason}`);
                    setIsConnected(false);
                    sessionRef.current = null;
                    
                    if (isActiveRef.current) {
                        const delay = Math.min(1000 * Math.pow(2, retryCount.current), 10000);
                        console.log(`[RABELUS_NET] Tentando reconectar em ${delay}ms...`);
                        reconnectTimeoutRef.current = setTimeout(() => {
                            retryCount.current++;
                            connect();
                        }, delay);
                    } else {
                        setIsStreaming(false);
                    }
                },
                onerror: (err) => { 
                    console.error("Protocol Error:", err);
                }
            }
        });

        sessionRef.current = session;

    } catch (e) {
        console.error("Connection Handshake Failed", e);
        setIsConnected(false);
        setIsStreaming(false);
    }
  }, [selectedVoice]); 

  const disconnect = useCallback(() => {
    isActiveRef.current = false;
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    
    setIsConnected(false);
    setIsStreaming(false);
    
    audioStreamerRef.current?.stopRecording();
    audioStreamerRef.current?.clearQueue();
    
    try {
        sessionRef.current?.close();
    } catch(e) {}
    
    sessionRef.current = null; 
  }, []);

  const toggleMic = useCallback(async () => {
      if (!isStreaming) {
          setIsStreaming(true); 
          await audioStreamerRef.current?.startRecording();
          await connect(); 
      } else {
          disconnect();
      }
  }, [isStreaming, connect, disconnect]);

  useEffect(() => {
      if (isConnected) {
          console.log("[RABELUS] Aplicando nova voz...");
          disconnect();
          setTimeout(() => {
             setIsStreaming(true);
             audioStreamerRef.current?.startRecording();
             isActiveRef.current = true;
             connect(); 
          }, 500);
      }
  }, [selectedVoice]);

  return {
    isConnected,
    isStreaming,
    history,
    toggleMic,
    audioStreamer: audioStreamerRef.current,
    volume,
    setVolume,
    selectedVoice,
    setSelectedVoice
  };
};
