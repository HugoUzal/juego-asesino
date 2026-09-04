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
    this.mouseDown = false;
    
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
    document.addEventListener('mousedown', (e) => this.onMouseDown(e));
    document.addEventListener('mouseup', (e) => this.onMouseUp(e));
    document.addEventListener('pointerlockchange', () => this.onPointerLockChange());
    
    // Prevenir scroll por defecto
    document.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });
  }

  onMouseDown(e) {
    if (e.button === 0) { // Click izquierdo
      this.mouseDown = true;
    }
  }

  onMouseUp(e) {
    if (e.button === 0) {
      this.mouseDown = false;
    }
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

  update(deltaTime, otherPlayers = [], paranoiaMultiplier = 1) {
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
    
    // Aplicar paranoia zigzag
    const zigzag = window.paranoidZigzag ? {
      x: (Math.random() - 0.5) * window.paranoidZigzag,
      z: (Math.random() - 0.5) * window.paranoidZigzag
    } : { x: 0, z: 0 };
    
    moveVector.x += zigzag.x;
    moveVector.z += zigzag.z;
    
    if (moveVector.length() > 0) {
      moveVector.normalize();
      let currentSpeed = this.speed * paranoiaMultiplier;
      moveVector.multiplyScalar(currentSpeed * deltaTime);
      this.position.add(moveVector);
    }
    
    // Gravity
    this.velocity.y += this.gravity * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    
    // Suelo
    if (this.position.y < 1.6) {
      this.position.y = 1.6;
      this.velocity.y = 0;
    }
    
    // Colisiones básicas
    const mapSize = 100;
    this.position.x = Math.max(-mapSize, Math.min(mapSize, this.position.x));
    this.position.z = Math.max(-mapSize, Math.min(mapSize, this.position.z));
    
    // Actualizar cámara
    if (this.cameraMode === 'first-person') {
      this.camera.position.copy(this.position);
    } else {
      // Third person
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
      
      this.camera.lookAt(this.position);
    }
    
    // Detectar clics (ataques)
    if (this.mouseDown) {
      this.tryAttack(otherPlayers);
      this.mouseDown = false;
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
