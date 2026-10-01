import * as THREE from 'three';
import { HackerState } from '../types';

export class HackerModel {
  public group: THREE.Group;

  // Body parts
  private pelvis: THREE.Group;
  private torso: THREE.Group;
  private headGroup: THREE.Group;
  private hoodieGroup: THREE.Group;
  private visorMesh: THREE.Mesh;
  private laptopGroup: THREE.Group;
  private laptopScreenMat: THREE.MeshBasicMaterial;

  private leftArm: THREE.Group;
  private leftForearm: THREE.Group;
  private rightArm: THREE.Group;
  private rightForearm: THREE.Group;

  private leftLeg: THREE.Group;
  private leftCalf: THREE.Group;
  private rightLeg: THREE.Group;
  private rightCalf: THREE.Group;

  // Stun stars & status billboard
  private starsGroup: THREE.Group;
  private statusBillboard: THREE.Group;
  private progressBarMesh: THREE.Mesh;
  private targetReticle: THREE.Group;
  public isNearPlayer: boolean = false;

  // Materials for direct hit flash
  private hoodieMat: THREE.MeshStandardMaterial;
  private visorMat: THREE.MeshBasicMaterial;
  private hitFlashTimer: number = 0;

  // Animation state
  public state: HackerState = 'sneaking';
  private animTime: number = 0;
  public currentYaw: number = 0;
  public targetYaw: number = 0;
  public hackingProgress: number = 0; // 0 to 100

