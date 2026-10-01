import * as THREE from 'three';
import { CharacterModel } from './CharacterModel';
import { OfficeScene } from './OfficeScene';
import { HackerModel } from './HackerModel';
import { CustomCharacterInstance } from './FBXCharacterManager';
import { ComputerData, HackerInfo, HackerState, MalwareSavedProgress } from '../types';
import { soundManager } from '../audio/soundManager';

export interface GameEngineCallbacks {
  onNearComputerChange: (computer: ComputerData | null) => void;
  onOpenMiniGame: (computer: ComputerData) => void;
  onOpenMalwareBattle: (computer: ComputerData) => void;
  onComputerBrokenAlert: (computer: ComputerData) => void;
  onComputersUpdate: (computers: ComputerData[]) => void;
  onHackerAlert?: (message: string) => void;
  onHackerWhacked?: (count: number) => void;
  onHackerStateChange?: (hackerInfo: HackerInfo | null) => void;
  onMalwareGameOver?: () => void;
  onComboChange?: (combo: number, timeLeft: number, maxTime: number) => void;
  onSpeedBoostChange?: (active: boolean, timeLeft: number, maxDuration: number) => void;
}

export type CameraViewMode = 'tpp' | 'overview' | 'fpp';

export class GameEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private office: OfficeScene;
  public character: CharacterModel;
  public showCharacterModel: boolean = true;
  public cameraViewMode: CameraViewMode = 'tpp';

  // Hacker Entity
  public hacker: HackerModel | null = null;
  private hackerPos: THREE.Vector3 = new THREE.Vector3(0, 0, 11);
  private hackerTargetPc: ComputerData | null = null;
  private hackerSpawnCooldown: number = 10; // First hacker arrives in 10s
  private hackerHackingTimer: number = 0;
  private hackerStunTimer: number = 0;
  public hackerWhackCount: number = 0;
  private hackLaserBeam: THREE.Line | null = null;
  private malwarePropagationTimer: number = 0; // Timer for LAN worm propagation if 1 PC is infected

  // Camera System (Third Person Follow Camera)
  public cameraAnglePitch: number = 0;

  // Combo & Speed Boost Skill System
  public speedBoostTimer: number = 0;
  public maxSpeedBoostDuration: number = 6.5;
  public comboCount: number = 0;
  public comboTimer: number = 0;
  public maxComboTimer: number = 9.0;

  // 3D Fire & Turbo Visual Effects
  private fireLight: THREE.PointLight;
  private fireAuraGroup: THREE.Group;
  private fireAuraParticles: Array<{
    mesh: THREE.Mesh;
    baseY: number;
    angle: number;
    radius: number;
    speed: number;
    oscSpeed: number;
  }> = [];
  private fireTrailParticles: Array<{
    mesh: THREE.Mesh;
    life: number;
    maxLife: number;
    velY: number;
  }> = [];
  private fireTrailSpawnTimer: number = 0;

  private clock: THREE.Clock;
  private animFrameId: number | null = null;
  private isRunning: boolean = false;
  private isPaused: boolean = false; // When mini-game is active
  public isMenuMode: boolean = false;
  private menuOrbitAngle: number = 0;

  // Input states
  private keys: { [key: string]: boolean } = {};
  public joystickVector: { x: number; y: number } = { x: 0, y: 0 };
  public cameraAngleYaw: number = 0;
  public invertCameraYaw: boolean = false;
  public invertCameraPitch: boolean = false;
  private isDraggingMouse: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;
  private mouseDownPos: { x: number; y: number } = { x: 0, y: 0 };

  // Collision & Physics
  private playerPos: THREE.Vector3 = new THREE.Vector3(0, 0, 0); // Start in central hallway
  private playerVelocity: THREE.Vector3 = new THREE.Vector3();
  private playerRadius: number = 0.45;

  // Interaction
  public nearComputer: ComputerData | null = null;
  private callbacks: GameEngineCallbacks;

  // Spawner timer
  private breakSpawnCooldown: number = 6;
  private footstepTimer: number = 0;

  constructor(container: HTMLElement, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.clock = new THREE.Clock();

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f172a); // Deep modern slate background
    this.scene.fog = new THREE.FogExp2(0x0f172a, 0.018);

    // 2. Camera
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.camera.position.set(0, 9, 10);
    this.camera.lookAt(0, 1, 0);
    this.scene.add(this.camera);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 4. Office Environment
    this.office = new OfficeScene(this.scene);

    // 5. Character (hidden by default per user request)
    this.character = new CharacterModel();
    this.character.group.position.copy(this.playerPos);
    this.character.group.visible = this.showCharacterModel;
    this.scene.add(this.character.group);

    // 6. 3D Fire Effects & Aura (attached to scene to illuminate both in 3P and 1P)
    this.fireLight = new THREE.PointLight(0xff5500, 0, 6.0);
    this.fireLight.position.set(0, 1.2, 0);
    this.scene.add(this.fireLight);

    this.fireAuraGroup = new THREE.Group();
    this.fireAuraGroup.visible = false;
    this.scene.add(this.fireAuraGroup);

    const flameColors = [0xff2200, 0xff5500, 0xff8800, 0xffbb00, 0xffea00];
    for (let i = 0; i < 16; i++) {
      const geo = new THREE.DodecahedronGeometry(0.06 + Math.random() * 0.04);
      const mat = new THREE.MeshBasicMaterial({
        color: flameColors[i % flameColors.length],
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });
      const mesh = new THREE.Mesh(geo, mat);
      this.fireAuraGroup.add(mesh);
      this.fireAuraParticles.push({
        mesh,
        baseY: Math.random() * 1.5,
        angle: (i / 16) * Math.PI * 2,
        radius: 0.35 + Math.random() * 0.25,
        speed: 3.2 + Math.random() * 2.5,
        oscSpeed: 4.5 + Math.random() * 4.0,
      });
    }

    // Event listeners
    this.setupInputs();
    this.setupResize();
  }

  private setupInputs() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    // Mouse camera orbit and left-click to whack
    const dom = this.renderer.domElement;
    dom.addEventListener('mousedown', (e) => {
      this.isDraggingMouse = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.mouseDownPos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDraggingMouse) return;
      const deltaX = e.clientX - this.lastMouseX;
      const deltaY = e.clientY - this.lastMouseY;

      const yawMultiplier = this.invertCameraYaw ? -1 : 1;
      const pitchMultiplier = this.invertCameraPitch ? -1 : 1;

      // Normal non-inverted: Dragging right turns view right (+Yaw), dragging left turns view left (-Yaw)
      this.cameraAngleYaw += deltaX * 0.006 * yawMultiplier;

      // Third Person: allow natural vertical camera elevation
      this.cameraAnglePitch -= deltaY * 0.004 * pitchMultiplier;
      this.cameraAnglePitch = THREE.MathUtils.clamp(this.cameraAnglePitch, -0.35, 0.65);
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener('mouseup', (e) => {
      if (this.isDraggingMouse) {
        // If mouse barely moved, count as left click whack!
        const dx = Math.abs(e.clientX - this.mouseDownPos.x);
        const dy = Math.abs(e.clientY - this.mouseDownPos.y);
        if (dx < 6 && dy < 6 && e.button === 0) {
          this.triggerWhackBat();
        }
      }
      this.isDraggingMouse = false;
    });

    // Touch screen camera swipe controls
    dom.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length === 1) {
          this.isDraggingMouse = true;
          this.lastMouseX = e.touches[0].clientX;
          this.lastMouseY = e.touches[0].clientY;
          this.mouseDownPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
      },
      { passive: true }
    );

    window.addEventListener(
      'touchmove',
      (e) => {
        if (!this.isDraggingMouse || e.touches.length !== 1) return;
        const deltaX = e.touches[0].clientX - this.lastMouseX;
        const deltaY = e.touches[0].clientY - this.lastMouseY;

        const yawMultiplier = this.invertCameraYaw ? -1 : 1;
        const pitchMultiplier = this.invertCameraPitch ? -1 : 1;

        // Normal non-inverted: Swiping right turns view right, swiping left turns view left
        this.cameraAngleYaw += deltaX * 0.006 * yawMultiplier;

        this.cameraAnglePitch -= deltaY * 0.004 * pitchMultiplier;
        this.cameraAnglePitch = THREE.MathUtils.clamp(this.cameraAnglePitch, -0.35, 0.65);
        this.lastMouseX = e.touches[0].clientX;
        this.lastMouseY = e.touches[0].clientY;
      },
      { passive: true }
    );

    window.addEventListener('touchend', () => {
      this.isDraggingMouse = false;
    });
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true;

    // Attack / Whack with Bat: KeyF or KeyQ
    if (e.code === 'KeyF' || e.code === 'KeyQ') {
      this.triggerWhackBat();
      return;
    }

    // Interaction key E or Space or Enter
    if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') {
      this.triggerInteract();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  private setupResize() {
    const handleResize = () => {
      if (!this.container) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);
  }

  public setInvertCamera(invertYaw: boolean, invertPitch: boolean = false) {
    this.invertCameraYaw = invertYaw;
    this.invertCameraPitch = invertPitch;
  }

  public toggleInvertCamera(): boolean {
    this.invertCameraYaw = !this.invertCameraYaw;
    soundManager.playClick();
    return this.invertCameraYaw;
  }

  public checkHackerDirectHit(): boolean {
    if (!this.hacker || this.hacker.state === 'stunned') return false;

    // Horizontal distance between player and hacker centers
    const dx = this.hackerPos.x - this.playerPos.x;
    const dz = this.hackerPos.z - this.playerPos.z;
    const horizDist = Math.sqrt(dx * dx + dz * dz);

    // Physical melee bat strike reach:
    // Player radius (0.45) + Hacker radius (0.35) + Bat reach (0.55) = ~1.35m
    if (horizDist > 1.38) {
      return false; // Beyond physical reach of the bat
    }

    // Third Person: Player must be facing towards the hacker within a ~65-degree frontal swing arc
    const forwardX = Math.sin(this.character.currentYaw);
    const forwardZ = Math.cos(this.character.currentYaw);
    const normX = dx / (horizDist || 1);
    const normZ = dz / (horizDist || 1);

    const dot = forwardX * normX + forwardZ * normZ;
    return dot >= 0.42; // Facing the hacker's body
  }

  private spawnImpactSparks(pos: THREE.Vector3) {
    const sparkCount = 18;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(sparkCount * 3);
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < sparkCount; i++) {
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;

      const angle = Math.random() * Math.PI * 2;
      const speed = 1.8 + Math.random() * 3.2;
      velocities.push(
        new THREE.Vector3(
          Math.cos(angle) * speed,
          1.2 + Math.random() * 2.2,
          Math.sin(angle) * speed
        )
      );
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xfbbf24,
      size: 0.1,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
    });
    const pMesh = new THREE.Points(geo, mat);
    this.scene.add(pMesh);

    let life = 0.4;
    const animateSparks = () => {
      life -= 0.035;
      const posAttr = pMesh.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < sparkCount; i++) {
        velocities[i].y -= 0.12; // Gravity
        arr[i * 3] += velocities[i].x * 0.025;
        arr[i * 3 + 1] += velocities[i].y * 0.025;
        arr[i * 3 + 2] += velocities[i].z * 0.025;
      }
      posAttr.needsUpdate = true;
      mat.opacity = Math.max(0, life / 0.4);

      if (life > 0) {
        requestAnimationFrame(animateSparks);
      } else {
        this.scene.remove(pMesh);
        geo.dispose();
        mat.dispose();
      }
    };
    requestAnimationFrame(animateSparks);
  }

  public triggerWhackBat() {
    if (this.isPaused) return;
    soundManager.playSwoosh();
    this.character.triggerAttack();

    // Check direct melee hit on Hacker's body
    if (this.hacker && this.hacker.state !== 'stunned') {
      const isDirectHit = this.checkHackerDirectHit();
      if (isDirectHit) {
        // Direct body hit!
        soundManager.playBonk();
        this.hacker.setHackerState('stunned');
        this.hackerStunTimer = 2.5;
        this.hackerWhackCount++;

        // Knockback physics: push hacker body backwards away from strike
        const knockback = this.hackerPos.clone().sub(this.playerPos);
        knockback.y = 0;
        knockback.normalize().multiplyScalar(0.75);
        this.hackerPos.add(knockback);
        this.hackerPos.x = THREE.MathUtils.clamp(this.hackerPos.x, -11, 11);
        this.hackerPos.z = THREE.MathUtils.clamp(this.hackerPos.z, -11, 11);
        this.hacker.group.position.copy(this.hackerPos);

        // Flash hacker model white/red
        this.hacker.triggerDirectHit();

        // Spawn impact particle sparks at torso point of contact
        this.spawnImpactSparks(new THREE.Vector3(this.hackerPos.x, 1.15, this.hackerPos.z));

        // Spatial UI feedback popup
        this.office.spawnFloatingPopup('💥 DIRECT HIT! โดนตัวแฮกเกอร์! +250 XP', this.hackerPos, '#f59e0b');

        // Remove laser beam if hacking
        this.removeLaserBeam();
        this.hackerTargetPc = null;

        if (this.callbacks.onHackerWhacked) {
          this.callbacks.onHackerWhacked(this.hackerWhackCount);
        }
        if (this.callbacks.onHackerAlert) {
          this.callbacks.onHackerAlert('💥 ฟาดโดนตัวแฮกเกอร์เต็มๆ! แฮกเกอร์มึนตึ้บกำลังหนีเตลิด!');
        }
      } else {
        // Swung but missed because not close enough to body or facing away
        const dist = this.playerPos.distanceTo(this.hackerPos);
        if (dist < 2.8) {
          this.office.spawnFloatingPopup('💨 หวดวืด! ต้องประชิดตัวแฮกเกอร์', this.playerPos.clone().add(new THREE.Vector3(0, 1.5, 0)), '#94a3b8');
        }
      }
    }
  }

  public triggerInteract() {
    if (!this.nearComputer || this.isPaused) return;

    if (this.nearComputer.status === 'broken') {
      this.callbacks.onOpenMiniGame(this.nearComputer);
    } else if (this.nearComputer.status === 'malware') {
      this.callbacks.onOpenMalwareBattle(this.nearComputer);
    }
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
    if (paused) {
      this.character.setAnimationState('repair');
    } else {
      this.character.setAnimationState('idle');
    }
  }

  public setMenuMode(isMenu: boolean) {
    this.isMenuMode = isMenu;
    if (isMenu) {
      this.character.setAnimationState('idle');
      this.deactivateSpeedBoost();
      this.resetCombo();
    }
  }

  public activateSpeedBoost(duration: number = 6.5) {
    this.speedBoostTimer = duration;
    this.character.isSpeedBoosted = true;
    if (this.fireAuraGroup) {
      this.fireAuraGroup.visible = true;
    }
    soundManager.playSpeedBoost();
    if (this.callbacks.onSpeedBoostChange) {
      this.callbacks.onSpeedBoostChange(true, this.speedBoostTimer, this.maxSpeedBoostDuration);
    }
  }

  public deactivateSpeedBoost() {
    this.speedBoostTimer = 0;
    this.character.isSpeedBoosted = false;
    if (this.fireAuraGroup) {
      this.fireAuraGroup.visible = false;
    }
    if (this.fireLight) {
      this.fireLight.intensity = 0;
    }
    if (this.callbacks.onSpeedBoostChange) {
      this.callbacks.onSpeedBoostChange(false, 0, this.maxSpeedBoostDuration);
    }
  }

  public incrementCombo(): number {
    this.comboCount += 1;
    this.comboTimer = this.maxComboTimer;
    soundManager.playComboUp(this.comboCount);
    if (this.callbacks.onComboChange) {
      this.callbacks.onComboChange(this.comboCount, this.comboTimer, this.maxComboTimer);
    }
    return this.comboCount;
  }

  public resetCombo() {
    this.comboCount = 0;
    this.comboTimer = 0;
    if (this.callbacks.onComboChange) {
      this.callbacks.onComboChange(0, 0, this.maxComboTimer);
    }
  }

  public setCustomCharacter(instance: CustomCharacterInstance) {
    this.character.setCustomCharacter(instance);
  }

  public clearCustomCharacter() {
    this.character.clearCustomCharacter();
  }

  public getIsCustomCharacter(): boolean {
    return this.character.isCustomModel;
  }

  public saveComputerMalwareProgress(id: string, progress: MalwareSavedProgress) {
    const compVis = this.office.computerVisuals.get(id);
    if (compVis) {
      compVis.data.malwareSavedProgress = progress;
      this.notifyComputersChange();
    }
  }

  public markComputerRepaired(id: string) {
    const compVis = this.office.computerVisuals.get(id);
    if (compVis) {
      compVis.data.malwareSavedProgress = undefined;
      // Spatial UI popup
      this.office.spawnFloatingPopup('⚡ WIRES RESTORED! +100 XP', compVis.originalPos, '#10b981');
    }
    this.office.setComputerStatus(id, 'normal');
    this.character.setAnimationState('success');
    setTimeout(() => {
      if (!this.isPaused) {
        this.character.setAnimationState('idle');
      }
    }, 1200);

    // Reward player with Combo & Speed Boost Skill with Fire Effect!
    this.incrementCombo();
    this.activateSpeedBoost(6.5);

    this.notifyComputersChange();

    // Check if broken computers are low, schedule another
    const brokenCount = this.getBrokenComputersCount();
    if (brokenCount === 0) {
      setTimeout(() => this.breakRandomComputer(), 1500);
    }
  }

  public markComputerFailed(id: string) {
    this.resetCombo();
    this.character.setAnimationState('fail');
    setTimeout(() => {
      if (!this.isPaused) {
        this.character.setAnimationState('idle');
      }
    }, 1200);
  }

  public breakRandomComputer(): ComputerData | null {
    const normals: ComputerData[] = [];
    this.office.computerVisuals.forEach((vis) => {
      if (vis.data.status === 'normal') {
        normals.push(vis.data);
      }
    });

    if (normals.length === 0) return null;

    const chosen = normals[Math.floor(Math.random() * normals.length)];
    this.office.setComputerStatus(chosen.id, 'broken');
    soundManager.playAlert();
    this.callbacks.onComputerBrokenAlert(chosen);
    this.notifyComputersChange();
    return chosen;
  }

  public getBrokenComputersCount(): number {
    let count = 0;
    this.office.computerVisuals.forEach((vis) => {
      if (vis.data.status === 'broken' || vis.data.status === 'repairing') count++;
    });
    return count;
  }

  public getMalwareComputersCount(): number {
    let count = 0;
    this.office.computerVisuals.forEach((vis) => {
      if (vis.data.status === 'malware') count++;
    });
    return count;
  }

  public getAllComputers(): ComputerData[] {
    const list: ComputerData[] = [];
    this.office.computerVisuals.forEach((vis) => list.push(vis.data));
    return list;
  }

  private notifyComputersChange() {
    const all = this.getAllComputers();
    this.callbacks.onComputersUpdate(all);
    const broken = this.getBrokenComputersCount();
    const malwares = this.getMalwareComputersCount();
    const integrity = Math.max(0, 100 - broken * 8 - malwares * 30);
    this.office.updateServerBoard(integrity, broken, malwares);

    const malwareCount = all.filter((c) => c.status === 'malware').length;
    if (malwareCount >= 2 && this.callbacks.onMalwareGameOver) {
      this.callbacks.onMalwareGameOver();
    }
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();

    // Start with 2 broken computers if none are broken
    if (this.getBrokenComputersCount() === 0) {
      this.breakRandomComputer();
      this.breakRandomComputer();
    }

    this.loop();
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public destroy() {
    this.stop();
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }

  private loop = () => {
    if (!this.isRunning) return;
    this.animFrameId = requestAnimationFrame(this.loop);

    const delta = Math.min(this.clock.getDelta(), 0.1);

    if (!this.isPaused) {
      this.updateMovement(delta);
      this.updateComputerSpawning(delta);
      this.checkNearComputer();
      this.updateHacker(delta);
    }

    // Always update office animations (lights, sparks, screen indicators)
    this.office.update(delta);

    // Update fire effects & speed boost skill
    this.updateSpeedBoostAndFire(delta);

    // Update character animation frame
    this.character.update(delta);

    // Update smooth camera follow
    this.updateCamera(delta);

    // Render
    this.renderer.render(this.scene, this.camera);
  };

  private updateSpeedBoostAndFire(delta: number) {
    if (this.speedBoostTimer > 0) {
      this.speedBoostTimer -= delta;

      if (this.speedBoostTimer <= 0) {
        // Boost has ended: cleanly reset state and shut off fire visuals
        this.deactivateSpeedBoost();
      } else {
        // Boost is actively running
        this.character.isSpeedBoosted = true;
        this.fireAuraGroup.visible = true;
        this.fireLight.position.set(this.playerPos.x, 1.2, this.playerPos.z);
        this.fireAuraGroup.position.set(this.playerPos.x, 0, this.playerPos.z);

        // Dynamic flickering fire light
        const t = this.clock.getElapsedTime();
        this.fireLight.intensity = 2.8 + Math.sin(t * 26) * 0.9 + (Math.random() - 0.5) * 0.5;
        this.fireLight.color.setHex(Math.random() > 0.25 ? 0xff4500 : 0xffaa00);

        // Animate aura flame embers
        for (const p of this.fireAuraParticles) {
          p.angle += p.speed * delta;
          const currentY = (p.baseY + t * 1.6) % 1.5;
          p.mesh.position.set(
            Math.cos(p.angle) * p.radius,
            currentY,
            Math.sin(p.angle) * p.radius
          );
          const scale = 0.6 + Math.sin(t * p.oscSpeed) * 0.4;
          p.mesh.scale.setScalar(scale);
        }

        if (this.callbacks.onSpeedBoostChange) {
          this.callbacks.onSpeedBoostChange(true, this.speedBoostTimer, this.maxSpeedBoostDuration);
        }
      }
    } else {
      // Safety guard: guarantee visuals and character animation state are restored if timer is 0
      if (this.character.isSpeedBoosted || this.fireAuraGroup.visible || this.fireLight.intensity > 0) {
        this.deactivateSpeedBoost();
      }
    }

    // Update fire trail embers
    for (let i = this.fireTrailParticles.length - 1; i >= 0; i--) {
      const p = this.fireTrailParticles[i];
      p.life -= delta;
      p.mesh.position.y += p.velY * delta;
      const ratio = Math.max(0, p.life / p.maxLife);
      p.mesh.scale.setScalar(ratio);
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = ratio * 0.9;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
        this.fireTrailParticles.splice(i, 1);
      }
    }

    // Combo countdown
    if (this.comboCount > 0) {
      this.comboTimer = Math.max(0, this.comboTimer - delta);
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
      }
      if (this.callbacks.onComboChange) {
        this.callbacks.onComboChange(this.comboCount, this.comboTimer, this.maxComboTimer);
      }
    }
  }

  private spawnFireTrailEmber() {
    // Keep max 40 active trail embers to maintain 60 FPS
    if (this.fireTrailParticles.length > 40) return;

    const geo = new THREE.DodecahedronGeometry(0.08 + Math.random() * 0.05);
    const colors = [0xff2200, 0xff5500, 0xff8800, 0xffcc00];
    const mat = new THREE.MeshBasicMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      this.playerPos.x + (Math.random() - 0.5) * 0.35,
      0.08 + Math.random() * 0.2,
      this.playerPos.z + (Math.random() - 0.5) * 0.35
    );
    this.scene.add(mesh);
    this.fireTrailParticles.push({
      mesh,
      life: 0.5 + Math.random() * 0.3,
      maxLife: 0.8,
      velY: 0.3 + Math.random() * 0.4,
    });
  }

  private updateMovement(delta: number) {
    if (this.isMenuMode) {
      this.character.setAnimationState('idle');
      return;
    }

    let inputX = 0;
    let inputZ = 0;

    // Keyboard controls
    if (this.keys['KeyW'] || this.keys['ArrowUp']) inputZ -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) inputZ += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) inputX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) inputX += 1;

    // Mobile virtual joystick input override
    if (Math.abs(this.joystickVector.x) > 0.05 || Math.abs(this.joystickVector.y) > 0.05) {
      inputX = this.joystickVector.x;
      inputZ = -this.joystickVector.y; // invert Y for standard forward/back
    }

    const moveMag = Math.sqrt(inputX * inputX + inputZ * inputZ);

    if (moveMag > 0.05) {
      // Normalize
      const dirX = inputX / moveMag;
      const dirZ = inputZ / moveMag;

      // Rotate movement vector according to current camera yaw angle for natural third-person direction
      const cosY = Math.cos(this.cameraAngleYaw);
      const sinY = Math.sin(this.cameraAngleYaw);
      const worldX = dirX * cosY - dirZ * sinY;
      const worldZ = dirX * sinY + dirZ * cosY;

      // Target character yaw angle
      const targetAngle = Math.atan2(worldX, worldZ);
      this.character.updateFacing(targetAngle, delta, 16);

      // Speed (9.2 with Speed Boost skill vs 5.5 normal)
      const baseSpeed = this.speedBoostTimer > 0 ? 9.2 : 5.5;
      const speed = baseSpeed * Math.min(moveMag, 1.0);
      const moveStepX = worldX * speed * delta;
      const moveStepZ = worldZ * speed * delta;

      // Collision detection with office furniture
      const newX = this.playerPos.x + moveStepX;
      const newZ = this.playerPos.z + moveStepZ;

      if (!this.checkCollision(newX, this.playerPos.z)) {
        this.playerPos.x = newX;
      }
      if (!this.checkCollision(this.playerPos.x, newZ)) {
        this.playerPos.z = newZ;
      }

      // Keep within office walls
      this.playerPos.x = THREE.MathUtils.clamp(
        this.playerPos.x,
        this.office.officeBounds.minX + 0.8,
        this.office.officeBounds.maxX - 0.8
      );
      this.playerPos.z = THREE.MathUtils.clamp(
        this.playerPos.z,
        this.office.officeBounds.minZ + 0.8,
        this.office.officeBounds.maxZ - 0.8
      );

      this.character.group.position.copy(this.playerPos);
      this.character.setAnimationState('run');

      // Footstep audio (faster cadence when speed boosted)
      this.footstepTimer += delta;
      const stepInterval = this.speedBoostTimer > 0 ? 0.15 : 0.28;
      if (this.footstepTimer > stepInterval) {
        soundManager.playFootstep();
        this.footstepTimer = 0;
      }

      // Fire trail when moving with speed boost
      if (this.speedBoostTimer > 0) {
        this.fireTrailSpawnTimer += delta;
        if (this.fireTrailSpawnTimer > 0.05) {
          this.fireTrailSpawnTimer = 0;
          this.spawnFireTrailEmber();
        }
      }
    } else {
      if (
        this.character.getAnimationState() !== 'success' &&
        this.character.getAnimationState() !== 'fail' &&
        this.character.getAnimationState() !== 'repair'
      ) {
        this.character.setAnimationState('idle');
      }
    }
  }

  private checkCollision(x: number, z: number): boolean {
    const testCenter = new THREE.Vector3(x, 0.9, z);
    const testBox = new THREE.Box3();
    testBox.setFromCenterAndSize(
      testCenter,
      new THREE.Vector3(this.playerRadius * 2, 1.8, this.playerRadius * 2)
    );

    for (const box of this.office.colliders) {
      if (box.intersectsBox(testBox)) {
        return true;
      }
    }
    return false;
  }

  private checkNearComputer() {
    let closestComp: ComputerData | null = null;
    let closestDist = 2.4; // Max interaction distance in meters

    this.office.computerVisuals.forEach((vis) => {
      const dist = this.playerPos.distanceTo(
        new THREE.Vector3(vis.data.position[0], 0, vis.data.position[2])
      );
      if (dist < closestDist) {
        closestDist = dist;
        closestComp = vis.data;
      }
    });

    if (this.nearComputer?.id !== closestComp?.id) {
      this.nearComputer = closestComp;
      this.callbacks.onNearComputerChange(this.nearComputer);
    }
  }

  private updateComputerSpawning(delta: number) {
    if (this.isMenuMode) return;
    this.breakSpawnCooldown -= delta;

    const brokenCount = this.getBrokenComputersCount();

    // Keep between 1 and 3 computers broken
    if (this.breakSpawnCooldown <= 0) {
      if (brokenCount < 3) {
        this.breakRandomComputer();
      }
      // Reset cooldown between 12 to 20 seconds
      this.breakSpawnCooldown = 12 + Math.random() * 8;
    }
  }

  private spawnHacker() {
    // Find computers to target (any computer not currently infected with malware)
    const targetableComputers: ComputerData[] = [];
    this.office.computerVisuals.forEach((vis) => {
      if (vis.data.status !== 'malware') {
        targetableComputers.push(vis.data);
      }
    });

    if (targetableComputers.length === 0) {
      this.hackerSpawnCooldown = 6;
      return;
    }

    // Pick target PC (prefer normal, but broken computers can be hacked too)
    const normalCandidates = targetableComputers.filter((c) => c.status === 'normal');
    this.hackerTargetPc =
      normalCandidates.length > 0
        ? normalCandidates[Math.floor(Math.random() * normalCandidates.length)]
        : targetableComputers[Math.floor(Math.random() * targetableComputers.length)];

    // Instantiate Hacker Model
    this.hacker = new HackerModel();
    // Spawn near entrance / backdoor
    this.hackerPos.set(0, 0, 11);
    this.hacker.group.position.copy(this.hackerPos);
    this.scene.add(this.hacker.group);

    soundManager.playHackerAlert();

    const currentMalware = this.getMalwareComputersCount();
    if (this.callbacks.onHackerAlert) {
      if (currentMalware >= 1) {
        this.callbacks.onHackerAlert('🚨 เตือนภัยระดับวิกฤต! Hacker บุกอีกแล้ว รีบวิ่งไปประชิดตัวแล้วฟาด [F] ก่อนเครื่องที่ 2 จะติดมัลแวร์!');
      } else {
        this.callbacks.onHackerAlert('⚠️ มี Hacker บุกเข้ามาในออฟฟิศ! วิ่งไปประชิดตัวแล้วฟาดไม้ [F] ใส่ตัวแฮกเกอร์!');
      }
    }
  }

  private removeLaserBeam() {
    if (this.hackLaserBeam) {
      this.scene.remove(this.hackLaserBeam);
      this.hackLaserBeam.geometry.dispose();
      (this.hackLaserBeam.material as THREE.Material).dispose();
      this.hackLaserBeam = null;
    }
  }

  private updateHacker(delta: number) {
    if (this.isMenuMode) {
      if (this.callbacks.onHackerStateChange) {
        this.callbacks.onHackerStateChange(null);
      }
      return;
    }

    const currentMalwareCount = this.getMalwareComputersCount();

    // LAN Malware worm propagation if 1 computer is left infected
    if (currentMalwareCount === 1) {
      this.malwarePropagationTimer += delta;
      if (this.malwarePropagationTimer >= 18 && this.malwarePropagationTimer < 26) {
        const remainingSec = Math.max(1, Math.ceil(26 - this.malwarePropagationTimer));
        if (Math.floor(this.malwarePropagationTimer * 2) % 2 === 0 && this.callbacks.onHackerAlert) {
          this.callbacks.onHackerAlert(`🚨 มัลแวร์ในระบบกำลังลุกลามผ่าน LAN สู่เครื่องที่ 2 ใน ${remainingSec} วินาที! รีบไปกด [E] ล้างด่วน!`);
        }
      } else if (this.malwarePropagationTimer >= 26) {
        // Infect a second computer via network spread
        const cleanComputers: ComputerData[] = [];
        this.office.computerVisuals.forEach((v) => {
          if (v.data.status !== 'malware') {
            cleanComputers.push(v.data);
          }
        });
        if (cleanComputers.length > 0) {
          const secondVictim = cleanComputers[Math.floor(Math.random() * cleanComputers.length)];
          this.office.setComputerStatus(secondVictim.id, 'malware');
          soundManager.playAlarm();
          this.notifyComputersChange();
        }
        this.malwarePropagationTimer = 0;
      }
    } else {
      this.malwarePropagationTimer = 0;
    }

    if (!this.hacker) {
      this.hackerSpawnCooldown -= delta;
      if (this.hackerSpawnCooldown <= 0) {
        this.spawnHacker();
      }
      if (this.callbacks.onHackerStateChange) {
        this.callbacks.onHackerStateChange(null);
      }
      return;
    }

    // Direct melee body strike contact check (No arbitrary circle ring!)
    const isNearPlayer = this.checkHackerDirectHit();
    this.hacker.setNearPlayer(isNearPlayer);

    if (this.hacker.state === 'sneaking') {
      if (!this.hackerTargetPc || this.hackerTargetPc.status === 'malware') {
        this.hacker.setHackerState('fleeing');
        return;
      }

      // Move toward target PC desk position
      const targetPos = new THREE.Vector3(
        this.hackerTargetPc.position[0],
        0,
        this.hackerTargetPc.position[2]
      );
      const toTarget = targetPos.clone().sub(this.hackerPos);
      const dist = toTarget.length();

      if (dist > 1.6) {
        // Walk smoothly towards PC with agile speed
        toTarget.normalize();
        const sneakSpeed = 3.0; // m/s
        this.hackerPos.add(toTarget.multiplyScalar(sneakSpeed * delta));
        this.hacker.group.position.copy(this.hackerPos);

        const targetAngle = Math.atan2(toTarget.x, toTarget.z);
        this.hacker.updateFacing(targetAngle, delta, 11);
      } else {
        // Arrived at PC: Start Hacking!
        this.hacker.setHackerState('hacking');
        this.hackerHackingTimer = 7.0; // 7 seconds hack window for high tension
        soundManager.playHackerAlert();

        if (this.callbacks.onHackerAlert) {
          this.callbacks.onHackerAlert(`🚨 แฮกเกอร์เริ่มแฮก [${this.hackerTargetPc.name}]! รีบวิ่งไปประชิดตัวแล้วฟาดไม้ [F] ด่วน!`);
        }

        // Create cyber laser beam from hacker to PC monitor
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 1.2, 0.3),
          targetPos.clone().sub(this.hackerPos).add(new THREE.Vector3(0, 1.2, 0)),
        ]);
        const lineMat = new THREE.LineBasicMaterial({
          color: 0xa855f7,
          linewidth: 2,
        });
        this.hackLaserBeam = new THREE.Line(lineGeo, lineMat);
        this.hacker.group.add(this.hackLaserBeam);
      }

    } else if (this.hacker.state === 'hacking') {
      this.hackerHackingTimer -= delta;
      const progress = Math.max(0, Math.min(100, (1 - this.hackerHackingTimer / 7.0) * 100));
      this.hacker.hackingProgress = progress;

      // Pulse cyber laser beam
      if (this.hackLaserBeam) {
        (this.hackLaserBeam.material as THREE.LineBasicMaterial).color.setHex(
          Math.sin(this.hackerHackingTimer * 18) > 0 ? 0xef4444 : 0xa855f7
        );
      }

      if (this.hackerHackingTimer <= 0) {
        // HACK SUCCEEDED: Computer becomes malware!
        if (this.hackerTargetPc) {
          this.office.setComputerStatus(this.hackerTargetPc.id, 'malware');
          this.notifyComputersChange();
          soundManager.playAlarm();

          if (this.callbacks.onHackerAlert) {
            this.callbacks.onHackerAlert(`⚠️ มัลแวร์แพร่กระจายสำเร็จที่ [${this.hackerTargetPc.name}]!`);
          }
        }

        this.removeLaserBeam();
        this.hackerTargetPc = null;
        this.hacker.setHackerState('fleeing');
      }

    } else if (this.hacker.state === 'stunned') {
      this.hackerStunTimer -= delta;
      if (this.hackerStunTimer <= 0) {
        this.hacker.setHackerState('fleeing');
      }

    } else if (this.hacker.state === 'fleeing') {
      // Flee towards entrance door at (0, 0, 12)
      const exitPos = new THREE.Vector3(0, 0, 12);
      const toExit = exitPos.clone().sub(this.hackerPos);
      const dist = toExit.length();

      if (dist > 1.2) {
        toExit.normalize();
        const fleeSpeed = 5.8; // m/s panic sprint
        this.hackerPos.add(toExit.multiplyScalar(fleeSpeed * delta));
        this.hacker.group.position.copy(this.hackerPos);

        const targetAngle = Math.atan2(toExit.x, toExit.z);
        this.hacker.updateFacing(targetAngle, delta, 14);
      } else {
        // Despawn hacker
        this.scene.remove(this.hacker.group);
        this.removeLaserBeam();
        this.hacker = null;

        // If there's already 1 malware computer active, the next hacker arrives faster (8-13s)
        const activeMalware = this.getMalwareComputersCount();
        this.hackerSpawnCooldown = activeMalware >= 1 ? 8 + Math.random() * 5 : 13 + Math.random() * 7;
        return;
      }
    }

    this.hacker.update(delta);

    // Notify state to HUD
    if (this.callbacks.onHackerStateChange) {
      this.callbacks.onHackerStateChange({
        position: [this.hackerPos.x, this.hackerPos.y, this.hackerPos.z],
        state: this.hacker.state,
        targetPcName: this.hackerTargetPc?.name,
        hackingProgress: this.hacker.hackingProgress,
        isNearPlayer,
      });
    }
  }

  public setShowCharacterModel(show: boolean) {
    this.showCharacterModel = show;
    if (this.character?.group) {
      this.character.group.visible = show && this.cameraViewMode !== 'fpp';
    }
  }

  public cycleCameraViewMode(): CameraViewMode {
    if (this.cameraViewMode === 'tpp') {
      this.cameraViewMode = 'overview';
    } else if (this.cameraViewMode === 'overview') {
      this.cameraViewMode = 'fpp';
    } else {
      this.cameraViewMode = 'tpp';
    }

    if (this.character?.group) {
      this.character.group.visible = this.cameraViewMode !== 'fpp' && this.showCharacterModel;
    }
    return this.cameraViewMode;
  }

  public setCameraViewMode(mode: CameraViewMode) {
    this.cameraViewMode = mode;
    if (this.character?.group) {
      this.character.group.visible = mode !== 'fpp' && this.showCharacterModel;
    }
  }

  private updateCamera(delta: number) {
    if (this.isMenuMode) {
      // Cinematic slow panoramic orbit around the office center
      this.menuOrbitAngle += delta * 0.12;
      const orbitDist = 12.0;
      const orbitHeight = 7.2 + Math.sin(this.menuOrbitAngle * 0.7) * 0.6;
      const targetCamX = Math.sin(this.menuOrbitAngle) * orbitDist;
      const targetCamZ = Math.cos(this.menuOrbitAngle) * orbitDist;

      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetCamX, 3.5, delta);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, orbitHeight, 3.5, delta);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, targetCamZ, 3.5, delta);

      const lookTarget = new THREE.Vector3(0, 1.2, 0);
      this.camera.lookAt(lookTarget);
      return;
    }

    if (this.cameraViewMode === 'tpp') {
      // True TPP (Third-Person Perspective): closely behind the character's back/shoulder
      const pitchOffset = THREE.MathUtils.clamp(this.cameraAnglePitch, -0.45, 0.55);
      const camDist = 3.6;
      const camHeight = 1.95 + pitchOffset * 1.8;

      const targetCamX = this.playerPos.x - Math.sin(this.cameraAngleYaw) * camDist;
      const targetCamZ = this.playerPos.z + Math.cos(this.cameraAngleYaw) * camDist;
      const targetCamY = this.playerPos.y + camHeight;

      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetCamX, 9, delta);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, targetCamY, 9, delta);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, targetCamZ, 9, delta);

      // Aim slightly past character towards action direction
      const forwardDist = 4.0;
      const lookTarget = new THREE.Vector3(
        this.playerPos.x + Math.sin(this.cameraAngleYaw) * forwardDist,
        this.playerPos.y + 1.45 + pitchOffset * 1.2,
        this.playerPos.z - Math.cos(this.cameraAngleYaw) * forwardDist
      );
      this.camera.lookAt(lookTarget);

    } else if (this.cameraViewMode === 'fpp') {
      // First Person Perspective (FPP): at character's eye line
      const pitchOffset = THREE.MathUtils.clamp(this.cameraAnglePitch, -0.7, 0.7);
      const eyeHeight = 1.55;

      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, this.playerPos.x, 14, delta);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, this.playerPos.y + eyeHeight, 14, delta);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, this.playerPos.z, 14, delta);

      const lookTarget = new THREE.Vector3(
        this.playerPos.x + Math.sin(this.cameraAngleYaw) * 6.0,
        this.playerPos.y + eyeHeight + pitchOffset * 3.5,
        this.playerPos.z - Math.cos(this.cameraAngleYaw) * 6.0
      );
      this.camera.lookAt(lookTarget);

    } else {
      // Overview Mode: tactical high angle
      const pitchOffset = THREE.MathUtils.clamp(this.cameraAnglePitch, -0.35, 0.65);
      const camDist = 7.5;
      const camHeight = 6.8 + pitchOffset * 3.2;

      const targetCamX = this.playerPos.x - Math.sin(this.cameraAngleYaw) * camDist;
      const targetCamZ = this.playerPos.z + Math.cos(this.cameraAngleYaw) * camDist;
      const targetCamY = this.playerPos.y + camHeight;

      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetCamX, 6, delta);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, targetCamY, 6, delta);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, targetCamZ, 6, delta);

      const lookTarget = new THREE.Vector3(
        this.playerPos.x,
        1.1 + pitchOffset * 0.4,
        this.playerPos.z
      );
      this.camera.lookAt(lookTarget);
    }
  }
}
