const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Servir archivos estáticos del cliente
app.use(express.static(path.join(__dirname, '../client')));

// CONSTANTES
const MAX_PLAYERS = 12;
const GAME_STATES = {
  LOBBY: 'lobby',
  STARTING: 'starting',
  PLAYING: 'playing',
  ENDED: 'ended'
};

// ESTADO DEL JUEGO
const gameState = {
  state: GAME_STATES.LOBBY,
  players: {},
  playerCount: 0,
  map: 'times-square', // map actual
  assassin: null,
  gameStartTime: null,
};

// PERSONAJES DISPONIBLES
const CHARACTERS = [
  { id: 1, name: 'Lord Arthur Sterling', description: 'El Heredero Malcriado' },
  { id: 2, name: 'Lady Evelyn Thorne', description: 'La Viuda Negruzca' },
  { id: 3, name: 'Dr. Alistair Vance', description: 'El Médico de Cabecera' },
  { id: 4, name: 'Madame Blanche DuBois', description: 'La Cantante de Ópera' },
  { id: 5, name: 'Coronel Reginald Pike', description: 'El Comandante Retirado' },
  { id: 6, name: 'Madame Cassandra', description: 'La Astróloga y Espiritista' },
  { id: 7, name: 'Sra. Margaret Croft', description: 'El Ama de Llaves Fiel' },
  { id: 8, name: 'Thomas Pendelton', description: 'El Abogado Calculador' },
  { id: 9, name: 'Scarlet Monet', description: 'La Actriz Joven' },
  { id: 10, name: 'Prof. Julian Wright', description: 'El Profesor de Antigüedades' },
  { id: 11, name: 'Silas Thorne', description: 'El Jardinero Silencioso' },
  { id: 12, name: 'Clara Higgins', description: 'La Periodista Chismosa' },
];

// Socket.IO Events
io.on('connection', (socket) => {
  console.log(`[CONEXIÓN] ${socket.id} conectado`);

  // EVENTOS DE LOBBY
  socket.on('player-join', (data) => {
    if (gameState.playerCount >= MAX_PLAYERS) {
      socket.emit('error', { message: 'Sala llena' });
      return;
    }

    const player = {
      id: socket.id,
      username: data.username,
      character: data.character,
      position: { x: Math.random() * 100 - 50, y: 1, z: Math.random() * 100 - 50 },
      rotation: { x: 0, y: 0, z: 0 },
      isAlive: true,
      isAssassin: false,
      isParanoid: false,
      paranoidTimer: 0,
      health: 100,
      armorLevel: 0, // 0 = none, 1 = light, 2 = heavy
      weapon: null,
      ammo: 0,
      isHelped: false,
      isFrozen: false,
    };

    gameState.players[socket.id] = player;
    gameState.playerCount++;

    console.log(`[LOBBY] ${data.username} se unió. Total: ${gameState.playerCount}/${MAX_PLAYERS}`);

    // Notificar a todos
    io.emit('players-update', {
      players: Object.values(gameState.players),
      playerCount: gameState.playerCount,
      maxPlayers: MAX_PLAYERS
    });

    socket.emit('you-joined', { playerId: socket.id, player });
  });

  // EVENTOS DE MOVIMIENTO
  socket.on('player-move', (data) => {
    if (gameState.players[socket.id]) {
      gameState.players[socket.id].position = data.position;
      gameState.players[socket.id].rotation = data.rotation;

      // Broadcast a cercanos (50m)
      io.emit('player-moved', {
        playerId: socket.id,
        position: data.position,
        rotation: data.rotation
      });
    }
  });

  // EVENTO: INICIAR JUEGO
  socket.on('start-game', (data) => {
    if (gameState.playerCount < 2) {
      socket.emit('error', { message: 'Mínimo 2 jugadores' });
      return;
    }

    if (gameState.state !== GAME_STATES.LOBBY) {
      socket.emit('error', { message: 'Juego ya iniciado' });
      return;
    }

    startGame(data.map || 'times-square');
  });

  // EVENTO: ATAQUE/DAÑO
  socket.on('player-attack', (data) => {
    const attacker = gameState.players[socket.id];
    const victim = gameState.players[data.victimId];

    if (!attacker || !victim || !attacker.isAlive || !victim.isAlive) {
      return;
    }

    // Validar distancia (proximidad)
    const dist = distance(attacker.position, victim.position);
    if (dist > 5) return; // 5m de rango máximo

    // Procesar daño
    const damage = data.damage || 10;
    victim.health = Math.max(0, victim.health - damage);

    console.log(`[ATAQUE] ${attacker.username} golpea a ${victim.username} (${damage} daño)`);

    io.emit('player-hit', {
      attackerId: socket.id,
      victimId: data.victimId,
      damage: damage,
      victimHealth: victim.health,
      weaponType: data.weaponType
    });

    // Validar si víctima murió
    if (victim.health <= 0) {
      victim.isAlive = false;
      io.emit('player-died', {
        victimId: data.victimId,
        attackerId: socket.id,
        cause: data.weaponType
      });

      checkGameEnd();
    }
  });

  // EVENTO: CHAT
  socket.on('chat-message', (data) => {
    const player = gameState.players[socket.id];
    if (!player) return;

    io.emit('chat-message', {
      playerId: socket.id,
      username: player.username,
      message: data.message,
      timestamp: Date.now()
    });
  });

  // EVENTO: DESCONEXIÓN
  socket.on('disconnect', () => {
    if (gameState.players[socket.id]) {
      const player = gameState.players[socket.id];
      console.log(`[DESCONEXIÓN] ${player.username} se fue`);
      
      delete gameState.players[socket.id];
      gameState.playerCount--;

      io.emit('player-left', { playerId: socket.id });
      io.emit('players-update', {
        players: Object.values(gameState.players),
        playerCount: gameState.playerCount,
        maxPlayers: MAX_PLAYERS
      });
    }
  });
});

