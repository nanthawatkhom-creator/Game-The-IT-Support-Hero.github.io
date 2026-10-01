import * as THREE from 'three';
import { CustomCharacterInstance } from './FBXCharacterManager';

export type CharacterAnimState = 'idle' | 'walk' | 'run' | 'repair' | 'success' | 'fail' | 'attack';

export class CharacterModel {
  public group: THREE.Group;
  public proceduralGroup: THREE.Group;
  public customGroup: THREE.Group;

  // Custom FBX model state
  public isCustomModel: boolean = false;
  public customInstance: CustomCharacterInstance | null = null;
  private currentCustomAction: THREE.AnimationAction | null = null;
  private attackTimeoutId: any = null;
  
  // Body parts for animation
  private pelvis: THREE.Group;
  private torso: THREE.Group;
  private neck: THREE.Group;
  private head: THREE.Group;
  private idBadge: THREE.Group;
  
  private leftShoulder: THREE.Group;
  private leftUpperArm: THREE.Group;
  private leftForearm: THREE.Group;
  private leftHand: THREE.Group;

  private rightShoulder: THREE.Group;
  private rightUpperArm: THREE.Group;
  private rightForearm: THREE.Group;
  private rightHand: THREE.Group;
  private batGroup: THREE.Group;

  private leftHip: THREE.Group;
  private leftThigh: THREE.Group;
  private leftCalf: THREE.Group;
  private leftFoot: THREE.Group;

  private rightHip: THREE.Group;
  private rightThigh: THREE.Group;
  private rightCalf: THREE.Group;
  private rightFoot: THREE.Group;

  // Animation variables
  private animState: CharacterAnimState = 'idle';
  private animTime: number = 0;
  public currentYaw: number = 0;
  public targetYaw: number = 0;
  public isAttacking: boolean = false;
  public isSpeedBoosted: boolean = false;
  private onAttackComplete?: () => void;

