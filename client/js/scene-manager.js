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
    // Edificios simple
    for (let i = 0; i < 5; i++) {
      const buildingGeometry = new THREE.BoxGeometry(20, 30 + Math.random() * 20, 15);
      const buildingMaterial = new THREE.MeshLambertMaterial({
        color: new THREE.Color().setHSL(Math.random(), 0.3, 0.5)
      });
      const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
      building.position.set(
        -50 + i * 25,
        15,
        -30 + Math.random() * 20
      );
      building.castShadow = true;
      this.scene.add(building);
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
    // Muros del castillo
    const wallGeometry = new THREE.BoxGeometry(100, 15, 5);
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.y = 7.5;
    wall.castShadow = true;
    this.scene.add(wall);
    
    // Torre central
    const towerGeometry = new THREE.ConeGeometry(10, 50, 16);
    const towerMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
    const tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.y = 25;
    tower.castShadow = true;
    this.scene.add(tower);
  }

  createLaBoca() {
    // Casas coloridas random
    for (let i = 0; i < 10; i++) {
      const houseGeometry = new THREE.BoxGeometry(10, 12, 10);
      const colors = [0xff6b6b, 0xee5a6f, 0xc92a2a, 0xf08c00, 0xff6b35, 0x004e89];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const houseMaterial = new THREE.MeshLambertMaterial({ color: randomColor });
      const house = new THREE.Mesh(houseGeometry, houseMaterial);
      
      house.position.set(
        -40 + Math.random() * 80,
        6,
        -40 + Math.random() * 80
      );
      house.castShadow = true;
      this.scene.add(house);
    }
  }

  addPlayer(playerId, player) {
    if (this.playerModels[playerId]) return; // Ya existe
    
    // Crear modelo simple del jugador
    const geometry = new THREE.CapsuleGeometry(0.4, 1.8, 4, 8);
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
