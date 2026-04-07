export class WebAudioRecorder {
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private processor: AudioWorkletNode | null = null;
  private recording: boolean = false;
  private audioChunks: Float32Array[] = [];
  private sampleRate: number = 44100;
  private onRecordingStarted?: () => void;

  async start(onRecordingStarted?: () => void): Promise<void> {
    if (this.recording) return;

    this.onRecordingStarted = onRecordingStarted;

    try {
      // Get microphone access and create audio context in parallel
      const [stream, audioContext] = await Promise.all([
        navigator.mediaDevices.getUserMedia({ 
          audio: { channelCount: 1 } 
        }),
        new Promise<AudioContext>((resolve) => {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          resolve(ctx);
        })
      ]);

      this.stream = stream;
      this.audioContext = audioContext;
      this.sampleRate = this.audioContext.sampleRate;

      // Load the AudioWorklet processor
      await this.audioContext.audioWorklet.addModule('/pcm-processor.js');

      // Create the processor
      this.processor = new AudioWorkletNode(this.audioContext, 'pcm-recorder-processor');

      // Set up communication with the processor
      this.audioChunks = [];
      let hasReceivedAudio = false;
      this.processor.port.onmessage = (event) => {
        if (event.data.audioData) {
          this.audioChunks.push(event.data.audioData);
          
          // Call the callback when we first receive audio data
          if (!hasReceivedAudio && this.onRecordingStarted) {
            hasReceivedAudio = true;
            this.onRecordingStarted();
          }
        }
      };

      // Connect the audio graph
      const source = this.audioContext.createMediaStreamSource(this.stream);
      source.connect(this.processor);
      // Note: We don't connect to destination to avoid feedback

      this.recording = true;
      console.log(`PCM recording started at ${this.sampleRate}Hz`);
    } catch (err) {
      console.error("Error starting PCM recording:", err);
      this.recording = false;
      throw err;
    }
  }

  async stop(): Promise<Blob> {
    if (!this.recording) {
      throw new Error("Not currently recording");
    }

    // Clean up the audio graph
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close();
    }
    
    this.processor = null;
    this.recording = false;

    // Concatenate all audio chunks
    const totalLength = this.audioChunks.reduce((acc, chunk) => acc + chunk.length, 0);
    
    if (totalLength === 0) {
      console.warn('No audio data recorded, creating minimal WAV file');
      // Create a minimal WAV file with silence
      const minimalFloatData = new Float32Array(1024); // 512 samples of silence
      const pcm16Bit = this.floatTo16BitPCM(minimalFloatData);
      return this.createWavBlob(pcm16Bit, this.sampleRate);
    }

    const floatData = new Float32Array(totalLength);
    let offset = 0;
    
    for (const chunk of this.audioChunks) {
      floatData.set(chunk, offset);
      offset += chunk.length;
    }

    // Convert to 16-bit PCM
    const pcm16Bit = this.floatTo16BitPCM(floatData);

    // Create WAV file
    const wavBlob = this.createWavBlob(pcm16Bit, this.sampleRate);
    
    return wavBlob;
  }

  private floatTo16BitPCM(input: Float32Array): Uint8Array {
    let offset = 0;
    const output = new Uint8Array(input.length * 2);
    
    for (let i = 0; i < input.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, input[i]));
      s = s < 0 ? s * 0x8000 : s * 0x7FFF;
      output[offset] = s & 0xFF;
      output[offset + 1] = (s >> 8) & 0xFF;
    }
    
    return output;
  }

  private writeWavHeader(buffer: ArrayBuffer, dataLength: number, sampleRate: number): number {
    const view = new DataView(buffer);
    let offset = 0;
    
    const writeString = (s: string) => {
      for (let i = 0; i < s.length; i++) {
        view.setUint8(offset++, s.charCodeAt(i));
      }
    };

    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = (bitsPerSample * sampleRate * numChannels) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;

    // RIFF header
    writeString('RIFF');
    view.setUint32(offset, 36 + dataLength, true);
    offset += 4;
    writeString('WAVE');
    
    // fmt chunk
    writeString('fmt ');
    view.setUint32(offset, 16, true);
    offset += 4;
    view.setUint16(offset, 1, true); // PCM format
    offset += 2;
    view.setUint16(offset, numChannels, true);
    offset += 2;
    view.setUint32(offset, sampleRate, true);
    offset += 4;
    view.setUint32(offset, byteRate, true);
    offset += 4;
    view.setUint16(offset, blockAlign, true);
    offset += 2;
    view.setUint16(offset, bitsPerSample, true);
    offset += 2;
    
    // data chunk
    writeString('data');
    view.setUint32(offset, dataLength, true);
    offset += 4;
    
    return offset;
  }

  private createWavBlob(pcmData: Uint8Array, sampleRate: number): Blob {
    // Validate input data
    if (!pcmData || pcmData.length === 0) {
      console.warn('No PCM data available, creating minimal WAV file');
      // Create a minimal WAV file with silence
      const minimalPcmData = new Uint8Array(1024); // 512 samples of silence
      return this.createWavBlob(minimalPcmData, sampleRate);
    }

    const wavHeaderLength = 44;
    const totalWavLength = wavHeaderLength + pcmData.length;
    const wavBuffer = new ArrayBuffer(totalWavLength);

    // Write WAV header
    this.writeWavHeader(wavBuffer, pcmData.length, sampleRate);

    // Copy PCM data after the header
    const view = new Uint8Array(wavBuffer, wavHeaderLength);
    view.set(pcmData);

    return new Blob([wavBuffer], { type: 'audio/wav' });
  }

  isRecording(): boolean {
    return this.recording;
  }
}
