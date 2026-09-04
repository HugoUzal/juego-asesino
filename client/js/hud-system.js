// HUD SYSTEM - Sistema mejorado de interfaz

class HUDSystem {
  constructor() {
    this.elements = {
      playerCount: document.getElementById('player-count'),
      healthFill: document.getElementById('health-fill'),
      roleDisplay: document.getElementById('role-display'),
      weaponDisplay: document.getElementById('weapon-display'),
      ammoDisplay: document.getElementById('ammo-display'),
      mapName: document.getElementById('map-name')
    };

    this.health = 100;
    this.weapon = 'puños';
    this.ammo = 0;
    this.isAssassin = false;
    this.role = 'Inocente';
  }

  updateHealth(health) {
    this.health = Math.max(0, health);
    const healthPercent = this.health;

    // Actualizar barra
    this.elements.healthFill.style.width = `${healthPercent}%`;

    // Cambiar color
    if (healthPercent > 60) {
      this.elements.healthFill.style.background = 'linear-gradient(90deg, #00ff00, #ffff00)';
    } else if (healthPercent > 30) {
      this.elements.healthFill.style.background = 'linear-gradient(90deg, #ffff00, #ff6600)';
    } else {
      this.elements.healthFill.style.background = 'linear-gradient(90deg, #ff6600, #ff0000)';
    }

    // Parpadeo si salud baja
    if (healthPercent < 20) {
      this.elements.healthFill.style.animation = 'none';
      setTimeout(() => {
        this.elements.healthFill.style.animation = 'pulse 0.5s infinite';
      }, 10);
    }
  }

  updateWeapon(weaponType, ammo) {
    const weaponNames = {
      'punch': '✊ Puños',
      'knife': '🔪 Cuchillo',
      'gun': '🔫 Pistola'
    };

    this.elements.weaponDisplay.textContent = weaponNames[weaponType] || 'Desconocido';
    this.elements.ammoDisplay.textContent = weaponType === 'gun' ? ammo : '∞';

    // Color según arma
    if (weaponType === 'gun') {
      this.elements.weaponDisplay.style.color = '#ff6600';
    } else if (weaponType === 'knife') {
      this.elements.weaponDisplay.style.color = '#ff0000';
    } else {
      this.elements.weaponDisplay.style.color = '#00ff00';
    }
  }

  updateRole(isAssassin) {
    this.isAssassin = isAssassin;

    if (isAssassin) {
      this.elements.roleDisplay.textContent = '🔪 ASESINO 🔪';
      this.elements.roleDisplay.style.color = '#ff3300';
      this.elements.roleDisplay.style.textShadow = '0 0 10px #ff3300';
    } else {
      this.elements.roleDisplay.textContent = '👤 Inocente';
      this.elements.roleDisplay.style.color = '#ffff00';
      this.elements.roleDisplay.style.textShadow = '0 0 5px #ffff00';
    }
  }

  updatePlayerCount(alive, total) {
    this.elements.playerCount.textContent = `${alive}/${total}`;

    // Color warning si quedan pocos
    if (alive <= 3) {
      this.elements.playerCount.style.color = '#ff0000';
      this.elements.playerCount.style.fontWeight = 'bold';
    } else if (alive <= 5) {
      this.elements.playerCount.style.color = '#ff6600';
    } else {
      this.elements.playerCount.style.color = '#00ff00';
    }
  }

  updateMap(mapName) {
    const mapNames = {
      'times-square': 'Times Square, NYC',
      'blue-mosque': 'Mezquita Azul, Estambul',
      'plaza-mayor': 'Plaza Mayor, Madrid',
      'edinburgh-castle': 'Castillo de Edimburgo',
      'la-boca': 'La Boca, Buenos Aires'
    };

    this.elements.mapName.textContent = mapNames[mapName] || mapName;
  }

  showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 20px 40px;
      border-radius: 8px;
      border: 2px solid ${this.getTypeColor(type)};
      font-size: 20px;
      font-weight: bold;
      z-index: 500;
      animation: slide-in 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slide-out 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }

  getTypeColor(type) {
    const colors = {
      'info': '#00ff00',
      'warning': '#ffff00',
      'error': '#ff3300',
      'success': '#00ff00',
      'assassin': '#ff0000'
    };
    return colors[type] || '#00ff00';
  }

  showWoundedState() {
    const woundIndicator = document.createElement('div');
    woundIndicator.id = 'wound-state';
    woundIndicator.style.cssText = `
      position: absolute;
      bottom: 220px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255, 0, 0, 0.9);
      color: white;
      padding: 15px 30px;
      border-radius: 8px;
      border: 2px solid #ff0000;
      font-weight: bold;
      font-size: 16px;
      animation: wound-pulse 0.8s infinite;
    `;
    woundIndicator.textContent = '🩹 ARRASTRATE O PIDE AYUDA (2:00)';

    document.body.appendChild(woundIndicator);
    return woundIndicator;
  }

  removeWoundedState() {
    const wound = document.getElementById('wound-state');
    if (wound) {
      wound.remove();
    }
  }

  showParanoiaIndicator() {
    const paranoia = document.createElement('div');
    paranoia.id = 'paranoia-indicator';
    paranoia.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: rgba(255, 0, 0, 0.4);
      font-size: 32px;
      font-weight: bold;
      pointer-events: none;
      animation: paranoia-pulse 0.5s infinite;
      text-shadow: 0 0 20px rgba(255, 0, 0, 0.8);
    `;
    paranoia.textContent = '⚠️ MATASTE UN INOCENTE ⚠️';

    document.body.appendChild(paranoia);
    return paranoia;
  }

  removeParanoiaIndicator() {
    const paranoia = document.getElementById('paranoia-indicator');
    if (paranoia) {
      paranoia.remove();
    }
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slide-in {
        from {
          opacity: 0;
          transform: translate(-50%, -100%);
        }
        to {
          opacity: 1;
          transform: translate(-50%, -50%);
        }
      }

      @keyframes slide-out {
        from {
          opacity: 1;
          transform: translate(-50%, -50%);
        }
        to {
          opacity: 0;
          transform: translate(-50%, 100%);
        }
      }

      @keyframes paranoia-pulse {
        0%, 100% {
          opacity: 0.3;
          transform: translate(-50%, -50%) scale(1);
        }
        50% {
          opacity: 0.7;
          transform: translate(-50%, -50%) scale(1.1);
        }
      }

      @keyframes wound-pulse {
        0%, 100% {
          background: rgba(255, 0, 0, 0.8);
        }
        50% {
          background: rgba(255, 50, 50, 0.9);
        }
      }

      @keyframes pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }

      .notification-info {
        border-color: #00ff00;
        background: rgba(0, 255, 0, 0.1);
      }

      .notification-warning {
        border-color: #ffff00;
        background: rgba(255, 255, 0, 0.1);
      }

      .notification-error {
        border-color: #ff3300;
        background: rgba(255, 51, 0, 0.1);
      }

      .notification-assassin {
        border-color: #ff0000;
        background: rgba(255, 0, 0, 0.2);
      }
    `;
    document.head.appendChild(style);
  }
}