  constructor() {
    this.group = new THREE.Group();

    // Materials
    this.hoodieMat = new THREE.MeshStandardMaterial({
      color: 0x18181b, // Dark charcoal hoodie
      roughness: 0.8,
    });
    const insideHoodMat = new THREE.MeshBasicMaterial({
      color: 0x09090b,
    });
    this.visorMat = new THREE.MeshBasicMaterial({
      color: 0x22c55e, // Matrix Neon Green glowing visor
    });
    const pantsMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.7,
    });
    const bootsMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      roughness: 0.5,
    });
    const laptopMat = new THREE.MeshStandardMaterial({
      color: 0x3f3f46,
      metalness: 0.7,
      roughness: 0.3,
    });

    this.laptopScreenMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7, // Cyber Purple terminal screen
    });

    // Ground Contact Shadow Decal
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sctx = shadowCanvas.getContext('2d')!;
    const grad = sctx.createRadialGradient(64, 64, 10, 64, 64, 60);
    grad.addColorStop(0, 'rgba(0,0,0,0.68)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0.3)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 128, 128);
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);

    const shadowMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 1.2),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
    );
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.005;
    this.group.add(shadowMesh);

    // 1. Pelvis
    this.pelvis = new THREE.Group();
    this.pelvis.position.y = 0.9;
    this.group.add(this.pelvis);

    // 2. Torso with Hoodie
    this.torso = new THREE.Group();
    this.torso.position.y = 0.1;
    this.pelvis.add(this.torso);

    const torsoMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.46, 0.24),
      this.hoodieMat
    );
    torsoMesh.position.y = 0.23;
    torsoMesh.castShadow = true;
    this.torso.add(torsoMesh);

    // Hoodie pocket pouch
    const pocket = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.16, 0.06),
      this.hoodieMat
    );
    pocket.position.set(0, 0.14, 0.13);
    this.torso.add(pocket);

    // 3. Head & Hood
    this.headGroup = new THREE.Group();
    this.headGroup.position.y = 0.48;
    this.torso.add(this.headGroup);

    // Hood shell
    this.hoodieGroup = new THREE.Group();
    const hoodMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 16, 16),
      this.hoodieMat
    );
    hoodMesh.position.set(0, 0.08, -0.02);
    hoodMesh.scale.set(1.05, 1.2, 1.15);
    hoodMesh.castShadow = true;
    this.hoodieGroup.add(hoodMesh);

    // Deep shadowy face cavity
    const faceShadow = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 12, 12),
      insideHoodMat
    );
    faceShadow.position.set(0, 0.06, 0.05);
    this.hoodieGroup.add(faceShadow);

    // Glowing Cyber Mask / Visor
    this.visorMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.05, 0.02),
      this.visorMat
    );
    this.visorMesh.position.set(0, 0.07, 0.16);
    this.hoodieGroup.add(this.visorMesh);

    this.headGroup.add(this.hoodieGroup);

    // 4. Arms & Cyber Laptop Deck
    // Left arm
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.24, 0.4, 0);
    this.torso.add(this.leftArm);

    const leftArmMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.05, 0.24, 8),
      this.hoodieMat
    );
    leftArmMesh.position.y = -0.12;
    leftArmMesh.castShadow = true;
    this.leftArm.add(leftArmMesh);

    this.leftForearm = new THREE.Group();
    this.leftForearm.position.y = -0.24;
    this.leftArm.add(this.leftForearm);

    const leftForeMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.048, 0.042, 0.22, 8),
      this.hoodieMat
    );
    leftForeMesh.position.y = -0.11;
    this.leftForearm.add(leftForeMesh);

    // Right arm
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.24, 0.4, 0);
    this.torso.add(this.rightArm);

    const rightArmMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.05, 0.24, 8),
      this.hoodieMat
    );
    rightArmMesh.position.y = -0.12;
    rightArmMesh.castShadow = true;
    this.rightArm.add(rightArmMesh);

    this.rightForearm = new THREE.Group();
    this.rightForearm.position.y = -0.24;
    this.rightArm.add(this.rightForearm);

    const rightForeMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.048, 0.042, 0.22, 8),
      this.hoodieMat
    );
    rightForeMesh.position.y = -0.11;
    this.rightForearm.add(rightForeMesh);

    // Cyber Laptop held in hands
    this.laptopGroup = new THREE.Group();
    this.laptopGroup.position.set(0, 0.26, 0.32);
    this.laptopGroup.rotation.x = 0.2;

    const laptopBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.02, 0.22),
      laptopMat
    );
    this.laptopGroup.add(laptopBase);

    const laptopScreen = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.2, 0.015),
      laptopMat
    );
    laptopScreen.position.set(0, 0.1, -0.1);
    laptopScreen.rotation.x = -0.3;
    this.laptopGroup.add(laptopScreen);

    const laptopDisplay = new THREE.Mesh(
      new THREE.PlaneGeometry(0.27, 0.17),
      this.laptopScreenMat
    );
    laptopDisplay.position.set(0, 0.1, -0.09);
    laptopDisplay.rotation.x = -0.3;
    this.laptopGroup.add(laptopDisplay);

    this.torso.add(this.laptopGroup);

    // 5. Legs
    // Left Leg
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.11, -0.05, 0);
    this.pelvis.add(this.leftLeg);

    const leftThighMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.065, 0.42, 8),
      pantsMat
    );
    leftThighMesh.position.y = -0.21;
    this.leftLeg.add(leftThighMesh);

    this.leftCalf = new THREE.Group();
    this.leftCalf.position.y = -0.42;
    this.leftLeg.add(this.leftCalf);

    const leftCalfMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.055, 0.4, 8),
      pantsMat
    );
    leftCalfMesh.position.y = -0.2;
    this.leftCalf.add(leftCalfMesh);

    const leftBoot = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.08, 0.18),
      bootsMat
    );
    leftBoot.position.set(0, -0.42, 0.03);
    this.leftCalf.add(leftBoot);

    // Right Leg
    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.11, -0.05, 0);
    this.pelvis.add(this.rightLeg);

    const rightThighMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.065, 0.42, 8),
      pantsMat
    );
    rightThighMesh.position.y = -0.21;
    this.rightLeg.add(rightThighMesh);

    this.rightCalf = new THREE.Group();
    this.rightCalf.position.y = -0.42;
    this.rightLeg.add(this.rightCalf);

    const rightCalfMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.055, 0.4, 8),
      pantsMat
    );
    rightCalfMesh.position.y = -0.2;
    this.rightCalf.add(rightCalfMesh);

    const rightBoot = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.08, 0.18),
      bootsMat
    );
    rightBoot.position.set(0, -0.42, 0.03);
    this.rightCalf.add(rightBoot);

    // 6. Stun Dizzy Stars (for when whacked!)
    this.starsGroup = new THREE.Group();
    this.starsGroup.position.set(0, 1.85, 0);
    this.starsGroup.visible = false;

    const starMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    for (let s = 0; s < 4; s++) {
      const star = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.06, 0),
        starMat
      );
      const ang = (s / 4) * Math.PI * 2;
      star.position.set(Math.cos(ang) * 0.28, Math.sin(ang * 2) * 0.05, Math.sin(ang) * 0.28);
      this.starsGroup.add(star);
    }
    this.group.add(this.starsGroup);

    // 7. Above-Head Floating Billboard Indicator (Status & Hack Progress)
    this.statusBillboard = new THREE.Group();
    this.statusBillboard.position.set(0, 2.05, 0);

    const billboardBg = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.24, 0.02),
      new THREE.MeshBasicMaterial({ color: 0x09090b, transparent: true, opacity: 0.9 })
    );
    this.statusBillboard.add(billboardBg);

    // Hacker Skull Tag
    const skullTag = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.12, 0.03),
      new THREE.MeshBasicMaterial({ color: 0xa855f7 })
    );
    skullTag.position.set(-0.28, 0, 0.02);
    this.statusBillboard.add(skullTag);

    // Hacking Progress Track
    const progTrack = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.06, 0.022),
      new THREE.MeshBasicMaterial({ color: 0x27272a })
    );
    progTrack.position.set(0.08, 0, 0.02);
    this.statusBillboard.add(progTrack);

    this.progressBarMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.045, 0.025),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    this.progressBarMesh.position.set(0.08, 0, 0.022);
    this.progressBarMesh.scale.set(0.01, 1, 1);
    this.statusBillboard.add(this.progressBarMesh);

    this.group.add(this.statusBillboard);

    // 8. Direct Body Strike Reticle (Only visible when player is in direct melee contact range)
    // NO floor circle ring! Instead, precision corner brackets around the hacker's chest
    this.targetReticle = new THREE.Group();
    this.targetReticle.position.set(0, 1.15, 0);
    this.targetReticle.visible = false;

    const bracketMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.9,
    });
    // 4 angular corner markers framing the hacker's body
    const corners = [
      { x: -0.28, y: 0.28 },
      { x: 0.28, y: 0.28 },
      { x: -0.28, y: -0.28 },
      { x: 0.28, y: -0.28 },
    ];
    corners.forEach((c) => {
      // Horizontal tick
      const hTick = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.02, 0.02), bracketMat);
      hTick.position.set(c.x + (c.x > 0 ? -0.045 : 0.045), c.y, 0.16);
      this.targetReticle.add(hTick);

      // Vertical tick
      const vTick = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.09, 0.02), bracketMat);
      vTick.position.set(c.x, c.y + (c.y > 0 ? -0.045 : 0.045), 0.16);
      this.targetReticle.add(vTick);
    });

    this.group.add(this.targetReticle);
  }

  public setHackerState(state: HackerState) {
    this.state = state;
    this.animTime = 0;
    if (state === 'stunned') {
      this.starsGroup.visible = true;
    } else {
      this.starsGroup.visible = false;
    }
  }

  public setNearPlayer(near: boolean) {
    this.isNearPlayer = near;
  }

  public triggerDirectHit() {
    this.hitFlashTimer = 0.22;
    this.hoodieMat.color.setHex(0xffffff); // Direct impact white flash
    this.visorMat.color.setHex(0xef4444);
  }

  public updateFacing(targetYaw: number, delta: number, speed: number = 12) {
    this.targetYaw = targetYaw;
    let diff = this.targetYaw - this.currentYaw;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.currentYaw += diff * Math.min(delta * speed, 1);
    this.group.rotation.y = this.currentYaw;
  }

  public update(delta: number) {
    this.animTime += delta;
    const t = this.animTime;

    // Handle Direct Impact White Flash
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= delta;
      if (this.hitFlashTimer <= 0) {
        this.hoodieMat.color.setHex(0x18181b); // Restore dark charcoal hoodie
        this.visorMat.color.setHex(this.state === 'hacking' ? 0xef4444 : 0x22c55e);
      }
    }

    // Direct Body Strike Reticle animation (Only when in melee strike contact range)
    if (this.isNearPlayer && this.state !== 'stunned') {
      this.targetReticle.visible = true;
      const pulse = 1.0 + Math.sin(t * 12) * 0.08;
      this.targetReticle.scale.set(pulse, pulse, 1);
    } else {
      this.targetReticle.visible = false;
    }

    // Update Hacking Progress Bar in overhead billboard
    const normProg = Math.max(0.01, Math.min(1.0, this.hackingProgress / 100));
    this.progressBarMesh.scale.x = normProg;
    this.progressBarMesh.position.x = 0.08 - 0.21 * (1 - normProg);
    (this.progressBarMesh.material as THREE.MeshBasicMaterial).color.setHex(
      this.hackingProgress > 75 ? 0xef4444 : 0xa855f7
    );

    // Pulse visor color & laptop screen
    if (this.hitFlashTimer <= 0) {
      if (this.state === 'hacking') {
        const flash = Math.sin(t * 14) > 0;
        this.visorMat.color.setHex(flash ? 0xef4444 : 0xa855f7);
        this.laptopScreenMat.color.setHex(flash ? 0xef4444 : 0x22c55e);
      } else {
        this.visorMat.color.setHex(0x22c55e);
        this.laptopScreenMat.color.setHex(0xa855f7);
      }
    }

    // Always rotate billboard to face camera or gently oscillate
    this.statusBillboard.rotation.y = Math.sin(t * 1.5) * 0.1;

    if (this.state === 'sneaking' || this.state === 'patrol') {
      // Stealth crouched walk
      const cadence = 7.5;
      const cycle = t * cadence;
      this.pelvis.position.y = 0.8;
      this.torso.rotation.x = 0.35; // Sneak forward lean
      this.headGroup.rotation.x = -0.2; // Look up while sneaking

      const lSin = Math.sin(cycle);
      const rSin = Math.sin(cycle + Math.PI);

      this.leftLeg.rotation.x = lSin * 0.45;
      this.leftCalf.rotation.x = lSin > 0 ? lSin * 0.6 : 0;

      this.rightLeg.rotation.x = rSin * 0.45;
      this.rightCalf.rotation.x = rSin > 0 ? rSin * 0.6 : 0;

      // Holding laptop securely
      this.leftArm.rotation.set(-0.9, 0.4, -0.2);
      this.leftForearm.rotation.set(-0.8, 0, 0);

      this.rightArm.rotation.set(-0.9, -0.4, 0.2);
      this.rightForearm.rotation.set(-0.8, 0, 0);

    } else if (this.state === 'hacking') {
      // Stationed at desk, typing furiously on cyberdeck
      this.pelvis.position.y = 0.85;
      this.torso.rotation.x = 0.25;
      this.headGroup.rotation.x = 0.1;

      const typeCycle = Math.sin(t * 18);
      this.leftArm.rotation.set(-0.9 + typeCycle * 0.08, 0.3, 0);
      this.leftForearm.rotation.set(-1.1 - typeCycle * 0.12, 0, 0);

      this.rightArm.rotation.set(-0.9 - typeCycle * 0.08, -0.3, 0);
      this.rightForearm.rotation.set(-1.1 + typeCycle * 0.12, 0, 0);

      this.leftLeg.rotation.set(0, 0, 0);
      this.rightLeg.rotation.set(0, 0, 0);

    } else if (this.state === 'fleeing') {
      // Fast panic running away
      const cycle = t * 16;
      this.pelvis.position.y = 0.95 + Math.abs(Math.sin(cycle)) * 0.08;
      this.torso.rotation.x = 0.3;

      const lSin = Math.sin(cycle);
      const rSin = Math.sin(cycle + Math.PI);

      this.leftLeg.rotation.x = lSin * 0.8;
      this.rightLeg.rotation.x = rSin * 0.8;

      this.leftArm.rotation.x = rSin * 0.9;
      this.rightArm.rotation.x = lSin * 0.9;

    } else if (this.state === 'stunned') {
      // Dizzy wobbling from bat hit!
      this.pelvis.position.y = 0.72;
      this.torso.rotation.x = -0.35; // Knocked back
      this.torso.rotation.z = Math.sin(t * 8) * 0.18;
      this.headGroup.rotation.y = Math.sin(t * 12) * 0.35;

      this.leftArm.rotation.set(-0.5, 0, -0.8);
      this.rightArm.rotation.set(-0.5, 0, 0.8);

      // Rotate dizzy stars
      this.starsGroup.rotation.y += delta * 6;
    }
  }
}
