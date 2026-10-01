import React, { useState } from 'react';
import { ComputerData, HackerInfo, RadioDispatch, ShiftObjective } from '../types';
import {
  Wrench,
  Volume2,
  VolumeX,
  Music,
  HelpCircle,
  RotateCcw,
  AlertTriangle,
  Monitor,
  Skull,
  Zap,
  ShieldAlert,
  Flame,
  Save,
  Play,
  Compass,
  Pause,
  Info,
  Radio,
  MapPin,
  CheckSquare,
  ShieldCheck,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface GameHUDProps {
  timeRemaining: number; // in seconds
  repairedCount: number;
  failedCount: number;
  brokenCount: number;
  malwareCount?: number;
  networkIntegrity?: number;
  hackerWhackedCount?: number;
  hackerInfo?: HackerInfo | null;
  hackerAlertMsg?: string | null;
  radioDispatch?: RadioDispatch | null;
  onDismissRadioDispatch?: () => void;
  nearComputer: ComputerData | null;
  onInteract: () => void;
  onWhackBat?: () => void;
  onRestart: () => void;
  onOpenHelp: () => void;
  onOpenDevMenu?: () => void;
  onOpenPause?: () => void;
  isCustomActive?: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  isBgmActive: boolean;
  onToggleBgm: () => void;
  comboCount?: number;
  comboTimer?: number;
  isSpeedBoosted?: boolean;
  speedBoostTimeLeft?: number;
  toastMessage?: string | null;
  isInvertCamera?: boolean;
  onToggleInvertCamera?: () => void;
  cameraViewMode?: 'tpp' | 'overview' | 'fpp';
  onCycleCameraViewMode?: () => void;
  shiftObjectives?: ShiftObjective[];
}

export const GameHUD: React.FC<GameHUDProps> = ({
  timeRemaining,
  repairedCount,
  failedCount,
  brokenCount,
  malwareCount = 0,
  networkIntegrity = 100,
  hackerWhackedCount = 0,
  hackerInfo,
  hackerAlertMsg,
  radioDispatch,
  onDismissRadioDispatch,
  nearComputer,
  onInteract,
  onWhackBat,
  onRestart,
  onOpenHelp,
  onOpenDevMenu,
  onOpenPause,
  isCustomActive = false,
  isMuted,
  onToggleMute,
  isBgmActive,
  onToggleBgm,
  comboCount = 0,
  comboTimer = 0,
  isSpeedBoosted = false,
  speedBoostTimeLeft = 0,
  toastMessage,
  isInvertCamera = false,
  onToggleInvertCamera,
  cameraViewMode = 'tpp',
  onCycleCameraViewMode,
  shiftObjectives = [],
}) => {
  const [showControlsHint, setShowControlsHint] = useState<boolean>(true);
  const [showObjectives, setShowObjectives] = useState<boolean>(false);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeFormatted = `${minutes < 10 ? `0${minutes}` : minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
  const isLowTime = timeRemaining <= 30;
  const isLowIntegrity = networkIntegrity < 50;

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between select-none">
      {/* Red vignette emergency border when 1 computer is infected with malware */}
      {malwareCount >= 1 && (
        <div className="pointer-events-none fixed inset-0 ring-4 ring-inset ring-rose-500/60 shadow-[inset_0_0_80px_rgba(244,63,94,0.35)] animate-pulse z-20" />
      )}

      {/* Low Time / Critical Network Heartbeat Vignette */}
      {(isLowTime || isLowIntegrity) && (
        <div className="pointer-events-none fixed inset-0 shadow-[inset_0_0_90px_rgba(239,68,68,0.25)] animate-pulse z-10" />
      )}

      {/* Speed Boost Fire Aura Screen Vignette */}
      {isSpeedBoosted && speedBoostTimeLeft > 0 && (
        <div className="pointer-events-none fixed inset-0 ring-4 ring-inset ring-amber-500/70 shadow-[inset_0_0_80px_rgba(245,158,11,0.3)] animate-pulse z-20" />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 pointer-events-auto flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-900/95 border border-cyan-400 text-white shadow-2xl shadow-cyan-500/30">
          <Save className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-xs font-semibold tracking-wide text-cyan-100">{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. UNIFIED PRO HUD HEADER BAR (Clean, Non-AI-Slop, Consolidated)        */}
      {/* ========================================================================= */}
      <header className="relative z-30 w-full pointer-events-auto bg-slate-950/85 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 shadow-lg">
        {/* Left: Corporate Network Integrity & Repaired Score */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Corporate Network Integrity Meter */}
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-lg border ${
                networkIntegrity >= 80
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : networkIntegrity >= 50
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono font-medium text-slate-400 uppercase tracking-wider leading-none">
                NETWORK INTEGRITY
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`text-base font-mono font-bold leading-tight ${
                    networkIntegrity >= 80
                      ? 'text-emerald-400'
                      : networkIntegrity >= 50
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {networkIntegrity}%
                </span>
                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      networkIntegrity >= 80
                        ? 'bg-emerald-400'
                        : networkIntegrity >= 50
                        ? 'bg-amber-400'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${networkIntegrity}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          {/* Repaired Count */}
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Monitor className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono font-medium text-slate-400 uppercase tracking-wider leading-none">
                REPAIRED
              </div>
              <div className="text-base sm:text-lg font-mono font-bold text-white leading-tight">
                {repairedCount}
              </div>
            </div>
          </div>
        </div>

        {/* Center: Shift Countdown Clock & Unified Status */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-3">
            {/* Countdown Clock */}
            <div
              className={`font-mono text-xl sm:text-2xl font-black tracking-tight ${
                isLowTime ? 'text-red-400 animate-pulse' : 'text-amber-400'
              }`}
            >
              {timeFormatted}
            </div>

            <span className="text-slate-600 hidden sm:inline">·</span>

            {/* Consolidated Incident Threat Line */}
            <div className="hidden sm:flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-slate-300">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>สายหลุด: <strong className="font-mono text-white">{Math.max(0, brokenCount - malwareCount)}</strong></span>
              </div>

              <span>·</span>

              <div
                className={`flex items-center gap-1.5 ${
                  malwareCount >= 1 ? 'text-rose-400 font-bold' : 'text-slate-300'
                }`}
              >
                <Skull className={`w-3.5 h-3.5 ${malwareCount >= 1 ? 'text-rose-400 animate-bounce' : 'text-slate-400'}`} />
                <span>มัลแวร์: <strong className="font-mono text-white">{malwareCount}</strong>/2</span>
                {malwareCount === 1 && (
                  <span className="text-[10px] text-rose-300 bg-rose-950 px-1.5 py-0.5 rounded border border-rose-600 animate-pulse">
                    วิกฤต!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Dynamic Combo & Speed Boost Skill Meter (Renders right below clock when active) */}
          {(comboCount > 0 || (isSpeedBoosted && speedBoostTimeLeft > 0)) && (
            <div className="flex items-center gap-2 mt-1">
              {comboCount > 0 && (
                <div className="flex items-center gap-1 text-[11px] font-mono text-amber-300 font-bold">
                  <Flame className="w-3 h-3 text-orange-400" />
                  <span>COMBO x{comboCount}</span>
                </div>
              )}
              {isSpeedBoosted && speedBoostTimeLeft > 0 && (
                <div className="flex items-center gap-1 text-[11px] font-mono text-yellow-300 font-bold">
                  <span>⚡ TURBO {speedBoostTimeLeft.toFixed(1)}s</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Tactical Action Controls & Menu */}
        <div className="flex items-center gap-1.5">
          {/* Shift Objectives Checklist Toggle */}
          <button
            onClick={() => {
              soundManager.playUiClick();
              setShowObjectives(!showObjectives);
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              showObjectives
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="ภารกิจประจำกะงาน (คีย์ลัด [T])"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">ภารกิจกะ</span>
            <span className="font-mono text-[10px] opacity-70">[T]</span>
          </button>

          {/* Dev Studio Menu Button (FBX Character Models & Animations) */}
          {onOpenDevMenu && (
            <button
              onClick={() => {
                soundManager.playUiClick();
                onOpenDevMenu();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                isCustomActive
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10'
                  : 'bg-amber-500/20 border-amber-500/60 text-amber-300 hover:bg-amber-500/30'
              }`}
              title="เปิด Dev Menu สำหรับอัปโหลดโมเดลตัวละครและท่าทาง FBX (คีย์ลัด [F2] หรือ [~])"
            >
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span>Dev</span>
              <span className="font-mono text-[10px] opacity-70">[F2]</span>
            </button>
          )}

          {/* Camera View Mode Toggle (TPP / Overview / FPP) */}
          {onCycleCameraViewMode && (
            <button
              onClick={() => {
                soundManager.playUiClick();
                onCycleCameraViewMode();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer bg-cyan-950/70 border-cyan-500/50 text-cyan-300 hover:bg-cyan-900/80 shadow-md shadow-cyan-500/10"
              title="สลับมุมมองกล้อง: TPP (บุคคลที่ 3) / Overview (มุมสูง) / FPP (คีย์ลัด [V] หรือ [C])"
            >
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>{cameraViewMode === 'tpp' ? '📷 TPP' : cameraViewMode === 'fpp' ? '📷 FPP' : '📷 มุมสูง'}</span>
              <span className="font-mono text-[10px] opacity-70">[V]</span>
            </button>
          )}

          {/* Invert Camera Direction */}
          {onToggleInvertCamera && (
            <button
              onClick={() => {
                soundManager.playUiClick();
                onToggleInvertCamera();
              }}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                isInvertCamera
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title={isInvertCamera ? 'ทิศทางหัน: กลับทิศ (Invert)' : 'ทิศทางหัน: ปกติ ไม่สลับ (Normal)'}
            >
              <Compass className={`w-3.5 h-3.5 ${isInvertCamera ? 'text-amber-400' : 'text-slate-400'}`} />
            </button>
          )}

          {/* Sound Mute */}
          <button
            onClick={() => {
              soundManager.playUiClick();
              onToggleMute();
            }}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={isMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Help Guide */}
          <button
            onClick={() => {
              soundManager.playUiClick();
              onOpenHelp();
            }}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="คู่มือการเล่น"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>

          {/* Pause / In-game Menu */}
          {onOpenPause && (
            <button
              onClick={() => {
                soundManager.playUiClick();
                onOpenPause();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              title="พักเกม / เมนู (ปุ่ม [Esc])"
            >
              <Pause className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">เมนู</span>
              <span className="font-mono text-[10px] opacity-70">[ESC]</span>
            </button>
          )}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. META UI: COLLEAGUE RADIO DISPATCH PAGER (สื่อสารให้ผู้เล่นอิน)         */}
      {/* ========================================================================= */}
      {radioDispatch && (
        <div className="relative z-30 flex justify-start px-4 sm:px-6 pt-3 pointer-events-auto">
          <div
            className={`flex items-start gap-3 p-3.5 rounded-xl border max-w-md shadow-2xl backdrop-blur-md transition-all ${
              radioDispatch.department === 'marketing'
                ? 'bg-slate-900/95 border-cyan-500 text-cyan-100 shadow-cyan-950/40'
                : radioDispatch.department === 'dev'
                ? 'bg-slate-900/95 border-indigo-500 text-indigo-100 shadow-indigo-950/40'
                : radioDispatch.department === 'finance'
                ? 'bg-slate-900/95 border-purple-500 text-purple-100 shadow-purple-950/40'
                : 'bg-slate-900/95 border-amber-500 text-amber-100 shadow-amber-950/40'
            }`}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 border border-white/10 shrink-0 text-cyan-400 mt-0.5">
              <Radio className="w-4 h-4 animate-pulse text-cyan-400" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono font-bold tracking-wider text-slate-300">
                  {radioDispatch.senderName} ({radioDispatch.role})
                </span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800">
                  RADIO COMM
                </span>
              </div>
              <p className="text-xs text-white leading-relaxed">
                "{radioDispatch.message}"
              </p>
            </div>
            {onDismissRadioDispatch && (
              <button
                onClick={onDismissRadioDispatch}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer text-xs"
                title="ปิดข้อความ"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2.5 BARTLE ACHIEVER: SHIFT OBJECTIVES CHECKLIST CARD                     */}
      {/* ========================================================================= */}
      {showObjectives && (
        <div className="absolute top-16 right-4 sm:right-6 z-40 w-80 rounded-xl border border-slate-700 bg-slate-950/95 backdrop-blur-md p-4 shadow-2xl text-slate-100 space-y-3 pointer-events-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <CheckSquare className="w-4 h-4" />
              <span>ภารกิจกะงาน IT (Shift Objectives)</span>
            </div>
            <button
              onClick={() => setShowObjectives(false)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {shiftObjectives.map((obj) => (
              <div
                key={obj.id}
                className={`p-2 rounded-lg border flex items-start gap-2.5 transition-colors ${
                  obj.completed
                    ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200'
                    : 'border-slate-800 bg-slate-900/60 text-slate-300'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {obj.completed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded border border-slate-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white flex items-center justify-between">
                    <span>{obj.title}</span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {obj.current}/{obj.target}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                    {obj.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TACTICAL CENTER NOTIFICATIONS (Hacker Siren Alert)                     */}
      {/* ========================================================================= */}
      {hackerAlertMsg && (
        <div className="relative z-30 flex justify-center -mt-4 pointer-events-auto px-4">
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-purple-950/95 border border-purple-500 text-white shadow-2xl shadow-purple-900/40 animate-bounce">
            <ShieldAlert className="w-5 h-5 text-purple-400 animate-spin" />
            <span className="font-semibold text-xs sm:text-sm tracking-wide">{hackerAlertMsg}</span>
            {onWhackBat && (
              <button
                onClick={() => {
                  soundManager.playUiClick();
                  onWhackBat();
                }}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer active:scale-95 transition-all shadow-md ${
                  hackerInfo?.isNearPlayer
                    ? 'bg-red-500 hover:bg-red-400 text-white animate-pulse shadow-red-500/50 scale-105 ring-2 ring-white/50'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                }`}
              >
                {hackerInfo?.isNearPlayer ? '💥 ตีตัว [F]!' : 'ฟาดไม้ [F]'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CONTEXTUAL ACTION RETICLE (Near Broken PC or Malware Terminal)        */}
      {/* ========================================================================= */}
      <div className="flex justify-center mb-4 pointer-events-auto">
        {nearComputer && nearComputer.status === 'broken' && (
          <button
            onClick={() => {
              soundManager.playUiClick();
              onInteract();
            }}
            className="group flex items-center gap-3 px-5 py-3 rounded-xl bg-slate-900/95 border-2 border-amber-500 text-white shadow-2xl shadow-amber-500/20 hover:bg-slate-800 transition-all cursor-pointer active:scale-98 animate-bounce"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400 text-slate-950 font-mono font-black text-xs shadow">
              E
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Wrench className="w-3.5 h-3.5 animate-spin" />
                <span>ซ่อมสายไฟฮาร์ดแวร์</span>
              </div>
              <div className="text-sm font-semibold text-white">
                {nearComputer.name}
              </div>
            </div>
          </button>
        )}

        {nearComputer && nearComputer.status === 'malware' && (
          <button
            onClick={() => {
              soundManager.playUiClick();
              onInteract();
            }}
            className="group flex items-center gap-3 px-5 py-3 rounded-xl bg-slate-900/95 border-2 border-purple-500 text-white shadow-2xl shadow-purple-500/30 hover:bg-slate-800 transition-all cursor-pointer active:scale-98 animate-bounce"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500 text-white font-mono font-black text-xs shadow">
              E
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5 text-purple-400 text-xs font-bold uppercase tracking-wider">
                <Skull className="w-3.5 h-3.5 animate-pulse" />
                <span>ล้างมัลแวร์ในระบบ</span>
              </div>
              <div className="text-sm font-semibold text-white">
                {nearComputer.name}{' '}
                {nearComputer.malwareSavedProgress && (
                  <span className="text-cyan-300 font-mono text-xs">
                    (เซฟไว้ Stage {nearComputer.malwareSavedProgress.stageIndex + 1}/3)
                  </span>
                )}
              </div>
            </div>
          </button>
        )}

        {nearComputer && nearComputer.status === 'normal' && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-800 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{nearComputer.name} สถานะปกติ</span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. REFINED BOTTOM QUICK-CONTROLS STRIP (Non-Intrusive, Minimalist)        */}
      {/* ========================================================================= */}
      <footer className="relative z-20 w-full pointer-events-auto px-4 py-2 bg-slate-950/80 backdrop-blur-md border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
        {showControlsHint ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>
              <strong className="text-slate-200">WASD / ลูกศร</strong> เดิน
            </span>
            <span>·</span>
            <span>
              <strong className="text-emerald-400">[E] / [Space]</strong> ซ่อมคอม
            </span>
            <span>·</span>
            <span>
              <strong className="text-amber-400">[F] / คลิกซ้าย</strong> ทุบแฮกเกอร์
            </span>
            <span>·</span>
            <span>
              <strong className="text-slate-300">ลากเมาส์</strong> หันกล้อง
            </span>
            <span>·</span>
            <span>
              <strong className="text-slate-200">[Esc]</strong> พัก/เมนู
            </span>
          </div>
        ) : (
          <div className="text-slate-500">IT SUPPORT OPERATIONS READY</div>
        )}

        <button
          onClick={() => setShowControlsHint(!showControlsHint)}
          className="text-slate-400 hover:text-white transition-colors cursor-pointer text-[11px] underline ml-2 shrink-0"
        >
          {showControlsHint ? 'ซ่อนปุ่ม' : 'แสดงปุ่มลัด'}
        </button>
      </footer>
    </div>
  );
};
