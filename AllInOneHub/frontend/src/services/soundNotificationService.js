/**
 * Sound Notification Service
 * Handles playing notification sounds for different notification types
 */

class SoundNotificationService {
  constructor() {
    this.audioContext = null;
    this.sounds = new Map();
    this.isEnabled = true;
    this.volume = 0.7;
    
    // Initialize audio context (lazy loading)
    this.initAudioContext();
    
    // Load user preferences from localStorage
    this.loadPreferences();
  }

  // Initialize Web Audio API context
  initAudioContext() {
    try {
      // Use AudioContext or webkitAudioContext for browser compatibility
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
      }
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  // Load preferences from localStorage
  loadPreferences() {
    try {
      const saved = localStorage.getItem('soundNotificationPreferences');
      if (saved) {
        const prefs = JSON.parse(saved);
        this.isEnabled = prefs.enabled !== false; // Default to true
        this.volume = prefs.volume !== undefined ? prefs.volume : 0.7;
      }
    } catch (error) {
      console.warn('Error loading sound preferences:', error);
    }
  }

  // Save preferences to localStorage
  savePreferences() {
    try {
      localStorage.setItem('soundNotificationPreferences', JSON.stringify({
        enabled: this.isEnabled,
        volume: this.volume
      }));
    } catch (error) {
      console.warn('Error saving sound preferences:', error);
    }
  }

  // Enable/disable sound notifications
  setEnabled(enabled) {
    this.isEnabled = enabled;
    this.savePreferences();
  }

  // Set volume (0.0 to 1.0)
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.savePreferences();
  }

  // Generate a beep sound using Web Audio API
  playBeep(frequency = 800, duration = 200, type = 'sine') {
    if (!this.isEnabled || !this.audioContext) return;

    try {
      // Resume audio context if suspended (browser autoplay policy)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.warn('Error playing beep sound:', error);
    }
  }

  // Play notification sound based on priority/type
  playNotificationSound(type = 'default', priority = 'medium') {
    if (!this.isEnabled) return;

    switch (type) {
      case 'task_assigned':
      case 'assignment':
        // Task assignment - pleasant double beep
        this.playBeep(600, 150, 'sine');
        setTimeout(() => {
          this.playBeep(800, 200, 'sine');
        }, 150);
        break;

      case 'urgent':
      case 'high':
        // Urgent notification - urgent triple beep
        this.playBeep(1000, 100, 'sine');
        setTimeout(() => {
          this.playBeep(1000, 100, 'sine');
        }, 120);
        setTimeout(() => {
          this.playBeep(1000, 150, 'sine');
        }, 240);
        break;

      case 'medium':
        // Medium priority - single beep
        this.playBeep(800, 200, 'sine');
        break;

      case 'low':
        // Low priority - soft beep
        this.playBeep(600, 150, 'sine');
        break;

      case 'success':
        // Success - ascending notes
        this.playBeep(523, 100, 'sine'); // C
        setTimeout(() => {
          this.playBeep(659, 100, 'sine'); // E
        }, 100);
        setTimeout(() => {
          this.playBeep(784, 150, 'sine'); // G
        }, 200);
        break;

      case 'error':
        // Error - descending notes
        this.playBeep(784, 100, 'sine'); // G
        setTimeout(() => {
          this.playBeep(659, 100, 'sine'); // E
        }, 100);
        setTimeout(() => {
          this.playBeep(523, 200, 'sine'); // C
        }, 200);
        break;

      default:
        // Default - simple beep
        this.playBeep(800, 200, 'sine');
    }
  }

  // Play a custom sound file (if you want to use audio files)
  async playSoundFile(url) {
    if (!this.isEnabled) return;

    try {
      const audio = new Audio(url);
      audio.volume = this.volume;
      await audio.play();
    } catch (error) {
      console.warn('Error playing sound file:', error);
      // Fallback to beep if file fails
      this.playBeep(800, 200, 'sine');
    }
  }
}

// Export singleton instance
const soundNotificationService = new SoundNotificationService();
export default soundNotificationService;

