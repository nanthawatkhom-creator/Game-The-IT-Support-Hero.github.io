import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

export interface FBXAnimationSlots {
  idle?: THREE.AnimationClip;
  walk?: THREE.AnimationClip;
  run?: THREE.AnimationClip;
  attack?: THREE.AnimationClip;
}

export interface FBXModelConfig {
  scale: number;
  yOffset: number;
  xOffset?: number;
  zOffset?: number;
  rotationY: number; // in radians
  attachBat: boolean;
  batHand?: 'right' | 'left'; // hand to attach bat: 'right' (default) or 'left'
  batPosX?: number; // local offset X in meters (scaled by nativeUnitScale)
  batPosY?: number; // local offset Y in meters
  batPosZ?: number; // local offset Z in meters
  batRotX?: number; // in degrees
  batRotY?: number; // in degrees
  batRotZ?: number; // in degrees
  batScale?: number; // scale multiplier
}

export interface AutoScaleResult {
  scale: number;
  height: number;
  width: number;
  depth: number;
  minY: number;
  maxY: number;
  recommendedYOffset: number;
  recommendedXOffset: number;
  recommendedZOffset: number;
  detectedUnit: string;
}

export interface FBXInspection {
  boneCount: number;
  meshCount: number;
  animations: THREE.AnimationClip[];
  hasMesh: boolean;
  isAnimationOnly: boolean;
  rootBoneName?: string;
  detectedUnit: string;
  rawHeight: number;
}

export interface CustomCharacterInstance {
  baseGroup: THREE.Group;
  mixer: THREE.AnimationMixer;
  clips: FBXAnimationSlots;
  actions: {
    idle?: THREE.AnimationAction;
    walk?: THREE.AnimationAction;
    run?: THREE.AnimationAction;
    attack?: THREE.AnimationAction;
  };
  config: FBXModelConfig;
  batMesh?: THREE.Group;
}

export class FBXCharacterManager {
  private static loader = new FBXLoader();

  /**
   * Anatomical synonyms to bridge differences between Mixamo, Blender Rigify,
   * Unreal Mannequin, and Biped naming conventions.
   */
  private static readonly BONE_SYNONYMS: Record<string, string[]> = {
    hips: ['pelvis', 'root', 'waist', 'hip'],
    pelvis: ['hips', 'root', 'waist', 'hip'],
    root: ['hips', 'pelvis'],
    spine: ['spine1', 'abdomen', 'torso', 'spine01'],
    spine1: ['spine', 'chest', 'spinetorso', 'spine02'],
    spine2: ['chest', 'upperchest', 'torso2', 'spine03'],
    neck: ['headneck', 'neckbase', 'neck01'],
    head: ['face', 'skull'],
    leftshoulder: ['leftcollar', 'l_collar', 'clavicle_l', 'l_shoulder', 'lshoulder', 'leftclavicle'],
    rightshoulder: ['rightcollar', 'r_collar', 'clavicle_r', 'r_shoulder', 'rshoulder', 'rightclavicle'],
    leftarm: ['leftupperarm', 'upperarm_l', 'l_upperarm', 'larm', 'lupperarm', 'leftarm'],
    rightarm: ['rightupperarm', 'upperarm_r', 'r_upperarm', 'rarm', 'rupperarm', 'rightarm'],
    leftforearm: ['leftlowerarm', 'lowerarm_l', 'l_lowerarm', 'l_forearm', 'lforearm', 'leftelbow'],
    rightforearm: ['rightlowerarm', 'lowerarm_r', 'r_lowerarm', 'r_forearm', 'rforearm', 'rightelbow'],
    lefthand: ['hand_l', 'l_hand', 'lhand', 'leftwrist', 'l_wrist'],
    righthand: ['hand_r', 'r_hand', 'rhand', 'rightwrist', 'r_wrist'],
    leftupleg: ['leftthigh', 'thigh_l', 'l_thigh', 'lupleg', 'lupperleg', 'leftthighleg'],
    rightupleg: ['rightthigh', 'thigh_r', 'r_thigh', 'rupleg', 'rupperleg', 'rightthighleg'],
    leftleg: ['leftcalf', 'calf_l', 'l_calf', 'lleg', 'l_lowerleg', 'leftshin', 'leftknee'],
    rightleg: ['rightcalf', 'calf_r', 'r_calf', 'rleg', 'r_lowerleg', 'rightshin', 'rightknee'],
    leftfoot: ['foot_l', 'l_foot', 'lfoot', 'leftankle'],
    rightfoot: ['foot_r', 'r_foot', 'rfoot', 'rightankle'],
    lefttoebase: ['lefttoe', 'toe_l', 'l_toe', 'ltoebase', 'lefttoes'],
    righttoebase: ['righttoe', 'toe_r', 'r_toe', 'rtoebase', 'righttoes'],
  };

