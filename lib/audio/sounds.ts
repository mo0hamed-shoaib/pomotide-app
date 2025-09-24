// Audio utilities for Pomodoro timer sounds

export interface SoundConfig {
  frequency: number;
  duration: number;
  type: OscillatorType;
  volume: number;
}

export const SOUND_PRESETS = {
  work: {
    frequency: 880, // A5
    duration: 1.2,
    type: 'sine' as OscillatorType,
    volume: 0.05,
  },
  shortBreak: {
    frequency: 660, // E5
    duration: 0.8,
    type: 'sine' as OscillatorType,
    volume: 0.04,
  },
  longBreak: {
    frequency: 440, // A4
    duration: 1.5,
    type: 'sine' as OscillatorType,
    volume: 0.06,
  },
  focus: {
    frequency: 1047, // C6
    duration: 0.5,
    type: 'sine' as OscillatorType,
    volume: 0.03,
  },
  gentle: {
    frequency: 523, // C5
    duration: 1.0,
    type: 'triangle' as OscillatorType,
    volume: 0.03,
  },
} as const;

export type SoundType = keyof typeof SOUND_PRESETS;

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private isInitialized = false;

  private async initializeAudioContext(): Promise<AudioContext> {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      return this.audioContext;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      
      // Resume context if it's suspended (required for user interaction)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      this.isInitialized = true;
      return this.audioContext;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      throw error;
    }
  }

  async playSound(soundType: SoundType): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const context = await this.initializeAudioContext();
      const config = SOUND_PRESETS[soundType];
      
      // Create oscillator
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      // Configure oscillator
      oscillator.type = config.type;
      oscillator.frequency.setValueAtTime(config.frequency, context.currentTime);
      
      // Configure gain (volume) with envelope
      const now = context.currentTime;
      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.exponentialRampToValueAtTime(config.volume, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + config.duration);
      
      // Start and stop oscillator
      oscillator.start(now);
      oscillator.stop(now + config.duration);
      
      // Clean up
      setTimeout(() => {
        try {
          oscillator.disconnect();
          gainNode.disconnect();
        } catch (error) {
          // Ignore cleanup errors
        }
      }, (config.duration + 0.1) * 1000);
      
    } catch (error) {
      console.error('Failed to play sound:', error);
    }
  }

  async playCustomSound(config: SoundConfig): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const context = await this.initializeAudioContext();
      
      // Create oscillator
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      // Configure oscillator
      oscillator.type = config.type;
      oscillator.frequency.setValueAtTime(config.frequency, context.currentTime);
      
      // Configure gain (volume) with envelope
      const now = context.currentTime;
      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.exponentialRampToValueAtTime(config.volume, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + config.duration);
      
      // Start and stop oscillator
      oscillator.start(now);
      oscillator.stop(now + config.duration);
      
      // Clean up
      setTimeout(() => {
        try {
          oscillator.disconnect();
          gainNode.disconnect();
        } catch (error) {
          // Ignore cleanup errors
        }
      }, (config.duration + 0.1) * 1000);
      
    } catch (error) {
      console.error('Failed to play custom sound:', error);
    }
  }

  // Play a sequence of sounds (e.g., for different session types)
  async playSoundSequence(sounds: SoundType[], delay: number = 200): Promise<void> {
    for (let i = 0; i < sounds.length; i++) {
      await this.playSound(sounds[i]);
      if (i < sounds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Test sound functionality
  async testSound(soundType: SoundType = 'gentle'): Promise<boolean> {
    try {
      await this.playSound(soundType);
      return true;
    } catch (error) {
      console.error('Sound test failed:', error);
      return false;
    }
  }

  // Clean up audio context
  cleanup(): void {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
      this.isInitialized = false;
    }
  }
}

// Singleton instance
export const audioManager = new AudioManager();