  constructor() {
    this.group = new THREE.Group();
    this.proceduralGroup = new THREE.Group();
    this.customGroup = new THREE.Group();
    this.group.add(this.proceduralGroup);
    this.group.add(this.customGroup);

    // Materials
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xf5c39e,
      roughness: 0.6,
      metalness: 0.05,
    });
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x221a15,
      roughness: 0.8,
    });
    const shirtMat = new THREE.MeshStandardMaterial({
      color: 0x1e40af, // Tech Navy Blue Polo
      roughness: 0.7,
    });
    const collarMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      roughness: 0.6,
    });
    const pantsMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Charcoal Slacks
      roughness: 0.8,
    });
    const beltMat = new THREE.MeshStandardMaterial({
      color: 0x171717,
      roughness: 0.5,
    });
    const buckleMat = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      metalness: 0.9,
      roughness: 0.2,
    });
    const shoeMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      roughness: 0.4,
    });
    const glassesMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.8,
      roughness: 0.2,
    });
    const lensMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.9,
      opacity: 1,
      transparent: true,
      roughness: 0.1,
    });
    const lanyardMat = new THREE.MeshStandardMaterial({
      color: 0xef4444, // Red IT staff lanyard
      roughness: 0.7,
    });
    const badgeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
    });
    const badgePhotoMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      roughness: 0.5,
    });
    const toolMat = new THREE.MeshStandardMaterial({
      color: 0xeab308, // Yellow screwdriver handle
      roughness: 0.3,
    });
    const metalShaftMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.9,
      roughness: 0.1,
    });

    // Root Pelvis
    this.pelvis = new THREE.Group();
    this.pelvis.position.y = 0.98; // Hip level
    this.proceduralGroup.add(this.pelvis);

    // Pelvis mesh (Hips)
    const hipsMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.16, 0.18, 12),
      pantsMat
    );
    hipsMesh.castShadow = true;
    this.pelvis.add(hipsMesh);

    // Belt
    const beltMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.185, 0.185, 0.05, 12),
      beltMat
    );
    beltMesh.position.y = 0.07;
    this.pelvis.add(beltMesh);

    const buckleMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.045, 0.02),
      buckleMat
    );
    buckleMesh.position.set(0, 0.07, 0.18);
    this.pelvis.add(buckleMesh);

    // Torso (Polo shirt)
    this.torso = new THREE.Group();
    this.torso.position.y = 0.12;
    this.pelvis.add(this.torso);

    const torsoMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.21, 0.18, 0.44, 12),
      shirtMat
    );
    torsoMesh.position.y = 0.22;
    torsoMesh.castShadow = true;
    this.torso.add(torsoMesh);

    // Collar
    const collarMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.19, 0.07, 12),
      collarMat
    );
    collarMesh.position.y = 0.44;
    this.torso.add(collarMesh);

    // Chest IT pocket & pen
    const pocketMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.08, 0.015),
      collarMat
    );
    pocketMesh.position.set(0.1, 0.28, 0.19);
    this.torso.add(pocketMesh);

    const penMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.005, 0.07, 6),
      buckleMat
    );
    penMesh.position.set(0.1, 0.32, 0.2);
    penMesh.rotation.z = -0.1;
    this.torso.add(penMesh);

    // Lanyard & ID Badge
    this.idBadge = new THREE.Group();
    this.idBadge.position.set(0, 0.42, 0.12);

    const ribbonLeft = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.32, 0.006),
      lanyardMat
    );
    ribbonLeft.position.set(-0.05, -0.14, 0.05);
    ribbonLeft.rotation.z = -0.28;
    this.idBadge.add(ribbonLeft);

    const ribbonRight = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.32, 0.006),
      lanyardMat
    );
    ribbonRight.position.set(0.05, -0.14, 0.05);
    ribbonRight.rotation.z = 0.28;
    this.idBadge.add(ribbonRight);

    const cardGroup = new THREE.Group();
    cardGroup.position.set(0, -0.3, 0.08);

    const badgeCard = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.12, 0.006),
      badgeMat
    );
    badgeCard.castShadow = true;
    cardGroup.add(badgeCard);

    const badgePic = new THREE.Mesh(
      new THREE.PlaneGeometry(0.06, 0.04),
      badgePhotoMat
    );
    badgePic.position.set(0, 0.02, 0.004);
    cardGroup.add(badgePic);

    this.idBadge.add(cardGroup);
    this.torso.add(this.idBadge);

    // Neck
    this.neck = new THREE.Group();
    this.neck.position.y = 0.46;
    this.torso.add(this.neck);

    const neckMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.08, 0.1, 10),
      skinMat
    );
    neckMesh.position.y = 0.05;
    this.neck.add(neckMesh);

    // Head
    this.head = new THREE.Group();
    this.head.position.y = 0.1;
    this.neck.add(this.head);

    // Head skull
    const headMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 16, 16),
      skinMat
    );
    headMesh.position.y = 0.12;
    headMesh.scale.set(0.95, 1.15, 1.0);
    headMesh.castShadow = true;
    this.head.add(headMesh);

    // Nose
    const noseMesh = new THREE.Mesh(
      new THREE.ConeGeometry(0.022, 0.05, 6),
      skinMat
    );
    noseMesh.position.set(0, 0.12, 0.145);
    noseMesh.rotation.x = Math.PI / 2;
    this.head.add(noseMesh);

    // Ears
    const leftEar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.025, 0.015, 8),
      skinMat
    );
    leftEar.position.set(-0.14, 0.12, 0.01);
    leftEar.rotation.z = Math.PI / 2;
    this.head.add(leftEar);

    const rightEar = leftEar.clone();
    rightEar.position.set(0.14, 0.12, 0.01);
    this.head.add(rightEar);

    // Hair
    const hairMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.148, 16, 16),
      hairMat
    );
    hairMesh.position.set(0, 0.15, -0.01);
    hairMesh.scale.set(0.98, 1.05, 1.02);
    this.head.add(hairMesh);

    // Hair fringe/bangs
    const hairFringe = new THREE.Mesh(
      new THREE.BoxGeometry(0.19, 0.06, 0.06),
      hairMat
    );
    hairFringe.position.set(0, 0.22, 0.11);
    hairFringe.rotation.x = 0.2;
    this.head.add(hairFringe);

    // Glasses frame
    const glassesGroup = new THREE.Group();
    glassesGroup.position.set(0, 0.14, 0.125);

    const frameLeft = new THREE.Mesh(
      new THREE.TorusGeometry(0.032, 0.005, 8, 16),
      glassesMat
    );
    frameLeft.position.x = -0.05;
    glassesGroup.add(frameLeft);

    const frameRight = new THREE.Mesh(
      new THREE.TorusGeometry(0.032, 0.005, 8, 16),
      glassesMat
    );
    frameRight.position.x = 0.05;
    glassesGroup.add(frameRight);

    const lensL = new THREE.Mesh(
      new THREE.CircleGeometry(0.03, 12),
      lensMat
    );
    lensL.position.set(-0.05, 0, 0.002);
    glassesGroup.add(lensL);

    const lensR = new THREE.Mesh(
      new THREE.CircleGeometry(0.03, 12),
      lensMat
    );
    lensR.position.set(0.05, 0, 0.002);
    glassesGroup.add(lensR);

    const bridge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.004, 0.004, 0.035, 6),
      glassesMat
    );
    bridge.rotation.z = Math.PI / 2;
    glassesGroup.add(bridge);

    this.head.add(glassesGroup);

    // Headset with microphone for IT Tech!
    const headsetBand = new THREE.Mesh(
      new THREE.TorusGeometry(0.15, 0.01, 8, 24, Math.PI),
      glassesMat
    );
    headsetBand.position.set(0, 0.15, 0.01);
    headsetBand.rotation.x = -Math.PI / 2;
    this.head.add(headsetBand);

    const earPiece = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.02, 12),
      glassesMat
    );
    earPiece.position.set(0.15, 0.13, 0.01);
    earPiece.rotation.z = Math.PI / 2;
    this.head.add(earPiece);

    const micBoom = new THREE.Mesh(
      new THREE.CylinderGeometry(0.004, 0.004, 0.14, 6),
      glassesMat
    );
    micBoom.position.set(0.12, 0.08, 0.1);
    micBoom.rotation.set(0.7, 0.3, 0.4);
    this.head.add(micBoom);

    // ================= ARMS =================
    // Left Arm
    this.leftShoulder = new THREE.Group();
    this.leftShoulder.position.set(-0.25, 0.38, 0);
    this.torso.add(this.leftShoulder);

    const leftShoulderMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.065, 10, 10),
      shirtMat
    );
    this.leftShoulder.add(leftShoulderMesh);

    this.leftUpperArm = new THREE.Group();
    this.leftShoulder.add(this.leftUpperArm);

    const leftUpperArmMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.048, 0.26, 10),
      shirtMat
    );
    leftUpperArmMesh.position.y = -0.13;
    leftUpperArmMesh.castShadow = true;
    this.leftUpperArm.add(leftUpperArmMesh);

    this.leftForearm = new THREE.Group();
    this.leftForearm.position.y = -0.26;
    this.leftUpperArm.add(this.leftForearm);

    const leftForearmMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.038, 0.24, 10),
      skinMat
    );
    leftForearmMesh.position.y = -0.12;
    leftForearmMesh.castShadow = true;
    this.leftForearm.add(leftForearmMesh);

    // Smartwatch on left wrist!
    const watchMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.042, 0.042, 0.03, 10),
      glassesMat
    );
    watchMesh.position.y = -0.19;
    this.leftForearm.add(watchMesh);

    this.leftHand = new THREE.Group();
    this.leftHand.position.y = -0.24;
    this.leftForearm.add(this.leftHand);

    const leftHandMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.08, 0.035),
      skinMat
    );
    leftHandMesh.position.y = -0.04;
    this.leftHand.add(leftHandMesh);

    // Right Arm
    this.rightShoulder = new THREE.Group();
    this.rightShoulder.position.set(0.25, 0.38, 0);
    this.torso.add(this.rightShoulder);

    const rightShoulderMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.065, 10, 10),
      shirtMat
    );
    this.rightShoulder.add(rightShoulderMesh);

    this.rightUpperArm = new THREE.Group();
    this.rightShoulder.add(this.rightUpperArm);

    const rightUpperArmMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.048, 0.26, 10),
      shirtMat
    );
    rightUpperArmMesh.position.y = -0.13;
    rightUpperArmMesh.castShadow = true;
    this.rightUpperArm.add(rightUpperArmMesh);

    this.rightForearm = new THREE.Group();
    this.rightForearm.position.y = -0.26;
    this.rightUpperArm.add(this.rightForearm);

    const rightForearmMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.038, 0.24, 10),
      skinMat
    );
    rightForearmMesh.position.y = -0.12;
    rightForearmMesh.castShadow = true;
    this.rightForearm.add(rightForearmMesh);

    this.rightHand = new THREE.Group();
    this.rightHand.position.y = -0.24;
    this.rightForearm.add(this.rightHand);

    const rightHandMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.08, 0.035),
      skinMat
    );
    rightHandMesh.position.y = -0.04;
    this.rightHand.add(rightHandMesh);

    // IT Anti-Hacker Whack Bat (ไม้ทุบแฮกเกอร์)
    this.batGroup = new THREE.Group();
    this.batGroup.position.set(0, -0.05, 0.02);
    this.batGroup.rotation.set(0.35, 0, 0.15);

    // Bat Grip Handle
    const gripMat = new THREE.MeshStandardMaterial({
      color: 0x18181b, // Dark rubber grip
      roughness: 0.9,
    });
    const batHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.018, 0.18, 10),
      gripMat
    );
    this.batGroup.add(batHandle);

    // Bat Knob
    const knob = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.022, 0.02, 10),
      buckleMat
    );
    knob.position.y = -0.09;
    this.batGroup.add(knob);

    // Bat Barrel (Tapered heavy head)
    const barrelMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Amber gold wooden/composite bat
      roughness: 0.35,
      metalness: 0.15,
    });
    const batBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.038, 0.02, 0.52, 12),
      barrelMat
    );
    batBarrel.position.y = 0.28;
    batBarrel.castShadow = true;
    this.batGroup.add(batBarrel);

    // Hazard Stripes & IT Logo rings on bat
    const hazardMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
    });
    const ring1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0385, 0.037, 0.03, 12),
      hazardMat
    );
    ring1.position.y = 0.42;
    this.batGroup.add(ring1);

    const ring2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.034, 0.03, 12),
      hazardMat
    );
    ring2.position.y = 0.34;
    this.batGroup.add(ring2);

    this.rightHand.add(this.batGroup);

    // ================= LEGS =================
    // Left Leg
    this.leftHip = new THREE.Group();
    this.leftHip.position.set(-0.11, -0.08, 0);
    this.pelvis.add(this.leftHip);

    this.leftThigh = new THREE.Group();
    this.leftHip.add(this.leftThigh);

    const leftThighMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.07, 0.44, 10),
      pantsMat
    );
    leftThighMesh.position.y = -0.22;
    leftThighMesh.castShadow = true;
    this.leftThigh.add(leftThighMesh);

    this.leftCalf = new THREE.Group();
    this.leftCalf.position.y = -0.44;
    this.leftThigh.add(this.leftCalf);

    const leftCalfMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.068, 0.055, 0.42, 10),
      pantsMat
    );
    leftCalfMesh.position.y = -0.21;
    leftCalfMesh.castShadow = true;
    this.leftCalf.add(leftCalfMesh);

    this.leftFoot = new THREE.Group();
    this.leftFoot.position.y = -0.42;
    this.leftCalf.add(this.leftFoot);

    const leftShoeMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.075, 0.22),
      shoeMat
    );
    leftShoeMesh.position.set(0, -0.035, 0.05);
    leftShoeMesh.castShadow = true;
    this.leftFoot.add(leftShoeMesh);

    // Right Leg
    this.rightHip = new THREE.Group();
    this.rightHip.position.set(0.11, -0.08, 0);
    this.pelvis.add(this.rightHip);

    this.rightThigh = new THREE.Group();
    this.rightHip.add(this.rightThigh);

    const rightThighMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.07, 0.44, 10),
      pantsMat
    );
    rightThighMesh.position.y = -0.22;
    rightThighMesh.castShadow = true;
    this.rightThigh.add(rightThighMesh);

    this.rightCalf = new THREE.Group();
    this.rightCalf.position.y = -0.44;
    this.rightThigh.add(this.rightCalf);

    const rightCalfMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.068, 0.055, 0.42, 10),
      pantsMat
    );
    rightCalfMesh.position.y = -0.21;
    rightCalfMesh.castShadow = true;
    this.rightCalf.add(rightCalfMesh);

    this.rightFoot = new THREE.Group();
    this.rightFoot.position.y = -0.42;
    this.rightCalf.add(this.rightFoot);

    const rightShoeMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.075, 0.22),
      shoeMat
    );
    rightShoeMesh.position.set(0, -0.035, 0.05);
    rightShoeMesh.castShadow = true;
    this.rightFoot.add(rightShoeMesh);
  }

  public setCustomCharacter(instance: CustomCharacterInstance) {
    if (this.attackTimeoutId) {
      clearTimeout(this.attackTimeoutId);
      this.attackTimeoutId = null;
    }
    this.customGroup.clear();
    this.customInstance = instance;
    this.customGroup.add(instance.baseGroup);
    this.proceduralGroup.visible = false;
    this.customGroup.visible = true;
    this.isCustomModel = true;
    this.currentCustomAction = null;
    this.isAttacking = false;

    // Start with idle action
    this.setAnimationState('idle');
  }

  public clearCustomCharacter() {
    if (this.attackTimeoutId) {
      clearTimeout(this.attackTimeoutId);
      this.attackTimeoutId = null;
    }
    this.customGroup.clear();
    this.customInstance = null;
    this.currentCustomAction = null;
    this.isCustomModel = false;
    this.isAttacking = false;
    this.proceduralGroup.visible = true;
    this.setAnimationState('idle');
  }

  public triggerAttack(onComplete?: () => void) {
    if (this.isAttacking) return;
    this.isAttacking = true;
    this.onAttackComplete = onComplete;

    if (this.isCustomModel && this.customInstance && this.customInstance.actions.attack) {
      this.animState = 'attack';
      const attackAction = this.customInstance.actions.attack;
      attackAction.reset();
      attackAction.setLoop(THREE.LoopOnce, 1);
      attackAction.clampWhenFinished = true;
      attackAction.timeScale = 1.25;
      attackAction.fadeIn(0.08);
      attackAction.play();

      if (this.currentCustomAction && this.currentCustomAction !== attackAction) {
        this.currentCustomAction.fadeOut(0.08);
      }
      this.currentCustomAction = attackAction;

      const durationMs = (attackAction.getClip().duration / attackAction.timeScale) * 1000;
      const attackDuration = Math.min(Math.max(durationMs, 250), 900);

      this.attackTimeoutId = setTimeout(() => {
        this.isAttacking = false;
        this.setAnimationState('idle');
        if (this.onAttackComplete) {
          this.onAttackComplete();
          this.onAttackComplete = undefined;
        }
      }, attackDuration);
    } else if (this.isCustomModel) {
      // Custom model without separate attack animation: brief pause and callback
      this.animState = 'attack';
      this.attackTimeoutId = setTimeout(() => {
        this.isAttacking = false;
        this.setAnimationState('idle');
        if (this.onAttackComplete) {
          this.onAttackComplete();
          this.onAttackComplete = undefined;
        }
      }, 350);
    } else {
      this.setAnimationState('attack');
    }
  }

  public setAnimationState(state: CharacterAnimState) {
    if (this.isAttacking && state !== 'attack') {
      return; // Finish attack first
    }
    if (this.animState !== state) {
      this.animState = state;
      this.animTime = 0;
    }

    if (this.isCustomModel && this.customInstance) {
      this.applyCustomAnimation(state);
    }
  }

  private applyCustomAnimation(state: CharacterAnimState) {
    if (!this.customInstance) return;

    let targetAction: THREE.AnimationAction | undefined;

    switch (state) {
      case 'idle':
        targetAction = this.customInstance.actions.idle;
        break;
      case 'walk':
        targetAction = this.customInstance.actions.walk || this.customInstance.actions.run || this.customInstance.actions.idle;
        break;
      case 'run':
        targetAction = this.customInstance.actions.run || this.customInstance.actions.walk || this.customInstance.actions.idle;
        break;
      case 'attack':
        targetAction = this.customInstance.actions.attack || this.customInstance.actions.idle;
        break;
      case 'repair':
      case 'success':
      case 'fail':
        targetAction = this.customInstance.actions.idle;
        break;
    }

    if (targetAction && targetAction !== this.currentCustomAction) {
      targetAction.reset();
      if (state === 'run' && this.isSpeedBoosted) {
        targetAction.timeScale = 1.35;
      } else {
        targetAction.timeScale = 1.0;
      }
      targetAction.fadeIn(0.2);
      targetAction.play();

      if (this.currentCustomAction) {
        this.currentCustomAction.fadeOut(0.2);
      }
      this.currentCustomAction = targetAction;
    } else if (targetAction && targetAction === this.currentCustomAction) {
      if (state === 'run') {
        targetAction.timeScale = this.isSpeedBoosted ? 1.35 : 1.0;
      }
    }
  }

  public getAnimationState(): CharacterAnimState {
    return this.animState;
  }

  // Smooth normal turning towards movement direction
  public updateFacing(targetYaw: number, delta: number, speed: number = 14) {
    this.targetYaw = targetYaw;
    
    // Shortest angular difference
    let diff = this.targetYaw - this.currentYaw;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;

    this.currentYaw += diff * Math.min(delta * speed, 1);
    this.group.rotation.y = this.currentYaw;
  }

  public update(delta: number, speedMagnitude: number = 0) {
    if (this.isCustomModel && this.customInstance) {
      this.customInstance.mixer.update(delta);
      return;
    }

    this.animTime += delta;
    const t = this.animTime;

    // Reset default transforms
    this.torso.position.y = 0.12;
    this.torso.rotation.set(0, 0, 0);
    this.neck.rotation.set(0, 0, 0);
    this.head.rotation.set(0, 0, 0);
    this.pelvis.position.y = 0.98;
    this.rightHand.rotation.set(0, 0, 0);
    this.leftHand.rotation.set(0, 0, 0);

    if (this.animState === 'idle') {
      // Natural breathing & posture
      const breath = Math.sin(t * 2.2);
      this.torso.position.y = 0.12 + breath * 0.008;
      this.torso.rotation.x = breath * 0.015;
      this.head.rotation.y = Math.sin(t * 0.8) * 0.08;
      this.head.rotation.x = Math.sin(t * 1.5) * 0.02;

      // Arms resting casually
      this.leftUpperArm.rotation.set(0.05 + breath * 0.02, 0, 0.08);
      this.leftForearm.rotation.set(-0.25, 0, 0);

      this.rightUpperArm.rotation.set(0.05 + breath * 0.02, 0, -0.08);
      this.rightForearm.rotation.set(-0.35, 0, 0);
      this.rightHand.rotation.set(0.2, 0, 0.1);

      // Bat held naturally down along thigh
      this.batGroup.position.set(0, -0.05, 0.02);
      this.batGroup.rotation.set(0.35, 0, 0.15);

      // Legs standing firmly
      this.leftThigh.rotation.set(0, 0, -0.04);
      this.leftCalf.rotation.set(0, 0, 0);
      this.rightThigh.rotation.set(0, 0, 0.04);
      this.rightCalf.rotation.set(0, 0, 0);

      // ID badge subtle sway
      this.idBadge.rotation.z = Math.sin(t * 2) * 0.03;
      this.idBadge.rotation.x = Math.cos(t * 1.8) * 0.03;

    } else if (this.animState === 'walk' || this.animState === 'run') {
      const isRun = this.animState === 'run';
      const cadence = isRun ? (this.isSpeedBoosted ? 22 : 14) : 9;
      const legAmp = isRun ? (this.isSpeedBoosted ? 0.95 : 0.75) : 0.55;
      const armAmp = isRun ? (this.isSpeedBoosted ? 1.05 : 0.85) : 0.6;
      const cycle = t * cadence;

      // Vertical bounce & forward tilt
      const bounce = Math.abs(Math.sin(cycle)) * (isRun ? (this.isSpeedBoosted ? 0.09 : 0.07) : 0.04);
      this.pelvis.position.y = 0.98 + bounce;
      this.torso.rotation.x = isRun ? (this.isSpeedBoosted ? 0.32 : 0.22) : 0.1;
      this.torso.rotation.y = Math.sin(cycle) * 0.12;

      // Left leg
      const lSin = Math.sin(cycle);
      this.leftThigh.rotation.x = lSin * legAmp;
      this.leftCalf.rotation.x = lSin > 0 ? lSin * 0.9 : 0.05;
      this.leftFoot.rotation.x = lSin < 0 ? -0.15 : 0.1;

      // Right leg (opposite phase)
      const rSin = Math.sin(cycle + Math.PI);
      this.rightThigh.rotation.x = rSin * legAmp;
      this.rightCalf.rotation.x = rSin > 0 ? rSin * 0.9 : 0.05;
      this.rightFoot.rotation.x = rSin < 0 ? -0.15 : 0.1;

      // Left arm (swings opposite to left leg)
      this.leftUpperArm.rotation.x = rSin * armAmp;
      this.leftUpperArm.rotation.z = 0.1;
      this.leftForearm.rotation.x = -0.5 - Math.max(0, rSin) * 0.4;

      // Right arm
      this.rightUpperArm.rotation.x = lSin * armAmp;
      this.rightUpperArm.rotation.z = -0.1;
      this.rightForearm.rotation.x = -0.5 - Math.max(0, lSin) * 0.4;
      this.rightHand.rotation.set(0.3, 0, 0.1);

      // Bat swings comfortably along with running arm motion
      this.batGroup.position.set(0, -0.05, 0.02);
      this.batGroup.rotation.set(0.55, 0, 0.15);

      // ID badge dynamic swinging while running
      this.idBadge.rotation.x = 0.2 + Math.sin(cycle * 2) * 0.2;
      this.idBadge.rotation.z = Math.sin(cycle) * 0.15;

    } else if (this.animState === 'repair') {
      // Technician crouched / leaning over desk to fix hardware
      this.pelvis.position.y = 0.72; // Crouch down
      this.leftThigh.rotation.set(-0.6, 0, -0.2);
      this.leftCalf.rotation.set(1.1, 0, 0);

      this.rightThigh.rotation.set(-0.4, 0, 0.2);
      this.rightCalf.rotation.set(0.9, 0, 0);

      this.torso.position.y = 0.08;
      this.torso.rotation.x = 0.45; // Lean into PC
      this.head.rotation.x = -0.3; // Look down at cables

      // Active working hands (screwing, connecting)
      const workCycle = Math.sin(t * 12);
      this.leftUpperArm.rotation.set(-0.8, -0.3, 0.2);
      this.leftForearm.rotation.set(-0.9 + workCycle * 0.15, 0, 0);

      this.rightUpperArm.rotation.set(-0.9, 0.4, -0.2);
      this.rightForearm.rotation.set(-1.0 - workCycle * 0.25, 0, workCycle * 0.3);
      this.rightHand.rotation.set(-0.2, 0, 0);

      // Bat safely stowed along hip while working on delicate hardware
      this.batGroup.position.set(0, -0.04, 0.01);
      this.batGroup.rotation.set(-1.1, 0.3, 0);

    } else if (this.animState === 'success') {
      // Both arms raised high in celebration!
      const cheer = Math.sin(t * 8);
      this.torso.rotation.x = -0.15;
      this.head.rotation.x = 0.2; // Look up proudly

      this.leftUpperArm.rotation.set(-2.6 + cheer * 0.15, 0, 0.4);
      this.leftForearm.rotation.set(-0.2, 0, 0);

      this.rightUpperArm.rotation.set(-2.6 - cheer * 0.15, 0, -0.4);
      this.rightForearm.rotation.set(-0.2, 0, 0);
      this.rightHand.rotation.set(0, 0, 0);
      this.batGroup.rotation.set(0.3, 0, 0);

      this.leftThigh.rotation.set(0, 0, -0.08);
      this.rightThigh.rotation.set(0, 0, 0.08);

    } else if (this.animState === 'fail') {
      // Disappointed / hands on face or head shake
      const shake = Math.sin(t * 10) * 0.2;
      this.torso.rotation.x = 0.2;
      this.head.rotation.y = shake;
      this.head.rotation.x = 0.2;

      this.leftUpperArm.rotation.set(-1.6, -0.5, 0.6);
      this.leftForearm.rotation.set(-1.4, 0, 0);

      this.rightUpperArm.rotation.set(-1.6, 0.5, -0.6);
      this.rightForearm.rotation.set(-1.4, 0, 0);
      this.batGroup.rotation.set(0.4, 0, 0);

    } else if (this.animState === 'attack') {
      // Powerful, Visceral IT Bat Strike Animation (duration ~0.38s)
      // Bat position and rotation perfectly aligned with striking arc!
      const duration = 0.38;
      const progress = Math.min(t / duration, 1.0);

      if (progress < 0.24) {
        // Phase 1: High Wind-up (Coiled spring over right shoulder)
        const windProgress = progress / 0.24;
        // Torso coils right
        this.torso.rotation.y = -0.65 * windProgress;
        this.torso.rotation.x = -0.08 * windProgress;

        // Right arm raises high and back
        this.rightUpperArm.rotation.set(
          -1.65 * windProgress,
          0.6 * windProgress,
          0.85 * windProgress
        );
        this.rightForearm.rotation.set(
          -1.35 * windProgress,
          0,
          0.35 * windProgress
        );
        // Wrist cocks the bat up and behind the head
        this.rightHand.rotation.set(
          -0.65 * windProgress,
          0.35 * windProgress,
          -0.25 * windProgress
        );

        // Bat points upward and backward ready to deliver maximum impact
        this.batGroup.position.set(0, -0.05, 0.03);
        this.batGroup.rotation.set(
          -0.35 + windProgress * 0.75,
          -0.2 * windProgress,
          -0.45 * windProgress
        );

        // Left arm balances posture
        this.leftUpperArm.rotation.set(-0.6 * windProgress, -0.5 * windProgress, 0.3);
        this.leftForearm.rotation.set(-0.8 * windProgress, 0, 0);

      } else if (progress < 0.72) {
        // Phase 2: Explosive Forward Strike & Impact!
        const swingProgress = (progress - 0.24) / 0.48;

        // Torso drives forward with maximum rotational torque
        this.torso.rotation.y = -0.65 + swingProgress * 1.6;
        this.torso.rotation.x = 0.18; // Aggressive forward lunge

        // Arm drives forward and whips across the striking plane
        this.rightUpperArm.rotation.set(
          -1.35 + swingProgress * 0.65,
          -0.75 * swingProgress,
          -1.35 * swingProgress
        );
        this.rightForearm.rotation.set(
          -0.35 - swingProgress * 0.55,
          0,
          -0.75 * swingProgress
        );

        // Wrist snaps through with full extension
        this.rightHand.rotation.set(
          0.45 + swingProgress * 0.7,
          -0.55 * swingProgress,
          0.35
        );

        // BAT POSITION & ROTATION DIRECTLY ALIGNED WITH HIT DIRECTION!
        // The bat barrel leads horizontal across waist/chest height straight into the target
        this.batGroup.position.set(0, -0.05, 0.03);
        this.batGroup.rotation.set(
          Math.PI / 2 + 0.18,
          0.25 * (1 - swingProgress),
          -0.35 - swingProgress * 0.95
        );

        // Left arm pulls back to counterbalance the powerful swing
        this.leftUpperArm.rotation.set(-0.4, 0.4, 0.4);
        this.leftForearm.rotation.set(-0.5, 0, 0);

      } else {
        // Phase 3: Smooth Follow-Through & Quick Recovery
        const followProgress = (progress - 0.72) / 0.28;

        // Torso rotation decelerates back to neutral
        this.torso.rotation.y = 0.95 * (1 - followProgress);
        this.torso.rotation.x = 0.18 * (1 - followProgress);

        // Arm recovers smoothly
        this.rightUpperArm.rotation.set(
          -0.7 * (1 - followProgress),
          0,
          -0.7 * (1 - followProgress)
        );
        this.rightForearm.rotation.set(-0.4, 0, 0);
        this.rightHand.rotation.set(0.2 * (1 - followProgress), 0, 0);

        // Bat returns smoothly to neutral carry position
        this.batGroup.position.set(0, -0.05, 0.02);
        this.batGroup.rotation.set(
          (Math.PI / 2 + 0.18) * (1 - followProgress) + 0.35 * followProgress,
          0,
          0.15 * followProgress
        );

        this.leftUpperArm.rotation.set(-0.2 * (1 - followProgress), 0, 0.1);
      }

      if (progress >= 1.0) {
        this.isAttacking = false;
        this.setAnimationState('idle');
        if (this.onAttackComplete) {
          this.onAttackComplete();
          this.onAttackComplete = undefined;
        }
      }
    }
  }
}