// FUNCIONES
function startGame(mapName) {
  gameState.state = GAME_STATES.STARTING;
  gameState.map = mapName;
  gameState.gameStartTime = Date.now();

  // Asignar asesino random
  const playerIds = Object.keys(gameState.players);
  const assassinIndex = Math.floor(Math.random() * playerIds.length);
  const assassinId = playerIds[assassinIndex];

  gameState.assassin = assassinId;
  gameState.players[assassinId].isAssassin = true;

  console.log(`[JUEGO] Iniciando en ${mapName}. Asesino: ${gameState.players[assassinId].username}`);

  // Reasignar posiciones (spawn points)
  Object.values(gameState.players).forEach((player, idx) => {
    const spawnPoint = getSpawnPoint(idx, mapName);
    player.position = spawnPoint;
    player.health = 100;
    player.isAlive = true;
    player.isParanoid = false;
    player.isFrozen = false;
  });

  // Notificar a todos
  io.emit('game-started', {
    map: mapName,
    players: Object.values(gameState.players),
    isAssassin: (playerId) => playerId === assassinId // Cada cliente sabrá su rol
  });

  // Cambiar a estado PLAYING
  gameState.state = GAME_STATES.PLAYING;
}

function getSpawnPoint(index, mapName) {
  // Puntos de spawn básicos (expandir después)
  const spawns = {
    'times-square': [
      { x: 0, y: 1, z: 0 },
      { x: 20, y: 1, z: 20 },
      { x: -20, y: 1, z: 20 },
      { x: 20, y: 1, z: -20 },
      { x: -20, y: 1, z: -20 },
      { x: 40, y: 1, z: 0 },
      { x: -40, y: 1, z: 0 },
      { x: 0, y: 1, z: 40 },
      { x: 0, y: 1, z: -40 },
      { x: 30, y: 1, z: 30 },
      { x: -30, y: 1, z: -30 },
      { x: 30, y: 1, z: -30 }
    ]
  };

  return spawns[mapName]?.[index] || { x: Math.random() * 50 - 25, y: 1, z: Math.random() * 50 - 25 };
}

function distance(p1, p2) {
  return Math.sqrt(
    Math.pow(p1.x - p2.x, 2) +
    Math.pow(p1.y - p2.y, 2) +
    Math.pow(p1.z - p2.z, 2)
  );
}

function checkGameEnd() {
  const alivePlayers = Object.values(gameState.players).filter(p => p.isAlive);
  const assassinAlive = gameState.players[gameState.assassin]?.isAlive;

  if (alivePlayers.length === 0 || !assassinAlive) {
    endGame();
  }
}

function endGame() {
  gameState.state = GAME_STATES.ENDED;
  const assassin = gameState.players[gameState.assassin];
  const alivePlayers = Object.values(gameState.players).filter(p => p.isAlive);

  let winner;
  if (assassin && assassin.isAlive) {
    winner = 'ASSASSIN';
  } else {
    winner = 'INNOCENTS';
  }

  io.emit('game-ended', {
    winner: winner,
    assassin: {
      id: gameState.assassin,
      username: assassin?.username
    },
    survivors: alivePlayers.map(p => ({ id: p.id, username: p.username }))
  });

  console.log(`[FIN] Juego terminado. Ganador: ${winner}`);
}

// INICIO DEL SERVIDOR
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🎮 SERVIDOR ASESINO INICIADO EN http://localhost:${PORT}\n`);
});
