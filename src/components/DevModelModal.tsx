import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion } from 'motion/react';
import {
  Upload,
  Cpu,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Eye,
  Trash2,
  Sparkles,
  X,
  Swords,
  Footprints,
  User,
  Activity,
  Layers,
  Check,
  Compass,
  ArrowUpDown,
  Move,
  Bone,
} from 'lucide-react';
import {
  FBXCharacterManager,
  FBXModelConfig,
  FBXAnimationSlots,
  CustomCharacterInstance,
  AutoScaleResult,
  FBXInspection,
} from '../game/FBXCharacterManager';
import { soundManager } from '../audio/soundManager';
import { characterStorage, SavedCharacterRecord } from '../storage/characterStorage';

interface DevModelModalProps {
  onClose: () => void;
  onApplyCharacter: (instance: CustomCharacterInstance) => void;
  onResetDefaultCharacter: () => void;
  isCustomActive: boolean;
}

type AnimSlotKey = 'idle' | 'walk' | 'run' | 'attack';

interface SlotState {
  file: File | null;
  buffer: ArrayBuffer | null;
  clip: THREE.AnimationClip | null;
  name: string;
  source: 'upload' | 'embedded' | 'none';
  isWithoutSkin?: boolean;
  trackCount?: number;
  duration?: number;
}

