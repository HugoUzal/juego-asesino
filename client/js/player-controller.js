// CONTROLADOR DEL JUGADOR

class PlayerController {
  constructor(camera, renderer) {
    this.camera = camera;
    this.renderer = renderer;
    
    // Entrada
    this.keys = {};
    this.mouseX = 0;
    this.mouseY = 0;
    this.isLocked = false;
    
    // Estado del jugador
    this.position = new THREE.Vector3(0, 1.6, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
    
    // Movimiento
    this.speed = GAME_CONFIG.WALK_SPEED;
    this.isRunning = false;
    this.canJump = false;
    this.jumpForce = 10;
    this.gravity = -9.81;
    
    // Cámara
    this.cameraMode = 'third-person'; // 'first-person' o 'third-person'
    this.cameraDistance = 3;
    this.cameraHeight = 1;
    
    // Cooldowns
    this.lastAttackTime = 0;
    this.lastHelpTime = 0;
    
    // Configurar eventos
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Teclado
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
    document.addEventListener('keyup', (e) => this.onKeyUp(e));
    
    // Mouse
    document.addEventListener('mousemove', (e) => this.onMouseMove(e));
    document.addEventListener('click', () => this.requestPointerLock());
    document.addEventListener('pointerlockchange', () => this.onPointerLockChange());
    
    // Prevenir scroll por defecto
    document.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });
  }

  onKeyDown(e) {
    const key = e.key.toLowerCase();
    this.keys[key] = true;
    
    // Cambiar vista (E)
    if (key === 'e') {
      this.toggleCameraMode();
    }
    
    // Correr (Espacio)
    if (key === ' ') {
      this.isRunning = true;
      this.speed = GAME_CONFIG.RUN_SPEED;
    }
  }

  onKeyUp(e) {
    const key = e.key.toLowerCase();
    this.keys[key] = false;
    
    // Dejar de correr
    if (key === ' ') {
      this.isRunning = false;
      this.speed = GAME_CONFIG.WALK_SPEED;
    }
  }

  onMouseMove(e) {
    if (!this.isLocked) return;
    
    const movementX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
    const movementY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;
    
    this.rotation.setFromQuaternion(this.camera.quaternion);
    this.rotation.order = 'YXZ';
    
    this.rotation.setFromQuaternion(this.camera.quaternion);
    this.rotation.y -= movementX * 0.002;
    this.rotation.x -= movementY * 0.002;
    
    // Limitar rotación vertical
    this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));
    
    this.camera.quaternion.setFromEuler(this.rotation);
  }

  requestPointerLock() {
    document.body.requestPointerLock = document.body.requestPointerLock || 
                                        document.body.mozRequestPointerLock;
    document.body.requestPointerLock();
  }

  onPointerLockChange() {
    this.isLocked = document.pointerLockElement === document.body ||
                    document.mozPointerLockElement === document.body;
  }

  toggleCameraMode() {
    this.cameraMode = this.cameraMode === 'first-person' ? 'third-person' : 'first-person';
    console.log(`📷 Vista: ${this.cameraMode}`);
  }

  update(deltaTime, otherPlayers = []) {
    if (!this.isLocked) return;
    
    // Movimiento horizontal
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    
    right.crossVectors(this.camera.up, forward);
    right.normalize();
    
    const moveVector = new THREE.Vector3();
    
    if (this.keys['w']) moveVector.add(forward);
    if (this.keys['s']) moveVector.add(forward.multiplyScalar(-1));
    if (this.keys['a']) moveVector.add(right.multiplyScalar(-1));
    if (this.keys['d']) moveVector.add(right);
    
    if (moveVector.length() > 0) {
      moveVector.normalize();
      moveVector.multiplyScalar(this.speed * deltaTime);
      this.position.add(moveVector);
    }
    
    // Gravity simple (para futuro: implementar saltos)
    this.velocity.y += this.gravity * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    
    // Suelo
    if (this.position.y < 1.6) {
      this.position.y = 1.6;
      this.velocity.y = 0;
    }
    
    // Colisiones básicas (mantener dentro del mapa)
    const mapSize = 100;
    this.position.x = Math.max(-mapSize, Math.min(mapSize, this.position.x));
    this.position.z = Math.max(-mapSize, Math.min(mapSize, this.position.z));
    
    // Actualizar cámara
    if (this.cameraMode === 'first-person') {
      this.camera.position.copy(this.position);
    } else {
      // Third person - seguir desde atrás
      const offset = new THREE.Vector3();
      this.camera.getWorldDirection(offset);
      offset.y = 0;
      offset.normalize();
      offset.multiplyScalar(-this.cameraDistance);
      offset.y = this.cameraHeight;
      
      this.camera.position.lerp(
        this.position.clone().add(offset),
        0.1
      );
      
      // Mirar al jugador
      this.camera.lookAt(this.position);
    }
    
    // Detectar clics (ataques)
    if (this.keys['click']) {
      this.tryAttack(otherPlayers);
      this.keys['click'] = false;
    }
  }

  tryAttack(otherPlayers) {
    const now = Date.now();
    if (now - this.lastAttackTime < GAME_CONFIG.PUNCH_COOLDOWN) {
      return; // En cooldown
    }
    
    this.lastAttackTime = now;
    
    // Encontrar enemigo más cercano en rango
    let target = null;
    let minDist = 5; // Rango máximo
    
    for (const player of otherPlayers) {
      if (!player.isAlive) continue;
      
      const dist = this.position.distanceTo(player.position);
      if (dist < minDist) {
        minDist = dist;
        target = player;
      }
    }
    
    if (target) {
      console.log(`🔨 Atacando a ${target.username}`);
      network.sendAttack(target.id, GAME_CONFIG.PUNCH_DAMAGE, WEAPON_TYPES.PUNCH);
    }
  }

  getState() {
    return {
      position: this.position,
      rotation: this.rotation
    };
  }

  setPosition(pos) {
    this.position.copy(pos);
  }

  getCamera() {
    return this.camera;
  }
}
