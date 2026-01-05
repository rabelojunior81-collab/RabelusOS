
import { useState, useEffect, useRef, useCallback } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai' | 'system';
  text: string;
}

export const useVoiceInterface = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<ChatMessage[]>([{
    id: 'init',
    role: 'system',
    text: 'Rabelus Audio Core Online. Aguardando comando...'
  }]);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [volume, setVolume] = useState(1); // 0 to 1

  const recognitionRef = useRef<any>(null);
  const synth = window.speechSynthesis;

  // Initialize Voices
  useEffect(() => {
    const loadVoices = () => {
      const available = synth.getVoices();
      setVoices(available);
      // Try to find a good PT-BR voice or default
      const ptVoice = available.find(v => v.lang.includes('pt-BR') && v.name.includes('Google')) || available.find(v => v.lang.includes('pt-BR'));
      setSelectedVoice(ptVoice || available[0]);
    };

    loadVoices();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }
  }, []);

  // Initialize Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'pt-BR';

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);
      
      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
           addMessage('user', finalTranscript);
           // Simulate AI Processing & Reply
           setTimeout(() => handleAIResponse(finalTranscript), 800);
        }
      };
    }
  }, []);

  const addMessage = (role: 'user' | 'ai', text: string) => {
    setTranscript(prev => [...prev.slice(-4), { id: Date.now().toString(), role, text }]);
  };

  const handleAIResponse = async (userText: string) => {
     // Mock AI Logic - In a real app, this connects to Gemini
     const responses = [
         "Processando sua solicitação nos servidores centrais.",
         "Entendido. Iniciando protocolo.",
         "Analisei os dados. Parece promissor.",
         "O mercado está volátil hoje, recomendo cautela.",
         "Executando tarefa em segundo plano."
     ];
     const reply = responses[Math.floor(Math.random() * responses.length)];
     addMessage('ai', reply);
     speak(reply);
  };

  const speak = useCallback((text: string) => {
    if (synth.speaking) {
      console.error('speechSynthesis.speaking');
      return;
    }
    if (text !== '') {
      const utterThis = new SpeechSynthesisUtterance(text);
      utterThis.onstart = () => setIsSpeaking(true);
      utterThis.onend = () => setIsSpeaking(false);
      utterThis.onerror = (e) => { console.error('Speech error', e); setIsSpeaking(false); };
      
      utterThis.voice = selectedVoice;
      utterThis.pitch = 1;
      utterThis.rate = 1.1; // Slightly faster for tech feel
      utterThis.volume = volume;
      
      synth.speak(utterThis);
    }
  }, [selectedVoice, volume]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  };

  return {
    isListening,
    isSpeaking,
    transcript,
    toggleListening,
    voices,
    selectedVoice,
    setSelectedVoice,
    volume,
    setVolume
  };
};
