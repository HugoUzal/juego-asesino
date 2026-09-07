// MAIN - ORQUESTADOR DEL JUEGO

class Game {
  constructor() {
    this.state = GAME_STATES.LOBBY;
    this.playerId = null;
    this.isAssassin = false;
    this.players = {};
    this.localPlayer = null;
    this.playerController = null;
    this.sceneManager = null;
    this.hud = new HUDSystem();
    this.hud.addStyles();
    
    // UI
    this.uiElements = {
      lobby: document.getElementById('lobby'),
      hud: document.getElementById('hud'),
      gameOver: document.getElementById('game-over'),
      chatContainer: document.getElementById('chat-container'),
      chatMessages: document.getElementById('chat-messages'),
      chatInput: document.getElementById('chat-input'),
      playerList: document.getElementById('player-list'),
      startBtn: document.getElementById('start-btn'),
      joinBtn: document.getElementById('join-btn'),
      playerCount: document.getElementById('player-count'),
      healthFill: document.getElementById('health-fill'),
      roleDisplay: document.getElementById('role-display'),
      weaponDisplay: document.getElementById('weapon-display'),
      ammoDisplay: document.getElementById('ammo-display'),
    };

    this.myWeapon = null;

    this.setupUI();
    this.setupNetworking();

    // Game loop
    this.lastTime = Date.now();
    this.gameRunning = false;
  }

