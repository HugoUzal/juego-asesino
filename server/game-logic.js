// GAME LOGIC - Lógica central del juego

class GameLogic {
  constructor() {
    this.damageSystem = new DamageSystem();
    this.paranoiaSystem = new ParanoiaSystem();
    this.woundSystem = new WoundSystem();
  }

  processDamage(attacker, victim, weaponType) {
    if (!attacker || !victim || !attacker.isAlive || !victim.isAlive) {
      return null;
    }

    const damage = this.damageSystem.calculateDamage(weaponType);
    const wasWounded = victim.wounds > 0;

    // Aplicar daño
    victim.health = Math.max(0, victim.health - damage);
    victim.wounds += this.damageSystem.getWounds(weaponType);

    console.log(`[DAÑO] ${attacker.username} golpea a ${victim.username} con ${weaponType} (${damage} dmg, heridas: ${victim.wounds})`);

    // Verificar muerte
    const isDead = this.checkDeath(victim, weaponType);
    
    if (isDead) {
      victim.isAlive = false;
      console.log(`[MUERTE] ${victim.username} ha muerto`);
    }

    // Aplicar paranoia si mató inocentemente
    if (!attacker.isAssassin && !isDead && !wasWounded) {
      // Mató a inocente sin ser visto = paranoia
      // (Verificar LOS más tarde)
      attacker.isParanoid = true;
      attacker.paranoidStartTime = Date.now();
      attacker.paranoidBehavior = this.paranoiaSystem.getRandomBehavior();
      console.log(`[PARANOIA] ${attacker.username} está paranóico por matar a inocente`);
    }

    return {
      victim,
      damage,
      isDead,
      wounds: victim.wounds
    };
  }

  checkDeath(victim, weaponType) {
    if (weaponType === 'gun') {
      return true; // Disparo = muerte instantánea
    }

    if (weaponType === 'knife') {
      return victim.wounds >= 3; // 3+ cuchilladas = muerte
    }

    if (weaponType === 'punch') {
      return victim.wounds >= 6; // 6 golpes = muerte
    }

    return false;
  }

  applyParanoia(player) {
    if (!player.isParanoid) return;

    const elapsed = Date.now() - player.paranoidStartTime;
    const duration = 300000; // 5 minutos

    if (elapsed > duration) {
      player.isParanoid = false;
      player.paranoidBehavior = null;
      console.log(`[PARANOIA FINISH] ${player.username} se recuperó`);
      return;
    }

    // Random behavior every 1-3 seconds
    if (!player.paranoidBehaviorTimer || Date.now() - player.paranoidBehaviorTimer > 1000 + Math.random() * 2000) {
      player.paranoidBehavior = this.paranoiaSystem.getRandomBehavior();
      player.paranoidBehaviorTimer = Date.now();
    }
  }

  helpWoundedPlayer(helper, victim) {
    if (!victim.isWounded) {
      return { success: false, reason: 'not_wounded' };
    }

    if (helper.lastHelpTime && Date.now() - helper.lastHelpTime < 30000) {
      return { success: false, reason: 'cooldown' };
    }

    // Curar
    victim.isWounded = false;
    victim.health = Math.max(20, victim.health); // Mínimo 20 HP
    victim.wounds = Math.max(0, victim.wounds - 2); // Restar heridas
    victim.isHelped = true; // Penalidad de velocidad permanente

    helper.lastHelpTime = Date.now();

    console.log(`[AYUDA] ${helper.username} ayudó a ${victim.username}`);

    return { success: true, victimHealth: victim.health };
  }

  updateWounds(player, deltaTime) {
    if (player.wounds <= 0) {
      player.isWounded = false;
      return;
    }

    // Si tiene 1-2 heridas por cuchillo
    if (player.wounds === 1 || player.wounds === 2) {
      player.isWounded = true;

      if (!player.woundStartTime) {
        player.woundStartTime = Date.now();
      }

      const elapsed = Date.now() - player.woundStartTime;
      const woundDuration = 120000; // 2 minutos

      // Mover lentamente
      player.currentSpeed = 0.5; // 50% velocidad

      if (elapsed > woundDuration && !player.isHelped) {
        // Muerte por herida sin ayuda
        player.isAlive = false;
        player.isWounded = false;
        console.log(`[MUERTE] ${player.username} murió desangrado`);
        return { died: true, reason: 'bleed' };
      }
    }

    // Si tiene 3+ heridas = muerte instantánea
    if (player.wounds >= 3) {
      player.isAlive = false;
      console.log(`[MUERTE] ${player.username} murió por heridas graves`);
      return { died: true, reason: 'wounds' };
    }

    return { died: false };
  }

