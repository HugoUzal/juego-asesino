// CONSTANTES DEL JUEGO

const GAME_CONFIG = {
  // Movimiento
  WALK_SPEED: 5,
  RUN_SPEED: 8,
  CRAWL_SPEED: 1,
  
  // Cooldowns (en milisegundos)
  PUNCH_COOLDOWN: 500,
  KNIFE_COOLDOWN: 800,
  GUN_COOLDOWN: 1000,
  
  // Daño
  PUNCH_DAMAGE: 10,
  KNIFE_DAMAGE: 25,
  GUN_DAMAGE: 100,
  
  // Rango de visibilidad
  VISIBILITY_RANGE: 50,
  NAME_TAG_RANGE: 15,
  
  // Herida por cuchillo
  KNIFE_WOUND_DURATION: 120000, // 2 minutos en ms
  HELP_DURATION: 10000, // 10 segundos para curar
  HELP_COOLDOWN: 30000, // 30 segundos entre curaciones
  
  // Paranoia
  PARANOIA_DURATION: 300000, // 5 minutos
  PARANOIA_BEHAVIORS: ['zigzag', 'look-back', 'tremor', 'speed-fluctuation'],
  PARANOIA_CHANCE: 0.3, // 30% de chance cada segundo
  
  // Armas
  GUN_AMMO: 5,
  
  // Salud
  MAX_HEALTH: 100,
  
  // Maps
  MAPS: {
    'times-square': { name: 'Times Square', size: 200 },
    'blue-mosque': { name: 'Mezquita Azul', size: 200 },
    'plaza-mayor': { name: 'Plaza Mayor', size: 200 },
    'edinburgh-castle': { name: 'Castillo de Edimburgo', size: 200 },
    'la-boca': { name: 'La Boca', size: 200 }
  },
  
  // Personajes
  CHARACTERS: {
    1: { name: 'Lord Arthur Sterling', color: 0x1a1a2e },
    2: { name: 'Lady Evelyn Thorne', color: 0x16213e },
    3: { name: 'Dr. Alistair Vance', color: 0x0f3460 },
    4: { name: 'Madame Blanche DuBois', color: 0xe94560 },
    5: { name: 'Coronel Reginald Pike', color: 0x533483 },
    6: { name: 'Madame Cassandra', color: 0x2d3436 },
    7: { name: 'Sra. Margaret Croft', color: 0x636e72 },
    8: { name: 'Thomas Pendelton', color: 0x2c3e50 },
    9: { name: 'Scarlet Monet', color: 0xe74c3c },
    10: { name: 'Prof. Julian Wright', color: 0x8e44ad },
    11: { name: 'Silas Thorne', color: 0x27ae60 },
    12: { name: 'Clara Higgins', color: 0xf39c12 }
  }
};

const WEAPON_TYPES = {
  PUNCH: 'punch',
  KNIFE: 'knife',
  GUN: 'gun'
};

const PLAYER_STATES = {
  ALIVE: 'alive',
  WOUNDED: 'wounded', // Herida por cuchillo
  CRAWLING: 'crawling',
  FROZEN: 'frozen', // Preso
  DEAD: 'dead',
  SPECTATOR: 'spectator'
};

const GAME_STATES = {
  LOBBY: 'lobby',
  STARTING: 'starting',
  PLAYING: 'playing',
  ENDED: 'ended'
};
