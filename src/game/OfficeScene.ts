import * as THREE from 'three';
import { ComputerData } from '../types';

export interface FloatingPopup3D {
  sprite: THREE.Sprite;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

export interface ComputerVisual {
  data: ComputerData;
  group: THREE.Group;
  screenMesh: THREE.Mesh;
  alertIconGroup: THREE.Group;
  smokeParticles: THREE.Points;
  floorHoloRing: THREE.Mesh;
  holoRingMat: THREE.MeshBasicMaterial;
  originalPos: THREE.Vector3;
}

// =========================================================================
// DIEGETIC CANVAS TEXTURES (Realistic In-World Screen Visuals)
// =========================================================================
function createNormalScreenTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 300;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 512, 300);
  grad.addColorStop(0, '#090d16');
  grad.addColorStop(0.5, '#0f172a');
  grad.addColorStop(1, '#0369a1');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 300);

  // Grid
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 512; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 300);
    ctx.stroke();
  }

  // Taskbar
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 262, 512, 38);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(14, 270, 20, 20);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(40, 270, 20, 20);
  ctx.fillStyle = '#10b981';
  ctx.fillRect(66, 270, 20, 20);

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('14:35 PM · ONLINE', 500, 285);

  // Corporate Center Card
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.beginPath();
  ctx.roundRect(100, 60, 312, 140, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🏢 CORP WORKSTATION', 256, 105);

  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 15px monospace';
  ctx.fillText('● SYSTEM STATUS: NORMAL', 256, 140);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px monospace';
  ctx.fillText('LAN GIGABIT: CONNECTED (SECURED)', 256, 168);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

function createBsodScreenTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 300;
  const ctx = canvas.getContext('2d')!;

  // BSOD Azure Blue
  ctx.fillStyle = '#0078d7';
  ctx.fillRect(0, 0, 512, 300);

  // Sad Face
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 54px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(':(', 36, 75);

  // Error Text
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('Your PC ran into a problem and needs to restart.', 36, 118);
  ctx.font = '13px sans-serif';
  ctx.fillText("We're just collecting some error info for IT support.", 36, 140);

  // Mock QR box
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(36, 165, 75, 75);
  ctx.fillStyle = '#0078d7';
  ctx.fillRect(42, 171, 63, 63);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(48, 177, 20, 20);
  ctx.fillRect(78, 177, 20, 20);
  ctx.fillRect(48, 207, 20, 20);

  // Diagnostic Stop code
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px sans-serif';
  ctx.fillText('Call IT Support Desk or press [E] to reconnect', 125, 185);
  ctx.font = 'bold 12px monospace';
  ctx.fillText('Stop code: HARDWARE_CABLE_DISCONNECT', 125, 210);
  ctx.fillText('Module: POWER_ETHERNET_FAULT', 125, 230);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

function createMalwareScreenTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 300;
  const ctx = canvas.getContext('2d')!;

  // Blood Crimson / Obsidian Dark
  ctx.fillStyle = '#150303';
  ctx.fillRect(0, 0, 512, 300);

  // Red Border
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 506, 294);

  // Header Banner
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(6, 6, 500, 42);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 17px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('☠️ RANSOMWARE ALERT: SYSTEM LOCKED ☠️', 256, 34);

  // Main warning
  ctx.fillStyle = '#f87171';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('ALL CORPORATE DATA HAS BEEN ENCRYPTED!', 256, 95);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '12px monospace';
  ctx.fillText('Trojan.Agent.CryptoLock has seized control.', 256, 125);
  ctx.fillText('0.5 BTC ransom demanded to release master key.', 256, 145);

  // Countdown box
  ctx.fillStyle = '#260808';
  ctx.fillRect(110, 168, 292, 54);
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2;
  ctx.strokeRect(110, 168, 292, 54);

  ctx.fillStyle = '#fca5a5';
  ctx.font = '10px monospace';
  ctx.fillText('TIME REMAINING UNTIL PERMANENT KEY DELETION', 256, 187);
  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 22px monospace';
  ctx.fillText('23:59:18', 256, 212);

  // IT hero command
  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('PRESS [E] TO OVERRIDE & ENTER FIREWALL PURGE', 256, 260);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

