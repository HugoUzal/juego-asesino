# 🔪 JUEGO ASESINO - Multiplayer Psychological Thriller

## Descripción

Juego psicológico multijugador estilo **Among Us + Counter-Strike + Sherlock Holmes** en **3D en tiempo real**. Un asesino oculto debe eliminar a todos los inocentes mientras estos intentan descubrirlo y capturarlo.

**Máximo 12 jugadores | Multimapas | Efectos Visuales y Sonoros**

**ESTADO: ✅ FASE 4 COMPLETADA - LISTO PARA JUGAR**

## 🎮 Características Implementadas

### 🎯 CORE GAMEPLAY
- ✅ 1 Asesino vs 11 Inocentes (assignment aleatorio)
- ✅ Asesino conoce su rol, inocentes NO
- ✅ Sistema de daño realista:
  - Puños: 6 golpes para matar
  - Cuchillo: 1-2 heridas (crawling 2 min), 3+ muerte
  - Pistola: Disparo = muerte instantánea (5 balas)

### 🎬 PARANOIA & PSYCHOLOGY
- ✅ Paranoia visual tras matar inocente (5 minutos):
  - Bordes rojos
  - Visión oscura
  - 4 comportamientos aleatorios (zigzag, tremor, speed-fluctuation, look-back)
- ✅ Herida por cuchillo: 2 minutos arrastrándose antes de morir
- ✅ Sistema de ayuda: Otro jugador cura en 10 segundos (-30% velocidad permanente)

### 🗺️ MAPAS (5 escenarios 200x200m)
- ✅ Times Square (NYC) - Edificios, banners, puntos de cobertura
- ✅ Mezquita Azul (Estambul) - Estructura dómica, minaretes
- ✅ Plaza Mayor (Madrid) - Patios abiertos, arquitectura
- ✅ Castillo de Edimburgo - Muros, torres, puerta principal
- ✅ La Boca (Buenos Aires) - Casas coloridas, techos, faroles

### 🎮 CONTROLES & CÁMARA
- ✅ WASD - Movimiento fluido
- ✅ Mouse - Mirar en 360°
- ✅ E - Toggle FPS/TPS
- ✅ ESPACIO - Correr
- ✅ CLICK - Atacar
- ✅ T - Chat (escribe mientras quieto)

### 💬 COMUNICACIÓN & UI
- ✅ Chat en tiempo real (sincronizado por red)
- ✅ HUD dinámico con:
  - Barra de salud (colores según HP)
  - Contador de jugadores vivos
  - Display de arma actual
  - Rol visible (Asesino/Inocente)
  - Mapa actual
- ✅ Notificaciones emergentes contextuales
- ✅ Indicadores de estado (herida, paranoia)

### 🎵 AUDIO & EFECTOS
- ✅ Sonidos procedurales (Web Audio API):
  - Impactos según arma
  - Sonido de muerte
  - Paranoia alert
  - Fanfarra de inicio/fin
- ✅ Screen effects:
  - Flash rojo en daño
  - Bordes rojos en paranoia
  - Vignette (visión oscura)
  - Parpadeo en baja salud

### 🔧 NETWORKING & SERVER
- ✅ Socket.IO para sincronización real-time
- ✅ Gestión de estado del servidor
- ✅ Asignación aleatoria de asesino
- ✅ Eventos de ataque/muerte sincronizados
- ✅ Detección de LOS (proximidad 50m)

### ⭐ PROGRESIÓN & BALANCING
- ✅ Asesino:
  - 1 kill → +20% velocidad
  - 3 kills → +40% velocidad
  - 5 kills → +50% velocidad + +20% daño
- ✅ Inocente:
  - Paranoia tras matar
  - Debuff permanente si se curan (-30% velocidad)

## ✨ Características NO IMPLEMENTADAS (aún)
- ⏳ Congelamiento/Prisión (preso mode)
- ⏳ Sistema de espectador mejorado
- ⏳ Modelos 3D detallados de avatares (ahora capsulas)
- ⏳ Build de Electron (instalable)
- ⏳ Servidor online deployado
- ⏳ Sistema de puntuación/rankings

## 📋 Requisitos

