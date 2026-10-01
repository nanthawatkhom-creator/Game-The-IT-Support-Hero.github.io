import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, BookOpen, Settings, Volume2, VolumeX, Shield, Terminal, Zap, Flame, Monitor, HardDrive, User, Cpu } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface MainMenuProps {
  onStartGame: () => void;
  onOpenHowToPlay: () => void;
  onOpenSettings: () => void;
  onOpenDevMenu?: () => void;
  isCustomActive?: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  onOpenHowToPlay,
  onOpenSettings,
  onOpenDevMenu,
  isCustomActive = false,
  isMuted,
  onToggleMute,
}) => {
  // Listen for Enter or Space to quickly start game
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        soundManager.playUiClick();
        onStartGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame]);

  return (
    <div
      id="game-main-menu"
      className="absolute inset-0 z-40 flex flex-col justify-between p-6 md:p-10 select-none pointer-events-none"
    >
      {/* Subtle cinematic gradient vignette over 3D canvas */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/50 to-slate-950/20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/60 pointer-events-none" />

      {/* Top Header Row */}
      <header className="relative z-10 flex items-center justify-between w-full pointer-events-auto">
        {/* Brand Lockup */}
        <div className="flex items-center gap-3">
          <div className="relative overflow-hidden w-10 h-10 rounded-xl border border-cyan-500/40 bg-slate-900 shadow-lg shadow-cyan-500/10 flex items-center justify-center">
            <img
              src="/src/assets/images/it_hero_badge_1790298619514.jpg"
              alt="IT Hero Insignia"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Graceful fallback container
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
            <Monitor className="w-5 h-5 text-cyan-400 absolute" />
          </div>
          <div>
            <span className="text-xs font-mono font-semibold tracking-wider text-cyan-400 uppercase">
              FACILITY INCIDENT RESPONSE · v2.4
            </span>
            <div className="text-xs text-slate-400 font-medium">
              HEADQUARTERS FLOOR 14 · IT OPERATIONS
            </div>
          </div>
        </div>

        {/* Top Right Utilities */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950/70 text-xs text-slate-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>OPERATOR: TECH-01</span>
          </div>

          <button
            onClick={() => {
              soundManager.playUiClick();
              onToggleMute();
            }}
            onMouseEnter={() => soundManager.playUiHover()}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-800 bg-slate-950/70 text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
            title={isMuted ? 'เปิดเสียง (Unmute)' : 'ปิดเสียง (Mute)'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-xl py-6 my-auto pointer-events-auto space-y-6">
        {/* Game Title & Thai Subtitle */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-semibold tracking-widest uppercase">
            <Shield className="w-3.5 h-3.5" />
            <span>3D TACTICAL WORKPLACE SIMULATION</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-none">
            IT SUPPORT <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">HERO</span>
          </h1>

          <div className="text-xl sm:text-2xl font-bold text-slate-200">
            ภารกิจช่างไอที กู้ชีพคอมพิวเตอร์
          </div>

          <p className="text-sm text-slate-400 leading-relaxed max-w-md pt-1">
            รับบทเป็นช่างไอทีประจำออฟฟิศสุดวุ่นวาย วิ่งซ่อมสายไฟ สกัดกั้น Hacker บุกเจาะระบบ และพิมพ์โค้ดสู้มัลแวร์แข่งกับเวลา 3 นาที ก่อนระบบเครือข่ายจะล่มสลาย!
          </p>
        </motion.div>

        {/* Primary Menu Actions */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col gap-2.5 max-w-md"
        >
          {/* Start Shift (Primary CTA) */}
          <button
            id="menu-start-game-btn"
            onClick={() => {
              soundManager.playUiClick();
              onStartGame();
            }}
            onMouseEnter={() => soundManager.playUiHover()}
            className="group relative flex items-center justify-between px-6 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-base shadow-xl shadow-cyan-500/20 transition-all duration-200 cursor-pointer active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-cyan-400">
                <Play className="w-4 h-4 fill-cyan-400" />
              </div>
              <div className="text-left">
                <div className="text-slate-950 font-black text-base tracking-tight leading-tight">
                  เริ่มปฏิบัติหน้าที่ (START SHIFT)
                </div>
                <div className="text-[11px] font-semibold text-slate-900/80">
                  กะเวลา 3 นาที · เฝ้าระวัง 6 โต๊ะทำงาน
                </div>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1 font-mono text-xs font-bold px-2 py-1 rounded bg-slate-950/20 text-slate-950">
              [ENTER]
            </div>
          </button>

          {/* Secondary Actions Grid */}
          <div className="grid grid-cols-2 gap-2.5 max-w-md">
            {/* How To Play */}
            <button
              onClick={() => {
                soundManager.playUiClick();
                onOpenHowToPlay();
              }}
              onMouseEnter={() => soundManager.playUiHover()}
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl border border-slate-700/80 bg-slate-900/80 hover:bg-slate-800 hover:border-slate-600 text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>วิธีเล่น & กฎ</span>
            </button>

            {/* Settings */}
            <button
              onClick={() => {
                soundManager.playUiClick();
                onOpenSettings();
              }}
              onMouseEnter={() => soundManager.playUiHover()}
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl border border-slate-700/80 bg-slate-900/80 hover:bg-slate-800 hover:border-slate-600 text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4 text-amber-400" />
              <span>การตั้งค่า</span>
            </button>
          </div>

          {/* Dev Studio: FBX Character & Animations */}
          {onOpenDevMenu && (
            <button
              onClick={() => {
                soundManager.playUiClick();
                onOpenDevMenu();
              }}
              onMouseEnter={() => soundManager.playUiHover()}
              className={`flex items-center justify-between py-2.5 px-4 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                isCustomActive
                  ? 'border-emerald-500/50 bg-emerald-950/40 hover:bg-emerald-950/60 text-emerald-300'
                  : 'border-amber-500/40 bg-amber-950/20 hover:bg-amber-950/40 text-amber-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-400" />
                <span>🛠️ Dev Menu: อัปโหลดโมเดลตัวละคร FBX & ท่าทาง</span>
              </div>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
                [F2]
              </span>
            </button>
          )}
        </motion.div>

        {/* Live Features / Core Mechanics Overview (Clean, No-Slop) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-3 gap-2 max-w-md pt-2"
        >
          <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-950/60 backdrop-blur-sm space-y-1">
            <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-semibold">
              <HardDrive className="w-3.5 h-3.5" />
              <span>สายไฟหลุด</span>
            </div>
            <div className="text-[11px] text-slate-400 leading-tight">
              ลากสายไฟตามรหัสสีซ่อมด่วน
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-950/60 backdrop-blur-sm space-y-1">
            <div className="flex items-center gap-1.5 text-purple-400 text-xs font-semibold">
              <Terminal className="w-3.5 h-3.5" />
              <span>มัลแวร์สู้กลับ</span>
            </div>
            <div className="text-[11px] text-slate-400 leading-tight">
              พิมพ์โค้ดสู้ไวรัส มีระบบพักเซฟ
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-950/60 backdrop-blur-sm space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold">
              <Flame className="w-3.5 h-3.5" />
              <span>ไฟลุกสปีดรัน</span>
            </div>
            <div className="text-[11px] text-slate-400 leading-tight">
              คอมโบซ่อมเสร็จวิ่งเร็วติดไฟ
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer Status Bar */}
      <footer className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-slate-800/80 pt-4 text-xs text-slate-500 font-mono pointer-events-auto">
        <div className="flex items-center gap-3">
          <span>CONTROLS: WASD / ARROWS</span>
          <span>·</span>
          <span>INTERACT: [E]</span>
          <span>·</span>
          <span>BAT: [F]</span>
        </div>
        <div className="text-slate-400">
          PRESS <span className="text-cyan-400 font-bold">[ENTER]</span> OR <span className="text-cyan-400 font-bold">[SPACE]</span> TO START
        </div>
      </footer>
    </div>
  );
};