export class OfficeScene {
  public scene: THREE.Scene;
  public computerVisuals: Map<string, ComputerVisual> = new Map();
  public colliders: THREE.Box3[] = [];
  public officeBounds = { minX: -16, maxX: 16, minZ: -14, maxZ: 14 };

  // Screen Materials cache with high-fidelity canvas textures
  private matNormalScreen: THREE.MeshStandardMaterial;
  private matBrokenScreen: THREE.MeshStandardMaterial;
  private matMalwareScreen: THREE.MeshStandardMaterial;
  private serverLeds: THREE.MeshBasicMaterial[] = [];
  private alertTime: number = 0;

  // Server Room Large Diegetic Display Board
  private serverBoardMesh!: THREE.Mesh;
  private serverBoardCanvas!: HTMLCanvasElement;
  private serverBoardTexture!: THREE.CanvasTexture;

  // 3D Kinetic Floating Popups
  private floatingPopups: FloatingPopup3D[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.matNormalScreen = new THREE.MeshStandardMaterial({
      map: createNormalScreenTexture(),
      roughness: 0.15,
      metalness: 0.05,
    });

    this.matBrokenScreen = new THREE.MeshStandardMaterial({
      map: createBsodScreenTexture(),
      emissive: 0x0078d7,
      emissiveIntensity: 0.4,
      roughness: 0.2,
    });

    this.matMalwareScreen = new THREE.MeshStandardMaterial({
      map: createMalwareScreenTexture(),
      emissive: 0xef4444,
      emissiveIntensity: 0.8,
      roughness: 0.2,
    });

    this.buildLighting();
    this.buildFloorAndWalls();
    this.buildDesksAndComputers();
    this.buildStorageAndServerArea();
    this.buildOfficeProps();
  }