- **Node.js** 16+ ([descargar](https://nodejs.org/))
- **npm** (viene con Node.js)

## 🚀 Instalación & Ejecución (3 pasos)

### 1️⃣ Preparar el servidor

```bash
cd ~/juego-asesino/server
npm install  # Instala dependencias (solo primera vez)
```

### 2️⃣ Iniciar el servidor

```bash
npm start
```

Deberías ver:
```
🎮 SERVIDOR ASESINO INICIADO EN http://localhost:3000
```

### 3️⃣ Abrir en navegador

Abre **múltiples navegadores/pestañas incógnito** en:
```
http://localhost:3000
```

### 4️⃣ ¡Juega!

1. **Ingresa tu nombre** y **elige personaje**
2. Haz clic en **"UNIRSE A LA SALA"**
3. Espera a otros jugadores (mínimo 2, máximo 12)
4. El primer jugador puede hacer clic en **"INICIAR JUEGO"**
5. **¡Se inicia el juego!** - Se asigna un asesino aleatorio

### 💡 TIPS

- **Para probar rápido:** Abre 4-5 pestañas incógnito en el mismo navegador
- **Con amigos:** Comparte `http://[TU_IP]:3000` (reemplaza con tu IP local)
- **Cambiar mapa:** Elige en el dropdown antes de unirse
- **Sonido:** El audio se activa automáticamente (Web Audio API)

## 🎯 Controles

| Tecla | Acción |
|-------|--------|
| **W/A/S/D** | Moverse |
| **Mouse** | Mirar alrededor |
| **ESPACIO** | Correr |
| **E** | Cambiar vista (FPS/TPS) |
| **CLICK** | Atacar |
| **T** | Abrir chat |
| **Enter** | Enviar mensaje |

## 📊 Mecánica del Juego

### Roles
- **Asesino**: Sabe que es asesino. Mata sin culpa.
- **Inocente**: No sabe su rol. Puede defenderse pero sufre paranoia si mata a otro inocente.

### Daño
- **Golpes**: 6 golpes para matar. Primeros 3 = daño, 4-5 = herida grave
- **Cuchillo**: 1-2 cuchilladas = herida (2 min arrastrándose). 3+ = muerte
- **Arma de fuego**: Muerte instantánea, 5 balas por arma

### Paranoia
Después de matar a un inocente sin ser visto (5 minutos):
- Bordes rojos + visión oscura
- Comportamientos aleatorios (zigzag, temblores, etc)
- Otros jugadores ven el comportamiento raro pero NO saben qué es

## 🏗️ Estructura del Proyecto

```
juego-asesino/
├── server/
│   ├── server.js (Node.js + Socket.IO)
│   ├── package.json
│   └── ...
├── client/
│   ├── index.html
│   ├── js/
│   │   ├── main.js
│   │   ├── network.js
│   │   ├── player-controller.js
│   │   ├── scene-manager.js
│   │   └── constants.js
│   └── assets/
└── README.md
```

## 🔄 LAN vs Online

### Modo Online (Actual)
- Todos se conectan al servidor central (`localhost:3000`)
- Se sincroniza automáticamente

### Modo LAN (Próximo)
- Un jugador inicia servidor local
- Otros se conectan con IP:puerto
- Mismo código, diferente configuración

## 📝 Próximas Fases

- [ ] Modelos 3D detallados de avatares
- [ ] Sistema de progresión del asesino mejorado
- [ ] Efectos visuales de paranoia mejorados
- [ ] Animaciones de combate
- [ ] UI más pulida
- [ ] Sonidos y música
- [ ] Build de Electron (instalable)
- [ ] Despliegue a servidor público

## 🐛 Debugging

Abre la **consola del navegador** (F12) para ver logs del servidor.

Comandos útiles:
```javascript
// Ver estado del juego
console.log(window.game);

// Ver jugadores
console.log(window.game.players);

// Ver si eres asesino
console.log(window.game.isAssassin);
```

## 📞 Soporte

Si tienes problemas:
1. Verifica que el servidor esté corriendo (`npm start`)
2. Recarga la página del navegador
3. Abre la consola (F12) y revisa los errores
4. Reinicia Node.js

## 📄 Licencia

Proyecto en desarrollo - Todos los derechos reservados (por ahora 😄)

---

**¡Que comience el juego! 🔪**
