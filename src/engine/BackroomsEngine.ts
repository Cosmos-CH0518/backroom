import * as THREE from 'three';
import { GameSettings, InputState, ItemType, MazeData, PlayerStats, WorldItem } from '../types';
import {
  createCarpetTexture,
  createCeilingTexture,
  createEntityTexture,
  createExitDoorTexture,
  createLightFixtureTexture,
  createWallpaperTexture,
} from '../textures/proceduralTextures';
import { soundManager } from '../audio/soundManager';

export class BackroomsEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animFrameId: number | null = null;
  private lastTime = 0;

  // Maze & World Data
  public mazeData: MazeData;
  public visitedCells: boolean[][];
  private wallColliders: THREE.Box3[] = [];
  private itemMeshes: Map<string, THREE.Group> = new Map();
  private exitDoorGroup: THREE.Group | null = null;
  private lightObjects: { light: THREE.PointLight; mesh: THREE.Mesh; flicker: boolean; nextFlicker: number; isOff: boolean }[] = [];

  // Player State
  public playerPosition = new THREE.Vector3();
  public playerRotation = { yaw: 0, pitch: 0 };
  private playerHeight = 1.65;
  private currentCameraY = 1.65;
  private headBobTimer = 0;
  private flashlight: THREE.SpotLight | null = null;
  private flashlightTarget: THREE.Object3D | null = null;
  public nearbyItem: WorldItem | null = null;
  public nearExitDoor = false;

  // Entity State
  public entityPosition = new THREE.Vector3(0, 1.4, 0);
  private entityMesh: THREE.Group | null = null;
  public entityDistance = 999;
  public isEntityChasing = false;
  private entitySpeed = 2.4;
  private entityWanderTarget = new THREE.Vector3();
  private entityWanderTimer = 0;

  // Game Stats & Callbacks
  public stats: PlayerStats = {
    sanity: 100,
    stamina: 100,
    flashlightBattery: 100,
    isFlashlightOn: true,
    keysCollected: 0,
    totalKeysNeeded: 3,
    tapesCollected: 0,
    almondWaterCount: 0,
    distanceTraveled: 0,
    timeSurvivedSeconds: 0
  };

  public settings: GameSettings;
  public onStatsUpdate?: (stats: PlayerStats) => void;
  public onItemCollected?: (item: WorldItem) => void;
  public onGameOver?: (reason: string) => void;
  public onVictory?: () => void;
  public onProximityGlitch?: (intensity: number) => void;

  constructor(container: HTMLElement, mazeData: MazeData, settings: GameSettings) {
    this.container = container;
    this.mazeData = mazeData;
    this.settings = settings;

    // Initialize visited cells grid for minimap fog-of-war
    this.visitedCells = Array(mazeData.height)
      .fill(false)
      .map(() => Array(mazeData.width).fill(false));

    // Three.js Scene Setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f0e0a);
    this.scene.fog = new THREE.FogExp2(0x1a160d, 0.075);

    // Camera
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(settings.fov || 75, aspect, 0.1, 80);

    // Spawn player
    this.playerPosition.set(mazeData.spawnPosition.x, 0, mazeData.spawnPosition.z);
    this.camera.position.set(this.playerPosition.x, this.playerHeight, this.playerPosition.z);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    container.appendChild(this.renderer.domElement);

    // Build World
    this.buildWorld();
    this.buildEntity();
    this.setupFlashlight();

    // Spawn Entity at a distance
    this.spawnEntity();

    // Start loop
    this.lastTime = performance.now();
    this.animate = this.animate.bind(this);
    this.animFrameId = requestAnimationFrame(this.animate);

    // Window resize observer
    window.addEventListener('resize', this.handleResize);
  }

  private buildWorld() {
    const { width, height, cellSize, grid } = this.mazeData;
    const worldWidth = width * cellSize;
    const worldHeight = height * cellSize;
    const wallHeight = 3.2;

    // Materials
    const wallpaperTex = createWallpaperTexture();
    const carpetTex = createCarpetTexture();
    const ceilingTex = createCeilingTexture();
    const lightTex = createLightFixtureTexture();

    carpetTex.repeat.set(width * 2, height * 2);
    ceilingTex.repeat.set(width * 2, height * 2);

    const carpetMat = new THREE.MeshStandardMaterial({
      map: carpetTex,
      roughness: 0.9,
      metalness: 0.05
    });

    const ceilingMat = new THREE.MeshStandardMaterial({
      map: ceilingTex,
      roughness: 0.85,
      metalness: 0.1
    });

    const wallMat = new THREE.MeshStandardMaterial({
      map: wallpaperTex,
      roughness: 0.75,
      metalness: 0.05
    });

    // Floor
    const floorGeo = new THREE.PlaneGeometry(worldWidth, worldHeight);
    const floorMesh = new THREE.Mesh(floorGeo, carpetMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(worldWidth / 2, 0, worldHeight / 2);
    this.scene.add(floorMesh);

    // Ceiling
    const ceilingGeo = new THREE.PlaneGeometry(worldWidth, worldHeight);
    const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceilingMesh.rotation.x = Math.PI / 2;
    ceilingMesh.position.set(worldWidth / 2, wallHeight, worldHeight / 2);
    this.scene.add(ceilingMesh);

    // Ambient Lighting (Moist yellow glow)
    const ambientLight = new THREE.AmbientLight(0x453e28, 0.45);
    this.scene.add(ambientLight);

    // Walls & Pillars Generation
    const wallBoxGeo = new THREE.BoxGeometry(cellSize, wallHeight, cellSize);
    const pillarGeo = new THREE.BoxGeometry(cellSize * 0.45, wallHeight, cellSize * 0.45);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = grid[y][x];
        const posX = (x + 0.5) * cellSize;
        const posZ = (y + 0.5) * cellSize;

        if (cell === 1) {
          // Solid Wall block
          const wall = new THREE.Mesh(wallBoxGeo, wallMat);
          wall.position.set(posX, wallHeight / 2, posZ);
          this.scene.add(wall);

          // Collider
          const box = new THREE.Box3().setFromCenterAndSize(
            new THREE.Vector3(posX, wallHeight / 2, posZ),
            new THREE.Vector3(cellSize, wallHeight, cellSize)
          );
          this.wallColliders.push(box);
        } else if (cell === 2) {
          // Pillar
          const pillar = new THREE.Mesh(pillarGeo, wallMat);
          pillar.position.set(posX, wallHeight / 2, posZ);
          this.scene.add(pillar);

          const box = new THREE.Box3().setFromCenterAndSize(
            new THREE.Vector3(posX, wallHeight / 2, posZ),
            new THREE.Vector3(cellSize * 0.45, wallHeight, cellSize * 0.45)
          );
          this.wallColliders.push(box);
        }
      }
    }

    // Ceiling Fluorescent Lights
    const lightFixtGeo = new THREE.PlaneGeometry(1.4, 0.7);
    const lightFixtMat = new THREE.MeshBasicMaterial({
      map: lightTex,
      color: 0xfffae0
    });

    this.mazeData.lights.forEach((l) => {
      const fixtMesh = new THREE.Mesh(lightFixtGeo, lightFixtMat.clone());
      fixtMesh.rotation.x = Math.PI / 2;
      fixtMesh.position.set(l.x, wallHeight - 0.01, l.z);
      this.scene.add(fixtMesh);

      if (!l.broken) {
        const pLight = new THREE.PointLight(l.color, 1.4, 9, 1.6);
        pLight.position.set(l.x, wallHeight - 0.2, l.z);
        this.scene.add(pLight);

        this.lightObjects.push({
          light: pLight,
          mesh: fixtMesh,
          flicker: l.flicker,
          nextFlicker: Math.random() * 3 + 1,
          isOff: false
        });
      } else {
        // Broken light has dark/dead fixture
        (fixtMesh.material as THREE.MeshBasicMaterial).color.setHex(0x333322);
      }
    });

    // Exit Door
    this.buildExitDoor();

    // World Items
    this.buildItems();
  }

  private buildExitDoor() {
    const exitPos = this.mazeData.exitPosition;
    const group = new THREE.Group();
    group.position.set(exitPos.x, 0, exitPos.z);

    const doorTex = createExitDoorTexture();
    const doorGeo = new THREE.BoxGeometry(2.4, 3.0, 0.3);
    const doorMat = new THREE.MeshStandardMaterial({
      map: doorTex,
      roughness: 0.5,
      metalness: 0.3,
      emissive: 0x05220c,
      emissiveIntensity: 0.5
    });

    const doorMesh = new THREE.Mesh(doorGeo, doorMat);
    doorMesh.position.y = 1.5;
    group.add(doorMesh);

    // Glowing Exit Light
    const exitLight = new THREE.PointLight(0x39ff14, 2.0, 7, 1.5);
    exitLight.position.set(0, 2.5, 0.4);
    group.add(exitLight);

    this.scene.add(group);
    this.exitDoorGroup = group;
  }

  private buildItems() {
    this.mazeData.items.forEach((item) => {
      const group = new THREE.Group();
      group.position.set(item.x, 0.6, item.z);

      if (item.type === 'key') {
        // Anomaly Key 3D Model
        const keyMat = new THREE.MeshStandardMaterial({
          color: 0xffd700,
          metalness: 0.9,
          roughness: 0.2,
          emissive: 0xaa8800,
          emissiveIntensity: 0.6
        });
        const keyRing = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 8, 16), keyMat);
        const keyStem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.35, 8), keyMat);
        keyStem.position.y = -0.2;
        keyStem.rotation.x = Math.PI / 2;
        const keyBit = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.08), keyMat);
        keyBit.position.set(0.04, -0.3, 0);

        group.add(keyRing, keyStem, keyBit);

        // Golden aura light
        const keyLight = new THREE.PointLight(0xffcc00, 1.2, 3);
        group.add(keyLight);
      } else if (item.type === 'almond_water') {
        // Almond water bottle
        const bottleMat = new THREE.MeshPhysicalMaterial({
          color: 0xe0f7fa,
          transmission: 0.8,
          opacity: 1,
          transparent: true,
          roughness: 0.1,
          ior: 1.33
        });
        const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.32, 12), bottleMat);
        const cap = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.05, 0.08, 12),
          new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
        );
        cap.position.y = 0.18;
        group.add(bottle, cap);

        const waterLight = new THREE.PointLight(0x80deea, 0.8, 2.5);
        group.add(waterLight);
      } else if (item.type === 'vhs_tape') {
        // Cassette tape
        const tapeMat = new THREE.MeshStandardMaterial({
          color: 0x1a1a1a,
          roughness: 0.5,
          metalness: 0.2
        });
        const tape = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.2), tapeMat);
        const label = new THREE.Mesh(
          new THREE.PlaneGeometry(0.2, 0.12),
          new THREE.MeshBasicMaterial({ color: 0xcccccc })
        );
        label.rotation.x = -Math.PI / 2;
        label.position.y = 0.031;
        group.add(tape, label);

        const tapeLight = new THREE.PointLight(0x90caf9, 0.7, 2);
        group.add(tapeLight);
      } else if (item.type === 'battery') {
        // 9V Battery
        const batMat = new THREE.MeshStandardMaterial({ color: 0xd32f2f, roughness: 0.4 });
        const bat = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.08), batMat);
        const term1 = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.02, 0.04),
          new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8 })
        );
        term1.position.set(-0.03, 0.1, 0);
        const term2 = term1.clone();
        term2.position.set(0.03, 0.1, 0);
        group.add(bat, term1, term2);

        const batLight = new THREE.PointLight(0xff5252, 0.6, 2);
        group.add(batLight);
      }

      this.scene.add(group);
      this.itemMeshes.set(item.id, group);
    });
  }

  private buildEntity() {
    const group = new THREE.Group();
    const entityTex = createEntityTexture();

    // Shadowy billboard sprite
    const spriteMat = new THREE.SpriteMaterial({
      map: entityTex,
      transparent: true,
      color: 0xffffff
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(2.0, 2.0, 1.0);
    group.add(sprite);

    // Eerie red eye glow
    const entityLight = new THREE.PointLight(0xff1100, 1.8, 6, 2);
    entityLight.position.set(0, 0.2, 0);
    group.add(entityLight);

    this.scene.add(group);
    this.entityMesh = group;
  }

  private setupFlashlight() {
    this.flashlightTarget = new THREE.Object3D();
    this.scene.add(this.flashlightTarget);

    this.flashlight = new THREE.SpotLight(0xfffae6, 3.2, 22, Math.PI / 6, 0.45, 1.5);
    this.flashlight.position.copy(this.camera.position);
    this.flashlight.target = this.flashlightTarget;
    this.scene.add(this.flashlight);
  }

  private spawnEntity() {
    // Spawn entity in a cell far away from player
    const { width, height, cellSize, grid } = this.mazeData;
    const candidates: { x: number; y: number }[] = [];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (grid[y][x] === 0) {
          const worldX = (x + 0.5) * cellSize;
          const worldZ = (y + 0.5) * cellSize;
          const dist = Math.hypot(worldX - this.playerPosition.x, worldZ - this.playerPosition.z);
          if (dist > 18) {
            candidates.push({ x: worldX, y: worldZ });
          }
        }
      }
    }

    if (candidates.length > 0) {
      const choice = candidates[Math.floor(Math.random() * candidates.length)];
      this.entityPosition.set(choice.x, 1.4, choice.y);
      this.entityWanderTarget.copy(this.entityPosition);
    }
  }

  public update(delta: number, input: InputState) {
    if (delta > 0.1) delta = 0.1; // clamp lag spike

    // Update Survival Stats Time
    this.stats.timeSurvivedSeconds += delta;

    // 1. Camera Look Rotation (Pitch & Yaw)
    const lookSens = (this.settings.lookSensitivity || 1.0) * 0.0035;
    this.playerRotation.yaw -= input.look.x * lookSens;
    const invertFactor = this.settings.invertY ? -1 : 1;
    this.playerRotation.pitch -= input.look.y * lookSens * invertFactor;
    this.playerRotation.pitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, this.playerRotation.pitch));

    // 2. Movement & Sprint / Crouch Physics
    const isCrouching = input.crouch;
    let isSprinting = input.sprint && this.stats.stamina > 10 && !isCrouching && (input.move.x !== 0 || input.move.y !== 0);

    // Stamina drain / recovery
    if (isSprinting) {
      this.stats.stamina = Math.max(0, this.stats.stamina - delta * 22);
      if (this.stats.stamina <= 0) isSprinting = false;
    } else {
      this.stats.stamina = Math.min(100, this.stats.stamina + delta * 14);
    }

    const baseSpeed = isCrouching ? 1.6 : isSprinting ? 5.2 : 3.0;
    const moveSens = this.settings.moveSensitivity || 1.0;
    const moveSpeed = baseSpeed * moveSens;

    const moveX = input.move.x;
    const moveY = input.move.y;
    const isMoving = Math.abs(moveX) > 0.05 || Math.abs(moveY) > 0.05;

    if (isMoving) {
      // Calculate world movement vector based on camera yaw
      const forward = new THREE.Vector3(-Math.sin(this.playerRotation.yaw), 0, -Math.cos(this.playerRotation.yaw));
      const right = new THREE.Vector3(Math.cos(this.playerRotation.yaw), 0, -Math.sin(this.playerRotation.yaw));

      const moveVec = new THREE.Vector3()
        .addScaledVector(forward, moveY)
        .addScaledVector(right, moveX)
        .normalize()
        .multiplyScalar(moveSpeed * delta);

      // Attempt X and Z moves with wall collision sliding
      this.attemptMoveWithCollision(moveVec);

      // Sound footsteps
      soundManager.playFootstep(isSprinting, isCrouching);

      // Head bobbing
      this.headBobTimer += delta * (isSprinting ? 14 : isCrouching ? 6 : 9);
      this.stats.distanceTraveled += moveVec.length();
    } else {
      this.headBobTimer = 0;
    }

    // Camera height interpolation (crouch vs standing + head bob)
    const targetHeight = isCrouching ? 0.9 : this.playerHeight;
    const bobOffset = isMoving ? Math.sin(this.headBobTimer) * (isSprinting ? 0.08 : 0.035) : 0;
    this.currentCameraY = THREE.MathUtils.lerp(this.currentCameraY, targetHeight + bobOffset, delta * 10);

    // Apply Camera Position & Rotation
    this.camera.position.set(this.playerPosition.x, this.currentCameraY, this.playerPosition.z);

    const euler = new THREE.Euler(this.playerRotation.pitch, this.playerRotation.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);

    // 3. Flashlight toggle & battery
    if (input.flashlightToggleRequested) {
      this.stats.isFlashlightOn = !this.stats.isFlashlightOn;
      soundManager.playFlashlightClick(this.stats.isFlashlightOn);
    }

    if (this.stats.isFlashlightOn && this.stats.flashlightBattery > 0) {
      this.stats.flashlightBattery = Math.max(0, this.stats.flashlightBattery - delta * 1.5);
      if (this.stats.flashlightBattery <= 0) {
        this.stats.isFlashlightOn = false;
        soundManager.playFlashlightClick(false);
      }
    }

    if (this.flashlight && this.flashlightTarget) {
      this.flashlight.visible = this.stats.isFlashlightOn && this.stats.flashlightBattery > 0;
      this.flashlight.position.copy(this.camera.position);

      const forwardDir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
      this.flashlightTarget.position.copy(this.camera.position).add(forwardDir.multiplyScalar(10));
    }

    // 4. Update Visited Cells for Minimap
    const curCellX = Math.floor(this.playerPosition.x / this.mazeData.cellSize);
    const curCellY = Math.floor(this.playerPosition.z / this.mazeData.cellSize);
    if (curCellX >= 0 && curCellX < this.mazeData.width && curCellY >= 0 && curCellY < this.mazeData.height) {
      // Reveal 3x3 surrounding
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = curCellX + dx;
          const ny = curCellY + dy;
          if (nx >= 0 && nx < this.mazeData.width && ny >= 0 && ny < this.mazeData.height) {
            this.visitedCells[ny][nx] = true;
          }
        }
      }
    }

    // 5. Update Lights (Flickering)
    this.updateLights(delta);

    // 6. Update Floating Items Animation & Interaction Check
    this.updateItems(delta, input.interactRequested);

    // 7. Check Exit Door Interaction
    this.checkExitDoor(input.interactRequested);

    // 8. Update Entity AI (Smiler / Stalker)
    if (this.settings.difficulty !== 'peaceful') {
      this.updateEntityAI(delta, isSprinting, isCrouching);
    }

    // 9. Update Sanity & Audio Proximity
    this.updateSanity(delta);

    // Broadcast stats
    if (this.onStatsUpdate) {
      this.onStatsUpdate({ ...this.stats });
    }
  }

  private attemptMoveWithCollision(moveVec: THREE.Vector3) {
    const playerRadius = 0.42;

    // Test X movement
    const targetPosX = this.playerPosition.x + moveVec.x;
    let collidesX = false;

    for (const box of this.wallColliders) {
      if (
        targetPosX + playerRadius > box.min.x &&
        targetPosX - playerRadius < box.max.x &&
        this.playerPosition.z + playerRadius > box.min.z &&
        this.playerPosition.z - playerRadius < box.max.z
      ) {
        collidesX = true;
        break;
      }
    }
    if (!collidesX) {
      this.playerPosition.x = targetPosX;
    }

    // Test Z movement
    const targetPosZ = this.playerPosition.z + moveVec.z;
    let collidesZ = false;

    for (const box of this.wallColliders) {
      if (
        this.playerPosition.x + playerRadius > box.min.x &&
        this.playerPosition.x - playerRadius < box.max.x &&
        targetPosZ + playerRadius > box.min.z &&
        targetPosZ - playerRadius < box.max.z
      ) {
        collidesZ = true;
        break;
      }
    }
    if (!collidesZ) {
      this.playerPosition.z = targetPosZ;
    }
  }

  private updateLights(delta: number) {
    this.lightObjects.forEach((item) => {
      if (!item.flicker) return;
      item.nextFlicker -= delta;
      if (item.nextFlicker <= 0) {
        item.isOff = !item.isOff;
        item.light.intensity = item.isOff ? 0.05 : 1.4;
        (item.mesh.material as THREE.MeshBasicMaterial).color.setHex(item.isOff ? 0x222218 : 0xfffae0);
        item.nextFlicker = item.isOff ? Math.random() * 0.25 + 0.05 : Math.random() * 4 + 1;
      }
    });
  }

  private updateItems(delta: number, interactRequested: boolean) {
    let closestItem: WorldItem | null = null;
    let closestDist = 2.5;

    this.mazeData.items.forEach((item) => {
      if (item.collected) return;
      const mesh = this.itemMeshes.get(item.id);
      if (mesh) {
        // Floating rotation
        mesh.rotation.y += delta * 1.8;
        mesh.position.y = 0.6 + Math.sin(performance.now() * 0.003 + item.x) * 0.08;

        const dist = Math.hypot(item.x - this.playerPosition.x, item.z - this.playerPosition.z);
        if (dist < closestDist) {
          closestDist = dist;
          closestItem = item;
        }
      }
    });

    this.nearbyItem = closestItem;

    if (interactRequested && closestItem) {
      this.collectItem(closestItem);
    }
  }

  public collectItem(item: WorldItem) {
    item.collected = true;
    const mesh = this.itemMeshes.get(item.id);
    if (mesh) {
      this.scene.remove(mesh);
    }

    soundManager.playItemPickup(item.type);

    if (item.type === 'key') {
      this.stats.keysCollected++;
    } else if (item.type === 'almond_water') {
      this.stats.almondWaterCount++;
      this.stats.sanity = Math.min(100, this.stats.sanity + 35);
      soundManager.playDrinkWater();
    } else if (item.type === 'vhs_tape') {
      this.stats.tapesCollected++;
    } else if (item.type === 'battery') {
      this.stats.flashlightBattery = Math.min(100, this.stats.flashlightBattery + 65);
    }

    if (this.onItemCollected) {
      this.onItemCollected(item);
    }
  }

  public drinkAlmondWaterInventory() {
    if (this.stats.almondWaterCount > 0) {
      this.stats.almondWaterCount--;
      this.stats.sanity = Math.min(100, this.stats.sanity + 40);
      soundManager.playDrinkWater();
    }
  }

  private checkExitDoor(interactRequested: boolean) {
    const exitPos = this.mazeData.exitPosition;
    const dist = Math.hypot(exitPos.x - this.playerPosition.x, exitPos.z - this.playerPosition.z);
    this.nearExitDoor = dist < 3.2;

    if (this.nearExitDoor && interactRequested) {
      if (this.stats.keysCollected >= this.stats.totalKeysNeeded) {
        if (this.onVictory) {
          this.onVictory();
        }
      }
    }
  }

  private updateEntityAI(delta: number, isSprinting: boolean, isCrouching: boolean) {
    if (!this.entityMesh) return;

    this.entityDistance = Math.hypot(
      this.entityPosition.x - this.playerPosition.x,
      this.entityPosition.z - this.playerPosition.z
    );

    // Entity Detection Range
    let detectRange = 12;
    if (isSprinting) detectRange = 22; // sprints make noise
    if (isCrouching) detectRange = 7; // crouching is silent
    if (this.stats.isFlashlightOn && this.entityDistance < 16) detectRange = 18; // flashlight attracts

    // AI State: Chase vs Wander
    if (this.entityDistance < detectRange) {
      this.isEntityChasing = true;
    } else if (this.entityDistance > detectRange + 8) {
      this.isEntityChasing = false;
    }

    if (this.isEntityChasing) {
      // Move directly toward player
      const dir = new THREE.Vector3()
        .subVectors(this.playerPosition, this.entityPosition)
        .setY(0)
        .normalize();

      const chaseSpeed = (this.settings.difficulty === 'nightmare' ? 3.8 : this.entitySpeed) * delta;
      this.entityPosition.addScaledVector(dir, chaseSpeed);

      if (Math.random() < 0.02) {
        soundManager.playEntityGrowl(1.0);
      }
    } else {
      // Wander to random points in the labyrinth
      this.entityWanderTimer -= delta;
      if (this.entityWanderTimer <= 0 || this.entityPosition.distanceTo(this.entityWanderTarget) < 1.0) {
        this.entityWanderTimer = Math.random() * 5 + 4;
        const { width, height, cellSize, grid } = this.mazeData;
        const rx = Math.floor(Math.random() * (width - 2)) + 1;
        const rz = Math.floor(Math.random() * (height - 2)) + 1;
        if (grid[rz][rx] === 0) {
          this.entityWanderTarget.set((rx + 0.5) * cellSize, 1.4, (rz + 0.5) * cellSize);
        }
      }

      const wanderDir = new THREE.Vector3()
        .subVectors(this.entityWanderTarget, this.entityPosition)
        .setY(0)
        .normalize();
      this.entityPosition.addScaledVector(wanderDir, this.entitySpeed * 0.6 * delta);
    }

    // Update entity mesh position
    this.entityMesh.position.copy(this.entityPosition);
    this.entityMesh.position.y = 1.4 + Math.sin(performance.now() * 0.005) * 0.15;

    // Check catch condition (Jumpscare / Game Over)
    if (this.entityDistance < 1.1) {
      soundManager.playJumpscare();
      if (this.onGameOver) {
        this.onGameOver('Caught by the Smiler entity in the dark.');
      }
    }
  }

  private updateSanity(delta: number) {
    // Sanity decreases when near entity, in darkness, or low battery
    let sanityDrain = 0.5 * delta;

    if (this.entityDistance < 12) {
      const proximityFactor = (12 - this.entityDistance) / 12;
      sanityDrain += proximityFactor * 8 * delta;

      // Heartbeat pulse frequency scales with entity proximity
      if (Math.random() < 0.08 + proximityFactor * 0.15) {
        soundManager.playHeartbeat(proximityFactor);
      }

      if (this.onProximityGlitch) {
        this.onProximityGlitch(proximityFactor);
      }
    } else {
      if (this.onProximityGlitch) {
        this.onProximityGlitch(0);
      }
    }

    if (!this.stats.isFlashlightOn || this.stats.flashlightBattery <= 0) {
      sanityDrain += 1.2 * delta;
    }

    this.stats.sanity = Math.max(0, this.stats.sanity - sanityDrain);

    if (this.stats.sanity <= 0) {
      if (this.onGameOver) {
        this.onGameOver('Lost all sanity to the endless yellow walls.');
      }
    }
  }

  private animate(currentTime: number) {
    this.animFrameId = requestAnimationFrame(this.animate);
    const delta = (currentTime - this.lastTime) * 0.001;
    this.lastTime = currentTime;

    // Render 3D Scene
    this.renderer.render(this.scene, this.camera);
  }

  private handleResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public setFov(fov: number) {
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
  }

  public destroy() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('resize', this.handleResize);
    this.renderer.dispose();
    if (this.container && this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
