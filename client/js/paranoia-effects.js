// PARANOIA EFFECTS - Efectos visuales de paranoia

class ParanoiaEffects {
  constructor(camera, renderer) {
    this.camera = camera;
    this.renderer = renderer;
    this.isActive = false;
    this.startTime = 0;
    this.duration = 300000; // 5 minutos
    this.currentBehavior = null;
    this.behaviorTimer = 0;
  }

  activate(duration = 300000) {
    this.isActive = true;
    this.startTime = Date.now();
    this.duration = duration;
    console.log('🔴 PARANOIA ACTIVADA');
  }

  deactivate() {
    this.isActive = false;
    this.currentBehavior = null;
    this.resetEffects();
    console.log('✓ Paranoia terminada');
  }

  update(deltaTime) {
    if (!this.isActive) return;

    const elapsed = Date.now() - this.startTime;

    if (elapsed > this.duration) {
      this.deactivate();
      return;
    }

    // Cambiar comportamiento cada 1-3 segundos
    if (Date.now() - this.behaviorTimer > 1000 + Math.random() * 2000) {
      this.currentBehavior = this.getRandomBehavior();
      this.behaviorTimer = Date.now();
    }

    // Aplicar efecto actual
    this.applyBehavior(deltaTime, elapsed, this.duration);

    // Intensidad crece con el tiempo
    const intensity = 0.3 + (elapsed / this.duration) * 0.7;
    this.applyScreenEffect(intensity);
  }

  getRandomBehavior() {
    const behaviors = ['zigzag', 'look-back', 'tremor', 'speed-fluctuation'];
    return behaviors[Math.floor(Math.random() * behaviors.length)];
  }

  applyBehavior(deltaTime, elapsed, duration) {
    const intensity = 0.3 + (elapsed / duration) * 0.7;

    switch (this.currentBehavior) {
      case 'zigzag':
        this.applyZigzag(intensity);
        break;
      case 'look-back':
        this.applyLookBack(intensity);
        break;
      case 'tremor':
        this.applyTremor(intensity);
        break;
      case 'speed-fluctuation':
        this.applySpeedFluctuation(intensity);
        break;
    }
  }

  applyZigzag(intensity) {
    // El cliente lo aplicará en su movimiento
    window.paranoidZigzag = intensity;
  }

  applyLookBack(intensity) {
    // Girar ocasionalmente hacia atrás
    if (Math.random() < 0.05) {
      this.camera.rotation.z += (Math.random() - 0.5) * intensity * 0.2;
    }
  }

  applyTremor(intensity) {
    // Vibración leve de cámara
    const shakeAmount = intensity * 0.02;
    this.camera.position.x += (Math.random() - 0.5) * shakeAmount;
    this.camera.position.y += (Math.random() - 0.5) * shakeAmount;
    this.camera.position.z += (Math.random() - 0.5) * shakeAmount;
  }

  applySpeedFluctuation(intensity) {
    // El cliente lo aplicará en su movimiento
    window.paranoidSpeedMultiplier = 0.7 + intensity * 0.6;
  }

  applyScreenEffect(intensity) {
    const canvas = this.renderer.domElement;
    const style = canvas.style;

    // Bordes rojos
    const redBorder = Math.max(0, 30 * intensity);
    style.boxShadow = `inset 0 0 ${redBorder}px rgba(255, 0, 0, ${intensity * 0.8})`;

    // Visión oscura (vignette)
    style.filter = `brightness(${1 - intensity * 0.3}) contrast(${1 + intensity * 0.2})`;

    // Respiración acelerada (audio visual)
    if (intensity > 0.7) {
      style.opacity = 0.95 + Math.sin(Date.now() * 0.005) * 0.02;
    } else {
      style.opacity = 1;
    }
  }

  resetEffects() {
    const canvas = this.renderer.domElement;
    canvas.style.boxShadow = 'none';
    canvas.style.filter = 'none';
    canvas.style.opacity = 1;
    window.paranoidZigzag = 0;
    window.paranoidSpeedMultiplier = 1;
  }

  getSpeedMultiplier() {
    return window.paranoidSpeedMultiplier || 1;
  }

  getZigzagOffset() {
    if (!window.paranoidZigzag || window.paranoidZigzag === 0) {
      return { x: 0, z: 0 };
    }

    return {
      x: (Math.random() - 0.5) * 2 * window.paranoidZigzag,
      z: (Math.random() - 0.5) * 2 * window.paranoidZigzag
    };
  }
}
