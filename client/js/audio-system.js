// AUDIO SYSTEM - Sonidos procedurales con Web Audio API

class AudioSystem {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.masterVolume = this.audioContext.createGain();
    this.masterVolume.connect(this.audioContext.destination);
    this.masterVolume.gain.value = 0.3; // Volumen bajo por defecto

    this.enabled = true;
    this.sfxEnabled = true;
    this.musicEnabled = true;
  }

  // SONIDOS DE ACCIÓN
  playHitSound(intensity = 1) {
    if (!this.enabled || !this.sfxEnabled) return;

    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.masterVolume);

    // Sonido de impacto (baja frecuencia)
    oscillator.frequency.setValueAtTime(150 * intensity, now);
    oscillator.frequency.exponentialRampToValueAtTime(50 * intensity, now + 0.1);

    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    oscillator.start(now);
    oscillator.stop(now + 0.1);
  }

  playSlashSound() {
    if (!this.enabled || !this.sfxEnabled) return;

    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterVolume);

    // Sonido de corte (ruido filtrado)
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(300, now);
    oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.15);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(5000, now);
    filter.frequency.exponentialRampToValueAtTime(2000, now + 0.15);

    gainNode.gain.setValueAtTime(0.25, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    oscillator.start(now);
    oscillator.stop(now + 0.15);
  }

  playGunshot() {
    if (!this.enabled || !this.sfxEnabled) return;

    const now = this.audioContext.currentTime;

    // Crear ruido blanco para disparo
    const bufferSize = this.audioContext.sampleRate * 0.2;
    const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }

    const noiseSource = this.audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterVolume);

    // Filtro para sonido de disparo
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(15000, now);
    filter.frequency.exponentialRampToValueAtTime(3000, now + 0.2);

    gainNode.gain.setValueAtTime(0.5, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    noiseSource.start(now);
    noiseSource.stop(now + 0.2);

    // Sonido de baja frecuencia (boom)
    const oscillator = this.audioContext.createOscillator();
    const gainNode2 = this.audioContext.createGain();

    oscillator.connect(gainNode2);
    gainNode2.connect(this.masterVolume);

    oscillator.frequency.setValueAtTime(150, now);
    oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.15);

    gainNode2.gain.setValueAtTime(0.3, now);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    oscillator.start(now);
    oscillator.stop(now + 0.15);
  }

  // SONIDOS DE ESTADO
  playDeathSound() {
    if (!this.enabled || !this.sfxEnabled) return;

    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.masterVolume);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, now);
    oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.5);

    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    oscillator.start(now);
    oscillator.stop(now + 0.5);
  }

  playParanoiaSound() {
    if (!this.enabled || !this.sfxEnabled) return;

    const now = this.audioContext.currentTime;

    // 3 tonos crecientes
    const frequencies = [300, 500, 800];

    frequencies.forEach((freq, index) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.masterVolume);

      const startTime = now + index * 0.1;
      oscillator.frequency.setValueAtTime(freq, startTime);
      gainNode.gain.setValueAtTime(0.15, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.15);
    });
  }

  playWoundSound() {
    if (!this.enabled || !this.sfxEnabled) return;

    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.masterVolume);

    oscillator.frequency.setValueAtTime(200, now);
    oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.3);

    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    oscillator.start(now);
    oscillator.stop(now + 0.3);
  }

  // SONIDOS DE INTERFAZ
  playUIClick() {
    if (!this.enabled || !this.sfxEnabled) return;

    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.masterVolume);

    oscillator.frequency.setValueAtTime(800, now);
    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    oscillator.start(now);
    oscillator.stop(now + 0.05);
  }

  playGameStart() {
    if (!this.enabled || !this.sfxEnabled) return;

    const now = this.audioContext.currentTime;
    const frequencies = [523, 659, 784]; // Do, Mi, Sol (acorde)

    frequencies.forEach((freq, index) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.masterVolume);

      oscillator.frequency.setValueAtTime(freq, now);
      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      oscillator.start(now);
      oscillator.stop(now + 0.3);
    });
  }

  playGameEnd(won = false) {
    if (!this.enabled || !this.sfxEnabled) return;

    const now = this.audioContext.currentTime;

    if (won) {
      // Sonido de victoria (notas ascendentes)
      const frequencies = [523, 659, 784, 1046]; // Do, Mi, Sol, Do alto

      frequencies.forEach((freq, index) => {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.masterVolume);

        const startTime = now + index * 0.15;
        oscillator.frequency.setValueAtTime(freq, startTime);
        gainNode.gain.setValueAtTime(0.2, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.4);
      });
    } else {
      // Sonido de derrota (notas descendentes)
      const frequencies = [784, 659, 523, 349]; // Sol, Mi, Do, Fa

      frequencies.forEach((freq, index) => {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.masterVolume);

        const startTime = now + index * 0.15;
        oscillator.frequency.setValueAtTime(freq, startTime);
        gainNode.gain.setValueAtValue(0.2, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.4);
      });
    }
  }

  // CONTROL
  setVolume(level) {
    this.masterVolume.gain.setTargetAtTime(level, this.audioContext.currentTime, 0.1);
  }

  mute() {
    this.masterVolume.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.1);
  }

  unmute() {
    this.masterVolume.gain.setTargetAtTime(0.3, this.audioContext.currentTime, 0.1);
  }

  toggleSound() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

// Instancia global
const audio = new AudioSystem();
