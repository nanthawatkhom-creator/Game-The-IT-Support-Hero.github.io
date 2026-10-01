import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Play, Wrench, Shield, Skull, Flame, Eye, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface HowToPlayModalProps {
  onClose: () => void;
  isInitial?: boolean;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose, isInitial = false }) => {
  const [activeTab, setActiveTab] = useState<'mission' | 'hardware' | 'hacker' | 'controls' | 'uxui'>('mission');

  const handleClose = () => {
    soundManager.playUiClick();
    onClose();
  };

  return (
    <div
      id="how-to-play-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 select-none"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/95 shadow-2xl text-slate-100 flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">
                คู่มือปฏิบัติการช่างไอที (Technician Field Manual)
              </h2>
              <p className="text-xs text-slate-400">
                Protocols, Hardware Diagnostics & Hacker Mitigation
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="ปิดคู่มือ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs (Functional, Clean segmented buttons) */}
        <div className="flex items-center gap-1 px-6 py-2.5 border-b border-slate-800 bg-slate-950/30 overflow-x-auto">
          <button
            onClick={() => {
              soundManager.playUiClick();
              setActiveTab('mission');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'mission'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            1. ภารกิจหลัก & เวลา
          </button>
          <button
            onClick={() => {
              soundManager.playUiClick();
              setActiveTab('hardware');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'hardware'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2. ซ่อมสายไฟหลุด
          </button>
          <button
            onClick={() => {
              soundManager.playUiClick();
              setActiveTab('hacker');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'hacker'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3. แฮกเกอร์ & มัลแวร์
          </button>
          <button
            onClick={() => {
              soundManager.playUiClick();
              setActiveTab('controls');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'controls'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            4. การควบคุม & กล้อง
          </button>
          <button
            onClick={() => {
              soundManager.playUiClick();
              setActiveTab('uxui');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'uxui'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            5. ระบบ UX/UI สื่อสารให้ผู้เล่นอิน
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm leading-relaxed">
          {activeTab === 'mission' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 space-y-2">
                <div className="font-semibold text-white flex items-center gap-2">
                  <span className="text-cyan-400">⏱️</span> กะเวลาปฏิบัติหน้าที่ 3 นาที (Shift Duty: 180s)
                </div>
                <p className="text-xs text-slate-300">
                  คุณมีเวลา 3 นาทีในการดูแลคอมพิวเตอร์ทั้ง 6 เครื่องในสำนักงานให้ทำงานได้ต่อเนื่อง ซ่อมคอมที่เสียให้ได้มากที่สุด และสะสมคะแนนเพื่อเลื่อนขั้นเป็น Senior IT Specialist!
                </p>
              </div>

              <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 space-y-2">
                <div className="font-semibold text-rose-300 flex items-center gap-2">
                  <Skull className="w-4 h-4 text-rose-400" />
                  <span>เงื่อนไขวิกฤต: เครือข่ายล่มสลาย (System Breach)</span>
                </div>
                <p className="text-xs text-slate-300">
                  หากปล่อยให้มีคอมพิวเตอร์ติดไวรัสมัลแวร์พร้อมกันครบ <strong className="text-white">2 เครื่อง</strong> ระบบจะเกิดการแพร่กระจายของ Worm และเกิด <strong>GAME OVER ทันที</strong>! อย่าปล่อยให้คอมติดมัลแวร์ค้างในระบบนาน
                </p>
              </div>

              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 space-y-2">
                <div className="font-semibold text-amber-300 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>ระบบ Combo & สกิลวิ่งเร็วติดไฟ (Turbo Speed Boost)</span>
                </div>
                <p className="text-xs text-slate-300">
                  ทุกครั้งที่คุณซ่อมคอมพิวเตอร์สำเร็จ คุณจะได้รับสกิล <strong className="text-white">วิ่งเร็วติดไฟลุกโชน</strong> นาน 6.5 วินาที พร้อมสะสมตัวคูณ Combo ช่วยให้วิ่งไปจัดการคอมเครื่องต่อไปได้ทันท่วงที
                </p>
              </div>
            </div>
          )}

          {activeTab === 'hardware' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 space-y-2">
                <div className="font-semibold text-white flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-400" />
                  <span>การสังเกตคอมพิวเตอร์เสียสายไฟหลุด</span>
                </div>
                <p className="text-xs text-slate-300">
                  คอมพิวเตอร์ที่มีปัญหาฮาร์ดแวร์ หน้าจอจะกระพริบสีแดงและมีประกายไฟควันพวยพุ่ง ให้วิ่งเข้าไปใกล้แล้วกด <strong className="text-amber-400 font-mono">[E]</strong> หรือ <strong className="text-amber-400 font-mono">[Space]</strong>
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 space-y-2">
                <div className="font-semibold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>วิธีแก้มินิเกมสายไฟ (Drag & Drop Cable)</span>
                </div>
                <p className="text-xs text-slate-300">
                  คลิกลากสายเคเบิลจากพอร์ตฝั่งซ้าย ไปเสียบเข้ากับช่องรับสัญญาณสีเดียวกันฝั่งขวาให้ครบทุกสาย หากลากผิดสายจะทำให้เสียเวลา 10 วินาที
                </p>
              </div>
            </div>
          )}

          {activeTab === 'hacker' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 space-y-2">
                <div className="font-semibold text-purple-300 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <span>Hacker บุกออฟฟิศ & ฟาดโดนตัวแฮกเกอร์ [F]</span>
                </div>
                <p className="text-xs text-slate-300">
                  แฮกเกอร์ใส่ฮู้ดดำจะแอบย่องเข้ามาเจาะระบบคอมพิวเตอร์ เมื่อได้ยินเสียงไซเรนเตือน รีบวิ่งเข้าไปประชิดตัวแล้วกดปุ่ม <strong className="text-amber-400 font-mono">[F]</strong> หรือคลิกซ้าย เพื่อฟาดไม้ไอทีกระแทกตัวแฮกเกอร์โดยตรง (ต้องประชิดและหวดโดนตัวแฮกเกอร์จริงๆ ไม่ใช่วงกว้าง) ก่อนที่แฮกเกอร์จะปล่อยมัลแวร์สำเร็จ!
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 space-y-2">
                <div className="font-semibold text-white flex items-center gap-2">
                  <Skull className="w-4 h-4 text-pink-400" />
                  <span>มินิเกมล้างมัลแวร์ & ระบบเซฟต่อจากเดิม (Save State)</span>
                </div>
                <p className="text-xs text-slate-300">
                  หากคอมพิวเตอร์โดนแฮก จอจะกลายเป็นสีม่วงรูปหัวกะโหลก ให้กด <strong className="text-pink-400 font-mono">[E]</strong> เพื่อเปิดเทอร์มินัลพิมพ์โค้ดสู้ไวรัส
                  <br />
                  <strong className="text-cyan-300">✨ ฟีเจอร์พิเศษ:</strong> หากติดธุระต้องวิ่งไปทุบแฮกเกอร์ สามารถกด <strong className="text-white">[พักการแก้ & ออก]</strong> หรือกด [Esc] เพื่อบันทึกความคืบหน้าไว้ แล้วค่อยกลับมาพิมพ์ต่อจากสเตจเดิมได้เลย!
                </p>
              </div>
            </div>
          )}

          {activeTab === 'controls' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/50">
                  <div className="font-semibold text-white mb-1">การเคลื่อนที่:</div>
                  <div className="text-slate-300 font-mono">W / A / S / D หรือ ลูกศร</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">หรือจอยสติ๊กสัมผัสบนมือถือ</div>
                </div>

                <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/50">
                  <div className="font-semibold text-white mb-1">การซ่อม / ปฏิสัมพันธ์:</div>
                  <div className="text-emerald-400 font-mono font-bold">[E] หรือ [Space]</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">กดเมื่ออยู่ใกล้คอมพิวเตอร์</div>
                </div>

                <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/50">
                  <div className="font-semibold text-white mb-1">ฟาดแฮกเกอร์ด้วยไม้:</div>
                  <div className="text-amber-400 font-mono font-bold">[F] หรือ คลิกซ้าย</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">วิ่งประชิดแล้วหวดให้โดนตัว</div>
                </div>

                <div className="p-3 rounded-xl border border-cyan-500/30 bg-cyan-950/20">
                  <div className="font-semibold text-cyan-300 mb-1">สลับมุมมองกล้อง:</div>
                  <div className="text-cyan-400 font-mono font-bold">[V] หรือ [C]</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">TPP (บุคคลที่ 3) / มุมสูง / FPP</div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/50 text-xs space-y-1">
                <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  <span>การหันมุมกล้องตามธรรมชาติ (Natural Camera):</span>
                </div>
                <p className="text-slate-300">
                  คลิกลากเมาส์ไปทางขวา หน้าจอจะหันไปทางขวาตามทิศทางมือจริง ลากซ้ายหันซ้าย หากต้องการกลับด้าน สามารถกดปุ่มเข็มทิศบนแถบ HUD ด้านบนได้ตลอดเวลา
                </p>
              </div>
            </div>
          )}

          {activeTab === 'uxui' && (
            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-950/20 space-y-1.5">
                <div className="font-bold text-cyan-300 text-sm flex items-center gap-2">
                  <span>🎮</span>
                  <span>ถอดบทเรียน UX/UI: สื่อสารอย่างไรให้ผู้เล่นอิน</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  เกมนี้ถูกออกแบบโครงสร้างอินเทอร์เฟซตามหลักทฤษฎีเกม UX/UI ชั้นนำ (อ้างอิง Fagerholt & Lorentzon และบทวิเคราะห์จากอุตสาหกรรมเกม) โดยแบ่งการสื่อสารออกเป็น 4 รูปแบบอย่างสมดุล ไม่รกตา ไม่เป็น AI Slop:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* 1. Diegetic */}
                <div className="p-3 rounded-xl border border-emerald-500/30 bg-slate-950/60 space-y-1">
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>1. Diegetic UI (อยู่ในโลกจริงของเกม)</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    หน้าจอคอมพิวเตอร์ CRT/LCD แต่ละโต๊ะที่มีไอคอนสถานะขัดข้องจริง และจอมอนิเตอร์ยักษ์ NOC Server Wall ในห้องเซิร์ฟเวอร์ที่แสดงระดับความปลอดภัยของระบบ
                  </p>
                </div>

                {/* 2. Non-Diegetic */}
                <div className="p-3 rounded-xl border border-blue-500/30 bg-slate-950/60 space-y-1">
                  <div className="font-bold text-blue-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span>2. Non-Diegetic UI (ข้อมูลส่งตรงถึงผู้เล่น)</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    แถบ HUD ด้านบนที่รวบรวมนาฬิกานับถอยหลัง 3 นาที, แถบสุขภาพเครือข่าย Network Health Gauge, รายการเป้าหมายกะการทำงาน (Shift Objectives) ออกแบบสไตล์ Minimalist แถบเดียวไม่บดบังฉาก
                  </p>
                </div>

                {/* 3. Spatial UI */}
                <div className="p-3 rounded-xl border border-amber-500/30 bg-slate-950/60 space-y-1">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>3. Spatial UI (บอกพิกัดในมิติ 3 มิติ)</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    วงแหวนโฮโลแกรมเรืองแสงบนพื้นใต้โต๊ะคอมพิวเตอร์ (วงฟ้า=ปกติ, วงส้ม=สายหลุด, วงม่วง=มัลแวร์), รัศมีขอบเขตอันตรายรอบตัวแฮกเกอร์ และตัวหนังสือลอยพวยพุ่ง Floating Action Popups ยามทุบสำเร็จ
                  </p>
                </div>

                {/* 4. Meta UI */}
                <div className="p-3 rounded-xl border border-purple-500/30 bg-slate-950/60 space-y-1">
                  <div className="font-bold text-purple-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <span>4. Meta UI (ความรู้สึกเสมือนผู้เล่นอยู่ในเหตุการณ์)</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    เสียงและแถบข้อความวิทยุสื่อสาร วอไอที (Colleague Radio Comms) จากเพื่อนร่วมแผนก (การตลาด, บัญชี, Dev, หัวหน้า IT) และขอบจอสีแดงกระพริบฉุกเฉิน Vignette เมื่อเครือข่ายตกอยู่ในภาวะเสี่ยง
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/40 text-[11px] text-slate-400 flex items-center justify-between">
                <span>หลักการปฏิสัมพันธ์: ชัดเจน · ลำดับชั้นสายตาดี · เข้าถึงง่ายด้วยคีย์บอร์ด & สัมผัส</span>
                <span className="font-mono text-cyan-400 font-semibold">ZERO-SLOP UX</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/40">
          <div className="text-xs text-slate-500 font-mono hidden sm:block">
            SECURITY CLEARANCE: TECHNICIAN
          </div>
          <button
            onClick={handleClose}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer ml-auto"
          >
            <span>{isInitial ? 'เริ่มเข้ากะปฏิบัติหน้าที่!' : 'เข้าใจแล้ว (Done)'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
