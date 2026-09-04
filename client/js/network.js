// NETWORKING CON SOCKET.IO

class NetworkManager {
  constructor() {
    this.socket = null;
    this.playerId = null;
    this.callbacks = {};
  }

  connect() {
    this.socket = io();

    // Eventos del servidor
    this.socket.on('you-joined', (data) => this.onYouJoined(data));
    this.socket.on('players-update', (data) => this.onPlayersUpdate(data));
    this.socket.on('player-moved', (data) => this.onPlayerMoved(data));
    this.socket.on('game-started', (data) => this.onGameStarted(data));
    this.socket.on('player-hit', (data) => this.onPlayerHit(data));
    this.socket.on('player-died', (data) => this.onPlayerDied(data));
    this.socket.on('chat-message', (data) => this.onChatMessage(data));
    this.socket.on('player-left', (data) => this.onPlayerLeft(data));
    this.socket.on('game-ended', (data) => this.onGameEnded(data));
    this.socket.on('you-killed-innocent', (data) => this.onYouKilledInnocent(data));
    this.socket.on('player-wounded', (data) => this.onPlayerWounded(data));
    this.socket.on('error', (data) => this.onError(data));
  }

  // === MÉTODOS PARA ENVIAR ===

  joinGame(username, character, map) {
    this.socket.emit('player-join', {
      username: username,
      character: character,
      map: map
    });
  }

  sendMovement(position, rotation) {
    this.socket.emit('player-move', {
      position: position,
      rotation: rotation
    });
  }

  sendAttack(victimId, damage, weaponType) {
    this.socket.emit('player-attack', {
      victimId: victimId,
      damage: damage,
      weaponType: weaponType
    });
  }

  sendChatMessage(message) {
    this.socket.emit('chat-message', {
      message: message
    });
  }

  startGame(map) {
    this.socket.emit('start-game', {
      map: map
    });
  }

  // === CALLBACKS DEL SERVIDOR ===

  onYouJoined(data) {
    this.playerId = data.playerId;
    console.log('✓ Te uniste al juego:', data.playerId);
    if (this.callbacks.onYouJoined) {
      this.callbacks.onYouJoined(data);
    }
  }

  onPlayersUpdate(data) {
    console.log(`🎮 ${data.playerCount}/${data.maxPlayers} jugadores en lobby`);
    if (this.callbacks.onPlayersUpdate) {
      this.callbacks.onPlayersUpdate(data);
    }
  }

  onPlayerMoved(data) {
    if (this.callbacks.onPlayerMoved) {
      this.callbacks.onPlayerMoved(data);
    }
  }

  onGameStarted(data) {
    console.log('🎬 ¡JUEGO INICIADO!');
    const isAssassin = data.isAssassin ? data.isAssassin(this.playerId) : false;
    
    if (this.callbacks.onGameStarted) {
      this.callbacks.onGameStarted({
        map: data.map,
        players: data.players,
        isAssassin: isAssassin,
        playerId: this.playerId
      });
    }
  }

  onPlayerHit(data) {
    console.log(`💥 Golpe recibido: ${data.damage} daño`);
    if (this.callbacks.onPlayerHit) {
      this.callbacks.onPlayerHit(data);
    }
  }

  onPlayerDied(data) {
    console.log(`💀 Jugador muerto: ${data.victimId}`);
    if (this.callbacks.onPlayerDied) {
      this.callbacks.onPlayerDied(data);
    }
  }

  onChatMessage(data) {
    if (this.callbacks.onChatMessage) {
      this.callbacks.onChatMessage(data);
    }
  }

  onPlayerLeft(data) {
    console.log(`👋 Jugador se fue: ${data.playerId}`);
    if (this.callbacks.onPlayerLeft) {
      this.callbacks.onPlayerLeft(data);
    }
  }

  onGameEnded(data) {
    console.log('🏁 ¡JUEGO TERMINADO!');
    if (this.callbacks.onGameEnded) {
      this.callbacks.onGameEnded(data);
    }
  }

  onYouKilledInnocent(data) {
    console.log(`⚠️  MATASTE INOCENTE: ${data.victim}`);
    if (this.callbacks.onYouKilledInnocent) {
      this.callbacks.onYouKilledInnocent(data);
    }
  }

  onPlayerWounded(data) {
    console.log(`🩹 Jugador herido: ${data.playerId}`);
    if (this.callbacks.onPlayerWounded) {
      this.callbacks.onPlayerWounded(data);
    }
  }

  onError(data) {
    console.error('❌ Error:', data.message);
    if (this.callbacks.onError) {
      this.callbacks.onError(data);
    }
  }

  // Registrar callbacks
  on(event, callback) {
    this.callbacks[event] = callback;
  }
}

// Instancia global
const network = new NetworkManager();