  private buildLighting() {
    // Soft ambient office light
    const ambient = new THREE.AmbientLight(0xf1f5f9, 0.65);
    this.scene.add(ambient);

    // Main directional sunlight through office windows
    const sun = new THREE.DirectionalLight(0xffffff, 0.85);
    sun.position.set(12, 18, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 45;
    sun.shadow.camera.left = -20;
    sun.shadow.camera.right = 20;
    sun.shadow.camera.top = 18;
    sun.shadow.camera.bottom = -18;
    sun.shadow.bias = -0.0005;
    this.scene.add(sun);

    // Fluorescent ceiling lights (soft point lights)
    const ceilingLights = [
      [-6, 5, -5],
      [6, 5, -5],
      [-6, 5, 5],
      [6, 5, 5],
      [-12, 5, 0], // Server room
    ];

    ceilingLights.forEach(([x, y, z]) => {
      const pl = new THREE.PointLight(0xe0f2fe, 0.45, 14);
      pl.position.set(x, y, z);
      this.scene.add(pl);

      // Light fixture mesh
      const fixture = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.08, 0.6),
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0xf8fafc,
          emissiveIntensity: 0.8,
        })
      );
      fixture.position.set(x, 4.9, z);
      this.scene.add(fixture);
    });
  }

  private buildFloorAndWalls() {
    // Floor - stylish office carpet tile texture
    const floorGeo = new THREE.PlaneGeometry(36, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Slate carpet
      roughness: 0.85,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Decorative carpet runner in main aisle
    const runnerGeo = new THREE.PlaneGeometry(3.6, 26);
    const runnerMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.9,
    });
    const runner = new THREE.Mesh(runnerGeo, runnerMat);
    runner.rotation.x = -Math.PI / 2;
    runner.position.set(0, 0.002, 0);
    runner.receiveShadow = true;
    this.scene.add(runner);

    // Server room tile floor (distinct tech rubber tiles)
    const serverFloorGeo = new THREE.PlaneGeometry(9, 26);
    const serverFloorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Dark technical flooring
      roughness: 0.4,
      metalness: 0.3,
    });
    const serverFloor = new THREE.Mesh(serverFloorGeo, serverFloorMat);
    serverFloor.rotation.x = -Math.PI / 2;
    serverFloor.position.set(-11.5, 0.003, 0);
    serverFloor.receiveShadow = true;
    this.scene.add(serverFloor);

    // Walls
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.9,
    });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x93c5fd,
      transmission: 0.8,
      opacity: 1,
      transparent: true,
      roughness: 0.1,
    });

    // North Wall
    const northWall = new THREE.Mesh(new THREE.BoxGeometry(36, 5, 0.4), wallMat);
    northWall.position.set(0, 2.5, -14);
    northWall.receiveShadow = true;
    this.scene.add(northWall);
    this.colliders.push(new THREE.Box3().setFromObject(northWall));

    // South Wall
    const southWall = new THREE.Mesh(new THREE.BoxGeometry(36, 5, 0.4), wallMat);
    southWall.position.set(0, 2.5, 14);
    southWall.receiveShadow = true;
    this.scene.add(southWall);
    this.colliders.push(new THREE.Box3().setFromObject(southWall));

    // East Wall (with large office windows)
    const eastWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5, 28), wallMat);
    eastWall.position.set(16, 2.5, 0);
    this.scene.add(eastWall);
    this.colliders.push(new THREE.Box3().setFromObject(eastWall));

    // Window glass panels on East wall
    for (let z = -9; z <= 9; z += 6) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.2, 4.2), glassMat);
      win.position.set(15.9, 2.5, z);
      this.scene.add(win);
    }

    // West Wall (Behind Server/IT storage)
    const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5, 28), wallMat);
    westWall.position.set(-16, 2.5, 0);
    this.scene.add(westWall);
    this.colliders.push(new THREE.Box3().setFromObject(westWall));

    // Partition Glass Wall separating Server Room & Main Office
    const partitionNorth = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4.8, 9), glassMat);
    partitionNorth.position.set(-7, 2.4, -7.5);
    this.scene.add(partitionNorth);
    this.colliders.push(new THREE.Box3().setFromObject(partitionNorth));

    const partitionSouth = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4.8, 9), glassMat);
    partitionSouth.position.set(-7, 2.4, 7.5);
    this.scene.add(partitionSouth);
    this.colliders.push(new THREE.Box3().setFromObject(partitionSouth));
    // Doorway opening in middle at z: -3 to +3
  }

  private buildDesksAndComputers() {
    // We create 8 computer workstations in 2 main cluster rows (Zone A and Zone B)
    // Plus 2 computers in IT Lab
    const deskConfigs = [
      // Zone A (Right side top row - ฝ่ายการตลาดและการขาย)
      { id: 'pc_1', name: 'โต๊ะ A-1 (การตลาด)', pos: [4.5, 0, -8], rot: 0, section: 'โซน A (ฝ่ายการตลาด)' },
      { id: 'pc_2', name: 'โต๊ะ A-2 (ฝ่ายขาย)', pos: [8.5, 0, -8], rot: 0, section: 'โซน A (ฝ่ายขาย)' },
      { id: 'pc_3', name: 'โต๊ะ A-3 (บริการลูกค้า)', pos: [4.5, 0, -3.5], rot: Math.PI, section: 'โซน A (บริการลูกค้า)' },
      { id: 'pc_4', name: 'โต๊ะ A-4 (ผู้จัดการฝ่าย)', pos: [8.5, 0, -3.5], rot: Math.PI, section: 'โซน A (ผู้จัดการฝ่าย)' },

      // Zone B (Right side bottom row - ฝ่ายพัฒนาและบัญชี)
      { id: 'pc_5', name: 'โต๊ะ B-1 (โปรแกรมเมอร์)', pos: [4.5, 0, 3.5], rot: 0, section: 'โซน B (วิศวกรรมซอฟต์แวร์)' },
      { id: 'pc_6', name: 'โต๊ะ B-2 (กราฟิกดีไซน์)', pos: [8.5, 0, 3.5], rot: 0, section: 'โซน B (กราฟิกดีไซน์)' },
      { id: 'pc_7', name: 'โต๊ะ B-3 (ฝ่ายบัญชี)', pos: [4.5, 0, 8], rot: Math.PI, section: 'โซน B (ฝ่ายบัญชี)' },
      { id: 'pc_8', name: 'โต๊ะ B-4 (ฝ่ายบุคคล HR)', pos: [8.5, 0, 8], rot: Math.PI, section: 'โซน B (ฝ่ายบุคคล HR)' },

      // Zone C (IT Workshop / Helpdesk Desk inside Server area)
      { id: 'pc_9', name: 'โต๊ะ C-1 (มอนิเตอร์เซิร์ฟเวอร์)', pos: [-10.5, 0, -4], rot: Math.PI / 2, section: 'ห้องไอที & เซิร์ฟเวอร์' },
      { id: 'pc_10', name: 'โต๊ะ C-2 (เครื่องทดสอบระบบ)', pos: [-10.5, 0, 4], rot: Math.PI / 2, section: 'ห้องไอที & เซิร์ฟเวอร์' },
    ];

    const deskWoodMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6, // Crisp corporate desk surface with white edge
      roughness: 0.3,
    });
    const deskTopMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.4,
    });
    const metalLegMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.8,
      roughness: 0.3,
    });
    const pcCaseMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.6,
      roughness: 0.4,
    });
    const keyboardMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.7,
    });

    deskConfigs.forEach((cfg, idx) => {
      const deskGroup = new THREE.Group();
      deskGroup.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
      deskGroup.rotation.y = cfg.rot;

      // Desk tabletop
      const tableTop = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 1.3), deskTopMat);
      tableTop.position.y = 0.85;
      tableTop.castShadow = true;
      tableTop.receiveShadow = true;
      deskGroup.add(tableTop);

      // Desk partition / privacy screen
      const partition = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 0.05), deskWoodMat);
      partition.position.set(0, 1.1, -0.62);
      partition.castShadow = true;
      deskGroup.add(partition);

      // Desk metal legs
      const legPositions = [
        [-1.1, 0.42, -0.55],
        [1.1, 0.42, -0.55],
        [-1.1, 0.42, 0.55],
        [1.1, 0.42, 0.55],
      ];
      legPositions.forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.84, 0.06), metalLegMat);
        leg.position.set(lx, ly, lz);
        leg.castShadow = true;
        deskGroup.add(leg);
      });

      // Computer Monitor
      const monitorGroup = new THREE.Group();
      monitorGroup.position.set(0, 0.89, -0.25);

      // Monitor Stand
      const standBase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.02, 12), pcCaseMat);
      standBase.position.y = 0.01;
      monitorGroup.add(standBase);

      const standPole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.22, 8), pcCaseMat);
      standPole.position.set(0, 0.12, -0.04);
      monitorGroup.add(standPole);

      // Monitor Bezel & Body
      const screenBezel = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.52, 0.04), pcCaseMat);
      screenBezel.position.set(0, 0.35, 0);
      screenBezel.castShadow = true;
      monitorGroup.add(screenBezel);

      // Screen Display Face
      const screenMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.8, 0.47),
        this.matNormalScreen.clone()
      );
      screenMesh.position.set(0, 0.35, 0.022);
      monitorGroup.add(screenMesh);

      deskGroup.add(monitorGroup);

      // Keyboard & Mouse
      const keyboard = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.015, 0.16), keyboardMat);
      keyboard.position.set(0, 0.895, 0.18);
      deskGroup.add(keyboard);

      const mouse = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.025, 0.11), pcCaseMat);
      mouse.position.set(0.35, 0.895, 0.18);
      deskGroup.add(mouse);

      // PC Tower Tower Unit under desk
      const pcTower = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.52, 0.5), pcCaseMat);
      pcTower.position.set(0.88, 0.3, 0.15);
      pcTower.castShadow = true;
      deskGroup.add(pcTower);

      // Office Swivel Chair
      const chairGroup = new THREE.Group();
      chairGroup.position.set(0, 0, 0.7);

      const chairSeat = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.08, 0.52),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 })
      );
      chairSeat.position.y = 0.52;
      chairSeat.castShadow = true;
      chairGroup.add(chairSeat);

      const chairBack = new THREE.Mesh(
        new THREE.BoxGeometry(0.52, 0.58, 0.06),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 })
      );
      chairBack.position.set(0, 0.82, 0.24);
      chairBack.castShadow = true;
      chairGroup.add(chairBack);

      const chairPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 8), metalLegMat);
      chairPole.position.y = 0.25;
      chairGroup.add(chairPole);

      deskGroup.add(chairGroup);

      // Spatial UI: Floor Holographic Projection Ring
      const ringGeo = new THREE.RingGeometry(0.85, 1.35, 32);
      const holoRingMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
      });
      const floorHoloRing = new THREE.Mesh(ringGeo, holoRingMat);
      floorHoloRing.rotation.x = -Math.PI / 2;
      floorHoloRing.position.set(0, 0.015, 0);
      deskGroup.add(floorHoloRing);

      // 3D Floating Alert Indicator above broken computer
      const alertIconGroup = new THREE.Group();
      alertIconGroup.position.set(0, 1.85, -0.2);
      alertIconGroup.visible = false;

      // Holographic glowing warning billboard
      const warningBg = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 0.45, 0.04),
        new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.85 })
      );
      alertIconGroup.add(warningBg);

      // Exclamation Mark inside warning
      const excBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.22, 0.06),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      excBar.position.y = 0.05;
      alertIconGroup.add(excBar);

      const excDot = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.08, 0.06),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      excDot.position.y = -0.12;
      alertIconGroup.add(excDot);

      deskGroup.add(alertIconGroup);

      // Smoke / Spark particle system for broken computer
      const sparkCount = 18;
      const sparkGeo = new THREE.BufferGeometry();
      const sparkPos = new Float32Array(sparkCount * 3);
      for (let p = 0; p < sparkCount * 3; p += 3) {
        sparkPos[p] = (Math.random() - 0.5) * 0.4;
        sparkPos[p + 1] = Math.random() * 0.5;
        sparkPos[p + 2] = (Math.random() - 0.5) * 0.4;
      }
      sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
      const sparkMat = new THREE.PointsMaterial({
        color: 0xf59e0b,
        size: 0.06,
        transparent: true,
        opacity: 0.9,
      });
      const smokeParticles = new THREE.Points(sparkGeo, sparkMat);
      smokeParticles.position.set(0, 1.1, -0.2);
      smokeParticles.visible = false;
      deskGroup.add(smokeParticles);

      this.scene.add(deskGroup);

      // Add collider for the physical desk
      const deskBox = new THREE.Box3();
      deskBox.setFromCenterAndSize(
        new THREE.Vector3(cfg.pos[0], 0.7, cfg.pos[2]),
        new THREE.Vector3(2.6, 1.4, 1.6)
      );
      this.colliders.push(deskBox);

      // Save Visual Reference
      const compData: ComputerData = {
        id: cfg.id,
        name: cfg.name,
        deskIndex: idx,
        position: [cfg.pos[0], cfg.pos[1], cfg.pos[2]],
        rotation: cfg.rot,
        status: 'normal',
        repairDifficulty: 1 + (idx % 3),
        sectionName: cfg.section,
      };

      this.computerVisuals.set(cfg.id, {
        data: compData,
        group: deskGroup,
        screenMesh,
        alertIconGroup,
        smokeParticles,
        floorHoloRing,
        holoRingMat,
        originalPos: new THREE.Vector3(cfg.pos[0], cfg.pos[1], cfg.pos[2]),
      });
    });
  }

  private buildStorageAndServerArea() {
    // IT Server Racks along the west side of Server room
    const serverMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      metalness: 0.8,
      roughness: 0.3,
    });
    const shelfMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.6,
      roughness: 0.4,
    });

    const rackZPositions = [-10, -7, 7, 10];
    rackZPositions.forEach((rz) => {
      const rack = new THREE.Group();
      rack.position.set(-13.5, 0, rz);

      const rackCabinet = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.2, 1.6), serverMat);
      rackCabinet.position.y = 1.6;
      rackCabinet.castShadow = true;
      rack.add(rackCabinet);

      // Glowing LED lights on servers
      for (let level = 0.5; level < 3.0; level += 0.35) {
        const ledMat = new THREE.MeshBasicMaterial({
          color: Math.random() > 0.3 ? 0x22c55e : 0x38bdf8,
        });
        this.serverLeds.push(ledMat);

        const ledBar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.03, 0.02), ledMat);
        ledBar.position.set(0.61, level, 0);
        ledBar.rotation.y = Math.PI / 2;
        rack.add(ledBar);
      }

      this.scene.add(rack);

      const rackBox = new THREE.Box3();
      rackBox.setFromCenterAndSize(new THREE.Vector3(-13.5, 1.6, rz), new THREE.Vector3(1.4, 3.2, 1.8));
      this.colliders.push(rackBox);
    });

    // IT Storage Shelves for spare parts, routers, cables
    const shelfGroup = new THREE.Group();
    shelfGroup.position.set(-13.5, 0, 0);

    const shelfFrame = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.4, 3.2), shelfMat);
    shelfFrame.position.y = 1.2;
    shelfFrame.castShadow = true;
    shelfGroup.add(shelfFrame);

    // Spare boxes & toolboxes on shelf
    const boxMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 });
    for (let b = -1.0; b <= 1.0; b += 0.7) {
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.5), boxMat);
      box.position.set(0, 1.5, b);
      box.castShadow = true;
      shelfGroup.add(box);
    }

    this.scene.add(shelfGroup);
    const shelfCollider = new THREE.Box3();
    shelfCollider.setFromCenterAndSize(new THREE.Vector3(-13.5, 1.2, 0), new THREE.Vector3(1.2, 2.4, 3.4));
    this.colliders.push(shelfCollider);

    // (Large NOC Board removed per user request to provide clear unobstructed office view)
  }

  private buildOfficeProps() {
    // Water Cooler Station in Central Hallway
    const waterCooler = new THREE.Group();
    waterCooler.position.set(0, 0, -11);

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 1.1, 16),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 })
    );
    body.position.y = 0.55;
    body.castShadow = true;
    waterCooler.add(body);

    const bottle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.22, 0.5, 16),
      new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, transmission: 0.85, transparent: true })
    );
    bottle.position.y = 1.35;
    waterCooler.add(bottle);

    this.scene.add(waterCooler);
    this.colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(0, 0.8, -11), new THREE.Vector3(0.7, 1.8, 0.7)));

    // Coffee Machine & Snack Corner in South Hallway
    const coffeeTable = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.9, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x64748b })
    );
    coffeeTable.position.set(0, 0.45, 11);
    coffeeTable.castShadow = true;
    this.scene.add(coffeeTable);

    const coffeeMachine = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.45, 0.4),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3 })
    );
    coffeeMachine.position.set(0, 1.12, 11);
    this.scene.add(coffeeMachine);
    this.colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(0, 0.7, 11), new THREE.Vector3(1.8, 1.4, 1.0)));

    // Potted Office Plants (Adds natural life to the modern office)
    const plantLocations = [
      [14, 0, -12],
      [14, 0, 12],
      [-5, 0, -12],
      [-5, 0, 12],
      [14, 0, 0],
    ];

    const potMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.6 });

    plantLocations.forEach(([px, py, pz]) => {
      const plantGroup = new THREE.Group();
      plantGroup.position.set(px, py, pz);

      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.65, 12), potMat);
      pot.position.y = 0.32;
      pot.castShadow = true;
      plantGroup.add(pot);

      // Leaves
      for (let l = 0; l < 7; l++) {
        const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.7, 5), leafMat);
        const ang = (l / 7) * Math.PI * 2;
        leaf.position.set(Math.cos(ang) * 0.15, 0.7 + (l % 3) * 0.15, Math.sin(ang) * 0.15);
        leaf.rotation.set(Math.cos(ang) * 0.3, ang, Math.sin(ang) * 0.3);
        plantGroup.add(leaf);
      }

      this.scene.add(plantGroup);
      this.colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(px, 0.6, pz), new THREE.Vector3(0.8, 1.4, 0.8)));
    });
  }

  public renderServerBoardCanvas(integrity: number = 100, brokenCount: number = 0, malwareCount: number = 0) {
    if (!this.serverBoardCanvas) return;
    const ctx = this.serverBoardCanvas.getContext('2d')!;

    // Background
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, 1024, 512);

    // Tech frame
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 1012, 500);

    // Header
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(12, 12, 1000, 70);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('🏢 HQ IT NETWORK OPERATIONS CENTER (NOC)', 35, 55);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('SYSVER: v4.8.2 · LEVEL 14 HUB', 985, 55);

    // Network Integrity Section
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`CORPORATE INTRANET INTEGRITY: ${integrity}%`, 40, 130);

    // Progress Bar
    const barW = 944;
    const barH = 34;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(40, 145, barW, barH);

    const fillW = Math.max(0, Math.min(barW, (barW * integrity) / 100));
    const barColor = integrity > 75 ? '#22c55e' : integrity > 40 ? '#f59e0b' : '#ef4444';
    ctx.fillStyle = barColor;
    ctx.fillRect(40, 145, fillW, barH);

    // Workstation Nodes Telemetry
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('ACTIVE WORKSTATIONS TELEMETRY (10 NODES):', 40, 230);

    const nodes = [
      { name: 'NODE A-1 [MKTG]', status: 'ONLINE' },
      { name: 'NODE A-2 [SALES]', status: 'ONLINE' },
      { name: 'NODE A-3 [CS]', status: 'ONLINE' },
      { name: 'NODE A-4 [MGR]', status: 'ONLINE' },
      { name: 'NODE B-1 [DEV]', status: 'ONLINE' },
      { name: 'NODE B-2 [DESIGN]', status: 'ONLINE' },
      { name: 'NODE B-3 [ACCT]', status: 'ONLINE' },
      { name: 'NODE B-4 [HR]', status: 'ONLINE' },
      { name: 'HUB C-1 [SERVER]', status: 'OPTIMAL' },
      { name: 'HUB C-2 [TESTBED]', status: 'OPTIMAL' },
    ];

    nodes.forEach((n, idx) => {
      const col = idx % 5;
      const row = Math.floor(idx / 5);
      const nx = 40 + col * 190;
      const ny = 260 + row * 65;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(nx, ny, 180, 50);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.strokeRect(nx, ny, 180, 50);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '12px monospace';
      ctx.fillText(n.name, nx + 10, ny + 22);

      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(`● ${n.status}`, nx + 10, ny + 42);
    });

    // Alert Bar
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(40, 410, 944, 75);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.strokeRect(40, 410, 944, 75);

    ctx.fillStyle = malwareCount > 0 ? '#ef4444' : brokenCount > 0 ? '#f59e0b' : '#38bdf8';
    ctx.font = 'bold 18px monospace';
    if (malwareCount > 0) {
      ctx.fillText(`⚠️ CRITICAL THREAT: ${malwareCount} RANSOMWARE BREACH DETECTED! DISPATCH IT HERO!`, 60, 452);
    } else if (brokenCount > 0) {
      ctx.fillText(`⚠️ ACTIVE INCIDENT: ${brokenCount} HARDWARE CONNECTION DROPS REPORTED`, 60, 452);
    } else {
      ctx.fillText('🛡️ SECURITY POSTURE: NORMAL · ALL FIREWALL GATES IN SYNC', 60, 452);
    }

    if (this.serverBoardTexture) {
      this.serverBoardTexture.needsUpdate = true;
    }
  }

  public updateServerBoard(integrity: number, brokenCount: number, malwareCount: number) {
    this.renderServerBoardCanvas(integrity, brokenCount, malwareCount);
  }

  // =========================================================================
  // SPATIAL UI: 3D Kinetic Floating Text Feedback
  // =========================================================================
  public spawnFloatingPopup(text: string, pos: THREE.Vector3, color: string = '#38bdf8') {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 96;
    const ctx = canvas.getContext('2d')!;

    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Glow outline
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 6;
    ctx.strokeText(text, 192, 48);

    ctx.fillStyle = color;
    ctx.fillText(text, 192, 48);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 1,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.copy(pos);
    sprite.position.y += 1.4;
    sprite.scale.set(2.4, 0.6, 1);

    this.scene.add(sprite);

    this.floatingPopups.push({
      sprite,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.2,
        0.9,
        (Math.random() - 0.5) * 0.2
      ),
      life: 0,
      maxLife: 1.3,
    });
  }

  public setComputerStatus(id: string, status: 'normal' | 'broken' | 'repairing' | 'malware') {
    const visual = this.computerVisuals.get(id);
    if (!visual) return;

    visual.data.status = status;

    if (status === 'broken' || status === 'repairing') {
      visual.screenMesh.material = this.matBrokenScreen;
      visual.alertIconGroup.visible = true;
      visual.smokeParticles.visible = true;
      visual.holoRingMat.color.setHex(0xf59e0b);
      visual.holoRingMat.opacity = 0.85;
    } else if (status === 'malware') {
      visual.screenMesh.material = this.matMalwareScreen;
      visual.alertIconGroup.visible = true;
      visual.smokeParticles.visible = true;
      visual.holoRingMat.color.setHex(0xa855f7);
      visual.holoRingMat.opacity = 0.95;
    } else {
      visual.data.malwareSavedProgress = undefined;
      visual.screenMesh.material = this.matNormalScreen;
      visual.alertIconGroup.visible = false;
      visual.smokeParticles.visible = false;
      visual.holoRingMat.color.setHex(0x38bdf8);
      visual.holoRingMat.opacity = 0.2;
      visual.group.position.copy(visual.originalPos);
    }
  }

  public update(delta: number) {
    this.alertTime += delta;

    // Animate server LEDs blinking
    this.serverLeds.forEach((led, i) => {
      const blink = Math.sin(this.alertTime * 6 + i * 1.5) > 0.1;
      led.color.setHex(blink ? 0x22c55e : 0x0f172a);
    });

    // Animate 3D floating kinetic popups
    for (let i = this.floatingPopups.length - 1; i >= 0; i--) {
      const popup = this.floatingPopups[i];
      popup.life += delta;
      popup.sprite.position.addScaledVector(popup.velocity, delta);

      const progress = popup.life / popup.maxLife;
      popup.sprite.material.opacity = Math.max(0, 1 - progress);

      if (popup.life >= popup.maxLife) {
        this.scene.remove(popup.sprite);
        popup.sprite.material.dispose();
        this.floatingPopups.splice(i, 1);
      }
    }

    // Animate broken and malware computers (screen flicker, shake, rotating holographic alert)
    this.computerVisuals.forEach((vis) => {
      if (vis.data.status === 'broken' || vis.data.status === 'repairing' || vis.data.status === 'malware') {
        // Floating rotating alert icon
        vis.alertIconGroup.rotation.y += delta * 2.5;
        vis.alertIconGroup.position.y = 1.85 + Math.sin(this.alertTime * 4) * 0.12;

        // Animate floor holo ring pulse
        vis.floorHoloRing.rotation.z += delta * 1.2;
        const pulse = 0.65 + Math.sin(this.alertTime * 6) * 0.3;
        vis.holoRingMat.opacity = pulse;

        // Glitch flicker for malware vs hardware
        if (vis.data.status === 'malware') {
          // Cyber glitch twitch
          if (Math.random() < 0.1) {
            vis.group.position.x = vis.originalPos.x + (Math.random() - 0.5) * 0.05;
          } else {
            vis.group.position.x = vis.originalPos.x;
          }
        } else {
          // Subtle jitter/shake on broken PC
          vis.group.position.x = vis.originalPos.x + (Math.random() - 0.5) * 0.02;
          vis.group.position.z = vis.originalPos.z + (Math.random() - 0.5) * 0.02;
        }

        // Animate spark particles
        const posAttr = vis.smokeParticles.geometry.attributes.position as THREE.BufferAttribute;
        const array = posAttr.array as Float32Array;
        for (let i = 1; i < array.length; i += 3) {
          array[i] += delta * 0.4;
          if (array[i] > 0.8) {
            array[i] = 0;
            array[i - 1] = (Math.random() - 0.5) * 0.3;
            array[i + 1] = (Math.random() - 0.5) * 0.3;
          }
        }
        posAttr.needsUpdate = true;
      }
    });
  }
}
