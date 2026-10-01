import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ComputerData, CableConnection } from '../types';
import { soundManager } from '../audio/soundManager';
import confetti from 'canvas-confetti';
import { CheckCircle2, AlertTriangle, Zap, Check, X, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';

interface MiniGameModalProps {
  computer: ComputerData;
  onSuccess: (computer: ComputerData) => void;
  onFail: (computer: ComputerData, reason: string) => void;
  onClose: () => void;
}

interface CableConfig {
  id: string;
  name: string;
  color: string;
  glowColor: string;
  label: string;
  icon: string;
}

const ALL_CABLE_CONFIGS: CableConfig[] = [
  {
    id: 'cable_power',
    name: 'สายไฟหลัก Main Power',
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    label: '220V AC (ขั้วทองเหลือง)',
    icon: '⚡',
  },
  {
    id: 'cable_hdmi',
    name: 'สายสัญญาณภาพ HDMI Display',
    color: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    label: '4K 144Hz (พอร์ตดิจิทัล)',
    icon: '🖥️',
  },
  {
    id: 'cable_lan',
    name: 'สายแลน LAN / Ethernet',
    color: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    label: '10 Gbps (หัวต่อ RJ-45)',
    icon: '🌐',
  },
  {
    id: 'cable_sata',
    name: 'สายบัสข้อมูล SSD / SATA',
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    label: 'NVMe Gen4 (ดาต้าบัส)',
    icon: '💾',
  },
];

interface Point {
  x: number;
  y: number;
}

export const MiniGameModal: React.FC<MiniGameModalProps> = ({
  computer,
  onSuccess,
  onFail,
}) => {
  // Determine cable configs for this difficulty (3 to 4 cables)
  const cablePool = useMemo(() => {
    const count = computer.repairDifficulty >= 2 ? 4 : 3;
    return ALL_CABLE_CONFIGS.slice(0, count);
  }, [computer.repairDifficulty]);

  // Shuffle right-side target slots so wires cross and require real matching!
  const targetSlots = useMemo(() => {
    const list = [...cablePool];
    // Fisher-Yates shuffle with fallback so it is never in 100% same order
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    // If by chance order is completely identical, swap first two
    if (list.length > 1 && list.every((item, idx) => item.id === cablePool[idx].id)) {
      [list[0], list[1]] = [list[1], list[0]];
    }
    return list;
  }, [cablePool]);

  // Cable state
  const [cables, setCables] = useState<CableConnection[]>(() => {
    return cablePool.map((cfg) => ({
      id: cfg.id,
      name: cfg.name,
      color: cfg.color,
      label: cfg.label,
      targetId: cfg.id,
      connectedTargetId: null,
      isConnected: false,
    }));
  });

  const [timeLeft, setTimeLeft] = useState<number>(14); // 14 seconds
  const maxTime = 14;
  const [gameState, setGameState] = useState<'playing' | 'success' | 'fail'>('playing');
  const timerRef = useRef<number | null>(null);

  // Dragging state
  const [draggingCableId, setDraggingCableId] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState<Point | null>(null);
  const [hoveredTargetId, setHoveredTargetId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  // Container refs for absolute coordinate calculation
  const boardRef = useRef<HTMLDivElement>(null);
  const leftPinRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const rightSocketRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [anchors, setAnchors] = useState<{
    left: Record<string, Point>;
    right: Record<string, Point>;
  }>({ left: {}, right: {} });

  // Measure anchor coordinates relative to boardRef
  const updateAnchors = () => {
    if (!boardRef.current) return;
    const boardRect = boardRef.current.getBoundingClientRect();

    const leftCoords: Record<string, Point> = {};
    leftPinRefs.current.forEach((el, id) => {
      if (el) {
        const r = el.getBoundingClientRect();
        leftCoords[id] = {
          x: r.right - boardRect.left,
          y: r.top + r.height / 2 - boardRect.top,
        };
      }
    });

    const rightCoords: Record<string, Point> = {};
    rightSocketRefs.current.forEach((el, id) => {
      if (el) {
        const r = el.getBoundingClientRect();
        rightCoords[id] = {
          x: r.left - boardRect.left,
          y: r.top + r.height / 2 - boardRect.top,
        };
      }
    });

    setAnchors({ left: leftCoords, right: rightCoords });
  };

  useEffect(() => {
    updateAnchors();
    const handleResize = () => updateAnchors();
    window.addEventListener('resize', handleResize);
    // Slight delay to ensure DOM is fully laid out
    const t = setTimeout(updateAnchors, 50);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(t);
    };
  }, [cablePool, targetSlots]);

  // Timer loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleFail('หมดเวลาต่อสายไฟ!');
          return 0;
        }
        if (prev <= 4) {
          soundManager.playSpark();
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  // Handle Drag Start
  const handlePointerDownPin = (
    cableId: string,
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    if (gameState !== 'playing') return;
    updateAnchors();

    // If cable was already connected, disconnect it for rewiring
    setCables((prev) =>
      prev.map((c) =>
        c.id === cableId ? { ...c, connectedTargetId: null, isConnected: false } : c
      )
    );

    // Capture pointer on board for reliable tracking across iframe
    if (boardRef.current) {
      boardRef.current.setPointerCapture(e.pointerId);
    }

    const boardRect = boardRef.current?.getBoundingClientRect();
    if (boardRect) {
      setCursorPos({
        x: e.clientX - boardRect.left,
        y: e.clientY - boardRect.top,
      });
    }

    setDraggingCableId(cableId);
    setHoveredTargetId(null);
    setFeedback(null);
    soundManager.playRotate();
  };

  // Handle Drag Move on Board
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingCableId || !boardRef.current) return;

    const boardRect = boardRef.current.getBoundingClientRect();
    const curX = e.clientX - boardRect.left;
    const curY = e.clientY - boardRect.top;
    setCursorPos({ x: curX, y: curY });

    // Check distance to all right target sockets
    let closestTargetId: string | null = null;
    let minDist = 48; // Snapping detection radius in px

    rightSocketRefs.current.forEach((el, id) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const targetCenterX = r.left - boardRect.left;
      const targetCenterY = r.top + r.height / 2 - boardRect.top;

      const dist = Math.hypot(curX - targetCenterX, curY - targetCenterY);
      if (dist < minDist) {
        minDist = dist;
        closestTargetId = id;
      }
    });

    setHoveredTargetId(closestTargetId);
  };

  // Handle Drag Release (Drop)
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingCableId) return;

    if (boardRef.current && boardRef.current.hasPointerCapture(e.pointerId)) {
      boardRef.current.releasePointerCapture(e.pointerId);
    }

    const currentDragging = draggingCableId;
    const target = hoveredTargetId;

    setDraggingCableId(null);
    setCursorPos(null);
    setHoveredTargetId(null);

    if (!target) {
      // Released in blank air: wire drops back
      soundManager.playSpark();
      setFeedback({ text: 'ลากสายไปเสียบเข้าช่องฝั่งขวา!', isError: true });
      return;
    }

    // Check if target socket matches this cable
    if (currentDragging === target) {
      // Correct connection!
      soundManager.playConnect();
      setFeedback({ text: '⚡ เสียบสายถูกต้อง! สัญญาณออนไลน์', isError: false });

      setCables((prev) => {
        const next = prev.map((c) =>
          c.id === currentDragging
            ? { ...c, connectedTargetId: target, isConnected: true }
            : c
        );

        // Check if all are connected
        const allDone = next.every((c) => c.isConnected);
        if (allDone) {
          setTimeout(handleSuccess, 250);
        }

        return next;
      });
    } else {
      // Incorrect connection! Wrong port
      soundManager.playSpark();
      setFeedback({ text: '❌ ผิดช่อง! ประเภทสายและสีไม่ตรงกัน', isError: true });
    }
  };

  const handleSuccess = () => {
    if (gameState !== 'playing') return;
    setGameState('success');
    if (timerRef.current) clearInterval(timerRef.current);
    soundManager.playSuccess();

    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    setTimeout(() => {
      onSuccess(computer);
    }, 1200);
  };

  const handleFail = (reason: string) => {
    if (gameState !== 'playing') return;
    setGameState('fail');
    if (timerRef.current) clearInterval(timerRef.current);
    soundManager.playFail();

    setTimeout(() => {
      onFail(computer, reason);
    }, 1400);
  };

  const connectedCount = cables.filter((c) => c.isConnected).length;
  const progressPercent = (connectedCount / cables.length) * 100;
  const timePercent = (timeLeft / maxTime) * 100;

  // Render SVG Bezier Curve for a wire
  const renderWirePath = (
    start: Point,
    end: Point,
    color: string,
    isActiveDrag: boolean = false,
    isConnected: boolean = false
  ) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    // Natural horizontal cable curve with sag
    const controlDist = Math.max(35, Math.abs(dx) * 0.45);
    const sag = isActiveDrag ? 15 : Math.sin(Math.PI * 0.5) * 8;

    const p1 = `${start.x} ${start.y}`;
    const c1 = `${start.x + controlDist} ${start.y + (dy > 0 ? sag : -sag)}`;
    const c2 = `${end.x - controlDist} ${end.y + (dy < 0 ? sag : -sag)}`;
    const p2 = `${end.x} ${end.y}`;

    const d = `M ${p1} C ${c1}, ${c2}, ${p2}`;

    return (
      <g key={`wire-${start.x}-${start.y}-${end.x}-${end.y}`}>
        {/* Wire drop shadow */}
        <path
          d={d}
          fill="none"
          stroke="rgba(0,0,0,0.5)"
          strokeWidth={isActiveDrag ? 12 : 10}
          strokeLinecap="round"
        />
        {/* Outer Heavy Rubber Jacket */}
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={isActiveDrag ? 9 : 8}
          strokeLinecap="round"
          opacity={isConnected ? 1 : 0.85}
        />
        {/* Inner Luminous Core */}
        <path
          d={d}
          fill="none"
          stroke="#ffffff"
          strokeWidth={isActiveDrag ? 3 : 2.5}
          strokeLinecap="round"
          strokeDasharray={isConnected ? '6 10' : 'none'}
          className={isConnected ? 'animate-pulse' : ''}
          opacity={isConnected ? 0.9 : 0.6}
        />
        {/* Plug tip head when dragging */}
        {isActiveDrag && (
          <g transform={`translate(${end.x}, ${end.y})`}>
            <circle r={10} fill={color} stroke="#ffffff" strokeWidth={2.5} />
            <circle r={4} fill="#ffffff" className="animate-ping" />
          </g>
        )}
      </g>
    );
  };

  return (
    <div
      id="mini-game-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 md:p-4 select-none"
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl p-5 md:p-6 text-slate-100 overflow-hidden"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-black tracking-tight text-white">
                  ลากสายไฟกู้ชีพคอมพิวเตอร์ (CONNECT WIRES)
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[11px] font-mono text-slate-300">
                  {computer.name}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {computer.sectionName} &bull; ระดับความยาก: {cables.length} สายสัญญาณ
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[11px] text-slate-400 font-medium">เวลาที่เหลือ</div>
            <div
              className={`font-mono text-2xl font-black tracking-tight ${
                timeLeft <= 4 ? 'text-red-400 animate-pulse' : 'text-amber-400'
              }`}
            >
              00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
            </div>
          </div>
        </div>

        {/* Live Instruction / Drag Tip Banner */}
        <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-950/80 border border-slate-800 px-3 py-2 text-xs mb-3">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-black text-[11px]">
              👉
            </span>
            <span>
              <strong className="text-white">วิธีเล่น:</strong> คลิกลากหัวปลั๊กจาก <span className="text-amber-300 font-bold">ฝั่งซ้าย</span> ไปเสียบเข้าพอร์ต <span className="text-blue-300 font-bold">ฝั่งขวา</span> ที่มีสีและประเภทตรงกัน
            </span>
          </div>

          {/* Feedback Toast */}
          {feedback && (
            <span
              className={`text-[11px] px-2.5 py-0.5 rounded-md font-bold tracking-tight shrink-0 transition-all ${
                feedback.isError
                  ? 'bg-rose-950 text-rose-300 border border-rose-600/50 animate-bounce'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-600/50'
              }`}
            >
              {feedback.text}
            </span>
          )}
        </div>

        {/* Time Progress Bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-4">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              timeLeft <= 4 ? 'bg-red-500' : 'bg-amber-400'
            }`}
            style={{ width: `${timePercent}%` }}
          />
        </div>

        {/* Main Interactive Wire Board */}
        <div
          ref={boardRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative w-full rounded-2xl bg-slate-950 border border-slate-800 p-4 md:p-6 overflow-hidden touch-none select-none shadow-inner"
          style={{ minHeight: `${cables.length * 68 + 40}px` }}
        >
          {/* Subtle Background Circuit Grid */}
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, #64748b 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* SVG Canvas for Drawing Physical Wires */}
          <svg
            className="pointer-events-none absolute inset-0 w-full h-full z-10"
            style={{ overflow: 'visible' }}
          >
            {/* 1. Draw Already Connected Wires */}
            {cables.map((cable) => {
              if (!cable.isConnected || !cable.connectedTargetId) return null;
              const start = anchors.left[cable.id];
              const end = anchors.right[cable.connectedTargetId];
              if (!start || !end) return null;
              return renderWirePath(start, end, cable.color, false, true);
            })}

            {/* 2. Draw Active Dragging Wire */}
            {draggingCableId && cursorPos && anchors.left[draggingCableId] && (
              renderWirePath(
                anchors.left[draggingCableId],
                cursorPos,
                cables.find((c) => c.id === draggingCableId)?.color || '#f59e0b',
                true,
                false
              )
            )}
          </svg>

          {/* Wire Terminals Layout: Left (Sources) vs Right (Targets) */}
          <div className="relative z-20 flex justify-between items-center h-full gap-8">
            {/* LEFT COLUMN: Source Pins */}
            <div className="flex flex-col justify-around gap-4 md:gap-5 w-[44%]">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pb-1 border-b border-slate-800">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>พอร์ตส่ง (SOURCE PINS)</span>
              </div>

              {cables.map((cable, idx) => {
                const isDragging = draggingCableId === cable.id;

                return (
                  <div
                    key={cable.id}
                    id={`source-cable-${idx}`}
                    onPointerDown={(e) => handlePointerDownPin(cable.id, e)}
                    className={`group relative flex items-center justify-between p-2.5 md:p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                      cable.isConnected
                        ? 'border-emerald-500/50 bg-emerald-950/20'
                        : isDragging
                        ? 'border-amber-400 bg-amber-500/20 shadow-lg shadow-amber-500/20'
                        : 'border-slate-800 bg-slate-900/90 hover:border-slate-700 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold text-slate-900 shadow-sm"
                        style={{ backgroundColor: cable.color }}
                      >
                        {idx + 1}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-200 truncate">
                          {cable.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {cable.label}
                        </div>
                      </div>
                    </div>

                    {/* Left Physical Connector Pin Anchor */}
                    <div
                      ref={(el) => {
                        if (el) leftPinRefs.current.set(cable.id, el);
                        else leftPinRefs.current.delete(cable.id);
                      }}
                      className={`relative flex items-center justify-center w-7 h-7 rounded-lg border-2 shrink-0 transition-transform ${
                        cable.isConnected
                          ? 'border-emerald-400 bg-emerald-500 shadow-sm shadow-emerald-400'
                          : isDragging
                          ? 'border-amber-400 bg-amber-500 scale-110 shadow-md shadow-amber-400'
                          : 'border-slate-600 bg-slate-800 group-hover:border-slate-400'
                      }`}
                      style={{
                        borderColor: isDragging || cable.isConnected ? undefined : cable.color,
                      }}
                    >
                      {cable.isConnected ? (
                        <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                      ) : (
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: cable.color }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* RIGHT COLUMN: Target Sockets (Shuffled) */}
            <div className="flex flex-col justify-around gap-4 md:gap-5 w-[44%]">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-end gap-1.5 pb-1 border-b border-slate-800">
                <span>ช่องเสียบเป้าหมาย (TARGET SOCKETS)</span>
                <span className="w-2 h-2 rounded-full bg-blue-400" />
              </div>

              {targetSlots.map((target, idx) => {
                const isMatched = cables.some(
                  (c) => c.connectedTargetId === target.id && c.isConnected
                );
                const isHovered = hoveredTargetId === target.id;

                return (
                  <div
                    key={target.id}
                    id={`target-socket-${idx}`}
                    className={`relative flex items-center justify-between p-2.5 md:p-3 rounded-xl border transition-all ${
                      isMatched
                        ? 'border-emerald-500/60 bg-emerald-950/20'
                        : isHovered
                        ? 'border-blue-400 bg-blue-500/20 scale-[1.02] shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/50'
                        : 'border-slate-800 bg-slate-900/90'
                    }`}
                  >
                    {/* Right Physical Receiver Socket Anchor */}
                    <div
                      ref={(el) => {
                        if (el) rightSocketRefs.current.set(target.id, el);
                        else rightSocketRefs.current.delete(target.id);
                      }}
                      className={`relative flex items-center justify-center w-7 h-7 rounded-lg border-2 shrink-0 transition-transform ${
                        isMatched
                          ? 'border-emerald-400 bg-emerald-500 shadow-sm shadow-emerald-400'
                          : isHovered
                          ? 'border-blue-400 bg-blue-500 scale-110 shadow-md shadow-blue-400 animate-pulse'
                          : 'border-slate-700 bg-slate-950'
                      }`}
                      style={{
                        borderColor: isMatched ? undefined : target.color,
                      }}
                    >
                      {isMatched ? (
                        <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                      ) : (
                        <div
                          className="w-2.5 h-2.5 rounded-sm border"
                          style={{
                            borderColor: target.color,
                            backgroundColor: isHovered ? target.color : 'transparent',
                          }}
                        />
                      )}
                    </div>

                    <div className="truncate text-right pl-2">
                      <div className="text-xs font-bold text-slate-200 truncate flex items-center justify-end gap-1.5">
                        <span>{target.name}</span>
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                          style={{ backgroundColor: target.color }}
                        />
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {target.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Progress & Abort */}
        <div className="flex items-center justify-between pt-4 mt-1 border-t border-slate-800/80">
          <button
            id="abort-repair-btn"
            onClick={() => handleFail('ผู้เล่นยกเลิกการซ่อม')}
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            ยกเลิกการซ่อม (เสียเวลา)
          </button>

          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-400">
              ต่อสายสำเร็จ: <strong className="font-mono text-white">{connectedCount} / {cables.length}</strong>
            </div>
            <div className="w-28 bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300 rounded-full shadow-sm shadow-emerald-400"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Success Overlay */}
        <AnimatePresence>
          {gameState === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-emerald-950/95 backdrop-blur-md text-center p-6"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-400 flex items-center justify-center mb-4 shadow-xl shadow-emerald-500/30 animate-bounce">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-emerald-300 tracking-tight mb-2">
                REPAIR COMPLETE! (ต่อสายสำเร็จ!)
              </h3>
              <p className="text-emerald-100 text-sm max-w-sm">
                สัญญาณดิจิทัลเชื่อมต่อตรงขั้วครบทุกช่อง คอมพิวเตอร์บูตกลับมาพร้อมทำงาน (+1 แต้ม)
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fail Overlay */}
        <AnimatePresence>
          {gameState === 'fail' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-red-950/95 backdrop-blur-md text-center p-6"
            >
              <div className="w-20 h-20 rounded-full bg-red-500/20 text-red-400 border-2 border-red-500 flex items-center justify-center mb-4 shadow-xl shadow-red-500/30">
                <X className="w-12 h-12" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-red-400 tracking-tight mb-2">
                FAILED! (ซ่อมไม่สำเร็จ)
              </h3>
              <p className="text-red-200 text-sm max-w-sm mb-1">
                การเชื่อมต่อสายสัญญาณไม่เสร็จสิ้น คอมพิวเตอร์ยังคงอยู่ในสภาพเสีย
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
