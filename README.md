# 🔪 JUEGO ASESINO - Multiplayer Thriller

## Descripción

Juego psicológico multijugador estilo **Among Us + Counter-Strike + Sherlock Holmes**. Un asesino oculto debe eliminar a todos los inocentes mientras estos intentan descubrirlo y capturarlo.

**Máximo 12 jugadores**

## 🎮 Características

- ✅ 1 Asesino vs 11 Inocentes
- ✅ Sistema de daño (golpes, cuchillo, arma de fuego)
- ✅ Paranoia visual tras matar accidentalmente
- ✅ Chat en tiempo real
- ✅ 5 mapas diferentes (Times Square, Mezquita Azul, Plaza Mayor, Castillo, La Boca)
- ✅ Dos vistas de cámara (Primera y tercera persona)
- ✅ Progresión del asesino con kills
- ✅ Sistema de curación y heridas

## 📋 Requisitos

- **Node.js** 16+ ([descargar](https://nodejs.org/))
- **npm** (viene con Node.js)

## 🚀 Instalación & Ejecución

### 1. Instalar dependencias

```bash
cd ~/juego-asesino
cd server
npm install
```

### 2. Iniciar el servidor

```bash
npm start
```

Deberías ver:
```
🎮 SERVIDOR ASESINO INICIADO EN http://localhost:3000
```

### 3. Abrir el cliente

Abre tu navegador y ve a:
```
http://localhost:3000
```

O si está en tu red local:
```
http://[TU_IP]:3000
```

### 4. ¡Jugar!

- Ingresa tu nombre y elige un personaje
- Haz clic en "UNIRSE A LA SALA"
- Espera a otros jugadores (mínimo 2)
- El primero que se une puede hacer click en "INICIAR JUEGO"

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