  setupUI() {
    // Join button
    this.uiElements.joinBtn.addEventListener('click', () => this.joinGame());
    
    // Start button
    this.uiElements.startBtn.addEventListener('click', () => this.startGame());
    
    // Chat
    this.uiElements.chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const message = this.uiElements.chatInput.value.trim();
        if (message) {
          network.sendChatMessage(message);
          this.uiElements.chatInput.value = '';
        }
      }
    });
    
    // Mostrar chat con T
    document.addEventListener('keydown', (e) => {
      if (e.key === 't' || e.key === 'T') {
        this.uiElements.chatInput.focus();
      }
    });
  }

  setupNetworking() {
    network.connect();
    
    network.on('onYouJoined', (data) => this.onYouJoined(data));
    network.on('onPlayersUpdate', (data) => this.onPlayersUpdate(data));
    network.on('onPlayerMoved', (data) => this.onPlayerMoved(data));
    network.on('onGameStarted', (data) => this.onGameStarted(data));
    network.on('onPlayerHit', (data) => this.onPlayerHit(data));
    network.on('onPlayerDied', (data) => this.onPlayerDied(data));
    network.on('onChatMessage', (data) => this.onChatMessage(data));
    
    // Nuevos eventos
    network.on('onYouKilledInnocent', (data) => this.onYouKilledInnocent(data));
    network.on('onPlayerWounded', (data) => this.onPlayerWounded(data));
    network.on('onPlayerLeft', (data) => this.onPlayerLeft(data));
    network.on('onGameEnded', (data) => this.onGameEnded(data));
    network.on('onWeaponPickedUp', (data) => this.onWeaponPickedUp(data));
  }

  joinGame() {
    const username = document.getElementById('username').value.trim();
    const character = document.getElementById('character').value;
    const map = document.getElementById('map').value;
    
    if (!username) {
      alert('Por favor ingresa un nombre');
      return;
    }
    
    if (!character) {
      alert('Por favor elige un personaje');
      return;
    }
    
    // Desabilitar UI
    this.uiElements.joinBtn.disabled = true;
    document.getElementById('username').disabled = true;
    document.getElementById('character').disabled = true;
    document.getElementById('map').disabled = true;
    
    network.joinGame(username, character, map);
  }

  onYouJoined(data) {
    this.playerId = data.playerId;
    this.players[this.playerId] = data.player;
    console.log('✓ Te uniste:', this.playerId);
  }

  onPlayersUpdate(data) {
    // Actualizar lista de jugadores
    const playerListHTML = data.players.map(p => 
      `<div class="player-item">👤 ${p.username}</div>`
    ).join('');
    
    this.uiElements.playerList.innerHTML = playerListHTML;
    this.uiElements.playerCount.textContent = data.playerCount;
    
    // Mostrar botón de inicio si hay suficientes jugadores y eres el primero
    if (data.playerCount >= 2 && data.players[0]?.id === this.playerId) {
      this.uiElements.startBtn.style.display = 'block';
    }
    
    // Guardar todos los jugadores
    this.players = {};
    data.players.forEach(p => {
      this.players[p.id] = p;
    });
  }

  startGame() {
    const map = document.getElementById('map').value;
    network.startGame(map);
  }

  onGameStarted(data) {
    this.state = GAME_STATES.PLAYING;
    this.isAssassin = data.isAssassin;
    
    console.log(`🎬 JUEGO INICIADO - Eres ${this.isAssassin ? 'ASESINO' : 'INOCENTE'}`);
    
    // Sonido de inicio
    audio.playGameStart();
    
    // Esconder lobby
    this.uiElements.lobby.style.display = 'none';
    this.uiElements.hud.style.display = 'block';
    
    // Actualizar HUD
    this.hud.updateRole(this.isAssassin);
    this.hud.updateMap(data.map);
    this.hud.showNotification(
      this.isAssassin ? '🔪 ERES EL ASESINO 🔪' : '👤 ERES INOCENTE',
      this.isAssassin ? 'assassin' : 'info',
      5000
    );
    
    // Inicializar escena 3D
    this.initializeGame(data.map, data.players, data.weapons || []);
  }

  initializeGame(mapName, players, weapons = []) {
    this.myWeapon = null;

    // Crear gestor de escena
    const container = document.body;
    this.sceneManager = new SceneManager(container);
    this.sceneManager.loadMap(mapName);
    this.sceneManager.setWeaponPickups(weapons);

    // Crear controlador del jugador
    const camera = this.sceneManager.getCamera();
    const renderer = this.sceneManager.getRenderer();
    this.playerController = new PlayerController(camera, renderer);

    // Crear efectos de paranoia
    this.paranoiaEffects = new ParanoiaEffects(camera, renderer);

    // Crear modelos para otros jugadores
    players.forEach(player => {
      if (player.id !== this.playerId) {
        this.sceneManager.addPlayer(player.id, player);
      } else {
        this.playerController.setPosition(new THREE.Vector3().copy(player.position));
        this.sceneManager.setLocalPlayer(player.character, player.username);
      }
    });

    // Iniciar game loop
    this.gameRunning = true;
    this.gameLoop();
  }

  gameLoop() {
    if (!this.gameRunning) return;
    
    const now = Date.now();
    const deltaTime = (now - this.lastTime) / 1000;
    this.lastTime = now;
    
    // Actualizar paranoia
    this.paranoiaEffects.update(deltaTime);
    const speedMult = this.paranoiaEffects.getSpeedMultiplier();
    
    // Actualizar controlador (excluyendo al propio jugador de los posibles
    // objetivos: si no, la distancia a uno mismo -0- siempre "gana" y todos
    // los golpes terminaban aplicándose sobre uno mismo en vez del rival)
    const otherPlayers = Object.values(this.players).filter(p => p.id !== this.playerId);
    this.playerController.update(
      deltaTime,
      otherPlayers,
      speedMult,
      this.sceneManager.getColliders(),
      this.myWeapon || 'punch'
    );

    // Animar personajes (propio y remotos)
    this.sceneManager.updateAnimations(deltaTime);
    this.sceneManager.updateLocalPlayer(
      this.playerController.position,
      this.playerController.rotation.y,
      this.playerController.isMoving(),
      this.playerController.cameraMode
    );

    // Recoger arma caminando encima
    this.checkWeaponPickup();

    // Enviar posición
    const state = this.playerController.getState();
    network.sendMovement(state.position, state.rotation);

    // Actualizar HUD
    this.updateHUD();

    // Renderizar escena
    const camera = this.playerController.getCamera();
    this.sceneManager.render(camera);

    requestAnimationFrame(() => this.gameLoop());
  }

  checkWeaponPickup() {
    if (this.myWeapon) return; // ya está armado

    const pos = this.playerController.position;
    const pickups = this.sceneManager.getWeaponPickups();

    for (const weapon of pickups) {
      const dx = pos.x - weapon.position.x;
      const dz = pos.z - weapon.position.z;
      if (dx * dx + dz * dz < 2.5 * 2.5) {
        network.pickupWeapon(weapon.id);
        break;
      }
    }
  }

  onWeaponPickedUp(data) {
    this.sceneManager.removeWeaponPickup(data.weaponId);

    if (this.players[data.playerId]) {
      this.players[data.playerId].weapon = data.weaponType;
    }

    if (data.playerId === this.playerId) {
      this.myWeapon = data.weaponType;
      this.sceneManager.setLocalPlayerWeapon(data.weaponType);

      if (this.uiElements.weaponDisplay) {
        this.uiElements.weaponDisplay.textContent = data.weaponType === 'gun' ? 'Pistola' : 'Cuchillo';
      }
      if (data.weaponType === 'gun' && this.uiElements.ammoDisplay) {
        this.uiElements.ammoDisplay.textContent = '5';
      }

      this.hud.showNotification(
        data.weaponType === 'gun' ? '🔫 Conseguiste una pistola' : '🔪 Conseguiste un cuchillo',
        'info',
        3000
      );
    } else if (this.sceneManager) {
      this.sceneManager.setPlayerWeapon(data.playerId, data.weaponType);
    }
  }

  updateHUD() {
    const aliveCount = Object.values(this.players).filter(p => p.isAlive).length;
    this.hud.updatePlayerCount(aliveCount, Object.keys(this.players).length);

    // Actualizar salud del jugador local
    if (this.localPlayer) {
      this.hud.updateHealth(this.localPlayer.health);
    }
  }

  onPlayerMoved(data) {
    if (data.playerId !== this.playerId) {
      const pos = new THREE.Vector3().copy(data.position);
      this.sceneManager.updatePlayerPosition(data.playerId, pos);
      
      // Guardar posición
      if (this.players[data.playerId]) {
        this.players[data.playerId].position = data.position;
      }
    }
  }

  onPlayerHit(data) {
    console.log(`💥 Golpe: ${data.damage} daño, Heridas: ${data.wounds}`);
    
    // Sonido según tipo de arma
    if (data.weaponType === 'punch') {
      audio.playHitSound(data.damage / 50);
    } else if (data.weaponType === 'knife') {
      audio.playSlashSound();
    } else if (data.weaponType === 'gun') {
      audio.playGunshot();
    }
    
    if (data.victimId === this.playerId) {
      // Tú fuiste golpeado
      this.addScreenEffect('hit');

      // Si estás herido
      if (data.isWounded) {
        console.log('🩹 Estás herido. Necesitas ayuda!');
        audio.playWoundSound();
      }
    }

    // Munición autoritativa del servidor: si te quedaste sin balas volvés a puños
    if (data.attackerId === this.playerId && data.weaponType === 'gun') {
      if (this.uiElements.ammoDisplay) {
        this.uiElements.ammoDisplay.textContent = data.attackerAmmo ?? 0;
      }
      if ((data.attackerAmmo ?? 0) <= 0) {
        this.myWeapon = null;
        this.sceneManager.setLocalPlayerWeapon(null);
        if (this.uiElements.weaponDisplay) {
          this.uiElements.weaponDisplay.textContent = 'Puños';
        }
      }
    }

    // Actualizar salud
    if (this.players[data.victimId]) {
      this.players[data.victimId].health = data.victimHealth;
      this.players[data.victimId].wounds = data.wounds;
      
      if (data.victimId === this.playerId) {
        const healthPercent = Math.max(0, data.victimHealth);
        this.uiElements.healthFill.style.width = `${healthPercent}%`;
        
        // Cambiar color según salud
        if (healthPercent > 60) {
          this.uiElements.healthFill.style.background = 'linear-gradient(90deg, #00ff00, #ffff00)';
        } else if (healthPercent > 30) {
          this.uiElements.healthFill.style.background = 'linear-gradient(90deg, #ffff00, #ff6600)';
        } else {
          this.uiElements.healthFill.style.background = 'linear-gradient(90deg, #ff6600, #ff0000)';
        }
      }
    }
  }

  onYouKilledInnocent(data) {
    console.log(`⚠️  MATASTE A UN INOCENTE: ${data.victim}`);
    
    // Sonido de paranoia
    audio.playParanoiaSound();
    
    this.addScreenEffect('paranoia');
    
    if (data.paranoia) {
      this.paranoiaEffects.activate();
      this.hud.showNotification(
        `⚠️  MATASTE A ${data.victim.toUpperCase()} ⚠️`,
        'error',
        8000
      );
      this.hud.showParanoiaIndicator();
      
      // Remover indicador después de 5 minutos
      setTimeout(() => this.hud.removeParanoiaIndicator(), 300000);
    }
  }

  onPlayerWounded(data) {
    console.log(`🩹 ${data.playerId} está herido`);
    
    if (data.playerId === this.playerId) {
      this.hud.showNotification(
        '🩹 ESTÁS HERIDO - ARRASTRATE O PIDE AYUDA',
        'error',
        10000
      );
      this.hud.showWoundedState();
    }
  }

  onPlayerDied(data) {
    const victim = this.players[data.victimId];
    const attacker = this.players[data.attackerId];
    
    console.log(`💀 ${victim?.username} murió por ${attacker?.username}`);
    
    // Sonido de muerte
    audio.playDeathSound();
    
    if (this.players[data.victimId]) {
      this.players[data.victimId].isAlive = false;
    }
    
    // Mostrar notificación
    this.hud.showNotification(
      `💀 ${victim?.username} ha muerto`,
      'warning',
      3000
    );
    
    if (data.victimId === this.playerId) {
      // Tú moriste - modo espectador
      this.playerController.isLocked = false;
      this.gameRunning = false;
      this.hud.showNotification(
        '💀 HAS MUERTO - Ahora eres ESPECTADOR',
        'error',
        5000
      );
      this.hud.removeWoundedState();
    } else {
      // Remover modelo
      this.sceneManager.removePlayer(data.victimId);
    }
  }

  onChatMessage(data) {
    const messageEl = document.createElement('div');
    messageEl.className = 'chat-message';
    const isMine = data.playerId === this.playerId;
    messageEl.style.borderLeftColor = isMine ? '#00ff00' : '#ff6600';
    messageEl.innerHTML = `<strong>${data.username}:</strong> ${data.message}`;
    
    this.uiElements.chatMessages.appendChild(messageEl);
    this.uiElements.chatMessages.scrollTop = this.uiElements.chatMessages.scrollHeight;
  }

  onPlayerLeft(data) {
    console.log(`👋 ${this.players[data.playerId]?.username} se fue`);
    
    delete this.players[data.playerId];
    if (this.sceneManager && data.playerId !== this.playerId) {
      this.sceneManager.removePlayer(data.playerId);
    }
  }

  onGameEnded(data) {
    this.gameRunning = false;
    this.state = GAME_STATES.ENDED;
    
    const isWinner = (data.winner === 'ASSASSIN' && this.isAssassin) ||
                     (data.winner === 'INNOCENTS' && !this.isAssassin);
    
    // Sonido de fin
    audio.playGameEnd(isWinner);
    
    // Mostrar pantalla de fin
    this.uiElements.gameOver.style.display = 'flex';
    const titleEl = document.getElementById('game-over-title');
    const messageEl = document.getElementById('game-over-message');
    
    titleEl.textContent = isWinner ? '¡GANASTE!' : '¡PERDISTE!';
    titleEl.className = isWinner ? 'win' : 'lose';
    messageEl.textContent = `El asesino era: ${data.assassin.username}`;
  }

  addScreenEffect(effect) {
    const canvas = this.sceneManager.getRenderer().domElement;
    
    if (effect === 'hit') {
      // Flash rojo
      canvas.style.filter = 'brightness(0.5) saturate(2)';
      setTimeout(() => {
        canvas.style.filter = 'none';
      }, 200);
    } else if (effect === 'paranoia') {
      // Parpadeo rojo intenso
      canvas.style.filter = 'brightness(0.7) hue-rotate(10deg)';
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          canvas.style.filter = i % 2 === 0 ? 'brightness(0.7)' : 'brightness(1)';
        }, i * 100);
      }
    }
  }
}

// Inicializar juego cuando el documento esté listo
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎮 Iniciando Juego Asesino...');
  window.game = new Game();
});