  applyAssassinProgression(assassin) {
    if (!assassin.isAssassin) return;

    const kills = Object.values(assassin.stats || {}).kills || 0;

    if (kills >= 1 && kills < 3) {
      assassin.speedMultiplier = 1.2; // 20% más rápido
    } else if (kills >= 3 && kills < 5) {
      assassin.speedMultiplier = 1.4; // 40% más rápido
    } else if (kills >= 5) {
      assassin.speedMultiplier = 1.5; // 50% más rápido
      assassin.damageMultiplier = 1.2; // 20% más daño
    }
  }

  canPlayerAttack(attacker, victim, range = 5) {
    // Distancia
    const dist = Math.sqrt(
      Math.pow(attacker.position.x - victim.position.x, 2) +
      Math.pow(attacker.position.y - victim.position.y, 2) +
      Math.pow(attacker.position.z - victim.position.z, 2)
    );

    return dist <= range;
  }

  getVisiblePlayers(player, otherPlayers, range = 50) {
    const visible = [];

    for (const other of otherPlayers) {
      if (other.id === player.id || !other.isAlive) continue;

      const dist = Math.sqrt(
        Math.pow(player.position.x - other.position.x, 2) +
        Math.pow(player.position.y - other.position.y, 2) +
        Math.pow(player.position.z - other.position.z, 2)
      );

      if (dist <= range) {
        visible.push({
          ...other,
          distance: dist,
          showName: dist <= 15 // Nombres solo en cercano
        });
      }
    }

    return visible;
  }
}

class DamageSystem {
  calculateDamage(weaponType) {
    const damages = {
      'punch': 10,
      'knife': 25,
      'gun': 100
    };
    return damages[weaponType] || 0;
  }

  getWounds(weaponType) {
    if (weaponType === 'gun') return 0; // Disparo = muerte, no herida
    if (weaponType === 'knife') return 1; // Cuchillo = 1 herida
    if (weaponType === 'punch') return 1; // Golpe = 1 herida (pero necesita 6)
    return 0;
  }

  getAmmoUsage(weaponType) {
    return weaponType === 'gun' ? 1 : 0;
  }
}

class ParanoiaSystem {
  constructor() {
    this.behaviors = [
      'zigzag',
      'look-back',
      'tremor',
      'speed-fluctuation'
    ];
  }

  getRandomBehavior() {
    return this.behaviors[Math.floor(Math.random() * this.behaviors.length)];
  }

  applyBehavior(player) {
    const behavior = player.paranoidBehavior;

    if (!behavior) return {};

    const output = {
      behavior: behavior,
      intensity: 0.3 + Math.random() * 0.7 // 0.3-1.0
    };

    switch (behavior) {
      case 'zigzag':
        output.moveOffset = { x: (Math.random() - 0.5) * 2, z: (Math.random() - 0.5) * 2 };
        break;

      case 'look-back':
        output.lookOffset = 180 + (Math.random() - 0.5) * 30;
        break;

      case 'tremor':
        output.cameraShake = (Math.random() - 0.5) * 0.1;
        break;

      case 'speed-fluctuation':
        output.speedMultiplier = 0.7 + Math.random() * 0.6; // 0.7-1.3x
        break;
    }

    return output;
  }
}

class WoundSystem {
  constructor() {
    this.wounds = {};
  }

  createWound(playerId, type) {
    this.wounds[playerId] = {
      type: type, // 'knife' o 'punch'
      startTime: Date.now(),
      isActive: true
    };
  }

  isWounded(playerId) {
    const wound = this.wounds[playerId];
    if (!wound) return false;

    const elapsed = Date.now() - wound.startTime;
    const maxDuration = 120000; // 2 minutos

    if (elapsed > maxDuration) {
      delete this.wounds[playerId];
      return false;
    }

    return true;
  }

  removeWound(playerId) {
    delete this.wounds[playerId];
  }
}

module.exports = { GameLogic, DamageSystem, ParanoiaSystem, WoundSystem };
