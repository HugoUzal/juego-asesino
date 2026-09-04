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
    };
    
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
    network.on('onPlayerLeft', (data) => this.onPlayerLeft(data));
    network.on('onGameEnded', (data) => this.onGameEnded(data));
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
    
    // Esconder lobby
    this.uiElements.lobby.style.display = 'none';
    this.uiElements.hud.style.display = 'block';
    
    // Mostrar rol
    this.uiElements.roleDisplay.textContent = this.isAssassin ? 'ASESINO 🔪' : 'Inocente';
    if (this.isAssassin) {
      this.uiElements.roleDisplay.style.color = '#ff3300';
    }
    
    // Inicializar escena 3D
    this.initializeGame(data.map, data.players);
  }

  initializeGame(mapName, players) {
    // Crear gestor de escena
    const container = document.body;
    this.sceneManager = new SceneManager(container);
    this.sceneManager.loadMap(mapName);
    
    // Crear controlador del jugador
    const camera = this.sceneManager.getCamera();
    this.playerController = new PlayerController(camera, this.sceneManager.getRenderer());
    
    // Crear modelos para otros jugadores
    players.forEach(player => {
      if (player.id !== this.playerId) {
        this.sceneManager.addPlayer(player.id, player);
      } else {
        this.playerController.setPosition(new THREE.Vector3().copy(player.position));
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
    
    // Actualizar controlador
    this.playerController.update(deltaTime, Object.values(this.players));
    
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

  updateHUD() {
    const aliveCount = Object.values(this.players).filter(p => p.isAlive).length;
    this.uiElements.playerCount.textContent = aliveCount;
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
    // Visual feedback
    console.log(`💥 Golpe: ${data.damage} daño`);
    
    if (data.victimId === this.playerId) {
      // Tú fuiste golpeado
      this.addScreenEffect('hit');
    }
    
    // Actualizar salud
    if (this.players[data.victimId]) {
      this.players[data.victimId].health = data.victimHealth;
      
      if (data.victimId === this.playerId) {
        this.uiElements.healthFill.style.width = `${Math.max(0, data.victimHealth)}%`;
      }
    }
  }

  onPlayerDied(data) {
    console.log(`💀 ${this.players[data.victimId]?.username} murió`);
    
    if (this.players[data.victimId]) {
      this.players[data.victimId].isAlive = false;
    }
    
    if (data.victimId === this.playerId) {
      // Tú moriste - modo espectador
      this.playerController.isLocked = false;
      this.gameRunning = false;
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
    
    // Mostrar pantalla de fin
    this.uiElements.gameOver.style.display = 'flex';
    const titleEl = document.getElementById('game-over-title');
    const messageEl = document.getElementById('game-over-message');
    
    titleEl.textContent = isWinner ? '¡GANASTE!' : '¡PERDISTE!';
    titleEl.className = isWinner ? 'win' : 'lose';
    messageEl.textContent = `El asesino era: ${data.assassin.username}`;
  }

  addScreenEffect(effect) {
    // Flash rojo o efecto de daño
    const canvas = this.sceneManager.getRenderer().domElement;
    canvas.style.filter = effect === 'hit' ? 'brightness(0.5)' : 'none';
    
    setTimeout(() => {
      canvas.style.filter = 'none';
    }, 200);
  }
}

// Inicializar juego cuando el documento esté listo
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎮 Iniciando Juego Asesino...');
  window.game = new Game();
});
