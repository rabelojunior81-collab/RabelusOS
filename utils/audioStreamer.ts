
export class AudioStreamer {
  public audioContext: AudioContext | null = null; // Output Context (24kHz)
  private inputAudioContext: AudioContext | null = null; // Input Context (16kHz)
  
  private isPlaying: boolean = false;
  private inputSampleRate: number = 16000; // Optimal for Speech Recognition
  private outputSampleRate: number = 24000; // Optimal for Gemini Voice Output
  
  private bufferSize: number = 4096;
  private inputProcessor: ScriptProcessorNode | null = null;
  private mediaStream: MediaStream | null = null;
  private gainNode: GainNode | null = null;
  public analyser: AnalyserNode | null = null;
  
  // Gapless Playback Cursor
  private nextStartTime: number = 0;
  
  // Track active sources to allow immediate cancellation (Barge-in)
  private activeSources: AudioBufferSourceNode[] = [];

  // Callback to send audio data back to the hook
  public onData: (base64: string) => void = () => {};

  constructor() {
    // Initial setup
  }

  async initialize() {
    // 1. Initialize Output Context (High Quality)
    if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: this.outputSampleRate, 
        });
        
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.5;
        
        this.gainNode = this.audioContext.createGain();
        this.gainNode.connect(this.audioContext.destination);
    }

    // 2. Initialize Input Context (Voice Standard)
    if (!this.inputAudioContext) {
        this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: this.inputSampleRate, 
        });
    }
  }

  async startRecording() {
    await this.initialize();
    
    // Resume contexts if they were suspended (common browser policy)
    if (this.inputAudioContext && this.inputAudioContext.state === 'suspended') {
      await this.inputAudioContext.resume();
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    if (!this.inputAudioContext) return;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          channelCount: 1, 
          echoCancellation: true, 
          autoGainControl: true, 
          noiseSuppression: true,
          sampleRate: this.inputSampleRate
        } 
      });

      const source = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
      
      // Use the input context for processing to ensure 16kHz rate
      this.inputProcessor = this.inputAudioContext.createScriptProcessor(this.bufferSize, 1, 1);
      
      source.connect(this.inputProcessor);
      this.inputProcessor.connect(this.inputAudioContext.destination); 

      this.inputProcessor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Data is already at 16kHz because inputAudioContext is 16kHz
        const pcmData = this.floatTo16BitPCM(inputData);
        
        // Only send if we have data
        if (pcmData.byteLength > 0) {
            const base64 = this.arrayBufferToBase64(pcmData.buffer);
            this.onData(base64);
        }
      };

    } catch (error) {
      console.error("Error starting audio stream:", error);
    }
  }

  stopRecording() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.inputProcessor) {
      this.inputProcessor.disconnect();
      this.inputProcessor = null;
    }
  }

  // --- AUDIO OUTPUT (Gapless Logic) ---

  async addAudioToQueue(base64Data: string) {
    if (!this.audioContext) await this.initialize();
    if (!this.audioContext) return;
    
    // Ensure output context is running
    if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
    }

    try {
        const arrayBuffer = this.base64ToArrayBuffer(base64Data);
        const int16Data = new Int16Array(arrayBuffer);
        const float32Data = new Float32Array(int16Data.length);
        
        for (let i = 0; i < int16Data.length; i++) {
            float32Data[i] = int16Data[i] / 32768.0;
        }

        const buffer = this.audioContext.createBuffer(1, float32Data.length, this.outputSampleRate);
        buffer.copyToChannel(float32Data, 0);

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;

        if (this.analyser && this.gainNode) {
            source.connect(this.analyser);
            this.analyser.connect(this.gainNode);
        } else {
            source.connect(this.audioContext.destination);
        }

        const currentTime = this.audioContext.currentTime;
        
        // Gapless Logic: Schedule next chunk at the end of the previous one.
        if (this.nextStartTime < currentTime) {
            this.nextStartTime = currentTime;
        }

        source.start(this.nextStartTime);
        this.nextStartTime += buffer.duration;

        // TRACK SOURCE FOR CANCELLATION
        this.activeSources.push(source);

        // Cleanup when finished naturally
        source.onended = () => {
          this.activeSources = this.activeSources.filter(s => s !== source);
        };

    } catch (e) {
        console.error("Error processing audio chunk", e);
    }
  }

  clearQueue() {
    // 1. HARD STOP all currently playing nodes
    this.activeSources.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        // Ignore errors if already stopped
      }
    });
    
    // 2. Clear array
    this.activeSources = [];

    // 3. Reset cursor to 'now' so next audio plays immediately
    if (this.audioContext) {
        this.nextStartTime = this.audioContext.currentTime;
    }
  }

  setVolume(val: number) {
      if (this.gainNode && this.audioContext) {
          this.gainNode.gain.setValueAtTime(val, this.audioContext.currentTime);
      }
  }

  // --- UTILS ---

  private floatTo16BitPCM(input: Float32Array) {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]));
        output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private base64ToArrayBuffer(base64: string) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  public getAnalyserData(dataArray: Uint8Array) {
      if (this.analyser) {
          this.analyser.getByteFrequencyData(dataArray);
      }
  }
}