  /**
   * Parse an FBX file from an ArrayBuffer
   */
  public static async parseFBX(buffer: ArrayBuffer): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      try {
        const group = this.loader.parse(buffer, '');
        // Clean out stray cameras or lamps that might have been exported from 3D software
        this.cleanStrayObjects(group);
        resolve(group);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Quick inspection of an FBX group to detect meshes, bones, animations,
   * and whether it is a character model (with skin) or animation-only (without skin).
   */
  public static inspectFBX(group: THREE.Group): FBXInspection {
    let boneCount = 0;
    let meshCount = 0;
    let rootBoneName: string | undefined;

    group.traverse((c) => {
      if ((c as THREE.Bone).isBone) {
        boneCount++;
        const norm = this.normalizeBoneName(c.name);
        if (norm === 'hips' || norm === 'pelvis' || norm === 'root') {
          rootBoneName = c.name;
        }
      }
      if ((c as THREE.Mesh).isMesh) {
        meshCount++;
      }
    });

    const animations = group.animations || [];
    const hasMesh = meshCount > 0;
    const isAnimationOnly = !hasMesh && animations.length > 0;

    const auto = this.calculateAutoScale(group, 1.78);

    return {
      boneCount,
      meshCount,
      animations,
      hasMesh,
      isAnimationOnly,
      rootBoneName,
      detectedUnit: auto.detectedUnit,
      rawHeight: auto.height,
    };
  }

  /**
   * Removes stray cameras and lights from FBX hierarchies that could distort bounding boxes
   */
  public static cleanStrayObjects(group: THREE.Group) {
    const toRemove: THREE.Object3D[] = [];
    group.traverse((c) => {
      if ((c as any).isCamera || (c as any).isLight) {
        toRemove.push(c);
      }
    });
    for (const obj of toRemove) {
      if (obj.parent) {
        obj.parent.remove(obj);
      }
    }
  }

  /**
   * Recursively configure materials and shadows on FBX mesh
   */
  public static prepareFBXMesh(group: THREE.Group) {
    group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat) => {
              mat.side = THREE.DoubleSide;
              if ('roughness' in mat && (mat as THREE.MeshStandardMaterial).roughness === undefined) {
                (mat as THREE.MeshStandardMaterial).roughness = 0.6;
              }
            });
          } else {
            mesh.material.side = THREE.DoubleSide;
            if ('roughness' in mesh.material && (mesh.material as THREE.MeshStandardMaterial).roughness === undefined) {
              (mesh.material as THREE.MeshStandardMaterial).roughness = 0.6;
            }
          }
        }
      }
    });
  }

  /**
   * Computes the precise bounding box and calculates auto-scale so the character
   * is ~1.78m tall in world units (matching the in-game IT technician character),
   * and calculates the recommended ground Y-offset so feet touch the floor (y = 0).
   */
  public static calculateAutoScale(group: THREE.Group, targetHeight: number = 1.78): AutoScaleResult {
    this.cleanStrayObjects(group);
    group.updateMatrixWorld(true);

    const box = new THREE.Box3();
    let hasMesh = false;
    const invRootMatrix = new THREE.Matrix4().copy(group.matrixWorld).invert();

    // Traverse all meshes and compute bounding box in group local coordinate space
    group.traverse((c) => {
      if ((c as any).isCamera || (c as any).isLight) return;

      if ((c as THREE.Mesh).isMesh) {
        const mesh = c as THREE.Mesh;
        if (mesh.geometry) {
          if (!mesh.geometry.boundingBox) {
            mesh.geometry.computeBoundingBox();
          }
          if (mesh.geometry.boundingBox) {
            const meshBox = mesh.geometry.boundingBox.clone();
            mesh.updateMatrixWorld(true);
            const localToGroup = new THREE.Matrix4().multiplyMatrices(invRootMatrix, mesh.matrixWorld);
            meshBox.applyMatrix4(localToGroup);
            box.union(meshBox);
            hasMesh = true;
          }
        }
      }
    });

    // Fallback if no meshes or box empty (e.g. bones only or skeleton file)
    if (!hasMesh || box.isEmpty()) {
      box.setFromObject(group);
      if (box.isEmpty()) {
        box.min.set(-0.3, 0, -0.3);
        box.max.set(0.3, 1.78, 0.3);
      }
    }

    const size = new THREE.Vector3();
    box.getSize(size);
    const rawHeight = Math.max(size.y, 0.001);

    // Compute raw scale factor to reach target in-game height (1.78m)
    const rawScale = targetHeight / rawHeight;

    // Detect format / units to provide human-readable feedback
    let detectedUnit = 'Custom';
    if (rawHeight >= 140 && rawHeight <= 220) {
      detectedUnit = 'Centimeters (Mixamo/Maya)';
    } else if (rawHeight >= 1.4 && rawHeight <= 2.2) {
      detectedUnit = 'Meters (Blender)';
    } else if (rawHeight >= 1400 && rawHeight <= 2200) {
      detectedUnit = 'Millimeters';
    } else if (rawHeight >= 55 && rawHeight <= 85) {
      detectedUnit = 'Inches';
    }

    // Preserve high precision scaling
    let scale = rawScale;
    if (scale < 0.001) {
      scale = Math.round(scale * 1000000) / 1000000;
    } else if (scale < 0.01) {
      scale = Math.round(scale * 100000) / 100000;
    } else if (scale < 0.1) {
      scale = Math.round(scale * 10000) / 10000;
    } else {
      scale = Math.round(scale * 1000) / 1000;
    }

    // Recommended Y offset to place feet firmly on the floor at y = 0
    const recommendedYOffset = Math.round(-box.min.y * scale * 1000) / 1000;

    // Center model in horizontal plane so turning pivots on center of mass
    const centerX = (box.min.x + box.max.x) / 2;
    const centerZ = (box.min.z + box.max.z) / 2;
    const recommendedXOffset = Math.round(-centerX * scale * 1000) / 1000;
    const recommendedZOffset = Math.round(-centerZ * scale * 1000) / 1000;

    return {
      scale,
      height: size.y,
      width: size.x,
      depth: size.z,
      minY: box.min.y,
      maxY: box.max.y,
      recommendedYOffset,
      recommendedXOffset,
      recommendedZOffset,
      detectedUnit,
    };
  }

  /**
   * Normalizes bone / node names across various FBX export tools:
   * Decodes FBX ASCII escapes (e.g. FBXASC058 -> ':'), strips hierarchy/take prefixes,
   * strips 'mixamorig' / 'bip01' / 'armature' prefixes, and converts to clean lowercase tokens.
   */
  public static normalizeBoneName(rawName: string): string {
    if (!rawName) return '';
    let s = rawName;

    // 1. Decode FBX ASCII escapes (common in Blender / Maya FBX exports)
    s = s.replace(/FBXASC058/gi, ':');
    s = s.replace(/FBXASC032/gi, ' ');
    s = s.replace(/FBXASC046/gi, '.');
    s = s.replace(/FBXASC045/gi, '-');

    // 2. Remove Take / Action / Armature pipe prefix (e.g. "Armature|mixamorig:Hips" -> "mixamorig:Hips")
    if (s.includes('|')) {
      s = s.split('|').pop() || s;
    }

    // 3. Remove hierarchy path slashes (e.g. "Armature/mixamorig:Hips" -> "mixamorig:Hips")
    if (s.includes('/')) {
      s = s.split('/').pop() || s;
    }

    // 4. Remove namespace prefixes if partitioned by colon (e.g. "Armature:mixamorig:Hips" -> "Hips")
    const parts = s.split(':');
    if (parts.length > 1) {
      s = parts[parts.length - 1];
    }

    // 5. Remove common rig/namespace prefixes
    s = s.replace(/^(mixamorig|mixamo|bip01|character1|rig|biped)[\s_.:-]?/i, '');

    // 6. Remove numeric suffixes (e.g. ".001", "_001")
    s = s.replace(/[._]\d+$/, '');

    // 7. Strip all non-alphanumeric characters and lowercase
    s = s.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    return s;
  }

  /**
   * Checks if a normalized bone name represents the root pelvis/hips bone.
   */
  public static isRootBone(normName: string): boolean {
    return normName === 'hips' || normName === 'pelvis' || normName === 'root';
  }

  /**
   * Retargets track names in an AnimationClip so they bind accurately to the bones of targetObject.
   * Handles files "Without Skin" (motion-only FBX files from Mixamo or Blender) being applied
   * to a model "With Skin" sharing the same bone skeleton:
   * 1. Universal bone name normalization & fuzzy synonym matching.
   * 2. Prevents limb ripping: Only allows .position tracks on the Root/Hips bone (child bones receive .quaternion).
   * 3. Scales root .position keyframes to match the character model's actual skeleton dimensions.
   */
  public static retargetClip(
    clip: THREE.AnimationClip,
    targetObject: THREE.Object3D,
    options?: { inPlace?: boolean }
  ): THREE.AnimationClip {
    // Index target nodes
    const nodeNames = new Set<string>();
    const nodeMapByNorm = new Map<string, string>();
    let targetRootBone: THREE.Object3D | null = null;

    targetObject.traverse((c) => {
      if (c.name) {
        nodeNames.add(c.name);
        const norm = this.normalizeBoneName(c.name);
        if (norm && !nodeMapByNorm.has(norm)) {
          nodeMapByNorm.set(norm, c.name);
        }
        if (this.isRootBone(norm) && !targetRootBone) {
          targetRootBone = c;
        }
      }
    });

    // Detect target root rest position Y for root motion scaling
    let targetRootRestY = 0;
    if (targetRootBone) {
      targetRootRestY = Math.abs(targetRootBone.position.y);
    }

    const newTracks: THREE.KeyframeTrack[] = [];

    for (const track of clip.tracks) {
      const dotIdx = track.name.lastIndexOf('.');
      if (dotIdx === -1) {
        newTracks.push(track);
        continue;
      }

      const property = track.name.substring(dotIdx); // e.g. '.quaternion' or '.position'
      const rawNodeName = track.name.substring(0, dotIdx);
      const normTrackNode = this.normalizeBoneName(rawNodeName);
      const isRoot = this.isRootBone(normTrackNode);

      // Find matching bone name in targetObject
      let matchedName = '';

      // Direct exact match
      if (nodeNames.has(rawNodeName)) {
        matchedName = rawNodeName;
      }
      // Normalized match
      else if (nodeMapByNorm.has(normTrackNode)) {
        matchedName = nodeMapByNorm.get(normTrackNode)!;
      }
      // Synonym match
      else if (this.BONE_SYNONYMS[normTrackNode]) {
        for (const syn of this.BONE_SYNONYMS[normTrackNode]) {
          if (nodeMapByNorm.has(syn)) {
            matchedName = nodeMapByNorm.get(syn)!;
            break;
          }
        }
      }

      // Fuzzy substring fallback
      if (!matchedName && normTrackNode.length > 3) {
        for (const [normTarget, origTarget] of nodeMapByNorm.entries()) {
          if (normTarget.includes(normTrackNode) || normTrackNode.includes(normTarget)) {
            matchedName = origTarget;
            break;
          }
        }
      }

      // If bone was not found in targetObject, skip this track
      if (!matchedName) {
        continue;
      }

      // -----------------------------------------------------------------------
      // RETARGETING RULE: NON-ROOT BONES MUST NOT USE .position TRACKS!
      // In 3D animation retargeting, child bones (limbs, spine, neck) must only
      // receive rotation (.quaternion). Applying raw .position tracks to child
      // bones tears limbs apart because characters have different bone lengths!
      // -----------------------------------------------------------------------
      if (!isRoot && property === '.position') {
        continue;
      }

      // Clone track and assign retargeted name
      const clonedTrack = track.clone();
      clonedTrack.name = matchedName + property;

      // -----------------------------------------------------------------------
      // ROOT MOTION SCALING:
      // Mixamo "without skin" exports root position in Mixamo cm (values ~90-105).
      // If the target model was modeled in meters (Blender ~0.9-1.05m), scale factor
      // is ~0.01. If both are cm, scale factor is ~1.0.
      // -----------------------------------------------------------------------
      if (isRoot && property === '.position' && clonedTrack.values.length >= 3) {
        const initialY = Math.abs(clonedTrack.values[1]);
        if (targetRootRestY > 0 && initialY > 0.001) {
          const ratio = targetRootRestY / initialY;
          // Only adjust if unit systems differ substantially (e.g. cm vs meters)
          if (ratio < 0.05 || ratio > 20) {
            for (let i = 0; i < clonedTrack.values.length; i += 3) {
              clonedTrack.values[i] *= ratio;
              clonedTrack.values[i + 1] *= ratio;
              clonedTrack.values[i + 2] *= ratio;
            }
          }
        }

        // Optional In-Place clamp (prevents walk/run from drifting away in preview)
        if (options?.inPlace) {
          const startX = clonedTrack.values[0];
          const startZ = clonedTrack.values[2];
          for (let i = 0; i < clonedTrack.values.length; i += 3) {
            clonedTrack.values[i] -= startX;
            clonedTrack.values[i + 2] -= startZ;
          }
        }
      }

      newTracks.push(clonedTrack);
    }

    return new THREE.AnimationClip(clip.name, clip.duration, newTracks);
  }

  /**
   * Search for the specified hand bone (right or left) in an FBX hierarchy to attach an IT Bat
   */
  public static findHandBone(group: THREE.Object3D, hand: 'right' | 'left' = 'right'): THREE.Object3D | null {
    let found: THREE.Object3D | null = null;
    const keywords = hand === 'left' ? [
      'mixamoriglefthand',
      'lefthand',
      'left_hand',
      'hand_l',
      'hand.l',
      'bip01lhand',
      'bip01_l_hand',
      'l_hand',
      'wrist_l',
      'wrist.l',
      'weapon_l',
      'l_weapon',
      'prop_l',
    ] : [
      'mixamorigrighthand',
      'righthand',
      'right_hand',
      'hand_r',
      'hand.r',
      'bip01rhand',
      'bip01_r_hand',
      'r_hand',
      'wrist_r',
      'wrist.r',
      'weapon_r',
      'r_weapon',
      'prop_r',
    ];

    group.traverse((c) => {
      if (found) return;
      const lower = c.name.toLowerCase().replace(/[:_]/g, '');
      for (const kw of keywords) {
        const cleanKw = kw.replace(/[:_]/g, '');
        if (lower.includes(cleanKw)) {
          found = c;
          return;
        }
      }
    });

    return found;
  }

  public static findRightHandBone(group: THREE.Object3D): THREE.Object3D | null {
    return this.findHandBone(group, 'right');
  }

  /**
   * Creates a standalone 3D Whack Bat mesh
   */
  public static createBatMesh(): THREE.Group {
    const batGroup = new THREE.Group();
    batGroup.name = 'CustomCharacterBat';

    const gripMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.9,
    });
    const buckleMat = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      metalness: 0.9,
      roughness: 0.2,
    });
    const barrelMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.35,
      metalness: 0.15,
    });
    const hazardMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
    });

    const batHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.018, 0.18, 10),
      gripMat
    );
    batGroup.add(batHandle);

    const knob = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.022, 0.02, 10),
      buckleMat
    );
    knob.position.y = -0.09;
    batGroup.add(knob);

    const batBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.038, 0.02, 0.52, 12),
      barrelMat
    );
    batBarrel.position.y = 0.28;
    batBarrel.castShadow = true;
    batGroup.add(batBarrel);

    const ring1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0385, 0.037, 0.03, 12),
      hazardMat
    );
    ring1.position.y = 0.42;
    batGroup.add(ring1);

    const ring2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.034, 0.03, 12),
      hazardMat
    );
    ring2.position.y = 0.34;
    batGroup.add(ring2);

    return batGroup;
  }

  /**
   * Instantiates a ready-to-use CustomCharacterInstance with all AnimationActions mapped
   */
  public static createCharacterInstance(
    baseGroup: THREE.Group,
    clips: FBXAnimationSlots,
    config: FBXModelConfig
  ): CustomCharacterInstance {
    // Clone using SkeletonUtils so SkinnedMeshes and bones are properly cloned and rebound!
    const model = SkeletonUtils.clone(baseGroup) as THREE.Group;
    this.prepareFBXMesh(model);

    // Calculate the model's native coordinate unit scale (e.g. 100 for Mixamo cm, 1 for Blender m)
    const auto = this.calculateAutoScale(baseGroup, 1.78);
    const nativeUnitScale = Math.max(auto.height / 1.78, 0.01);

    // Create Root Transform Wrapper Group
    // By applying transforms to the wrapper, the entire coordinate system
    // (all bones, all meshes, and weapon) scales uniformly, and AnimationMixer
    // will never overwrite the wrapper's scale or rotation.
    const wrapper = new THREE.Group();
    wrapper.name = 'CustomCharacterRoot';
    wrapper.add(model);

    // Apply scale, position offsets, and rotation to the root wrapper
    wrapper.scale.setScalar(config.scale);
    wrapper.position.set(config.xOffset || 0, config.yOffset, config.zOffset || 0);
    wrapper.rotation.y = config.rotationY;

    // Create AnimationMixer attached to model
    const mixer = new THREE.AnimationMixer(model);

    // Retarget and create actions
    const actions: {
      idle?: THREE.AnimationAction;
      walk?: THREE.AnimationAction;
      run?: THREE.AnimationAction;
      attack?: THREE.AnimationAction;
    } = {};

    if (clips.idle) {
      const retargeted = this.retargetClip(clips.idle, model);
      actions.idle = mixer.clipAction(retargeted);
      actions.idle.setLoop(THREE.LoopRepeat, Infinity);
    }

    if (clips.walk) {
      const retargeted = this.retargetClip(clips.walk, model, { inPlace: true });
      actions.walk = mixer.clipAction(retargeted);
      actions.walk.setLoop(THREE.LoopRepeat, Infinity);
    }

    if (clips.run) {
      const retargeted = this.retargetClip(clips.run, model, { inPlace: true });
      actions.run = mixer.clipAction(retargeted);
      actions.run.setLoop(THREE.LoopRepeat, Infinity);
    }

    if (clips.attack) {
      const retargeted = this.retargetClip(clips.attack, model);
      actions.attack = mixer.clipAction(retargeted);
      actions.attack.setLoop(THREE.LoopOnce, 1);
      actions.attack.clampWhenFinished = true;
    }

    // Attach Whack Bat if enabled
    let batMesh: THREE.Group | undefined;
    if (config.attachBat) {
      const targetHand = config.batHand || 'right';
      const handBone = this.findHandBone(model, targetHand);
      batMesh = this.createBatMesh();

      // Size the bat to match the model's native bone space (nativeUnitScale)
      // Since wrapper.scale is applied to the root, the bat automatically scales
      // with the character in natural proportions!
      const batScaleMult = config.batScale ?? 1.0;
      batMesh.scale.setScalar(nativeUnitScale * batScaleMult);

      // Bat position offsets (scaled by nativeUnitScale)
      const posX = (config.batPosX ?? 0) * nativeUnitScale;
      const posY = (config.batPosY ?? 0) * nativeUnitScale;
      const posZ = (config.batPosZ ?? 0) * nativeUnitScale;

      // Bat rotation (degrees to radians)
      // Default: RotX 90°, RotY 0°, RotZ -30° aligns the bat pointing forward out of the palm for attack swings
      const rotX = (((config.batRotX ?? 90)) * Math.PI) / 180;
      const rotY = (((config.batRotY ?? 0)) * Math.PI) / 180;
      const rotZ = (((config.batRotZ ?? -30)) * Math.PI) / 180;
      batMesh.rotation.set(rotX, rotY, rotZ);

      if (handBone) {
        batMesh.position.set(posX, posY, posZ);
        handBone.add(batMesh);
      } else {
        // Fallback: place in target hand region relative to model in its local space
        const sideX = targetHand === 'left' ? -0.35 : 0.35;
        batMesh.position.set(
          (sideX + (config.batPosX ?? 0)) * nativeUnitScale,
          (0.9 + (config.batPosY ?? 0)) * nativeUnitScale,
          (0.2 + (config.batPosZ ?? 0)) * nativeUnitScale
        );
        model.add(batMesh);
      }
    }

    return {
      baseGroup: wrapper,
      mixer,
      clips,
      actions,
      config,
      batMesh,
    };
  }
}

