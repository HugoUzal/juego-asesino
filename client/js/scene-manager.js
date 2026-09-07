// GESTOR DE ESCENA CON THREE.JS

class SceneManager {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    
    this.setup();
    
    this.playerModels = {}; // Modelos 3D de otros jugadores
    this.currentMap = null;
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

  createGround() {
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x2d3436 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    
    // Grid visual
    const gridHelper = new THREE.GridHelper(200, 20, 0x444444, 0x888888);
    gridHelper.position.y = 0.01;
    this.scene.add(gridHelper);
  }

  loadMap(mapName) {
    this.currentMap = mapName;
    const mapData = GAME_CONFIG.MAPS[mapName];
    
    console.log(`🗺️ Cargando mapa: ${mapData.name}`);
    
    // Aquí irían los modelos específicos de cada mapa
    // Por ahora, escenario genérico
    
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
    }
  }

  createTimesSquare() {
    // Edificios grandes con ventanas
    for (let i = 0; i < 6; i++) {
      const height = 30 + Math.random() * 30;
      const width = 20 + Math.random() * 15;
      const depth = 15 + Math.random() * 10;
      
      const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
      const buildingMaterial = new THREE.MeshLambertMaterial({
        color: new THREE.Color().setHSL(Math.random() * 0.1 + 0.05, 0.4, 0.5)
      });
      const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
      
      const x = -60 + (i % 3) * 40;
      const z = -40 + Math.floor(i / 3) * 40;
      
      building.position.set(x, height / 2, z);
      building.castShadow = true;
      building.receiveShadow = true;
      this.scene.add(building);

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
    for (let i = 0; i < 8; i++) {
      const shopGeometry = new THREE.BoxGeometry(10, 5, 10);
      const shopMaterial = new THREE.MeshLambertMaterial({
        color: 0x333333
      });
      const shop = new THREE.Mesh(shopGeometry, shopMaterial);
      
      const angle = (i / 8) * Math.PI * 2;
      shop.position.set(
        Math.cos(angle) * 50,
        2.5,
        Math.sin(angle) * 50
      );
      shop.castShadow = true;
      this.scene.add(shop);
    }

    // Puntos de cobertura (árboles/kioscos)
    for (let i = 0; i < 5; i++) {
      const coverGeometry = new THREE.ConeGeometry(8, 15, 8);
      const coverMaterial = new THREE.MeshLambertMaterial({
        color: 0x228B22
      });
      const cover = new THREE.Mesh(coverGeometry, coverMaterial);
      cover.position.set(
        -40 + Math.random() * 80,
        7.5,
        -40 + Math.random() * 80
      );
      cover.castShadow = true;
      this.scene.add(cover);
    }
  }

  createBlueMosque() {
    // Estructura central tipo domo
    const domeGeometry = new THREE.DodecahedronGeometry(15, 3);
    const domeMaterial = new THREE.MeshLambertMaterial({ color: 0x4a90e2 });
    const dome = new THREE.Mesh(domeGeometry, domeMaterial);
    dome.position.y = 20;
    dome.castShadow = true;
    this.scene.add(dome);
    
    // Minaretes
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const x = Math.cos(angle) * 30;
      const z = Math.sin(angle) * 30;
      
      const minaretGeometry = new THREE.ConeGeometry(3, 40, 8);
      const minaretMaterial = new THREE.MeshLambertMaterial({ color: 0xf4d03f });
      const minaret = new THREE.Mesh(minaretGeometry, minaretMaterial);
      minaret.position.set(x, 20, z);
      minaret.castShadow = true;
      this.scene.add(minaret);
    }
  }

  createPlazaMayor() {
    // Plazas/patios abiertos con algunos edificios
    const buildingGeometry = new THREE.BoxGeometry(15, 20, 15);
    const buildingMaterial = new THREE.MeshLambertMaterial({ color: 0xd4a574 });
    
    for (let i = 0; i < 4; i++) {
      const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
      const angle = (i / 4) * Math.PI * 2;
      building.position.x = Math.cos(angle) * 40;
      building.position.z = Math.sin(angle) * 40;
      building.position.y = 10;
      building.castShadow = true;
      this.scene.add(building);
    }
  }

  createEdinburghCastle() {
    // Muros del castillo (4 lados)
    const wallGeometry = new THREE.BoxGeometry(100, 20, 4);
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
    
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

    // Torres en las esquinas
    const towers = [
      { pos: [-50, 0, -50] },
      { pos: [50, 0, -50] },
      { pos: [-50, 0, 50] },
      { pos: [50, 0, 50] }
    ];

    towers.forEach(t => {
      const towerGeometry = new THREE.CylinderGeometry(8, 10, 40, 16);
      const towerMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
      const tower = new THREE.Mesh(towerGeometry, towerMaterial);
      tower.position.set(...t.pos);
      tower.castShadow = true;
      this.scene.add(tower);

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
    const mainTowerMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
    const mainTower = new THREE.Mesh(mainTowerGeometry, mainTowerMaterial);
    mainTower.position.y = 25;
    mainTower.castShadow = true;
    this.scene.add(mainTower);

    // Bandera en la torre
    const flagGeometry = new THREE.PlaneGeometry(8, 6);
    const flagMaterial = new THREE.MeshLambertMaterial({ color: 0x0066cc });
    const flag = new THREE.Mesh(flagGeometry, flagMaterial);
    flag.position.set(15, 50, 0);
    flag.castShadow = true;
    this.scene.add(flag);

    // Puerta principal
    const gateGeometry = new THREE.BoxGeometry(6, 15, 1);
    const gateMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
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
        
        // Casa principal
        const houseHeight = 10 + Math.random() * 8;
        const houseGeometry = new THREE.BoxGeometry(12, houseHeight, 12);
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const houseMaterial = new THREE.MeshLambertMaterial({ color: randomColor });
        const house = new THREE.Mesh(houseGeometry, houseMaterial);
        
        house.position.set(posX, houseHeight / 2, posZ);
        house.castShadow = true;
        house.receiveShadow = true;
        this.scene.add(house);

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

    // Calle con textura
    const streetGeometry = new THREE.PlaneGeometry(100, 100);
    const streetMaterial = new THREE.MeshLambertMaterial({ color: 0x442200 });
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

  addPlayer(playerId, player) {
    if (this.playerModels[playerId]) return; // Ya existe
    
    // Crear modelo simple del jugador
    const geometry = new THREE.CylinderGeometry(0.4, 1.8, 4, 8);
    const characterColor = GAME_CONFIG.CHARACTERS[player.character]?.color || 0x888888;
    const material = new THREE.MeshLambertMaterial({ color: characterColor });
    const playerMesh = new THREE.Mesh(geometry, material);
    
    playerMesh.position.copy(player.position);
    playerMesh.castShadow = true;
    playerMesh.receiveShadow = true;
    
    this.scene.add(playerMesh);
    
    // Crear etiqueta de nombre
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(player.username, 128, 40);
    
    const texture = new THREE.CanvasTexture(canvas);
    const labelGeometry = new THREE.PlaneGeometry(4, 1);
    const labelMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const label = new THREE.Mesh(labelGeometry, labelMaterial);
    label.position.y = 2.5;
    playerMesh.add(label);
    
    this.playerModels[playerId] = {
      mesh: playerMesh,
      label: label,
      username: player.username,
      character: player.character
    };
  }

  updatePlayerPosition(playerId, position) {
    const playerModel = this.playerModels[playerId];
    if (playerModel) {
      playerModel.mesh.position.lerp(new THREE.Vector3().copy(position), 0.1);
    }
  }

  removePlayer(playerId) {
    const playerModel = this.playerModels[playerId];
    if (playerModel) {
      this.scene.remove(playerModel.mesh);
      delete this.playerModels[playerId];
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