export const DevModelModal: React.FC<DevModelModalProps> = ({
  onClose,
  onApplyCharacter,
  onResetDefaultCharacter,
  isCustomActive,
}) => {
  // Preview Canvas
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const previewSceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    previewModelGroup: THREE.Group;
    mixer: THREE.AnimationMixer | null;
    actions: Partial<Record<AnimSlotKey, THREE.AnimationAction>>;
    currentAction: THREE.AnimationAction | null;
    clock: THREE.Clock;
    animFrameId: number | null;
    isDragging: boolean;
    lastMouseX: number;
    lastMouseY: number;
    orbitYaw: number;
    orbitPitch: number;
    orbitDistance: number;
  } | null>(null);

  // Loaded base model
  const [baseModelGroup, setBaseModelGroup] = useState<THREE.Group | null>(null);
  const [baseModelFileName, setBaseModelFileName] = useState<string>('');
  const baseModelBufferRef = useRef<ArrayBuffer | null>(null);
  const [embeddedClips, setEmbeddedClips] = useState<THREE.AnimationClip[]>([]);
  const [boneCount, setBoneCount] = useState<number>(0);
  const [meshCount, setMeshCount] = useState<number>(0);
  const [baseHasMesh, setBaseHasMesh] = useState<boolean>(true);

  // Animation slots
  const [slots, setSlots] = useState<Record<AnimSlotKey, SlotState>>({
    idle: { file: null, buffer: null, clip: null, name: '', source: 'none' },
    walk: { file: null, buffer: null, clip: null, name: '', source: 'none' },
    run: { file: null, buffer: null, clip: null, name: '', source: 'none' },
    attack: { file: null, buffer: null, clip: null, name: '', source: 'none' },
  });

  // Model adjustments config
  const [config, setConfig] = useState<FBXModelConfig>({
    scale: 0.01,
    yOffset: 0,
    xOffset: 0,
    zOffset: 0,
    rotationY: 0,
    attachBat: true,
    batPosX: 0,
    batPosY: 0,
    batPosZ: 0,
    batRotX: 90,
    batRotY: 0,
    batRotZ: -30,
    batScale: 1.0,
  });

  // Target height input state
  const [targetHeightInput, setTargetHeightInput] = useState<string>('1.78');

  // UI state
  const [activePreviewAnim, setActivePreviewAnim] = useState<AnimSlotKey | 'none'>('idle');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [originalHeight, setOriginalHeight] = useState<number>(0);
  const [autoScaleResult, setAutoScaleResult] = useState<AutoScaleResult | null>(null);

  // Initialize preview 3D viewport
  useEffect(() => {
    if (!previewContainerRef.current) return;
    const container = previewContainerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);

    // Studio lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 1.3);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfff8eb, 1.8);
    dirLight.position.set(3, 8, 4);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.bias = -0.0001;
    dirLight.shadow.normalBias = 0.035;
    dirLight.shadow.radius = 2.5;
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    rimLight.position.set(-4, 4, -4);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xf59e0b, 0.6);
    fillLight.position.set(0, -1, 4);
    scene.add(fillLight);

    // Ground platform & circular grid
    const grid = new THREE.GridHelper(6, 12, 0x38bdf8, 0x1e293b);
    grid.position.y = 0;
    scene.add(grid);

    const ringGeo = new THREE.RingGeometry(0.8, 0.84, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.45 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.005;
    scene.add(ring);

    // Ground shadow disc under character
    const discGeo = new THREE.CircleGeometry(0.75, 32);
    const discMat = new THREE.MeshBasicMaterial({ color: 0x020617, transparent: true, opacity: 0.6 });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = 0.002;
    scene.add(disc);

    // Height reference pole (positioned at x = -0.85m)
    const poleGroup = new THREE.Group();
    poleGroup.position.set(-0.85, 0, 0);

    const poleGeo = new THREE.CylinderGeometry(0.008, 0.008, 2.2, 8);
    poleGeo.translate(0, 1.1, 0);
    const poleMat = new THREE.MeshBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.8 });
    const poleMesh = new THREE.Mesh(poleGeo, poleMat);
    poleGroup.add(poleMesh);

    // Height tick markers
    const createTick = (y: number, color: number, width: number = 0.1) => {
      const tickGeo = new THREE.BoxGeometry(width, 0.012, 0.012);
      tickGeo.translate(0, y, 0);
      const tickMat = new THREE.MeshBasicMaterial({ color });
      return new THREE.Mesh(tickGeo, tickMat);
    };

    poleGroup.add(createTick(0.5, 0x64748b, 0.08));
    poleGroup.add(createTick(1.0, 0x64748b, 0.1));
    poleGroup.add(createTick(1.5, 0x64748b, 0.08));
    // 1.78m - Target in-game technician height (Gold marker)
    poleGroup.add(createTick(1.78, 0xf59e0b, 0.18));
    // 2.0m - Door clearance (Sky blue marker)
    poleGroup.add(createTick(2.0, 0x38bdf8, 0.12));

    scene.add(poleGroup);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 1.35, 3.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const previewModelGroup = new THREE.Group();
    scene.add(previewModelGroup);

    const previewState = {
      scene,
      camera,
      renderer,
      previewModelGroup,
      mixer: null as THREE.AnimationMixer | null,
      actions: {} as Partial<Record<AnimSlotKey, THREE.AnimationAction>>,
      currentAction: null as THREE.AnimationAction | null,
      clock: new THREE.Clock(),
      animFrameId: null as number | null,
      isDragging: false,
      lastMouseX: 0,
      lastMouseY: 0,
      orbitYaw: 0,
      orbitPitch: 0.12,
      orbitDistance: 3.8,
    };

    previewSceneRef.current = previewState;

    // Render loop
    const render = () => {
      previewState.animFrameId = requestAnimationFrame(render);
      const delta = previewState.clock.getDelta();
      if (previewState.mixer) {
        previewState.mixer.update(delta);
      }

      // Update camera orbit
      const cx = previewState.orbitDistance * Math.sin(previewState.orbitYaw) * Math.cos(previewState.orbitPitch);
      const cz = previewState.orbitDistance * Math.cos(previewState.orbitYaw) * Math.cos(previewState.orbitPitch);
      const cy = 1.0 + previewState.orbitDistance * Math.sin(previewState.orbitPitch);
      previewState.camera.position.set(cx, cy, cz);
      previewState.camera.lookAt(0, 0.9, 0);

      renderer.render(scene, camera);
    };
    render();

    // Mouse orbit handlers
    const dom = renderer.domElement;
    const onMouseDown = (e: MouseEvent) => {
      previewState.isDragging = true;
      previewState.lastMouseX = e.clientX;
      previewState.lastMouseY = e.clientY;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!previewState.isDragging) return;
      const dx = e.clientX - previewState.lastMouseX;
      const dy = e.clientY - previewState.lastMouseY;
      previewState.orbitYaw -= dx * 0.01;
      previewState.orbitPitch = THREE.MathUtils.clamp(previewState.orbitPitch + dy * 0.008, -0.4, 0.8);
      previewState.lastMouseX = e.clientX;
      previewState.lastMouseY = e.clientY;
    };
    const onMouseUp = () => {
      previewState.isDragging = false;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      previewState.orbitDistance = THREE.MathUtils.clamp(previewState.orbitDistance + e.deltaY * 0.003, 1.2, 8.0);
    };

    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      if (previewState.animFrameId) {
        cancelAnimationFrame(previewState.animFrameId);
      }
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      if (dom.parentNode) {
        dom.parentNode.removeChild(dom);
      }
      renderer.dispose();
      previewSceneRef.current = null;
    };
  }, []);

  // Restore previously saved character and settings on mount if available
  useEffect(() => {
    let isCancelled = false;

    const restoreSavedCharacter = async () => {
      try {
        const record = await characterStorage.loadCharacter();
        if (!record || isCancelled) return;

        baseModelBufferRef.current = record.baseModelBuffer;
        setBaseModelFileName(record.baseModelFileName);
        setConfig({
          batPosX: 0,
          batPosY: 0,
          batPosZ: 0,
          batRotX: 90,
          batRotY: 0,
          batRotZ: -30,
          batScale: 1.0,
          ...record.config,
        });

        const group = await FBXCharacterManager.parseFBX(record.baseModelBuffer);
        FBXCharacterManager.prepareFBXMesh(group);

        if (isCancelled) return;

        const inspection = FBXCharacterManager.inspectFBX(group);
        setBoneCount(inspection.boneCount);
        setMeshCount(inspection.meshCount);
        setBaseHasMesh(inspection.hasMesh);

        const auto = FBXCharacterManager.calculateAutoScale(group, 1.78);
        setOriginalHeight(auto.height);
        setAutoScaleResult(auto);
        setTargetHeightInput((auto.height * record.config.scale).toFixed(2));

        const embedded = group.animations || [];
        setEmbeddedClips(embedded);
        setBaseModelGroup(group);

        // Reconstruct animation slots from saved record
        const newSlots: Record<AnimSlotKey, SlotState> = {
          idle: { file: null, buffer: null, clip: null, name: '', source: 'none' },
          walk: { file: null, buffer: null, clip: null, name: '', source: 'none' },
          run: { file: null, buffer: null, clip: null, name: '', source: 'none' },
          attack: { file: null, buffer: null, clip: null, name: '', source: 'none' },
        };

        for (const key of ['idle', 'walk', 'run', 'attack'] as AnimSlotKey[]) {
          const slotData = record.slots[key];
          if (!slotData) continue;

          if (slotData.source === 'upload' && slotData.buffer) {
            try {
              const animGroup = await FBXCharacterManager.parseFBX(slotData.buffer);
              if (animGroup.animations && animGroup.animations.length > 0) {
                const clip = animGroup.animations[0];
                newSlots[key] = {
                  file: null,
                  buffer: slotData.buffer,
                  clip,
                  name: slotData.name,
                  source: 'upload',
                  isWithoutSkin: slotData.isWithoutSkin,
                  trackCount: clip.tracks.length,
                  duration: clip.duration,
                };
              }
            } catch (e) {
              console.warn(`Failed to parse saved slot ${key}:`, e);
            }
          } else if (slotData.source === 'embedded' && slotData.name) {
            const found = embedded.find((c) => c.name === slotData.name);
            if (found) {
              newSlots[key] = {
                file: null,
                buffer: null,
                clip: found,
                name: found.name,
                source: 'embedded',
                trackCount: found.tracks.length,
                duration: found.duration,
              };
            }
          }
        }

        setSlots(newSlots);
        setSuccessMessage(`✨ โหลดโมเดลตัวละครล่าสุด "${record.baseModelFileName}" และการตั้งค่าที่บันทึกไว้เรียบร้อยแล้ว`);
      } catch (err) {
        console.warn('Error restoring character in modal:', err);
      }
    };

    restoreSavedCharacter();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Update preview 3D model whenever baseModelGroup, slots, or config changes
  useEffect(() => {
    const preview = previewSceneRef.current;
    if (!preview) return;

    preview.previewModelGroup.clear();
    preview.actions = {};
    preview.currentAction = null;

    if (!baseModelGroup) return;

    // Instantiate temporary model for preview
    const clips: FBXAnimationSlots = {
      idle: slots.idle.clip || undefined,
      walk: slots.walk.clip || undefined,
      run: slots.run.clip || undefined,
      attack: slots.attack.clip || undefined,
    };

    const instance = FBXCharacterManager.createCharacterInstance(baseModelGroup, clips, config);
    preview.mixer = instance.mixer;
    preview.actions = instance.actions;
    preview.previewModelGroup.add(instance.baseGroup);

    // Play active preview animation
    playPreviewAnimation(activePreviewAnim);
  }, [baseModelGroup, slots, config]);

  const playPreviewAnimation = (slotKey: AnimSlotKey | 'none') => {
    const preview = previewSceneRef.current;
    if (!preview) return;

    setActivePreviewAnim(slotKey);

    if (slotKey === 'none' || !preview.actions[slotKey]) {
      // If requested slot isn't available, fallback to idle or first available
      const fallbackKey = (['idle', 'walk', 'run', 'attack'] as AnimSlotKey[]).find((k) => preview.actions[k]);
      if (fallbackKey && preview.actions[fallbackKey]) {
        slotKey = fallbackKey;
      } else {
        if (preview.currentAction) {
          preview.currentAction.fadeOut(0.2);
          preview.currentAction = null;
        }
        return;
      }
    }

    const nextAction = preview.actions[slotKey];
    if (nextAction && nextAction !== preview.currentAction) {
      nextAction.reset();
      nextAction.fadeIn(0.2);
      nextAction.play();
      if (preview.currentAction) {
        preview.currentAction.fadeOut(0.2);
      }
      preview.currentAction = nextAction;
    }
  };

  // Handle Base Character File Upload
  const handleBaseModelFile = async (file: File) => {
    setIsLoading(true);
    setLoadingMessage('กำลังประมวลผลโมเดล FBX ตัวละคร...');
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const buffer = await file.arrayBuffer();
      baseModelBufferRef.current = buffer;
      const group = await FBXCharacterManager.parseFBX(buffer);
      FBXCharacterManager.prepareFBXMesh(group);

      const inspection = FBXCharacterManager.inspectFBX(group);
      setBoneCount(inspection.boneCount);
      setMeshCount(inspection.meshCount);
      setBaseHasMesh(inspection.hasMesh);

      // Auto-scale to fit game dimensions (~1.78m height) and ground feet
      const auto = FBXCharacterManager.calculateAutoScale(group, 1.78);
      setOriginalHeight(auto.height);
      setAutoScaleResult(auto);
      setConfig((prev) => ({
        ...prev,
        scale: auto.scale,
        yOffset: auto.recommendedYOffset,
        xOffset: auto.recommendedXOffset,
        zOffset: auto.recommendedZOffset,
      }));

      // Check embedded animations
      const embedded = group.animations || [];
      setEmbeddedClips(embedded);
      setBaseModelGroup(group);
      setBaseModelFileName(file.name);

      // Auto-map embedded clips if present
      const newSlots = { ...slots };
      if (embedded.length > 0) {
        embedded.forEach((clip) => {
          const lower = clip.name.toLowerCase();
          if (lower.includes('idle') && !newSlots.idle.clip) {
            newSlots.idle = { file: null, buffer: null, clip, name: clip.name, source: 'embedded', trackCount: clip.tracks.length, duration: clip.duration };
          } else if (lower.includes('walk') && !newSlots.walk.clip) {
            newSlots.walk = { file: null, buffer: null, clip, name: clip.name, source: 'embedded', trackCount: clip.tracks.length, duration: clip.duration };
          } else if (lower.includes('run') && !newSlots.run.clip) {
            newSlots.run = { file: null, buffer: null, clip, name: clip.name, source: 'embedded', trackCount: clip.tracks.length, duration: clip.duration };
          } else if ((lower.includes('attack') || lower.includes('punch') || lower.includes('swing')) && !newSlots.attack.clip) {
            newSlots.attack = { file: null, buffer: null, clip, name: clip.name, source: 'embedded', trackCount: clip.tracks.length, duration: clip.duration };
          }
        });

        // If no slot matched but we have at least 1 clip, assign it to idle
        if (!newSlots.idle.clip && embedded[0]) {
          newSlots.idle = { file: null, buffer: null, clip: embedded[0], name: embedded[0].name, source: 'embedded', trackCount: embedded[0].tracks.length, duration: embedded[0].duration };
        }
        setSlots(newSlots);
      }

      if (!inspection.hasMesh) {
        setErrorMessage(
          `⚠️ ไฟล์ "${file.name}" มีเฉพาะโครงกระดูกและแอนิเมชัน (Without Skin) ไม่มีผิวโมเดล 3D! แนะนำให้เลือกไฟล์โมเดลตัวละคร (With Skin) ในช่องนี้ และนำไฟล์นี้ไปใส่ในช่องท่าทางแอนิเมชันด้านล่าง`
        );
      } else {
        setSuccessMessage(
          `โหลดโมเดล "${file.name}" สำเร็จ! ⚡ สเกลอัตโนมัติ: ${auto.scale}x (สูง ~1.78m พอดีเกม | ส้นเท้าแตะพื้นพอดี | หน่วยตรวจพบ: ${auto.detectedUnit})`
        );
        soundManager.playRestoredWave();
      }
    } catch (err: any) {
      console.error('FBX Load Error:', err);
      setErrorMessage(`เกิดข้อผิดพลาดในการโหลดไฟล์ FBX: ${err.message || err}`);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Handle Animation File Upload for a specific slot (supports With Skin or Without Skin FBX)
  const handleAnimSlotFile = async (slotKey: AnimSlotKey, file: File) => {
    setIsLoading(true);
    setLoadingMessage(`กำลังประมวลผลไฟล์ท่าทาง ${slotKey.toUpperCase()}...`);
    setErrorMessage(null);

    try {
      const buffer = await file.arrayBuffer();
      const animGroup = await FBXCharacterManager.parseFBX(buffer);
      const clips = animGroup.animations || [];
      if (clips.length === 0) {
        throw new Error('ไม่พบข้อมูล AnimationClip ในไฟล์ FBX นี้');
      }

      const clip = clips[0];
      const inspection = FBXCharacterManager.inspectFBX(animGroup);

      setSlots((prev) => ({
        ...prev,
        [slotKey]: {
          file,
          buffer,
          clip,
          name: file.name,
          source: 'upload',
          isWithoutSkin: inspection.isAnimationOnly,
          trackCount: clip.tracks.length,
          duration: clip.duration,
        },
      }));

      const skinBadge = inspection.isAnimationOnly
        ? '🦴 ท่าทาง (Without Skin)'
        : '👤 ท่าทางพร้อมโมเดล';

      setSuccessMessage(
        `อัปเดตท่า ${slotKey.toUpperCase()} จาก "${file.name}" เรียบร้อย! [${skinBadge} · ${clip.tracks.length} Tracks · ${clip.duration.toFixed(1)}s]`
      );
      soundManager.playUiClick();
      setActivePreviewAnim(slotKey);
    } catch (err: any) {
      console.error(`Error loading animation ${slotKey}:`, err);
      setErrorMessage(`ไม่สามารถอ่านท่าทางจาก ${file.name}: ${err.message || err}`);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Multi-file drag & drop batch upload (Mixamo bundle helper)
  const handleBatchDrop = async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    const fbxFiles = fileList.filter((f) => f.name.toLowerCase().endsWith('.fbx'));
    if (fbxFiles.length === 0) {
      setErrorMessage('กรุณาเลือกไฟล์ที่มีนามสกุล .fbx');
      return;
    }

    setIsLoading(true);
    setLoadingMessage(`กำลังตรวจสอบชุดไฟล์ FBX ${fbxFiles.length} ไฟล์...`);
    setErrorMessage(null);

    try {
      // Step 1: Pre-inspect all files to distinguish models (with skin) from motion-only files (without skin)
      const parsedInfo: { file: File; inspection: FBXInspection; group: THREE.Group }[] = [];
      for (const f of fbxFiles) {
        const buf = await f.arrayBuffer();
        const grp = await FBXCharacterManager.parseFBX(buf);
        const insp = FBXCharacterManager.inspectFBX(grp);
        parsedInfo.push({ file: f, inspection: insp, group: grp });
      }

      // Find the file that has 3D mesh (With Skin) to use as the base character model
      let baseEntry = parsedInfo.find((p) => p.inspection.hasMesh);

      // If no file has mesh, or multiple have mesh, prioritize name keywords
      if (!baseEntry) {
        baseEntry = parsedInfo.find((p) => {
          const l = p.file.name.toLowerCase();
          return l.includes('character') || l.includes('mesh') || l.includes('model') || l.includes('tpose');
        }) || parsedInfo[0];
      }

      // Load base model
      await handleBaseModelFile(baseEntry.file);

      // Map animation files (whether with skin or without skin) to slots
      const animFiles = parsedInfo.filter((p) => p !== baseEntry);
      for (const item of animFiles) {
        const lower = item.file.name.toLowerCase();
        let targetSlot: AnimSlotKey | null = null;

        if (lower.includes('idle') || lower.includes('stand') || lower.includes('breathe')) {
          targetSlot = 'idle';
        } else if (lower.includes('walk') || lower.includes('march') || lower.includes('stride')) {
          targetSlot = 'walk';
        } else if (lower.includes('run') || lower.includes('sprint') || lower.includes('dash') || lower.includes('jog')) {
          targetSlot = 'run';
        } else if (
          lower.includes('attack') ||
          lower.includes('swing') ||
          lower.includes('hit') ||
          lower.includes('punch') ||
          lower.includes('slash') ||
          lower.includes('fight')
        ) {
          targetSlot = 'attack';
        }

        if (targetSlot) {
          await handleAnimSlotFile(targetSlot, item.file);
        }
      }

      setSuccessMessage(`โหลดชุดไฟล์สำเร็จ! ตัวละคร: "${baseEntry.file.name}" พร้อมท่าทางที่แนบ`);
    } catch (err: any) {
      setErrorMessage(`ข้อผิดพลาดในการโหลดไฟล์ชุด: ${err.message || err}`);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Clear animation from a slot
  const handleClearSlot = (slotKey: AnimSlotKey) => {
    setSlots((prev) => ({
      ...prev,
      [slotKey]: { file: null, buffer: null, clip: null, name: '', source: 'none' },
    }));
    soundManager.playUiClick();
  };

  // Apply to Game and Save to persistent storage
  const handleApplyToGame = async () => {
    if (!baseModelGroup) {
      setErrorMessage('กรุณาอัปโหลดไฟล์โมเดลตัวละคร FBX ก่อนนำไปใช้งานในเกม');
      return;
    }

    const clips: FBXAnimationSlots = {
      idle: slots.idle.clip || undefined,
      walk: slots.walk.clip || undefined,
      run: slots.run.clip || undefined,
      attack: slots.attack.clip || undefined,
    };

    const instance = FBXCharacterManager.createCharacterInstance(baseModelGroup, clips, config);

    // Save to persistent storage so closing/reopening keeps the latest model & settings
    if (baseModelBufferRef.current) {
      try {
        const slotsToSave: SavedCharacterRecord['slots'] = {};
        for (const key of ['idle', 'walk', 'run', 'attack'] as AnimSlotKey[]) {
          const s = slots[key];
          if (s.clip) {
            slotsToSave[key] = {
              name: s.name,
              source: s.source === 'upload' ? 'upload' : 'embedded',
              buffer: s.source === 'upload' && s.buffer ? s.buffer : undefined,
              isWithoutSkin: s.isWithoutSkin,
            };
          }
        }

        await characterStorage.saveCharacter({
          baseModelFileName,
          baseModelBuffer: baseModelBufferRef.current,
          slots: slotsToSave,
          config,
        });
      } catch (err) {
        console.warn('Failed to save character state:', err);
      }
    }

    onApplyCharacter(instance);
    soundManager.playComboUp(3);
    onClose();
  };

  // Save as permanent default package for all machines & GitHub Pages
  const handleSaveAsPermanentDefault = async () => {
    if (!baseModelGroup || !baseModelBufferRef.current) {
      setErrorMessage('กรุณาอัปโหลดไฟล์โมเดลตัวละคร FBX ก่อนบันทึกเป็นโมเดลหลัก');
      return;
    }

    setIsLoading(true);
    setLoadingMessage('กำลังแปลงและบันทึกโมเดลเป็นตัวละครหลักของโปรเจกต์...');

    try {
      const clips: FBXAnimationSlots = {
        idle: slots.idle.clip || undefined,
        walk: slots.walk.clip || undefined,
        run: slots.run.clip || undefined,
        attack: slots.attack.clip || undefined,
      };

      const slotsToSave: SavedCharacterRecord['slots'] = {};
      for (const key of ['idle', 'walk', 'run', 'attack'] as AnimSlotKey[]) {
        const s = slots[key];
        if (s.clip) {
          slotsToSave[key] = {
            name: s.name,
            source: s.source === 'upload' ? 'upload' : 'embedded',
            buffer: s.source === 'upload' && s.buffer ? s.buffer : undefined,
            isWithoutSkin: s.isWithoutSkin,
          };
        }
      }

      const recordToSave = {
        baseModelFileName,
        baseModelBuffer: baseModelBufferRef.current,
        slots: slotsToSave,
        config,
      };

      // 1. Save to local IndexedDB
      await characterStorage.saveCharacter(recordToSave);

      // 2. Serialize to portable package
      const pkg = characterStorage.serializePackage(recordToSave);
      const pkgString = JSON.stringify(pkg);

      // 3. Try server API to write to public/character/default_character.json
      let serverSaved = false;
      try {
        const res = await fetch('/api/save-default-character', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: pkgString,
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success) serverSaved = true;
        }
      } catch (e) {
        console.warn('Could not save directly to server:', e);
      }

      // 4. Also trigger file download as default_character.json so user has the file
      try {
        const blob = new Blob([pkgString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'default_character.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (e) {
        console.warn('Download error:', e);
      }

      // 5. Apply to active game
      const instance = FBXCharacterManager.createCharacterInstance(baseModelGroup, clips, config);
      onApplyCharacter(instance);

      soundManager.playComboUp(3);
      setSuccessMessage(
        serverSaved
          ? '🌟 บันทึกเป็นตัวละครหลักในโปรเจกต์ (public/character/default_character.json) สำเร็จแล้ว! เมื่อ Push ขึ้น GitHub ทุกเครื่องใหม่จะโหลดตัวละครนี้เป็นหลักทันที!'
          : '🌟 บันทึกเรียบร้อย และดาวน์โหลด default_character.json แล้ว! นำไฟล์ไปวางที่ public/character/ เพื่อใช้เป็นโมเดลหลักถาวร'
      );
    } catch (err: any) {
      setErrorMessage(`เกิดข้อผิดพลาดในการบันทึก: ${err.message || err}`);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Reset to default
  const handleReset = async () => {
    try {
      await characterStorage.clearCharacter();
    } catch (err) {
      console.warn('Failed to clear character storage:', err);
    }
    onResetDefaultCharacter();
    soundManager.playUiClick();
    onClose();
  };

  // Auto-fit character model to in-game dimensions (~1.78m) and floor level
  const handleAutoFit = (targetHeight: number = 1.78) => {
    if (!baseModelGroup) return;
    const auto = FBXCharacterManager.calculateAutoScale(baseModelGroup, targetHeight);
    setAutoScaleResult(auto);
    setConfig((prev) => ({
      ...prev,
      scale: auto.scale,
      yOffset: auto.recommendedYOffset,
      xOffset: auto.recommendedXOffset,
      zOffset: auto.recommendedZOffset,
    }));
    setTargetHeightInput(targetHeight.toString());
    soundManager.playRestoredWave();
    setSuccessMessage(`📐 ปรับ Scale อัตโนมัติ: ${auto.scale}x (สูง ~${targetHeight}m พอดีเกม | ส้นเท้าติดพื้นพอดี)`);
  };

  // Set explicit target height (meters)
  const handleApplyTargetHeight = (heightMeters: number) => {
    if (!baseModelGroup || isNaN(heightMeters) || heightMeters <= 0.1) return;
    const auto = FBXCharacterManager.calculateAutoScale(baseModelGroup, heightMeters);
    setConfig((prev) => ({
      ...prev,
      scale: auto.scale,
      yOffset: auto.recommendedYOffset,
    }));
    soundManager.playUiClick();
    setSuccessMessage(`📐 ปรับความสูงตัวละครเป็น ${heightMeters.toFixed(2)}m (Scale: ${auto.scale})`);
  };

  // Ground model feet to y = 0
  const handleSnapToFloor = () => {
    if (!baseModelGroup) return;
    const auto = FBXCharacterManager.calculateAutoScale(baseModelGroup, 1.78);
    setConfig((prev) => ({
      ...prev,
      yOffset: auto.recommendedYOffset,
    }));
    soundManager.playUiClick();
    setSuccessMessage(`🦶 วางส้นเท้าติดพื้นพอดี (y = 0.0m)`);
  };

  // Center model origin (X=0, Z=0)
  const handleCenterPivot = () => {
    if (!baseModelGroup) return;
    const auto = FBXCharacterManager.calculateAutoScale(baseModelGroup, 1.78);
    setConfig((prev) => ({
      ...prev,
      xOffset: auto.recommendedXOffset,
      zOffset: auto.recommendedZOffset,
    }));
    soundManager.playUiClick();
    setSuccessMessage(`🎯 จัดกึ่งกลางแกนหมุนตัวละคร (X=0, Z=0)`);
  };

  // Fine-tune scale multiplier (e.g. +5% or -5%)
  const handleScaleMultiplier = (multiplier: number) => {
    setConfig((prev) => {
      let newScale = prev.scale * multiplier;
      newScale = Math.round(newScale * 100000) / 100000;
      return {
        ...prev,
        scale: Math.max(0.00001, newScale),
      };
    });
    soundManager.playUiClick();
  };

  // Calculate current live height in meters
  const currentHeightMeters = originalHeight > 0 ? (originalHeight * config.scale).toFixed(2) : '1.78';

  return (
    <div
      id="dev-model-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 select-none"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="relative w-full max-w-6xl h-[94vh] max-h-[860px] rounded-2xl border border-slate-700/80 bg-slate-900/95 shadow-2xl text-slate-100 flex flex-col overflow-hidden"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                  <span>DEV STUDIO: CHARACTER & SKELETON ANIMATIONS</span>
                </h2>
                {isCustomActive && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 border border-emerald-500/50 text-emerald-400">
                    CUSTOM ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                รองรับไฟล์ตัวละคร (With Skin) และไฟล์ท่าทางกระดูกอย่างเดียว (Without Skin) จาก Mixamo / Blender
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playUiClick();
              onClose();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="ปิดหน้าต่าง [Esc]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Alerts */}
        {errorMessage && (
          <div className="mx-5 mt-2.5 p-2.5 rounded-xl border border-rose-500/40 bg-rose-950/50 text-rose-200 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mx-5 mt-2.5 p-2.5 rounded-xl border border-emerald-500/40 bg-emerald-950/50 text-emerald-200 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-400 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <div className="text-sm font-semibold text-white tracking-wide">{loadingMessage}</div>
          </div>
        )}

        {/* Main Content Grid: Left 3D Viewport, Right Controls */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* ========================================================================= */}
          {/* LEFT: 3D PREVIEW VIEWPORT & ANIMATION CONTROLS (7 Cols)                  */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950/50 relative">
            {/* Viewport Canvas */}
            <div
              ref={previewContainerRef}
              className="flex-1 w-full h-full min-h-[280px] cursor-grab active:cursor-grabbing relative"
            >
              {/* Instructions banner on canvas */}
              <div className="absolute top-3 left-3 z-10 pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/85 backdrop-blur-md border border-slate-700/60 text-[11px] text-slate-300 font-mono shadow-md">
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>คลิกลากหมุนมุมกล้อง · กลิ้งเมาส์ซูม</span>
              </div>

              {/* Real-time Height & Ground Gauge Badge */}
              {baseModelGroup && (
                <div className="absolute top-3 right-3 z-10 pointer-events-none flex flex-col items-end gap-1 px-3 py-1.5 rounded-lg bg-slate-900/85 backdrop-blur-md border border-slate-700/60 text-[11px] font-mono shadow-md">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="text-slate-400">ความสูงปัจจุบัน:</span>
                    <span className="text-amber-400 font-bold">{currentHeightMeters} ม.</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    ความสูงมาตรฐานในเกม: <span className="text-emerald-400 font-bold">1.78 ม.</span>
                  </div>
                </div>
              )}

              {!baseModelGroup && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
                  <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-700 flex items-center justify-center text-slate-600 mb-3">
                    <User className="w-8 h-8" />
                  </div>
                  <div className="text-sm font-bold text-slate-300">ยังไม่ได้อัปโหลดโมเดลตัวละคร</div>
                  <p className="text-xs text-slate-500 max-w-xs mt-1">
                    ลากไฟล์ .fbx จากคอมพิวเตอร์มาวางในหน้าต่างนี้ หรือกดเลือกไฟล์ที่เมนูด้านขวา
                  </p>
                </div>
              )}
            </div>

            {/* Animation Player Strip */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-semibold text-slate-400 mr-1 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  <span>ทดสอบท่า:</span>
                </span>

                {/* Idle button */}
                <button
                  onClick={() => playPreviewAnimation('idle')}
                  disabled={!slots.idle.clip}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activePreviewAnim === 'idle'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                      : slots.idle.clip
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      : 'bg-slate-900/50 text-slate-600 border border-slate-800 cursor-not-allowed'
                  }`}
                >
                  <Play className="w-3 h-3" />
                  <span>Idle</span>
                </button>

                {/* Walk button */}
                <button
                  onClick={() => playPreviewAnimation('walk')}
                  disabled={!slots.walk.clip && !slots.run.clip}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activePreviewAnim === 'walk'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                      : slots.walk.clip || slots.run.clip
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      : 'bg-slate-900/50 text-slate-600 border border-slate-800 cursor-not-allowed'
                  }`}
                >
                  <Footprints className="w-3 h-3" />
                  <span>Walk</span>
                </button>

                {/* Run button */}
                <button
                  onClick={() => playPreviewAnimation('run')}
                  disabled={!slots.run.clip && !slots.walk.clip}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activePreviewAnim === 'run'
                      ? 'bg-blue-500 text-slate-950 font-bold shadow-md shadow-blue-500/20'
                      : slots.run.clip || slots.walk.clip
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      : 'bg-slate-900/50 text-slate-600 border border-slate-800 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Run</span>
                </button>

                {/* Attack button */}
                <button
                  onClick={() => playPreviewAnimation('attack')}
                  disabled={!slots.attack.clip}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activePreviewAnim === 'attack'
                      ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20'
                      : slots.attack.clip
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      : 'bg-slate-900/50 text-slate-600 border border-slate-800 cursor-not-allowed'
                  }`}
                >
                  <Swords className="w-3 h-3" />
                  <span>Attack</span>
                </button>
              </div>

              {/* Bat attachment indicator & quick match button */}
              <div className="flex items-center gap-2">
                <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${config.attachBat ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                  <span>ไม้ไอที: {config.attachBat ? 'ติดมือขวา' : 'ปิด'}</span>
                </div>
                {config.attachBat && (
                  <button
                    type="button"
                    onClick={() => {
                      setConfig(prev => ({
                        ...prev,
                        batRotX: 90,
                        batRotY: 0,
                        batRotZ: -30,
                        batPosX: 0,
                        batPosY: 0,
                        batPosZ: 0,
                        batScale: 1.0,
                      }));
                      if (slots.attack.clip) {
                        playPreviewAnimation('attack');
                      }
                      soundManager.playUiClick();
                    }}
                    className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center gap-1 cursor-pointer transition-colors"
                    title="ปรับตำแหน่งและองศาไม้ให้ตรงกับท่าตี (Match Attack Pose)"
                  >
                    <span>🎯 ปรับไม้เข้าท่าตี</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT: UPLOAD SLOTS & TRANSFORM CONFIG (5 Cols)                          */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 flex flex-col p-4 sm:p-5 overflow-y-auto space-y-4">
            {/* Batch Dropzone (Drop multiple FBX files) */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer.files) {
                  handleBatchDrop(e.dataTransfer.files);
                }
              }}
              className="p-3.5 rounded-xl border-2 border-dashed border-amber-500/40 hover:border-amber-400 bg-amber-950/10 hover:bg-amber-950/20 transition-all text-center group cursor-pointer"
              onClick={() => {
                const input = document.getElementById('batch-fbx-input') as HTMLInputElement;
                input?.click();
              }}
            >
              <input
                id="batch-fbx-input"
                type="file"
                multiple
                accept=".fbx"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleBatchDrop(e.target.files);
                  }
                }}
              />
              <div className="flex flex-col items-center gap-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 group-hover:scale-105 transition-transform">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-amber-300">
                  ลากวางชุดไฟล์ FBX หรือคลิกเลือก (โมเดล + ท่าทางพร้อมกัน)
                </div>
                <p className="text-[11px] text-slate-400 leading-tight max-w-xs">
                  ระบบแยกไฟล์ตัวละคร (With Skin) และไฟล์ท่าทางกระดูกเดียวกัน (Without Skin) ให้อัตโนมัติ
                </p>
              </div>
            </div>

            {/* Slot 1: Base Character Model FBX */}
            <div className="p-3 rounded-xl border border-slate-700 bg-slate-950/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    1. โมเดลตัวละครหลัก (Base Mesh & Rig)
                  </span>
                </div>
                {baseModelGroup && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono font-semibold">
                    <Check className="w-3.5 h-3.5" /> พร้อมใช้งาน
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <label className="flex-1 flex items-center justify-between px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs cursor-pointer transition-colors overflow-hidden">
                  <span className="truncate max-w-[200px]">
                    {baseModelFileName || 'เลือกไฟล์ .fbx ตัวละคร (With Skin)...'}
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400 shrink-0">BROWSE</span>
                  <input
                    type="file"
                    accept=".fbx"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleBaseModelFile(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>

              {baseModelGroup && (
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono px-1">
                  <span>กระดูก: {boneCount}</span>
                  <span>เมช: {meshCount} {meshCount === 0 && <span className="text-amber-400">(Without Skin)</span>}</span>
                  <span>แอนิเมชันในตัว: {embeddedClips.length}</span>
                </div>
              )}
            </div>

            {/* Slots 2-5: Animation FBX Files (Idle, Walk, Run, Attack) */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Bone className="w-3.5 h-3.5 text-amber-400" />
                  <span>ท่าทางแอนิเมชัน (รองรับ Without Skin):</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500">MIXAMO / BLENDER RIG</span>
              </div>

              {/* Slot: Idle */}
              <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/40 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-[80px]">
                    <Play className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-semibold text-slate-200">Idle (ท่ายืน)</span>
                  </div>

                  <div className="flex-1 flex items-center gap-1">
                    {embeddedClips.length > 0 ? (
                      <select
                        value={slots.idle.name}
                        onChange={(e) => {
                          const clip = embeddedClips.find((c) => c.name === e.target.value);
                          if (clip) {
                            setSlots((prev) => ({
                              ...prev,
                              idle: { file: null, clip, name: clip.name, source: 'embedded', trackCount: clip.tracks.length, duration: clip.duration },
                            }));
                            setActivePreviewAnim('idle');
                          }
                        }}
                        className="w-full text-[11px] bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-300 font-mono"
                      >
                        <option value="">-- เลือกจากไฟล์โมเดล --</option>
                        {embeddedClips.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name} ({c.duration.toFixed(1)}s)
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-400 truncate max-w-[140px]">
                        {slots.idle.name || 'ยังไม่มีท่า'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <label className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-cyan-400 border border-slate-700 cursor-pointer shrink-0">
                      FBX
                      <input
                        type="file"
                        accept=".fbx"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleAnimSlotFile('idle', e.target.files[0]);
                        }}
                      />
                    </label>
                    {slots.idle.clip && (
                      <button
                        onClick={() => handleClearSlot('idle')}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800"
                        title="ลบออก"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {slots.idle.clip && (
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1 pt-0.5">
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" />
                      {slots.idle.isWithoutSkin ? '🦴 Without Skin' : slots.idle.source === 'embedded' ? '📦 ในโมเดล' : '👤 With Skin'}
                    </span>
                    <span>{slots.idle.trackCount || 0} Tracks · {(slots.idle.duration || 0).toFixed(1)}s</span>
                  </div>
                )}
              </div>

              {/* Slot: Walk */}
              <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/40 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-[80px]">
                    <Footprints className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-xs font-semibold text-slate-200">Walk (เดิน)</span>
                  </div>

                  <div className="flex-1 flex items-center gap-1">
                    {embeddedClips.length > 0 ? (
                      <select
                        value={slots.walk.name}
                        onChange={(e) => {
                          const clip = embeddedClips.find((c) => c.name === e.target.value);
                          if (clip) {
                            setSlots((prev) => ({
                              ...prev,
                              walk: { file: null, clip, name: clip.name, source: 'embedded', trackCount: clip.tracks.length, duration: clip.duration },
                            }));
                            setActivePreviewAnim('walk');
                          }
                        }}
                        className="w-full text-[11px] bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-300 font-mono"
                      >
                        <option value="">-- เลือกจากไฟล์โมเดล --</option>
                        {embeddedClips.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name} ({c.duration.toFixed(1)}s)
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-400 truncate max-w-[140px]">
                        {slots.walk.name || 'ยังไม่มีท่า (จะใช้ท่าวิ่งแทน)'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <label className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-cyan-400 border border-slate-700 cursor-pointer shrink-0">
                      FBX
                      <input
                        type="file"
                        accept=".fbx"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleAnimSlotFile('walk', e.target.files[0]);
                        }}
                      />
                    </label>
                    {slots.walk.clip && (
                      <button
                        onClick={() => handleClearSlot('walk')}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800"
                        title="ลบออก"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {slots.walk.clip && (
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1 pt-0.5">
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" />
                      {slots.walk.isWithoutSkin ? '🦴 Without Skin' : slots.walk.source === 'embedded' ? '📦 ในโมเดล' : '👤 With Skin'}
                    </span>
                    <span>{slots.walk.trackCount || 0} Tracks · {(slots.walk.duration || 0).toFixed(1)}s</span>
                  </div>
                )}
              </div>

              {/* Slot: Run */}
              <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/40 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-[80px]">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-xs font-semibold text-slate-200">Run (วิ่ง)</span>
                  </div>

                  <div className="flex-1 flex items-center gap-1">
                    {embeddedClips.length > 0 ? (
                      <select
                        value={slots.run.name}
                        onChange={(e) => {
                          const clip = embeddedClips.find((c) => c.name === e.target.value);
                          if (clip) {
                            setSlots((prev) => ({
                              ...prev,
                              run: { file: null, clip, name: clip.name, source: 'embedded', trackCount: clip.tracks.length, duration: clip.duration },
                            }));
                            setActivePreviewAnim('run');
                          }
                        }}
                        className="w-full text-[11px] bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-300 font-mono"
                      >
                        <option value="">-- เลือกจากไฟล์โมเดล --</option>
                        {embeddedClips.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name} ({c.duration.toFixed(1)}s)
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-400 truncate max-w-[140px]">
                        {slots.run.name || 'ยังไม่มีท่า (จะใช้ท่าเดินแทน)'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <label className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-cyan-400 border border-slate-700 cursor-pointer shrink-0">
                      FBX
                      <input
                        type="file"
                        accept=".fbx"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleAnimSlotFile('run', e.target.files[0]);
                        }}
                      />
                    </label>
                    {slots.run.clip && (
                      <button
                        onClick={() => handleClearSlot('run')}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800"
                        title="ลบออก"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {slots.run.clip && (
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1 pt-0.5">
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" />
                      {slots.run.isWithoutSkin ? '🦴 Without Skin' : slots.run.source === 'embedded' ? '📦 ในโมเดล' : '👤 With Skin'}
                    </span>
                    <span>{slots.run.trackCount || 0} Tracks · {(slots.run.duration || 0).toFixed(1)}s</span>
                  </div>
                )}
              </div>

              {/* Slot: Attack */}
              <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/40 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-[80px]">
                    <Swords className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-xs font-semibold text-slate-200">Attack (ตี [F])</span>
                  </div>

                  <div className="flex-1 flex items-center gap-1">
                    {embeddedClips.length > 0 ? (
                      <select
                        value={slots.attack.name}
                        onChange={(e) => {
                          const clip = embeddedClips.find((c) => c.name === e.target.value);
                          if (clip) {
                            setSlots((prev) => ({
                              ...prev,
                              attack: { file: null, clip, name: clip.name, source: 'embedded', trackCount: clip.tracks.length, duration: clip.duration },
                            }));
                            setActivePreviewAnim('attack');
                          }
                        }}
                        className="w-full text-[11px] bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-300 font-mono"
                      >
                        <option value="">-- เลือกจากไฟล์โมเดล --</option>
                        {embeddedClips.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name} ({c.duration.toFixed(1)}s)
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-400 truncate max-w-[140px]">
                        {slots.attack.name || 'ยังไม่มีท่า'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <label className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-cyan-400 border border-slate-700 cursor-pointer shrink-0">
                      FBX
                      <input
                        type="file"
                        accept=".fbx"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleAnimSlotFile('attack', e.target.files[0]);
                        }}
                      />
                    </label>
                    {slots.attack.clip && (
                      <button
                        onClick={() => handleClearSlot('attack')}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800"
                        title="ลบออก"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {slots.attack.clip && (
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1 pt-0.5">
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" />
                      {slots.attack.isWithoutSkin ? '🦴 Without Skin' : slots.attack.source === 'embedded' ? '📦 ในโมเดล' : '👤 With Skin'}
                    </span>
                    <span>{slots.attack.trackCount || 0} Tracks · {(slots.attack.duration || 0).toFixed(1)}s</span>
                  </div>
                )}
              </div>
            </div>

            {/* Transform Tuning & Auto-Scale Controls */}
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span>ปรับแต่งขนาดและตำแหน่ง (Transforms):</span>
                </span>
                <button
                  onClick={() => handleAutoFit(1.78)}
                  disabled={!baseModelGroup}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-40 transition-all flex items-center gap-1"
                  title="คำนวณและปรับขนาดโมเดลให้สูง 1.78m เท่ากับตัวละครช่างไอทีในเกม พร้อมจัดวางเท้าติดพื้นพอดี"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>AUTO-FIT (1.78m)</span>
                </button>
              </div>

              {/* Target Height Presets & Setter */}
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                  <span className="text-slate-400 flex items-center gap-1">
                    <ArrowUpDown className="w-3 h-3 text-amber-400" />
                    <span>ตั้งเป้าความสูงตัวละคร:</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.05"
                      min="0.5"
                      max="4.0"
                      value={targetHeightInput}
                      onChange={(e) => setTargetHeightInput(e.target.value)}
                      className="w-14 px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-amber-300 font-bold text-center text-[11px]"
                    />
                    <span className="text-slate-400 text-[10px]">m</span>
                    <button
                      onClick={() => handleApplyTargetHeight(parseFloat(targetHeightInput))}
                      disabled={!baseModelGroup}
                      className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 cursor-pointer disabled:opacity-40 font-bold"
                    >
                      ปรับ
                    </button>
                  </div>
                </div>

                {/* Preset target buttons */}
                <div className="grid grid-cols-4 gap-1 text-[10px] font-mono">
                  <button
                    onClick={() => handleAutoFit(1.70)}
                    disabled={!baseModelGroup}
                    className="py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer disabled:opacity-40"
                    title="ขนาดกระทัดรัด 1.70m"
                  >
                    1.70m
                  </button>
                  <button
                    onClick={() => handleAutoFit(1.78)}
                    disabled={!baseModelGroup}
                    className="py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 cursor-pointer disabled:opacity-40 font-bold"
                    title="ตัวละครไอทีมาตรฐานเกม 1.78m"
                  >
                    1.78m (เกม)
                  </button>
                  <button
                    onClick={() => handleAutoFit(1.85)}
                    disabled={!baseModelGroup}
                    className="py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer disabled:opacity-40"
                    title="สูงโปร่ง 1.85m"
                  >
                    1.85m
                  </button>
                  <button
                    onClick={() => handleAutoFit(2.00)}
                    disabled={!baseModelGroup}
                    className="py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer disabled:opacity-40"
                    title="ร่างใหญ่ 2.00m"
                  >
                    2.00m
                  </button>
                </div>
              </div>

              {/* Scale Slider & Manual Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
                  <span>สเกลขนาด (Scale):</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleScaleMultiplier(0.95)}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 border border-slate-700 cursor-pointer"
                      title="ลดขนาด 5%"
                    >
                      -5%
                    </button>
                    <input
                      type="number"
                      step="any"
                      value={config.scale}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > 0) {
                          setConfig({ ...config, scale: val });
                        }
                      }}
                      className="w-20 px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-amber-300 font-bold text-right text-[11px]"
                    />
                    <button
                      onClick={() => handleScaleMultiplier(1.05)}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 border border-slate-700 cursor-pointer"
                      title="เพิ่มขนาด 5%"
                    >
                      +5%
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min={Math.max(0.00005, (autoScaleResult?.scale || config.scale) * 0.1)}
                  max={Math.max(0.05, (autoScaleResult?.scale || config.scale) * 2.5)}
                  step={Math.max(0.00001, (autoScaleResult?.scale || config.scale) * 0.01)}
                  value={config.scale}
                  onChange={(e) => setConfig({ ...config, scale: parseFloat(e.target.value) })}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Y Offset & Grounding */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
                  <span>ระดับความสูงพื้น (Y Offset):</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-cyan-300 font-bold">{config.yOffset.toFixed(3)}m</span>
                    <button
                      onClick={handleSnapToFloor}
                      disabled={!baseModelGroup}
                      className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-950/60 hover:bg-cyan-900/70 text-cyan-300 border border-cyan-500/40 cursor-pointer disabled:opacity-40"
                      title="ปรับให้ส้นเท้าสัมผัสพื้นพอดี (y = 0)"
                    >
                      🦶 ติดพื้นพอดี
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min="-2.0"
                  max="2.0"
                  step="0.01"
                  value={config.yOffset}
                  onChange={(e) => setConfig({ ...config, yOffset: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Horizontal Pivot Center (X & Z Offset) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <Move className="w-3 h-3 text-slate-400" />
                    <span>แกนหมุนกึ่งกลาง (X / Z Offset):</span>
                  </span>
                  <button
                    onClick={handleCenterPivot}
                    disabled={!baseModelGroup}
                    className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer disabled:opacity-40"
                    title="จัดให้อยู่กึ่งกลางหมุนพอดี"
                  >
                    🎯 กึ่งกลาง
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>ซ้าย/ขวา (X):</span>
                      <span className="text-slate-200">{(config.xOffset || 0).toFixed(2)}m</span>
                    </div>
                    <input
                      type="range"
                      min="-1.0"
                      max="1.0"
                      step="0.01"
                      value={config.xOffset || 0}
                      onChange={(e) => setConfig({ ...config, xOffset: parseFloat(e.target.value) })}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>หน้า/หลัง (Z):</span>
                      <span className="text-slate-200">{(config.zOffset || 0).toFixed(2)}m</span>
                    </div>
                    <input
                      type="range"
                      min="-1.0"
                      max="1.0"
                      step="0.01"
                      value={config.zOffset || 0}
                      onChange={(e) => setConfig({ ...config, zOffset: parseFloat(e.target.value) })}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Facing Rotation */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <Compass className="w-3 h-3 text-amber-400" />
                    <span>ทิศทางการหันหน้า (Rotation):</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-300 font-bold">
                      {Math.round((config.rotationY * 180) / Math.PI)}°
                    </span>
                    <button
                      onClick={() => setConfig({ ...config, rotationY: (config.rotationY + Math.PI) % (Math.PI * 2) })}
                      className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                      title="กลับทิศ 180 องศา"
                    >
                      🔄 180°
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                  {[0, 90, 180, 270].map((deg) => {
                    const rad = (deg * Math.PI) / 180;
                    const isSelected = Math.abs(config.rotationY - rad) < 0.05;
                    return (
                      <button
                        key={deg}
                        onClick={() => setConfig({ ...config, rotationY: rad })}
                        className={`py-1 rounded text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        {deg}°
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Attach Bat & Bat Transform Controls */}
              <div className="pt-2 border-t border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-200">
                    <input
                      type="checkbox"
                      checked={config.attachBat}
                      onChange={(e) => setConfig({ ...config, attachBat: e.target.checked })}
                      className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                    />
                    <span className="flex items-center gap-1.5">
                      <Swords className="w-3.5 h-3.5 text-amber-400" />
                      ติดไม้ทุบแฮกเกอร์ (IT Bat)
                    </span>
                  </label>
                  {config.attachBat && (
                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setConfig(prev => ({ ...prev, batHand: 'right' }));
                          soundManager.playUiClick();
                        }}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          (config.batHand || 'right') === 'right'
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        ✋ มือขวา
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setConfig(prev => ({ ...prev, batHand: 'left' }));
                          soundManager.playUiClick();
                        }}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          config.batHand === 'left'
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        🤚 มือซ้าย
                      </button>
                    </div>
                  )}
                </div>

                {config.attachBat && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-3 text-xs">
                    {/* Header & Quick Action Presets */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                      <div>
                        <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                          <span>🎯 ปรับตำแหน่ง & องศาไม้ (Position & Rotation ไม้)</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          ถือข้าง: <span className="text-amber-400 font-bold">{config.batHand === 'left' ? 'มือซ้าย' : 'มือขวา'}</span> · ปรับให้ตรงกับท่าตีของตัวละคร
                        </p>
                      </div>
                      {slots.attack.clip && (
                        <button
                          type="button"
                          onClick={() => {
                            playPreviewAnimation('attack');
                            soundManager.playUiClick();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-600/30 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                        >
                          <Play className="w-3 h-3 fill-rose-300" />
                          <span>ดูท่าตี (Attack)</span>
                        </button>
                      )}
                    </div>

                    {/* Quick Presets Buttons */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setConfig(prev => ({
                            ...prev,
                            batRotX: 90,
                            batRotY: 0,
                            batRotZ: -30,
                            batPosX: 0,
                            batPosY: 0,
                            batPosZ: 0,
                            batScale: 1.0,
                          }));
                          if (slots.attack.clip) {
                            playPreviewAnimation('attack');
                          }
                          soundManager.playUiClick();
                        }}
                        className="py-1.5 px-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-medium text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        title="ปรับเข้ากับท่าฟาดหรือท่าโจมตีมาตรฐาน"
                      >
                        <span>💥 ท่าฟาด (Swing)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setConfig(prev => ({
                            ...prev,
                            batRotX: 0,
                            batRotY: 90,
                            batRotZ: 0,
                            batPosX: 0,
                            batPosY: 0,
                            batPosZ: 0,
                            batScale: 1.0,
                          }));
                          if (slots.attack.clip) {
                            playPreviewAnimation('attack');
                          }
                          soundManager.playUiClick();
                        }}
                        className="py-1.5 px-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-medium text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        title="ปรับไม้ให้พุ่งตรงไปข้างหน้า"
                      >
                        <span>👉 ชี้ไปข้างหน้า</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setConfig(prev => ({
                            ...prev,
                            batHand: prev.batHand === 'left' ? 'right' : 'left',
                          }));
                          if (slots.attack.clip) {
                            playPreviewAnimation('attack');
                          }
                          soundManager.playUiClick();
                        }}
                        className="py-1.5 px-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-medium text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        title="สลับมือข้างที่ถือไม้ (ซ้าย ↔ ขวา)"
                      >
                        <span>🤚 สลับมือ ({config.batHand === 'left' ? 'ซ้าย' : 'ขวา'})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setConfig(prev => ({
                            ...prev,
                            batRotZ: ((prev.batRotZ ?? -30) + 180) % 360,
                          }));
                          soundManager.playUiClick();
                        }}
                        className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        title="กลับหัวไม้ 180 องศา"
                      >
                        <span>🔄 สลับหัว 180°</span>
                      </button>
                    </div>

                    {/* Rotation Controls (Rot X, Rot Y, Rot Z) */}
                    <div className="space-y-2 pt-1">
                      <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                        <Compass className="w-3 h-3 text-cyan-400" />
                        <span>องศาการหมุนของไม้ (Rotation Degrees):</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {/* Rot X */}
                        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400 font-mono">Rot X (ก้ม/เงย)</span>
                            <span className="text-amber-400 font-mono font-bold">{Math.round(config.batRotX ?? 90)}°</span>
                          </div>
                          <input
                            type="range"
                            min="-180"
                            max="180"
                            step="5"
                            value={config.batRotX ?? 90}
                            onChange={(e) => setConfig({ ...config, batRotX: Number(e.target.value) })}
                            className="w-full accent-amber-500 cursor-pointer h-1.5"
                          />
                        </div>

                        {/* Rot Y */}
                        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400 font-mono">Rot Y (หันข้าง)</span>
                            <span className="text-cyan-400 font-mono font-bold">{Math.round(config.batRotY ?? 0)}°</span>
                          </div>
                          <input
                            type="range"
                            min="-180"
                            max="180"
                            step="5"
                            value={config.batRotY ?? 0}
                            onChange={(e) => setConfig({ ...config, batRotY: Number(e.target.value) })}
                            className="w-full accent-cyan-500 cursor-pointer h-1.5"
                          />
                        </div>

                        {/* Rot Z */}
                        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400 font-mono">Rot Z (เอียงกระบอง)</span>
                            <span className="text-rose-400 font-mono font-bold">{Math.round(config.batRotZ ?? -30)}°</span>
                          </div>
                          <input
                            type="range"
                            min="-180"
                            max="180"
                            step="5"
                            value={config.batRotZ ?? -30}
                            onChange={(e) => setConfig({ ...config, batRotZ: Number(e.target.value) })}
                            className="w-full accent-rose-500 cursor-pointer h-1.5"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Position Offsets (Pos X, Pos Y, Pos Z) & Scale */}
                    <div className="space-y-2 pt-1">
                      <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                        <Move className="w-3 h-3 text-amber-400" />
                        <span>ตำแหน่งขยับในมือ & ขนาดไม้ (Position & Scale):</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {/* Pos X */}
                        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-400 font-mono">ซ้าย-ขวา (X)</span>
                            <span className="text-slate-200 font-mono font-bold">{(config.batPosX ?? 0).toFixed(2)}m</span>
                          </div>
                          <input
                            type="range"
                            min="-0.25"
                            max="0.25"
                            step="0.01"
                            value={config.batPosX ?? 0}
                            onChange={(e) => setConfig({ ...config, batPosX: Number(e.target.value) })}
                            className="w-full accent-amber-500 cursor-pointer h-1.5"
                          />
                        </div>

                        {/* Pos Y */}
                        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-400 font-mono">ขึ้น-ลง (Y)</span>
                            <span className="text-slate-200 font-mono font-bold">{(config.batPosY ?? 0).toFixed(2)}m</span>
                          </div>
                          <input
                            type="range"
                            min="-0.25"
                            max="0.25"
                            step="0.01"
                            value={config.batPosY ?? 0}
                            onChange={(e) => setConfig({ ...config, batPosY: Number(e.target.value) })}
                            className="w-full accent-amber-500 cursor-pointer h-1.5"
                          />
                        </div>

                        {/* Pos Z */}
                        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-400 font-mono">หน้า-หลัง (Z)</span>
                            <span className="text-slate-200 font-mono font-bold">{(config.batPosZ ?? 0).toFixed(2)}m</span>
                          </div>
                          <input
                            type="range"
                            min="-0.25"
                            max="0.25"
                            step="0.01"
                            value={config.batPosZ ?? 0}
                            onChange={(e) => setConfig({ ...config, batPosZ: Number(e.target.value) })}
                            className="w-full accent-amber-500 cursor-pointer h-1.5"
                          />
                        </div>

                        {/* Scale */}
                        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-400 font-mono">ขนาดไม้ (Scale)</span>
                            <span className="text-amber-400 font-mono font-bold">{(config.batScale ?? 1.0).toFixed(2)}x</span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.05"
                            value={config.batScale ?? 1.0}
                            onChange={(e) => setConfig({ ...config, batScale: Number(e.target.value) })}
                            className="w-full accent-amber-500 cursor-pointer h-1.5"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2">
            {isCustomActive && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-800/80 bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>รีเซ็ตกลับเป็นตัวละครเดิม (Default IT Hero)</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <button
              onClick={() => {
                soundManager.playUiClick();
                onClose();
              }}
              className="px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              ปิด
            </button>

            <button
              onClick={handleSaveAsPermanentDefault}
              disabled={!baseModelGroup}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-cyan-500/60 bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-300 font-bold text-xs shadow-lg shadow-cyan-500/15 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="บันทึกให้เครื่องใหม่ๆ ทุกเครื่องที่เข้าเว็บโหลดตัวละครนี้เป็นหลักอัตโนมัติ"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>🌟 บันทึกเป็นโมเดลหลักทุกเครื่อง (SET AS DEFAULT)</span>
            </button>

            <button
              onClick={handleApplyToGame}
              disabled={!baseModelGroup}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
            >
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>🚀 ใช้ในเกมรอบนี้ (APPLY)</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
