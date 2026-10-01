import React from 'react';
import { motion } from 'motion/react';
import { RotateCcw, Trophy, CheckCircle, XCircle, Zap, Skull, ShieldAlert, AlertOctagon } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GameOverReason } from '../types';

interface GameOverModalProps {
  reason?: GameOverReason;
  repairedCount: number;
  failedCount: number;
  hackerWhackedCount?: number;
  onRestart: () => void;
  onExitToMenu?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  reason = 'time',
  repairedCount,
  failedCount,
  hackerWhackedCount = 0,
  onRestart,
  onExitToMenu,
}) => {
  const isMalwareBreach = reason === 'malware';

  // Fire confetti on high score only if survived the shift and repaired well
  React.useEffect(() => {
    if (!isMalwareBreach && repairedCount >= 5) {
      try {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.5 },
        });
      } catch {
        // ignore
      }
    }
  }, [isMalwareBreach, repairedCount]);

  // Determine Grade and Title
  let grade = 'C';
  let title = 'ช่างไอทีฝึกหัด (Junior IT Intern)';
  let gradeColor = 'text-amber-400 border-amber-400 bg-amber-500/10';

  if (isMalwareBreach) {
    grade = '💀';
    title = 'ระบบเครือข่ายออฟฟิศถูกมัลแวร์ยึดครอง (Network Breached)';
    gradeColor = 'text-rose-400 border-rose-500 bg-rose-950/40 shadow-rose-900/50';
  } else if (repairedCount >= 12) {
    grade = 'S+';
    title = 'ตำนานเทพกู้ชีพเซิร์ฟเวอร์ (Legendary Senior IT Architect)';
    gradeColor = 'text-purple-400 border-purple-400 bg-purple-500/10';
  } else if (repairedCount >= 9) {
    grade = 'S';
    title = 'ยอดช่างสปีดรันประจำตึก (Elite IT Specialist)';
    gradeColor = 'text-emerald-400 border-emerald-400 bg-emerald-500/10';
  } else if (repairedCount >= 6) {
    grade = 'A';
    title = 'ผู้เชี่ยวชาญการแก้ปัญหาด่วน (Pro Support Engineer)';
    gradeColor = 'text-blue-400 border-blue-400 bg-blue-500/10';
  } else if (repairedCount >= 3) {
    grade = 'B';
    title = 'ช่างไอทีประจำแผนก (Helpdesk Technician)';
    gradeColor = 'text-cyan-400 border-cyan-400 bg-cyan-500/10';
  }

  const total = repairedCount + failedCount;
  const accuracy = total > 0 ? Math.round((repairedCount / total) * 100) : 0;

  return (
    <div
      id="game-over-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className={`w-full max-w-lg rounded-3xl border shadow-2xl p-6 md:p-8 text-slate-100 ${
          isMalwareBreach
            ? 'border-rose-600/80 bg-slate-900 shadow-rose-950/60'
            : 'border-slate-800 bg-slate-900 shadow-2xl'
        }`}
      >
        {/* Header */}
        <div className="text-center mb-6">
          {isMalwareBreach ? (
            <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 mb-3 animate-pulse">
              <Skull className="w-10 h-10 text-rose-500" />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-3">
              <Trophy className="w-8 h-8" />
            </div>
          )}

          <h2
            className={`text-3xl font-black tracking-tight ${
              isMalwareBreach ? 'text-rose-400' : 'text-white'
            }`}
          >
            {isMalwareBreach ? '🚨 GAME OVER! เครือข่ายล่มสลาย' : 'หมดเวลาปฏิบัติหน้าที่!'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {isMalwareBreach
              ? 'คอมพิวเตอร์โดนไวรัสมัลแวร์ครบ 2 เครื่อง! ไฟร์วอลล์กลางถูกทำลาย'
              : 'สรุปรายงานผลงานช่างไอทีกู้ชีพคอมพิวเตอร์ในเวลา 3 นาที'}
          </p>
        </div>

        {/* Malware Warning Callout if Breached */}
        {isMalwareBreach && (
          <div className="rounded-2xl bg-rose-950/40 border border-rose-500/40 p-3.5 mb-5 flex items-start gap-3 text-xs text-rose-200">
            <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
            <div>
              <div className="font-bold text-rose-300 mb-0.5">เงื่อนไขความยากขั้นสูง:</div>
              เมื่อปล่อยให้มัลแวร์ระบาดครบ <strong className="text-white underline">2 เครื่อง</strong> ในออฟฟิศ ดาต้าเซ็นเตอร์จะตัดการเชื่อมต่อทันที! ต้องรีบใช้ไม้ [F] ฟาดแฮกเกอร์ หรือกด [E] ล้างมัลแวร์ก่อนเครื่องที่ 2 จะติดเชื้อ
            </div>
          </div>
        )}

        {/* Grade Badge */}
        <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-950/60 border border-slate-800 mb-6 text-center">
          <div
            className={`w-20 h-20 rounded-full border-4 flex items-center justify-center text-4xl font-black font-mono shadow-xl mb-3 ${gradeColor}`}
          >
            {grade}
          </div>
          <div className="text-lg font-bold text-white tracking-tight">{title}</div>
          <div className="text-xs text-slate-400 mt-0.5">
            อัตราความแม่นยำในการซ่อม: <span className="font-mono text-emerald-400">{accuracy}%</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-6">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-[11px] font-semibold mb-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>ซ่อมสำเร็จ</span>
            </div>
            <div className="text-2xl font-black text-white font-mono">{repairedCount} เครื่อง</div>
          </div>

          <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-rose-400 text-[11px] font-semibold mb-1">
              <XCircle className="w-3.5 h-3.5" />
              <span>ซ่อมล้มเหลว</span>
            </div>
            <div className="text-2xl font-black text-white font-mono">{failedCount} เครื่อง</div>
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-amber-400 text-[11px] font-semibold mb-1">
              <Zap className="w-3.5 h-3.5" />
              <span>ฟาดแฮกเกอร์</span>
            </div>
            <div className="text-2xl font-black text-white font-mono">{hackerWhackedCount} ครั้ง</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <button
            id="play-again-btn"
            onClick={onRestart}
            className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-white font-bold text-sm shadow-lg transition-all active:scale-98 cursor-pointer ${
              isMalwareBreach
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black shadow-cyan-500/20'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isMalwareBreach ? 'เริ่มใหม่ แก้มือรอบนี้!' : 'เริ่มกะใหม่ (เล่นอีกครั้ง)'}</span>
          </button>

          {onExitToMenu && (
            <button
              onClick={onExitToMenu}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
            >
              <span>กลับสู่หน้าเมนูหลัก (Main Menu)</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
