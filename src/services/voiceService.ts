export class VoiceService {
  private synth: SpeechSynthesis;
  private recognition: SpeechRecognition | null = null;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private voiceReady: boolean = false;
  private pendingInitialMessage: { text: string; emotion?: string } | null = null;

  constructor() {
    this.synth = window.speechSynthesis;
    console.log('Speech synthesis initialized');
    
    // Resume audio context if suspended
    if (this.synth.speaking) {
      this.synth.cancel();
    }
    
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-GB';
      console.log('Speech recognition initialized');
    }

    // Initialize voices when they become available
    if (this.synth.getVoices().length > 0) {
      console.log('Voices available immediately');
      this.initializeVoices();
    } else {
      console.log('Waiting for voices to become available');
      this.synth.onvoiceschanged = () => {
        console.log('Voices changed event fired');
        this.initializeVoices();
      };
    }
  }

  private initializeVoices() {
    const voices = this.synth.getVoices();
    console.log('Available voices:', voices.length);
    
    // Prefer British English voices
    const britishVoices = voices.filter(voice => 
      voice.lang.includes('en-GB') || 
      voice.name.includes('British') ||
      voice.name.includes('UK')
    );
    console.log('British voices:', britishVoices.length);

    // Select the best available voice
    if (britishVoices.length > 0) {
      // Prefer female voices as they often sound more natural
      const femaleVoices = britishVoices.filter(voice => 
        voice.name.includes('Female') || 
        voice.name.includes('Woman')
      );
      console.log('Female British voices:', femaleVoices.length);
      
      this.selectedVoice = femaleVoices.length > 0 ? femaleVoices[0] : britishVoices[0];
    } else {
      // Fallback to any English voice
      const englishVoices = voices.filter(voice => voice.lang.includes('en-'));
      console.log('English voices:', englishVoices.length);
      this.selectedVoice = englishVoices.length > 0 ? englishVoices[0] : voices[0];
    }

    console.log('Selected voice:', this.selectedVoice?.name);
    this.voiceReady = true;

    // If there's a pending initial message, speak it now
    if (this.pendingInitialMessage) {
      console.log('Speaking pending message');
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
    console.log('Attempting to speak:', text);
    
    if (this.synth.speaking) {
      console.log('Canceling previous speech');
      this.synth.cancel();
    }

    // If voice is not ready, store the message and try again later
    if (!this.voiceReady) {
      console.log('Voice not ready, storing message');
      this.pendingInitialMessage = { text, emotion };
      return;
    }

    try {
      const utterance = this.adjustProsody(text, emotion);
      
      utterance.onstart = () => console.log('Speech started');
      utterance.onend = () => console.log('Speech ended');
      utterance.onerror = (event) => console.error('Speech error:', event);
      
      console.log('Speaking with voice:', this.selectedVoice?.name);
      this.synth.speak(utterance);
      
      // Chrome and Safari fix: Need to resume audio context
      // This is needed because some browsers require user interaction before allowing audio
      if (this.synth.paused) {
        console.log('Speech synthesis was paused, resuming');
        this.synth.resume();
      }
    } catch (error) {
      console.error('Error speaking:', error);
    }
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