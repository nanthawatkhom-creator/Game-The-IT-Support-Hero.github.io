import React from 'react';
import { motion } from 'motion/react';
import { X, Volume2, VolumeX, Music, Compass, Settings, Check, User } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface SettingsModalProps {
  isMuted: boolean;
  onToggleMute: () => void;
  isBgmActive: boolean;
  onToggleBgm: () => void;
  isInvertCamera: boolean;
  onToggleInvertCamera: () => void;
  cameraViewMode?: 'tpp' | 'overview' | 'fpp';
  onSetCameraViewMode?: (mode: 'tpp' | 'overview' | 'fpp') => void;
  showCharacterModel?: boolean;
  onToggleShowCharacterModel?: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isMuted,
  onToggleMute,
  isBgmActive,
  onToggleBgm,
  isInvertCamera,
  onToggleInvertCamera,
  cameraViewMode = 'tpp',
  onSetCameraViewMode,
  showCharacterModel = true,
  onToggleShowCharacterModel,
  onClose,
}) => {
  const handleClose = () => {
    soundManager.playUiClick();
    onClose();
  };

  return (
    <div
      id="settings-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 select-none"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/95 shadow-2xl text-slate-100 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">
                การตั้งค่าระบบ (Game Settings)
              </h2>
              <p className="text-xs text-slate-400">
                Audio, Camera & Control Preferences
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="ปิดการตั้งค่า"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Options List */}
        <div className="p-6 space-y-4">
          {/* Sound Effects */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/50">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </div>
              <div>
                <div className="text-sm font-semibold text-white">เสียงเอฟเฟกต์ (Sound Effects)</div>
                <div className="text-xs text-slate-400">เสียงซ่อมคอม, เสียงฟาดไม้, เสียงไซเรน</div>
              </div>
            </div>
            <button
              onClick={() => {
                soundManager.playUiClick();
                onToggleMute();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                !isMuted
                  ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {!isMuted ? 'เปิดใช้งาน' : 'ปิดเสียง'}
            </button>
          </div>

          {/* Background Music */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/50">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
                <Music className={`w-4 h-4 ${isBgmActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">ดนตรีประกอบ (Music BGM)</div>
                <div className="text-xs text-slate-400">ดนตรี Synthwave เพิ่มความตื่นเต้น</div>
              </div>
            </div>
            <button
              onClick={() => {
                soundManager.playUiClick();
                onToggleBgm();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                isBgmActive
                  ? 'bg-cyan-600/20 border-cyan-500/40 text-cyan-300 hover:bg-cyan-600/30'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {isBgmActive ? 'เล่นดนตรี' : 'ปิดดนตรี'}
            </button>
          </div>

          {/* Camera View Mode */}
          {onSetCameraViewMode && (
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/50 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-cyan-400">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">โหมดมุมมองกล้อง (Perspective)</div>
                    <div className="text-xs text-slate-400">กดปุ่ม [V] หรือ [C] ขณะเล่นเกมได้ทันที</div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playUiClick();
                    onSetCameraViewMode('tpp');
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    cameraViewMode === 'tpp'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  📷 TPP (ด้านหลัง)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playUiClick();
                    onSetCameraViewMode('overview');
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    cameraViewMode === 'overview'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  🏢 Overview (มุมสูง)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playUiClick();
                    onSetCameraViewMode('fpp');
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    cameraViewMode === 'fpp'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  👁️ FPP (บุคคลที่ 1)
                </button>
              </div>
            </div>
          )}

          {/* Camera Invert Direction */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/50">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
                <Compass className={`w-4 h-4 ${isInvertCamera ? 'text-amber-400' : 'text-emerald-400'}`} />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">ทิศทางหันมุมกล้อง (Camera Axis)</div>
                <div className="text-xs text-slate-400">ลากเมาส์ / ปัดหน้าจอซ้าย-ขวา</div>
              </div>
            </div>
            <button
              onClick={() => {
                soundManager.playUiClick();
                onToggleInvertCamera();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                isInvertCamera
                  ? 'bg-amber-600/20 border-amber-500/40 text-amber-300 hover:bg-amber-600/30'
                  : 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30'
              }`}
            >
              {isInvertCamera ? 'กลับทิศ (Invert)' : 'ทิศปกติ (Normal)'}
            </button>
          </div>

          {/* Character Model Visibility */}
          {onToggleShowCharacterModel && (
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
                  <User className={`w-4 h-4 ${showCharacterModel ? 'text-cyan-400' : 'text-slate-400'}`} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">โมเดลตัวละคร (Character Model)</div>
                  <div className="text-xs text-slate-400">ซ่อน/แสดงโมเดลตัวละคร 3D ในฉาก</div>
                </div>
              </div>
              <button
                onClick={() => {
                  soundManager.playUiClick();
                  onToggleShowCharacterModel();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                  showCharacterModel
                    ? 'bg-cyan-600/20 border-cyan-500/40 text-cyan-300 hover:bg-cyan-600/30'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {showCharacterModel ? 'แสดงโมเดล' : 'ซ่อนโมเดล (ปิด)'}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-800 bg-slate-950/40">
          <button
            onClick={handleClose}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>บันทึกและปิด (Done)</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
