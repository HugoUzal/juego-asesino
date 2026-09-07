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
    'la-boca': { name: 'La Boca', size: 200 },
    'city': { name: 'Ciudad', size: 200 }
  },

  // Personajes (outfit define accesorios visuales extra sobre el modelo base)
  CHARACTERS: {
    1: { name: 'Lord Arthur Sterling', color: 0x1a1a2e, outfit: { type: 'suit', accent: 0xa8202e } },
    2: { name: 'Lady Evelyn Thorne', color: 0x16213e, outfit: { type: 'dress', accent: 0x0d0d1a, headwear: 'veil' } },
    3: { name: 'Dr. Alistair Vance', color: 0xe9edf2, outfit: { type: 'labcoat', accent: 0xcc2222 } },
    4: { name: 'Madame Blanche DuBois', color: 0xe94560, outfit: { type: 'gown', accent: 0xffd700 } },
    5: { name: 'Coronel Reginald Pike', color: 0x2f3b2f, outfit: { type: 'uniform', accent: 0xd4af37, headwear: 'cap' } },
    6: { name: 'Madame Cassandra', color: 0x4a235a, outfit: { type: 'robe', accent: 0x9b59b6, headwear: 'scarf' } },
    7: { name: 'Sra. Margaret Croft', color: 0x2c2c2c, outfit: { type: 'maid', accent: 0xffffff, headwear: 'maidcap' } },
    8: { name: 'Thomas Pendelton', color: 0x2c3e50, outfit: { type: 'suit', accent: 0x1a1a1a } },
    9: { name: 'Scarlet Monet', color: 0xe74c3c, outfit: { type: 'gown', accent: 0xffffff } },
    10: { name: 'Prof. Julian Wright', color: 0x7d6449, outfit: { type: 'tweed', accent: 0x222222, headwear: 'glasses' } },
    11: { name: 'Silas Thorne', color: 0x556b2f, outfit: { type: 'overalls', accent: 0x4a6fa5, headwear: 'sunhat' } },
    12: { name: 'Clara Higgins', color: 0xc9a66b, outfit: { type: 'trench', accent: 0x8a6d3b, headwear: 'fedora' } }
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
