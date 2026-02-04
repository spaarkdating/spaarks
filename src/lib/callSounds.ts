// Call sounds using Web Audio API for ringtones and calling sounds

class CallSounds {
  private audioContext: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;
  private intervalId: NodeJS.Timeout | null = null;

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  // Play a tone sequence for calling sound (outgoing)
  playCallingSound(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;

    const playTone = () => {
      const ctx = this.getAudioContext();
      
      // Create oscillator for ring tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      // Ring tone frequency (similar to phone dial tone)
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4 note
      osc.type = 'sine';
      
      // Fade in and out
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.1);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.8);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1);
    };

    // Play tone immediately and then every 3 seconds
    playTone();
    this.intervalId = setInterval(() => {
      if (this.isPlaying) {
        playTone();
      }
    }, 3000);
  }

  // Play ringtone sound (incoming)
  playRingtone(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;

    const playRing = () => {
      const ctx = this.getAudioContext();
      
      // Create two oscillators for a more pleasant ringtone
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      // Ringtone frequencies (pleasant two-tone ring)
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc1.type = 'sine';
      osc2.type = 'sine';
      
      // Ring pattern: two short bursts
      gain.gain.setValueAtTime(0, ctx.currentTime);
      
      // First ring
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.3);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.35);
      
      // Second ring
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.5);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.8);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.85);
      
      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 1);
      osc2.stop(ctx.currentTime + 1);
    };

    // Play ring immediately and then every 2 seconds
    playRing();
    this.intervalId = setInterval(() => {
      if (this.isPlaying) {
        playRing();
      }
    }, 2000);
  }

  // Play call connected sound
  playConnectedSound(): void {
    const ctx = this.getAudioContext();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    // Short ascending tone for connection
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.15);
    osc.type = 'sine';
    
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  }

  // Play call ended sound
  playEndedSound(): void {
    const ctx = this.getAudioContext();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    // Short descending tone for disconnection
    osc.frequency.setValueAtTime(500, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(300, ctx.currentTime + 0.3);
    osc.type = 'sine';
    
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.35);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
  }

  // Stop all sounds
  stop(): void {
    this.isPlaying = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    if (this.oscillator) {
      try {
        this.oscillator.stop();
      } catch (e) {
        // Ignore if already stopped
      }
      this.oscillator = null;
    }
    
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
  }
}

// Singleton instance
export const callSounds = new CallSounds();
