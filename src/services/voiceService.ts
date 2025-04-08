export class VoiceService {
  private synth: SpeechSynthesis;
  private recognition: SpeechRecognition | null = null;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private voiceReady: boolean = false;
  private pendingInitialMessage: { text: string; emotion?: string } | null = null;

  constructor() {
    this.synth = window.speechSynthesis;
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-GB';
    }

    // Initialize voices when they become available
    if (this.synth.getVoices().length > 0) {
      this.initializeVoices();
    } else {
      this.synth.onvoiceschanged = () => this.initializeVoices();
    }
  }

  private initializeVoices() {
    const voices = this.synth.getVoices();
    
    // Prefer British English voices
    const britishVoices = voices.filter(voice => 
      voice.lang.includes('en-GB') || 
      voice.name.includes('British') ||
      voice.name.includes('UK')
    );

    // Select the best available voice
    if (britishVoices.length > 0) {
      // Prefer female voices as they often sound more natural
      const femaleVoices = britishVoices.filter(voice => 
        voice.name.includes('Female') || 
        voice.name.includes('Woman')
      );
      
      this.selectedVoice = femaleVoices.length > 0 ? femaleVoices[0] : britishVoices[0];
    } else {
      // Fallback to any English voice
      const englishVoices = voices.filter(voice => voice.lang.includes('en-'));
      this.selectedVoice = englishVoices.length > 0 ? englishVoices[0] : voices[0];
    }

    this.voiceReady = true;

    // If there's a pending initial message, speak it now
    if (this.pendingInitialMessage) {
      this.speak(this.pendingInitialMessage.text, this.pendingInitialMessage.emotion);
      this.pendingInitialMessage = null;
    }
  }

  private addNaturalPauses(text: string): string {
    // Add pauses after punctuation
    return text
      .replace(/\./g, '. ')
      .replace(/\?/g, '? ')
      .replace(/!/g, '! ')
      .replace(/,/g, ', ');
  }

  private adjustProsody(text: string, emotion?: string): SpeechSynthesisUtterance {
    const utterance = new SpeechSynthesisUtterance(this.addNaturalPauses(text));
    
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
    
    // Set language to British English
    utterance.lang = 'en-GB';
    
    // Adjust speech parameters based on emotion
    switch (emotion) {
      case 'frustrated':
        utterance.rate = 1.1;
        utterance.pitch = 1.2;
        utterance.volume = 1.1;
        break;
      case 'anxious':
        utterance.rate = 1.2;
        utterance.pitch = 1.3;
        utterance.volume = 0.9;
        break;
      case 'confused':
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        utterance.volume = 0.95;
        break;
      case 'satisfied':
        utterance.rate = 1.0;
        utterance.pitch = 1.1;
        utterance.volume = 1.0;
        break;
      default:
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
    }

    return utterance;
  }

  speak(text: string, emotion?: string): void {
    if (this.synth.speaking) {
      this.synth.cancel();
    }

    // If voice is not ready, store the message and try again later
    if (!this.voiceReady) {
      this.pendingInitialMessage = { text, emotion };
      return;
    }

    const utterance = this.adjustProsody(text, emotion);
    this.synth.speak(utterance);
  }

  startListening(onResult: (text: string) => void): void {
    if (!this.recognition) {
      console.error('Speech recognition not supported');
      return;
    }

    this.recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      onResult(text);
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
    };

    this.recognition.start();
  }

  stopListening(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
  }
} 