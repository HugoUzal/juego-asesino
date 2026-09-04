# 🛠️ Guía de Desarrollo

## Arquitectura General

### Cliente-Servidor

```
CLIENT (Three.js + Socket.IO)
    ↓↑
SERVER (Node.js + Express + Socket.IO)
    ↓
Game State Management
    ↓
Player/Game Logic
```

### Flujo de Estado

1. **LOBBY** - Lobby esperando jugadores
2. **STARTING** - Asignar asesino, spawn points
3. **PLAYING** - Juego en marcha
4. **ENDED** - Mostrar ganador

## Componentes Principales

### Server (`server/server.js`)

**Responsabilidades:**
- Gestionar conexiones Socket.IO
- Mantener estado global del juego (`gameState`)
- Procesar eventos de jugadores (movimiento, ataque, chat)
- Validar reglas del juego
- Sincronizar estado entre clientes

**Estructura de `gameState`:**
```javascript
{
  state: 'playing',
  players: {
    'socket-id': {
      id, username, character, position, rotation,
      isAlive, isAssassin, isParanoid, health,
      weapon, ammo, isFrozen, isHelped
    }
  },
  playerCount: 5,
  map: 'times-square',
  assassin: 'socket-id',
  gameStartTime: timestamp
}
```

### Client - Flujo

**main.js (Game.js)**
- Orquestador principal
- Maneja UI del lobby y HUD
- Conecta networking → escena → controlador
- Game loop

**network.js (NetworkManager)**
- Maneja Socket.IO conexiones
- Emite eventos al servidor
- Recibe eventos del servidor
- Callback handler

**scene-manager.js (SceneManager)**
- Three.js setup
- Creación de mapas
- Gestión de modelos de jugadores
- Renderizado

**player-controller.js (PlayerController)**
- Input (teclado, mouse)
- Cámara (FPS/TPS toggle)
- Movimiento
- Colisiones básicas
- Pointer lock

## Próximas Features - Guía de Implementación

### 1. Sistema de Daño Real

**Archivo:** `server/game-logic.js` (nuevo)

```javascript
class DamageSystem {
  applyDamage(attacker, victim, weaponType) {
    const damage = this.calculateDamage(weaponType);
    victim.health -= damage;
    
    // Checks
    if (victim.health <= 0) {
      victim.isAlive = false;
    }
    
    // Paranoia check (si atacante es inocente)
    if (!attacker.isAssassin && !isSelfDefense(attacker, victim)) {
      attacker.isParanoid = true;
      attacker.paranoidTimer = PARANOIA_DURATION;
    }
  }
  
  calculateDamage(weaponType) {
    // Lógica según tipo de arma
  }
}
```

### 2. Paranoia Visual

**Cliente:** `client/js/paranoia.js` (nuevo)

```javascript
class ParanoiaEffects {
  trigger(duration) {
    this.duration = duration;
    this.behaviors = this.getRandomBehaviors();
    this.applyVisualEffects();
    this.startBehaviorCycle();
  }
  
  applyVisualEffects() {
    // Bordes rojos
    // Visión oscura
    // Post-processing shaders
  }
  
  getRandomBehaviors() {
    // Retorna array de comportamientos aleatorios
  }
}
```

### 3. Mecánica de Herida por Cuchillo

**Server:** Agregar a `gameState.players`:
```javascript
{
  woundedState: null, // o { startTime, helper }
  woundedTimer: 0
}
```

**Lógica:**
- Si knife damage es 1-2: `player.woundedState = { startTime }`
- Cada tick: if (now - startTime > 120000) morir
- Otro jugador presiona E cerca: iniciar curación

### 4. Line of Sight (LOS)

```javascript
// Utilizar Raycasting en Three.js
const raycaster = new THREE.Raycaster();
const direction = victim.position.clone().sub(attacker.position).normalize();
raycaster.set(attacker.position, direction);
const intersects = raycaster.intersectObjects(scene.children);
// Si primer hit es victim, hay LOS
```

### 5. Progresión del Asesino

```javascript
assassin.stats = {
  kills: 0,
  speed: 1.0,
  armor: 0,
  weaponLevel: 1
}

// Cada kill:
if (kills >= 1) speed *= 1.2
if (kills >= 3) speed *= 1.2
if (kills >= 5) armor = 10 // Hace menos daño
```

## Debugging

### Logs del Servidor

```bash
# En server.js
console.log(`[CONEXIÓN] ${socket.id} conectado`);
console.log(`[LOBBY] ${username} se unió`);
console.log(`[ATAQUE] ${attacker} golpea a ${victim}`);
console.log(`[FIN] Ganador: ${winner}`);
```

### Logs del Cliente

```javascript
// En network.js callbacks
console.log('✓ Te uniste al juego');
console.log(`🎮 ${playerCount} jugadores`);
console.log(`🎬 ¡JUEGO INICIADO!`);
```

## Performance Tips

1. **Sincronización de Posición**
   - Enviar cada 100ms máximo (no cada frame)
   - Usar lerp en cliente para suavidad
   - Solo sincronizar cambios significativos

2. **Visibilidad de Jugadores**
   - Culling: No renderizar jugadores > 50m
   - Hide names si no están en rango
   - Usar LOD (Level of Detail)

3. **Networking**
   - Comprimir datos de posición
   - Usar socket.io rooms para scale
   - Considerar servidor node scaling

## Testing

### Pruebas Manuales

```bash
# Terminal 1: Servidor
cd server && npm start

# Terminal 2-5: Clientes (en navegadores diferentes o incógnito)
# Cada uno en http://localhost:3000
```

### Checklist de Features

- [ ] Damage applied correctly
- [ ] Paranoia triggers on accidental kill
- [ ] Knife wound mechanics work
- [ ] Help system restores health
- [ ] Game ends when assassin or all innocents die
- [ ] Chat message visibility by player state
- [ ] Movement sync smooth
- [ ] Name tags show/hide by range
- [ ] Camera switch FPS/TPS works
- [ ] No lag > 500ms

## Próximos Pasos

1. **Implementar Damage System** (1-2 horas)
2. **Agregar Paranoia Visual** (2-3 horas)
3. **Herida por Cuchillo Mechanic** (1-2 horas)
4. **Mejorar Modelos 3D** (4-6 horas)
5. **Efectos de Sonido** (2 horas)
6. **Build de Electron** (2-3 horas)
7. **Servidor Online** (3-4 horas)

## Stack Técnico

- **Frontend**: HTML5 + JavaScript ES6+
- **3D Graphics**: Three.js
- **Networking**: Socket.IO
- **Backend**: Node.js + Express
- **Build Tool**: Electron (próximo)
- **Package Manager**: npm

## Recursos Útiles

- [Three.js Docs](https://threejs.org/docs)
- [Socket.IO Docs](https://socket.io/docs)
- [Raycasting Guide](https://threejs.org/docs/index.html#api/en/core/Raycaster)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/nodejs-performance-best-practices/)

---

**¡Happy Coding! 🚀**
