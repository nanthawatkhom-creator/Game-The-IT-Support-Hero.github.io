import React from 'react';
import { motion } from 'motion/react';
import { Play, RotateCcw, HelpCircle, Settings, Home, Shield, Monitor, Cpu } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenHelp: () => void;
  onOpenSettings: () => void;
  onOpenDevMenu?: () => void;
  onExitToMenu: () => void;
  timeRemaining: number;
  repairedCount: number;
  malwareCount: number;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onOpenHelp,
  onOpenSettings,
  onOpenDevMenu,
  onExitToMenu,
  timeRemaining,
  repairedCount,
  malwareCount,
}) => {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeFormatted = `${minutes < 10 ? `0${minutes}` : minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;

  return (
    <div
      id="pause-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 select-none"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/95 shadow-2xl text-slate-100 p-6 flex flex-col gap-5"
      >
        {/* Pause Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-[11px] font-mono font-medium text-slate-300 uppercase tracking-widest mb-1">
            MISSION PAUSED
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            พักภารกิจชั่วคราว
          </h2>
          <p className="text-xs text-slate-400">
            ระบบหยุดเวลาไว้ชั่วคราว เลือกคำสั่งที่ต้องการด้านล่าง
          </p>
        </div>

        {/* Current Mission Status Briefing */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl border border-slate-800 bg-slate-950/60 text-center">
          <div>
            <div className="text-[10px] text-slate-400 font-medium uppercase">เวลาที่เหลือ</div>
            <div className="text-lg font-mono font-bold text-amber-400">{timeFormatted}</div>
          </div>
          <div className="border-x border-slate-800">
            <div className="text-[10px] text-slate-400 font-medium uppercase">ซ่อมสำเร็จ</div>
            <div className="text-lg font-mono font-bold text-emerald-400">{repairedCount} เครื่อง</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium uppercase">มัลแวร์ตกค้าง</div>
            <div className={`text-lg font-mono font-bold ${malwareCount > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
              {malwareCount}/2
            </div>
          </div>
        </div>

        {/* Menu Actions */}
        <div className="flex flex-col gap-2">
          {/* Resume */}
          <button
            onClick={() => {
              soundManager.playUiClick();
              onResume();
            }}
            onMouseEnter={() => soundManager.playUiHover()}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all cursor-pointer active:scale-98"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>กลับสู่การปฏิบัติหน้าที่ (Resume)</span>
          </button>

          {/* Restart */}
          <button
            onClick={() => {
              soundManager.playUiClick();
              onRestart();
            }}
            onMouseEnter={() => soundManager.playUiHover()}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 hover:text-white text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>เริ่มรอบใหม่ (Restart Shift)</span>
          </button>

          {/* How to Play */}
          <button
            onClick={() => {
              soundManager.playUiClick();
              onOpenHelp();
            }}
            onMouseEnter={() => soundManager.playUiHover()}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 hover:text-white text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            <span>คู่มือการเล่น (How to Play)</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => {
              soundManager.playUiClick();
              onOpenSettings();
            }}
            onMouseEnter={() => soundManager.playUiHover()}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 hover:text-white text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span>การตั้งค่าเสียงและมุมกล้อง (Settings)</span>
          </button>

          {/* Dev Menu: FBX Model & Animations */}
          {onOpenDevMenu && (
            <button
              onClick={() => {
                soundManager.playUiClick();
                onOpenDevMenu();
              }}
              onMouseEnter={() => soundManager.playUiHover()}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-amber-500/40 bg-amber-950/20 hover:bg-amber-950/40 text-amber-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              <Cpu className="w-4 h-4 text-amber-400" />
              <span>🛠️ Dev Menu: อัปโหลดโมเดลตัวละคร FBX & ท่าทาง</span>
            </button>
          )}

          {/* Exit to Main Menu */}
          <button
            onClick={() => {
              soundManager.playUiClick();
              onExitToMenu();
            }}
            onMouseEnter={() => soundManager.playUiHover()}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-rose-900/60 bg-rose-950/20 hover:bg-rose-900/30 text-rose-300 font-semibold text-xs transition-colors cursor-pointer mt-1"
          >
            <Home className="w-4 h-4" />
            <span>ออกจากเกมกลับเมนูหลัก (Exit to Main Menu)</span>
          </button>
        </div>

        {/* Shortcut hint */}
        <div className="text-center text-[11px] text-slate-500">
          กด <span className="font-mono text-slate-400 font-bold">[Esc]</span> เพื่อสลับหน้าต่างพักเกม
        </div>
      </motion.div>
    </div>
  );
};
