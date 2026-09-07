// GESTOR DE ESCENA CON THREE.JS

class SceneManager {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });

    this.playerModels = {}; // Modelos 3D de otros jugadores
    this.localPlayerModel = null; // Modelo 3D del jugador local (solo visible en 3ra persona)
    this.currentMap = null;

    this.EYE_HEIGHT = 1.6; // Debe coincidir con PlayerController
    this._textureCache = {};
    this.colliders = []; // Cajas (AABB en XZ) de edificios/obstáculos sólidos
    this.weaponPickups = {}; // Armas tiradas en el mapa, disponibles para recoger

    this.setup();
  }

  setup() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowShadowMap;
    this.renderer.setClearColor(0x0a0e27);
    this.container.appendChild(this.renderer.domElement);

    this.scene.background = new THREE.Color(0x0a0e27);
    this.scene.fog = new THREE.Fog(0x0a0e27, 150, 200);

    // Luces
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);

    // Cielo
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(500, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0x87ceeb,
        side: THREE.BackSide
      })
    );
    this.scene.add(sky);

    // Suelo
    this.createGround();

    // Responsive
    window.addEventListener('resize', () => this.onWindowResize());
  }

  // ==========================================================
  // GENERADORES DE TEXTURAS (canvas), memoizados para no
  // recrear el mismo canvas varias veces
  // ==========================================================

  _hexToCss(hex) {
    return '#' + hex.toString(16).padStart(6, '0');
  }

  _tileTexture(baseTexture, repeatX, repeatY) {
    const tex = baseTexture.clone();
    tex.needsUpdate = true;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
    return tex;
  }

  _getAsphaltTexture() {
    if (this._textureCache.asphalt) return this._textureCache.asphalt;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#2f3133';
    ctx.fillRect(0, 0, size, size);

    // Ruido/moteado para simular asfalto
    for (let i = 0; i < 1200; i++) {
      const shade = 40 + Math.random() * 40;
      ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, 0.5)`;
      const x = Math.random() * size;
      const y = Math.random() * size;
      const s = Math.random() * 2 + 0.5;
      ctx.fillRect(x, y, s, s);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    this._textureCache.asphalt = texture;
    return texture;
  }

  _getBrickTexture(brickColor = 0x8a8a8a, mortarColor = 0x555555) {
    const key = `brick_${brickColor}_${mortarColor}`;
    if (this._textureCache[key]) return this._textureCache[key];

    const w = 128, h = 128;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = this._hexToCss(mortarColor);
    ctx.fillRect(0, 0, w, h);

    const brickW = 32, brickH = 16, gap = 3;
    ctx.fillStyle = this._hexToCss(brickColor);
    for (let row = -1; row * brickH < h + brickH; row++) {
      const offset = row % 2 === 0 ? 0 : brickW / 2;
      for (let col = -1; col * brickW < w + brickW; col++) {
        const x = col * brickW + offset;
        const y = row * brickH;
        ctx.fillRect(x + gap / 2, y + gap / 2, brickW - gap, brickH - gap);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    this._textureCache[key] = texture;
    return texture;
  }

  _getTileTexture(colorA = 0x1e6fbf, colorB = 0xeef3f7) {
    const key = `tile_${colorA}_${colorB}`;
    if (this._textureCache[key]) return this._textureCache[key];

    const size = 64;
    const cells = 8;
    const cell = size / cells;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    for (let r = 0; r < cells; r++) {
      for (let c = 0; c < cells; c++) {
        ctx.fillStyle = this._hexToCss((r + c) % 2 === 0 ? colorA : colorB);
        ctx.fillRect(c * cell, r * cell, cell, cell);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    this._textureCache[key] = texture;
    return texture;
  }

  _getStripeTexture(colorA = 0xd4af37, colorB = 0xffffff) {
    const key = `stripe_${colorA}_${colorB}`;
    if (this._textureCache[key]) return this._textureCache[key];

    const w = 32, h = 64;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    const bandHeight = 8;
    for (let y = 0; y < h; y += bandHeight) {
      ctx.fillStyle = this._hexToCss((y / bandHeight) % 2 === 0 ? colorA : colorB);
      ctx.fillRect(0, y, w, bandHeight);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    this._textureCache[key] = texture;
    return texture;
  }

  _getPlankTexture(baseColor) {
    const key = `plank_${baseColor}`;
    if (this._textureCache[key]) return this._textureCache[key];

    const w = 128, h = 128;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = this._hexToCss(baseColor);
    ctx.fillRect(0, 0, w, h);

    // Líneas de tablones + sombreado leve
    const plankHeight = 16;
    for (let y = 0; y < h; y += plankHeight) {
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(0, y, w, 2);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(0, y + 2, w, plankHeight - 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    this._textureCache[key] = texture;
    return texture;
  }

  _getFacadeTexture(cols, rows, baseColor, windowColor, litColor) {
    const key = `facade_${cols}_${rows}_${baseColor}_${windowColor}_${litColor}`;
    if (this._textureCache[key]) return this._textureCache[key];

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = this._hexToCss(baseColor);
    ctx.fillRect(0, 0, size, size);

    const cellW = size / cols;
    const cellH = size / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const lit = Math.random() < 0.3;
        ctx.fillStyle = this._hexToCss(lit ? litColor : windowColor);
        const padX = cellW * 0.18;
        const padY = cellH * 0.22;
        ctx.fillRect(c * cellW + padX, r * cellH + padY, cellW - padX * 2, cellH - padY * 2);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    this._textureCache[key] = texture;
    return texture;
  }

  _getFaceTexture(skinColor) {
    const key = `face_${skinColor}`;
    if (this._textureCache[key]) return this._textureCache[key];

    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = this._hexToCss(skinColor);
    ctx.fillRect(0, 0, size, size);

    // Ojos
    ctx.fillStyle = '#222222';
    ctx.fillRect(16, 24, 8, 8);
    ctx.fillRect(40, 24, 8, 8);

    // Boca
    ctx.fillRect(24, 42, 16, 4);

    const texture = new THREE.CanvasTexture(canvas);
    this._textureCache[key] = texture;
    return texture;
  }

  // ==========================================================
  // ESCENARIO BASE
  // ==========================================================

  createGround() {
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const asphalt = this._tileTexture(this._getAsphaltTexture(), 24, 24);
    const groundMaterial = new THREE.MeshLambertMaterial({ map: asphalt });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  _addCollider(x, z, halfWidth, halfDepth) {
    this.colliders.push({ x, z, halfWidth, halfDepth });
  }

  _isInsideAnyCollider(x, z, margin = 0) {
    return this.colliders.some(c =>
      Math.abs(x - c.x) < c.halfWidth + margin && Math.abs(z - c.z) < c.halfDepth + margin
    );
  }

  getColliders() {
    return this.colliders;
  }

  loadMap(mapName) {
    this.currentMap = mapName;
    this.colliders = [];
    const mapData = GAME_CONFIG.MAPS[mapName];

    console.log(`🗺️ Cargando mapa: ${mapData.name}`);

    if (mapName === 'times-square') {
      this.createTimesSquare();
    } else if (mapName === 'blue-mosque') {
      this.createBlueMosque();
    } else if (mapName === 'plaza-mayor') {
      this.createPlazaMayor();
    } else if (mapName === 'edinburgh-castle') {
      this.createEdinburghCastle();
    } else if (mapName === 'la-boca') {
      this.createLaBoca();
    } else if (mapName === 'city') {
      this.createCity();
    }
  }

  createTimesSquare() {
    // Edificios grandes con ventanas
    for (let i = 0; i < 6; i++) {
      const height = 30 + Math.random() * 30;
      const width = 20 + Math.random() * 15;
      const depth = 15 + Math.random() * 10;

      const cols = Math.max(4, Math.round(width / 3));
      const rows = Math.max(6, Math.round(height / 4));
      const baseColor = new THREE.Color().setHSL(Math.random() * 0.1 + 0.05, 0.3, 0.35).getHex();
      const facade = this._getFacadeTexture(cols, rows, baseColor, 0x1c2733, 0xffe9a8);

      const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
      const buildingMaterial = new THREE.MeshLambertMaterial({ map: facade });
      const building = new THREE.Mesh(buildingGeometry, buildingMaterial);

      const x = -60 + (i % 3) * 40;
      const z = -40 + Math.floor(i / 3) * 40;

      building.position.set(x, height / 2, z);
      building.castShadow = true;
      building.receiveShadow = true;
      this.scene.add(building);
      this._addCollider(x, z, width / 2, depth / 2);

      // Añadir algunas luces internas
      const windowLight = new THREE.PointLight(0xffff99, 0.3, 30);
      windowLight.position.set(x, height * 0.3, z + depth / 2 + 2);
      this.scene.add(windowLight);
    }

    // Banners y carteles digitales
    for (let i = 0; i < 4; i++) {
      const bannerGeometry = new THREE.BoxGeometry(15, 8, 1);
      const bannerMaterial = new THREE.MeshLambertMaterial({
        color: 0xff3333,
        emissive: 0xff0000,
        emissiveIntensity: 0.3
      });
      const banner = new THREE.Mesh(bannerGeometry, bannerMaterial);
      banner.position.set(-60 + i * 40, 25, 50);
      banner.castShadow = true;
      this.scene.add(banner);
    }

    // Áreas de descanso/tiendas
    const shopBrick = this._tileTexture(this._getBrickTexture(0x8a5a3c, 0x4a3325), 3, 1.5);
    for (let i = 0; i < 8; i++) {
      const shopGeometry = new THREE.BoxGeometry(10, 5, 10);
      const shopMaterial = new THREE.MeshLambertMaterial({ map: shopBrick });
      const shop = new THREE.Mesh(shopGeometry, shopMaterial);

      const angle = (i / 8) * Math.PI * 2;
      shop.position.set(
        Math.cos(angle) * 50,
        2.5,
        Math.sin(angle) * 50
      );
      shop.castShadow = true;
      shop.receiveShadow = true;
      this.scene.add(shop);
      this._addCollider(shop.position.x, shop.position.z, 5, 5);
    }

    // Puntos de cobertura (árboles con tronco) — evitando que caigan sobre edificios/tiendas
    for (let i = 0; i < 5; i++) {
      let x, z, attempts = 0;
      do {
        x = -40 + Math.random() * 80;
        z = -40 + Math.random() * 80;
        attempts++;
      } while (this._isInsideAnyCollider(x, z, 3) && attempts < 20);

      const trunkGeometry = new THREE.CylinderGeometry(1, 1.3, 4, 8);
      const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x5a3d24 });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.set(x, 2, z);
      trunk.castShadow = true;
      this.scene.add(trunk);

      const coverGeometry = new THREE.ConeGeometry(8, 15, 8);
      const coverMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
      const cover = new THREE.Mesh(coverGeometry, coverMaterial);
      cover.position.set(x, 4 + 7.5, z);
      cover.castShadow = true;
      this.scene.add(cover);
    }
  }

  createBlueMosque() {
    // Base del edificio bajo el domo
    const baseFacade = this._getFacadeTexture(6, 4, 0xcbb994, 0x8a7a5c, 0xffe9a8);
    const baseGeometry = new THREE.BoxGeometry(36, 14, 36);
    const baseMaterial = new THREE.MeshLambertMaterial({ map: baseFacade });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 7;
    base.castShadow = true;
    base.receiveShadow = true;
    this.scene.add(base);
    this._addCollider(0, 0, 18, 18);

    // Estructura central tipo domo (mosaico de azulejos)
    const tile = this._tileTexture(this._getTileTexture(0x2f6fbf, 0xeaf2fb), 8, 8);
    const domeGeometry = new THREE.DodecahedronGeometry(15, 3);
    const domeMaterial = new THREE.MeshLambertMaterial({ map: tile });
    const dome = new THREE.Mesh(domeGeometry, domeMaterial);
    dome.position.y = 26;
    dome.castShadow = true;
    this.scene.add(dome);

    // Minaretes
    const stripe = this._tileTexture(this._getStripeTexture(0xd4af37, 0xf7f2df), 1, 6);
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const x = Math.cos(angle) * 30;
      const z = Math.sin(angle) * 30;

      const minaretGeometry = new THREE.ConeGeometry(3, 40, 8);
      const minaretMaterial = new THREE.MeshLambertMaterial({ map: stripe });
      const minaret = new THREE.Mesh(minaretGeometry, minaretMaterial);
      minaret.position.set(x, 20, z);
      minaret.castShadow = true;
      this.scene.add(minaret);
    }
  }

  createPlazaMayor() {
    // Plazas/patios abiertos con algunos edificios
    const facade = this._getFacadeTexture(5, 6, 0xd4a574, 0x5a4632, 0xffe9a8);
    const buildingGeometry = new THREE.BoxGeometry(15, 20, 15);
    const buildingMaterial = new THREE.MeshLambertMaterial({ map: facade });

    for (let i = 0; i < 4; i++) {
      const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
      const angle = (i / 4) * Math.PI * 2;
      building.position.x = Math.cos(angle) * 40;
      building.position.z = Math.sin(angle) * 40;
      building.position.y = 10;
      building.castShadow = true;
      building.receiveShadow = true;
      this.scene.add(building);
      this._addCollider(building.position.x, building.position.z, 7.5, 7.5);
    }
  }

  createEdinburghCastle() {
    // Muros del castillo (4 lados)
    const stone = this._tileTexture(this._getBrickTexture(0x6b6b6b, 0x454545), 10, 2);
    const wallGeometry = new THREE.BoxGeometry(100, 20, 4);
    const wallMaterial = new THREE.MeshLambertMaterial({ map: stone });

    const walls = [
      { pos: [0, 10, -50], rot: 0 },
      { pos: [0, 10, 50], rot: 0 },
      { pos: [-50, 10, 0], rot: Math.PI / 2 },
      { pos: [50, 10, 0], rot: Math.PI / 2 }
    ];

    walls.forEach(w => {
      const wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.set(...w.pos);
      wall.rotation.y = w.rot;
      wall.castShadow = true;
      wall.receiveShadow = true;
      this.scene.add(wall);
    });

    // Colliders de los muros (medio ancho/profundidad según su rotación),
    // dejando un hueco en el muro frontal para la puerta
    this._addCollider(-27, -50, 23, 2);
    this._addCollider(27, -50, 23, 2);
    this._addCollider(0, 50, 50, 2);
    this._addCollider(-50, 0, 2, 50);
    this._addCollider(50, 0, 2, 50);

    // Torres en las esquinas
    const towerStone = this._tileTexture(this._getBrickTexture(0x5a5a5a, 0x3a3a3a), 6, 5);
    const towers = [
      { pos: [-50, 0, -50] },
      { pos: [50, 0, -50] },
      { pos: [-50, 0, 50] },
      { pos: [50, 0, 50] }
    ];

    towers.forEach(t => {
      const towerGeometry = new THREE.CylinderGeometry(8, 10, 40, 16);
      const towerMaterial = new THREE.MeshLambertMaterial({ map: towerStone });
      const tower = new THREE.Mesh(towerGeometry, towerMaterial);
      tower.position.set(...t.pos);
      tower.castShadow = true;
      this.scene.add(tower);
      this._addCollider(t.pos[0], t.pos[2], 10, 10);

      // Techo cónico
      const roofGeometry = new THREE.ConeGeometry(10, 8, 16);
      const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
      const roof = new THREE.Mesh(roofGeometry, roofMaterial);
      roof.position.set(t.pos[0], 24, t.pos[2]);
      roof.castShadow = true;
      this.scene.add(roof);
    });

    // Torre central principal
    const mainTowerGeometry = new THREE.CylinderGeometry(12, 15, 50, 16);
    const mainTowerMaterial = new THREE.MeshLambertMaterial({ map: this._tileTexture(this._getBrickTexture(0x4a4a4a, 0x2f2f2f), 6, 6) });
    const mainTower = new THREE.Mesh(mainTowerGeometry, mainTowerMaterial);
    mainTower.position.y = 25;
    mainTower.castShadow = true;
    this.scene.add(mainTower);
    this._addCollider(0, 0, 15, 15);

    // Bandera en la torre
    const flagGeometry = new THREE.PlaneGeometry(8, 6);
    const flagMaterial = new THREE.MeshLambertMaterial({ color: 0x0066cc });
    const flag = new THREE.Mesh(flagGeometry, flagMaterial);
    flag.position.set(15, 50, 0);
    flag.castShadow = true;
    this.scene.add(flag);

    // Puerta principal
    const gateGeometry = new THREE.BoxGeometry(6, 15, 1);
    const gateMaterial = new THREE.MeshLambertMaterial({
      map: this._tileTexture(this._getPlankTexture(0x8B4513), 2, 3)
    });
    const gate = new THREE.Mesh(gateGeometry, gateMaterial);
    gate.position.set(0, 7.5, -50.5);
    gate.castShadow = true;
    this.scene.add(gate);

    // Parapetos (decorativo)
    for (let i = -40; i < 41; i += 10) {
      const battlementGeometry = new THREE.BoxGeometry(4, 6, 2);
      const battlementMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
      const battlement = new THREE.Mesh(battlementGeometry, battlementMaterial);
      battlement.position.set(i, 20, -50);
      this.scene.add(battlement);
    }
  }

  createLaBoca() {
    const colors = [0xff6b6b, 0xee5a6f, 0xc92a2a, 0xf08c00, 0xff6b35, 0x004e89, 0xffa500, 0xff1493];

    // Casas coloridas en grid
    const gridSize = 4;
    const spacing = 25;

    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        const posX = -37.5 + x * spacing;
        const posZ = -37.5 + z * spacing;

        // Casa principal (chapa/tablón pintado, estilo caminito)
        const houseHeight = 10 + Math.random() * 8;
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const plank = this._tileTexture(this._getPlankTexture(randomColor), 3, Math.max(2, Math.round(houseHeight / 3)));
        const houseGeometry = new THREE.BoxGeometry(12, houseHeight, 12);
        const houseMaterial = new THREE.MeshLambertMaterial({ map: plank });
        const house = new THREE.Mesh(houseGeometry, houseMaterial);

        house.position.set(posX, houseHeight / 2, posZ);
        house.castShadow = true;
        house.receiveShadow = true;
        this.scene.add(house);
        this._addCollider(posX, posZ, 6, 6);

        // Techo rojo
        const roofGeometry = new THREE.ConeGeometry(9, 4, 4);
        const roofMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(posX, houseHeight + 2, posZ);
        roof.castShadow = true;
        this.scene.add(roof);

        // Puerta
        const doorGeometry = new THREE.BoxGeometry(2, 4, 0.5);
        const doorMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(posX, 2, posZ + 6.25);
        this.scene.add(door);

        // Balcón decorativo
        const balconyGeometry = new THREE.BoxGeometry(14, 1, 2);
        const balconyMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const balcony = new THREE.Mesh(balconyGeometry, balconyMaterial);
        balcony.position.set(posX, houseHeight * 0.6, posZ + 6.5);
        this.scene.add(balcony);
      }
    }

    // Calle adoquinada
    const cobble = this._tileTexture(this._getBrickTexture(0x5a4a3a, 0x33281c), 20, 20);
    const streetGeometry = new THREE.PlaneGeometry(100, 100);
    const streetMaterial = new THREE.MeshLambertMaterial({ map: cobble });
    const street = new THREE.Mesh(streetGeometry, streetMaterial);
    street.rotation.x = -Math.PI / 2;
    street.position.y = -0.1;
    street.receiveShadow = true;
    this.scene.add(street);

    // Faroles
    for (let i = 0; i < 6; i++) {
      const lampGeometry = new THREE.CylinderGeometry(1, 1, 15, 8);
      const lampMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
      const lamp = new THREE.Mesh(lampGeometry, lampMaterial);

      const angle = (i / 6) * Math.PI * 2;
      lamp.position.set(
        Math.cos(angle) * 45,
        7.5,
        Math.sin(angle) * 45
      );
      lamp.castShadow = true;
      this.scene.add(lamp);

      // Luz del farol
      const lampLight = new THREE.PointLight(0xffff99, 0.6, 30);
      lampLight.position.set(
        Math.cos(angle) * 45,
        15,
        Math.sin(angle) * 45
      );
      this.scene.add(lampLight);
    }
  }

  _getRoadLineTexture() {
    if (this._textureCache.roadLine) return this._textureCache.roadLine;

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    // Fondo transparente + segmento amarillo (línea discontinua)
    ctx.fillStyle = '#e8c93a';
    ctx.fillRect(4, 6, 34, 4);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    this._textureCache.roadLine = texture;
    return texture;
  }

  createCity() {
    const blockPitch = 60; // distancia entre centros de manzana
    const blockSize = 40; // tamaño de vereda+edificio por manzana
    const sidewalkColor = 0x9a9a92;
    const buildingPalette = [0xc0704a, 0x8a9bb0, 0xb5a45c, 0xd6906a, 0x7fa88a, 0xa2795c, 0xc9c2a0, 0xb08a9a];

    let colorIndex = 0;
    const positions = [-1, 0, 1];

    for (const gx of positions) {
      for (const gz of positions) {
        const cx = gx * blockPitch;
        const cz = gz * blockPitch;

        if (gx === 0 && gz === 0) {
          this._createCityPlaza(cx, cz);
          continue;
        }

        // Vereda
        const sidewalkGeo = new THREE.PlaneGeometry(blockSize, blockSize);
        const sidewalkMat = new THREE.MeshLambertMaterial({ color: sidewalkColor });
        const sidewalk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
        sidewalk.rotation.x = -Math.PI / 2;
        sidewalk.position.set(cx, 0.02, cz);
        sidewalk.receiveShadow = true;
        this.scene.add(sidewalk);

        // Edificio con fachada variada
        const width = 22 + Math.random() * 8;
        const depth = 22 + Math.random() * 8;
        const height = 14 + Math.random() * 26;
        const cols = Math.max(4, Math.round(width / 3));
        const rows = Math.max(5, Math.round(height / 4));
        const baseColor = buildingPalette[colorIndex % buildingPalette.length];
        colorIndex++;
        const facade = this._getFacadeTexture(cols, rows, baseColor, 0x2a2a30, 0xffe9a8);

        const buildingGeo = new THREE.BoxGeometry(width, height, depth);
        const buildingMat = new THREE.MeshLambertMaterial({ map: facade });
        const building = new THREE.Mesh(buildingGeo, buildingMat);
        building.position.set(cx, height / 2, cz);
        building.castShadow = true;
        building.receiveShadow = true;
        this.scene.add(building);
        this._addCollider(cx, cz, width / 2, depth / 2);

        // Farol en la esquina de la manzana
        const lampGeometry = new THREE.CylinderGeometry(0.3, 0.3, 8, 6);
        const lampMaterial = new THREE.MeshLambertMaterial({ color: 0x2b2b2b });
        const lamp = new THREE.Mesh(lampGeometry, lampMaterial);
        lamp.position.set(cx - blockSize / 2 + 2, 4, cz - blockSize / 2 + 2);
        lamp.castShadow = true;
        this.scene.add(lamp);

        const lampLight = new THREE.PointLight(0xffe9a8, 0.5, 20);
        lampLight.position.set(lamp.position.x, 8, lamp.position.z);
        this.scene.add(lampLight);
      }
    }

    // Líneas de calle pintadas (cruce principal)
    const roadLineH = this._tileTexture(this._getRoadLineTexture(), 25, 1);
    const roadLineMatH = new THREE.MeshBasicMaterial({ map: roadLineH, transparent: true });
    const lineGeo = new THREE.PlaneGeometry(200, 1);

    const lineH = new THREE.Mesh(lineGeo, roadLineMatH);
    lineH.rotation.x = -Math.PI / 2;
    lineH.position.y = 0.03;
    this.scene.add(lineH);

    const roadLineV = this._tileTexture(this._getRoadLineTexture(), 25, 1);
    const roadLineMatV = new THREE.MeshBasicMaterial({ map: roadLineV, transparent: true });
    const lineV = new THREE.Mesh(lineGeo, roadLineMatV);
    lineV.rotation.x = -Math.PI / 2;
    lineV.rotation.z = Math.PI / 2;
    lineV.position.y = 0.03;
    this.scene.add(lineV);
  }

  _createCityPlaza(cx, cz) {
    // Fuente central
    const basinGeo = new THREE.CylinderGeometry(8, 8.5, 1, 20);
    const basinMat = new THREE.MeshLambertMaterial({ color: 0x8a97a5 });
    const basin = new THREE.Mesh(basinGeo, basinMat);
    basin.position.set(cx, 0.5, cz);
    basin.castShadow = true;
    basin.receiveShadow = true;
    this.scene.add(basin);
    this._addCollider(cx, cz, 8.5, 8.5);

    const waterGeo = new THREE.CylinderGeometry(7, 7, 0.3, 20);
    const waterMat = new THREE.MeshLambertMaterial({ color: 0x3a7bd5 });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.position.set(cx, 1.05, cz);
    this.scene.add(water);

    const jetGeo = new THREE.CylinderGeometry(0.4, 0.6, 3, 8);
    const jetMat = new THREE.MeshLambertMaterial({ color: 0xb0b8c0 });
    const jet = new THREE.Mesh(jetGeo, jetMat);
    jet.position.set(cx, 2.5, cz);
    this.scene.add(jet);

    // Torre del reloj
    const towerX = cx + 16;
    const towerZ = cz + 16;
    const towerGeo = new THREE.BoxGeometry(4, 26, 4);
    const towerMat = new THREE.MeshLambertMaterial({
      map: this._tileTexture(this._getBrickTexture(0xb08968, 0x6b4a35), 2, 8)
    });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(towerX, 13, towerZ);
    tower.castShadow = true;
    this.scene.add(tower);
    this._addCollider(towerX, towerZ, 2, 2);

    const clockFaceGeo = new THREE.CircleGeometry(1.6, 16);
    const clockFaceMat = new THREE.MeshBasicMaterial({ color: 0xfff8e0, side: THREE.DoubleSide });
    [0, Math.PI / 2, Math.PI, -Math.PI / 2].forEach(angle => {
      const face = new THREE.Mesh(clockFaceGeo, clockFaceMat);
      face.position.set(towerX + Math.sin(angle) * 2.05, 24, towerZ + Math.cos(angle) * 2.05);
      face.rotation.y = angle;
      this.scene.add(face);
    });

    // Árboles alrededor de la plaza
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const x = cx + Math.cos(angle) * 16;
      const z = cz + Math.sin(angle) * 16;
      if (Math.abs(x - towerX) < 4 && Math.abs(z - towerZ) < 4) continue;

      const trunkGeometry = new THREE.CylinderGeometry(0.6, 0.8, 3, 8);
      const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x5a3d24 });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.set(x, 1.5, z);
      trunk.castShadow = true;
      this.scene.add(trunk);

      const coverGeometry = new THREE.ConeGeometry(4, 7, 8);
      const coverMaterial = new THREE.MeshLambertMaterial({ color: 0x2e8b57 });
      const cover = new THREE.Mesh(coverGeometry, coverMaterial);
      cover.position.set(x, 3 + 3.5, z);
      cover.castShadow = true;
      this.scene.add(cover);
    }
  }

  // ==========================================================
  // PERSONAJES (low-poly tipo "muñeco de bloques" animado)
  // ==========================================================

  _createCharacterMesh(characterId, username) {
    const clothColor = GAME_CONFIG.CHARACTERS[characterId]?.color ?? 0x888888;
    const outfit = GAME_CONFIG.CHARACTERS[characterId]?.outfit ?? {};
    const skinColor = 0xE8B894;

    const legHeight = 0.8, legW = 0.28, legD = 0.28;
    const torsoHeight = 0.7, torsoW = 0.8, torsoD = 0.4;
    const armHeight = 0.7, armW = 0.24, armD = 0.24;
    const headSize = 0.5;

    const clothMat = new THREE.MeshLambertMaterial({ color: clothColor });
    const skinMat = new THREE.MeshLambertMaterial({ color: skinColor });

    const group = new THREE.Group();

    // Piernas: cilindros levemente cónicos en vez de cajas (menos "Minecraft")
    const legGeo = new THREE.CylinderGeometry(legW * 0.42, legW * 0.55, legHeight, 8);

    const hipL = new THREE.Group();
    hipL.position.set(-0.18, legHeight, 0);
    const legMeshL = new THREE.Mesh(legGeo, clothMat);
    legMeshL.position.y = -legHeight / 2;
    legMeshL.castShadow = true;
    hipL.add(legMeshL);
    group.add(hipL);

    const hipR = new THREE.Group();
    hipR.position.set(0.18, legHeight, 0);
    const legMeshR = new THREE.Mesh(legGeo, clothMat);
    legMeshR.position.y = -legHeight / 2;
    legMeshR.castShadow = true;
    hipR.add(legMeshR);
    group.add(hipR);

    // Torso: cilindro (más ancho de hombros que de cadera)
    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(torsoW * 0.5, torsoW * 0.42, torsoHeight, 10),
      clothMat
    );
    torso.position.y = legHeight + torsoHeight / 2;
    torso.castShadow = true;
    group.add(torso);

    // Brazos (pivote en el hombro), también cilíndricos
    const shoulderY = legHeight + torsoHeight;
    const armGeo = new THREE.CylinderGeometry(armW * 0.4, armW * 0.5, armHeight, 8);

    const shoulderL = new THREE.Group();
    shoulderL.position.set(-(torsoW / 2 + armW / 2), shoulderY, 0);
    const armMeshL = new THREE.Mesh(armGeo, skinMat);
    armMeshL.position.y = -armHeight / 2;
    armMeshL.castShadow = true;
    shoulderL.add(armMeshL);
    group.add(shoulderL);

    const shoulderR = new THREE.Group();
    shoulderR.position.set(torsoW / 2 + armW / 2, shoulderY, 0);
    const armMeshR = new THREE.Mesh(armGeo, skinMat);
    armMeshR.position.y = -armHeight / 2;
    armMeshR.castShadow = true;
    shoulderR.add(armMeshR);
    group.add(shoulderR);

    // Cabeza: esfera (redonda) con la cara como calcomanía plana al frente
    // en vez de mapear la textura sobre una caja (evita el look "cúbico")
    const headRadius = headSize / 2;
    const head = new THREE.Mesh(new THREE.SphereGeometry(headRadius, 14, 12), skinMat);
    head.position.y = shoulderY + 0.05 + headRadius;
    head.castShadow = true;
    group.add(head);

    const faceTexture = this._getFaceTexture(skinColor);
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(headRadius * 1.1, headRadius * 1.1),
      new THREE.MeshBasicMaterial({ map: faceTexture, transparent: true })
    );
    face.position.set(0, head.position.y, headRadius * 0.97);
    group.add(face);

    // Vestuario distintivo por personaje
    this._applyOutfit(group, outfit, {
      torsoW, torsoD, torsoHeight, legHeight,
      headSize, headY: head.position.y, shoulderY, shoulderL, shoulderR
    });

    // Etiqueta de nombre
    const label = this._createNameLabel(username);
    label.position.y = head.position.y + 0.55;
    group.add(label);

    return {
      mesh: group,
      parts: { hipL, hipR, shoulderL, shoulderR, armMeshR, heldWeapon: null }
    };
  }

  _applyOutfit(group, outfit, dims) {
    const { torsoW, torsoD, torsoHeight, legHeight, headSize, headY, shoulderY, shoulderL, shoulderR } = dims;
    const accent = outfit.accent ?? 0xffffff;
    const accentMat = new THREE.MeshLambertMaterial({ color: accent });
    // El torso ahora es un cilindro (radio promedio ~0.46*torsoW), no una caja
    // de profundidad torsoD: los accesorios deben apoyarse sobre esa superficie.
    const torsoFrontZ = torsoW * 0.46 + 0.02;
    const torsoCenterY = legHeight + torsoHeight / 2;

    switch (outfit.type) {
      case 'suit': {
        const tie = new THREE.Mesh(new THREE.BoxGeometry(0.12, torsoHeight * 0.7, 0.03), accentMat);
        tie.position.set(0, torsoCenterY + 0.05, torsoFrontZ);
        group.add(tie);
        break;
      }

      case 'dress':
      case 'gown': {
        const skirtHeight = legHeight * 0.75;
        const skirt = new THREE.Mesh(
          new THREE.CylinderGeometry(torsoW / 2, torsoW / 2 + 0.3, skirtHeight, 10),
          accentMat
        );
        skirt.position.y = skirtHeight / 2 + legHeight * 0.1;
        skirt.castShadow = true;
        group.add(skirt);

        if (outfit.headwear === 'veil') {
          const veil = new THREE.Mesh(
            new THREE.PlaneGeometry(0.5, 0.6),
            new THREE.MeshLambertMaterial({ color: accent, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
          );
          veil.position.set(0, headY, -headSize / 2 - 0.02);
          group.add(veil);
        }
        break;
      }

      case 'labcoat': {
        const badge = new THREE.Mesh(
          new THREE.PlaneGeometry(0.12, 0.12),
          new THREE.MeshBasicMaterial({ color: accent, side: THREE.DoubleSide })
        );
        badge.position.set(0.15, torsoCenterY + 0.1, torsoFrontZ);
        group.add(badge);
        break;
      }

      case 'uniform': {
        const epauletteGeo = new THREE.BoxGeometry(0.3, 0.08, 0.28);
        const epL = new THREE.Mesh(epauletteGeo, accentMat);
        epL.position.set(shoulderL.position.x, shoulderY + 0.04, 0);
        group.add(epL);
        const epR = new THREE.Mesh(epauletteGeo, accentMat);
        epR.position.set(shoulderR.position.x, shoulderY + 0.04, 0);
        group.add(epR);

        for (let i = 0; i < 3; i++) {
          const medal = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), accentMat);
          medal.position.set(-0.15 + i * 0.15, torsoCenterY + 0.15, torsoFrontZ);
          group.add(medal);
        }

        if (outfit.headwear === 'cap') {
          const cap = new THREE.Mesh(
            new THREE.CylinderGeometry(headSize * 0.55, headSize * 0.55, 0.12, 12),
            accentMat
          );
          cap.position.set(0, headY + headSize / 2 + 0.06, 0);
          group.add(cap);
        }
        break;
      }

      case 'robe': {
        if (outfit.headwear === 'scarf') {
          const scarf = new THREE.Mesh(
            new THREE.ConeGeometry(headSize * 0.55, 0.4, 10),
            new THREE.MeshLambertMaterial({ color: accent })
          );
          scarf.position.set(0, headY + headSize * 0.35, 0);
          group.add(scarf);
        }
        break;
      }

      case 'maid': {
        const apron = new THREE.Mesh(
          new THREE.PlaneGeometry(torsoW * 0.7, torsoHeight * 0.85),
          new THREE.MeshLambertMaterial({ color: accent, side: THREE.DoubleSide })
        );
        apron.position.set(0, torsoCenterY - 0.03, torsoFrontZ);
        group.add(apron);

        if (outfit.headwear === 'maidcap') {
          const cap = new THREE.Mesh(
            new THREE.BoxGeometry(headSize * 0.5, 0.08, headSize * 0.3),
            new THREE.MeshLambertMaterial({ color: accent })
          );
          cap.position.set(0, headY + headSize / 2 + 0.04, -headSize * 0.1);
          group.add(cap);
        }
        break;
      }

      case 'tweed': {
        if (outfit.headwear === 'glasses') {
          const glasses = new THREE.Mesh(
            new THREE.BoxGeometry(headSize * 0.7, 0.05, 0.03),
            new THREE.MeshBasicMaterial({ color: accent })
          );
          glasses.position.set(0, headY + 0.02, headSize / 2 + 0.01);
          group.add(glasses);
        }
        break;
      }

      case 'overalls': {
        const strapGeo = new THREE.BoxGeometry(0.1, torsoHeight, 0.05);
        const strapL = new THREE.Mesh(strapGeo, accentMat);
        strapL.position.set(-0.18, torsoCenterY, torsoFrontZ);
        group.add(strapL);
        const strapR = new THREE.Mesh(strapGeo, accentMat);
        strapR.position.set(0.18, torsoCenterY, torsoFrontZ);
        group.add(strapR);

        if (outfit.headwear === 'sunhat') {
          const brim = new THREE.Mesh(
            new THREE.CylinderGeometry(headSize * 0.9, headSize * 0.9, 0.05, 14),
            new THREE.MeshLambertMaterial({ color: accent })
          );
          brim.position.set(0, headY + headSize / 2 + 0.03, 0);
          group.add(brim);
        }
        break;
      }

      case 'trench': {
        if (outfit.headwear === 'fedora') {
          const hatTop = new THREE.Mesh(
            new THREE.CylinderGeometry(headSize * 0.4, headSize * 0.4, 0.22, 10),
            new THREE.MeshLambertMaterial({ color: accent })
          );
          hatTop.position.set(0, headY + headSize / 2 + 0.15, 0);
          group.add(hatTop);

          const brim = new THREE.Mesh(
            new THREE.CylinderGeometry(headSize * 0.75, headSize * 0.75, 0.04, 14),
            new THREE.MeshLambertMaterial({ color: accent })
          );
          brim.position.set(0, headY + headSize / 2 + 0.05, 0);
          group.add(brim);
        }
        break;
      }

      default:
        break;
    }
  }

  _createNameLabel(username) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(username, 128, 40);

    const texture = new THREE.CanvasTexture(canvas);
    const geometry = new THREE.PlaneGeometry(1.6, 0.4);
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    return new THREE.Mesh(geometry, material);
  }

  // ==========================================================
  // ARMAS (tiradas en el mapa y sostenidas en la mano)
  // ==========================================================

  _createWeaponMesh(type) {
    const group = new THREE.Group();

    if (type === 'gun') {
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.12, 0.32),
        new THREE.MeshLambertMaterial({ color: 0x2b2b2b })
      );
      body.position.z = 0.08;
      group.add(body);

      const grip = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.2, 0.08),
        new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
      );
      grip.position.set(0, -0.14, -0.05);
      group.add(grip);
      return group;
    }

    // Cuchillo
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.015, 0.28),
      new THREE.MeshBasicMaterial({ color: 0xd8d8d8 })
    );
    blade.position.z = 0.14;
    group.add(blade);

    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.14, 6),
      new THREE.MeshLambertMaterial({ color: 0x4a2f1a })
    );
    handle.rotation.x = Math.PI / 2;
    handle.position.z = -0.05;
    group.add(handle);
    return group;
  }

  _attachHeldWeapon(model, weaponType) {
    if (model.parts.heldWeapon) {
      model.parts.armMeshR.remove(model.parts.heldWeapon);
      model.parts.heldWeapon = null;
    }
    if (!weaponType) return;

    const weaponMesh = this._createWeaponMesh(weaponType);
    weaponMesh.position.set(0.02, -0.34, 0.08);
    weaponMesh.rotation.x = -Math.PI / 6;
    model.parts.armMeshR.add(weaponMesh);
    model.parts.heldWeapon = weaponMesh;
  }

  setPlayerWeapon(playerId, weaponType) {
    const model = this.playerModels[playerId];
    if (model) this._attachHeldWeapon(model, weaponType);
  }

  setLocalPlayerWeapon(weaponType) {
    if (this.localPlayerModel) this._attachHeldWeapon(this.localPlayerModel, weaponType);
  }

  setWeaponPickups(weapons) {
    Object.values(this.weaponPickups).forEach(p => this.scene.remove(p.mesh));
    this.weaponPickups = {};
    weapons.forEach(w => this._addWeaponPickup(w));
  }

  _addWeaponPickup(weapon) {
    const mesh = this._createWeaponMesh(weapon.type);
    mesh.scale.set(2.4, 2.4, 2.4);
    mesh.position.set(weapon.position.x, 0.6, weapon.position.z);
    mesh.rotation.x = Math.PI / 2.5;
    this.scene.add(mesh);
    this.weaponPickups[weapon.id] = { mesh, data: weapon };
  }

  removeWeaponPickup(weaponId) {
    const pickup = this.weaponPickups[weaponId];
    if (pickup) {
      this.scene.remove(pickup.mesh);
      delete this.weaponPickups[weaponId];
    }
  }

  getWeaponPickups() {
    return Object.values(this.weaponPickups).map(p => p.data);
  }

  addPlayer(playerId, player) {
    if (this.playerModels[playerId]) return; // Ya existe

    const { mesh, parts } = this._createCharacterMesh(player.character, player.username);
    mesh.position.set(player.position.x, player.position.y - this.EYE_HEIGHT, player.position.z);
    this.scene.add(mesh);

    this.playerModels[playerId] = {
      mesh,
      parts,
      username: player.username,
      character: player.character,
      isMoving: false,
      walkTime: 0,
      targetRotationY: 0,
      lastMoveTime: performance.now()
    };

    if (player.weapon) {
      this._attachHeldWeapon(this.playerModels[playerId], player.weapon);
    }
  }

  updatePlayerPosition(playerId, position) {
    const model = this.playerModels[playerId];
    if (!model) return;

    const feetTarget = new THREE.Vector3(position.x, position.y - this.EYE_HEIGHT, position.z);
    const dx = feetTarget.x - model.mesh.position.x;
    const dz = feetTarget.z - model.mesh.position.z;

    if (dx * dx + dz * dz > 0.0004) {
      model.targetRotationY = Math.atan2(dx, dz);
      model.isMoving = true;
      model.lastMoveTime = performance.now();
    }

    model.mesh.position.lerp(feetTarget, 0.2);
  }

  removePlayer(playerId) {
    const playerModel = this.playerModels[playerId];
    if (playerModel) {
      this.scene.remove(playerModel.mesh);
      delete this.playerModels[playerId];
    }
  }

  setLocalPlayer(characterId, username) {
    const { mesh, parts } = this._createCharacterMesh(characterId, username);
    mesh.visible = false;
    this.scene.add(mesh);

    this.localPlayerModel = {
      mesh,
      parts,
      isMoving: false,
      walkTime: 0,
      targetRotationY: 0
    };
  }

  updateLocalPlayer(position, rotationY, isMoving, cameraMode) {
    if (!this.localPlayerModel) return;

    this.localPlayerModel.mesh.visible = cameraMode === 'third-person';
    this.localPlayerModel.mesh.position.set(position.x, position.y - this.EYE_HEIGHT, position.z);
    // La cámara "mira" hacia -Z local a rotación 0, mientras que la cara del
    // personaje está pintada en +Z local: hay que sumar 180° para que la cara
    // apunte hacia donde mira la cámara (si no, se ve la cara en la nuca).
    this.localPlayerModel.targetRotationY = rotationY + Math.PI;
    this.localPlayerModel.isMoving = isMoving;
  }

  _animateCharacter(model, deltaTime) {
    // Rotación suave hacia la dirección de movimiento
    let diff = model.targetRotationY - model.mesh.rotation.y;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    model.mesh.rotation.y += diff * Math.min(1, deltaTime * 8);

    const parts = model.parts;
    if (model.isMoving) {
      model.walkTime += deltaTime * 8;
      const swing = Math.sin(model.walkTime) * 0.6;
      parts.hipL.rotation.x = swing;
      parts.hipR.rotation.x = -swing;
      parts.shoulderL.rotation.x = -swing;
      parts.shoulderR.rotation.x = swing;
    } else {
      model.walkTime = 0;
      parts.hipL.rotation.x *= 0.8;
      parts.hipR.rotation.x *= 0.8;
      parts.shoulderL.rotation.x *= 0.8;
      parts.shoulderR.rotation.x *= 0.8;
    }
  }

  updateAnimations(deltaTime) {
    const now = performance.now();

    for (const id in this.playerModels) {
      const model = this.playerModels[id];
      if (model.isMoving && now - model.lastMoveTime > 250) {
        model.isMoving = false;
      }
      this._animateCharacter(model, deltaTime);
    }

    if (this.localPlayerModel) {
      this._animateCharacter(this.localPlayerModel, deltaTime);
    }
  }

  render(camera) {
    this.renderer.render(this.scene, camera);
  }

  onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  getScene() {
    return this.scene;
  }

  getCamera() {
    return this.camera;
  }

  getRenderer() {
    return this.renderer;
  }
}
