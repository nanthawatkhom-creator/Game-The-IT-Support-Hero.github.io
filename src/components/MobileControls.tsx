import React, { useRef, useState, useEffect } from 'react';
import { Wrench, Zap } from 'lucide-react';

interface MobileControlsProps {
  onMove: (vector: { x: number; y: number }) => void;
  onInteract: () => void;
  onWhackBat?: () => void;
  canInteract: boolean;
  isHackerNear?: boolean;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onMove,
  onInteract,
  onWhackBat,
  canInteract,
  isHackerNear = false,
}) => {
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [touching, setTouching] = useState<boolean>(false);
  const touchIdRef = useRef<number | null>(null);

  const radius = 46;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (touchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    setTouching(true);
    updateKnob(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        updateKnob(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setTouching(false);
        setKnobPos({ x: 0, y: 0 });
        onMove({ x: 0, y: 0 });
        break;
      }
    }
  };

  const updateKnob = (clientX: number, clientY: number) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > radius) {
      dx = (dx / dist) * radius;
      dy = (dy / dist) * radius;
    }

    setKnobPos({ x: dx, y: dy });
    onMove({ x: dx / radius, y: -dy / radius }); // Normalized
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex items-end justify-between px-6 select-none md:hidden">
      {/* Joystick Base */}
      <div
        ref={joystickBaseRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="pointer-events-auto relative flex h-28 w-28 items-center justify-center rounded-full border-2 border-white/20 bg-slate-900/60 backdrop-blur-md shadow-2xl active:bg-slate-900/80"
      >
        <div
          className="h-14 w-14 rounded-full bg-blue-500/80 border-2 border-white/40 shadow-md shadow-blue-500/50 transition-transform"
          style={{
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          }}
        />
      </div>

      {/* Action Buttons Group */}
      <div className="pointer-events-auto flex items-center gap-3">
        {/* Whack Bat Button */}
        <button
          onClick={onWhackBat}
          className={`flex h-16 w-16 flex-col items-center justify-center rounded-full border-2 shadow-2xl transition-all active:scale-90 cursor-pointer ${
            isHackerNear
              ? 'border-red-400 bg-red-600 text-white font-black animate-bounce shadow-red-500/60 scale-110'
              : 'border-amber-500/60 bg-amber-600/90 text-white'
          }`}
        >
          <Zap className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-black">{isHackerNear ? 'ตีตัว [F]!' : 'ทุบ [F]'}</span>
        </button>

        {/* Interact / Repair Button */}
        <button
          onClick={onInteract}
          disabled={!canInteract}
          className={`flex h-20 w-20 flex-col items-center justify-center rounded-full border-2 shadow-2xl transition-all active:scale-90 cursor-pointer ${
            canInteract
              ? 'border-emerald-400 bg-emerald-500 text-slate-950 font-bold animate-pulse shadow-emerald-500/40'
              : 'border-slate-700 bg-slate-800/80 text-slate-500 opacity-50'
          }`}
        >
          <Wrench className="w-6 h-6 mb-0.5" />
          <span className="text-[10px] font-black">ซ่อม [E]</span>
        </button>
      </div>
    </div>
  );
};

