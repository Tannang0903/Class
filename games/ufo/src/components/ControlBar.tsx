import React from 'react';
import {
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Radio,
  Hash,
} from 'lucide-react';
import { GameStatus } from '../types';
import { soundManager } from '../utils/audio';

import { Keyboard } from 'lucide-react';

interface ControlBarProps {
  gameStatus: GameStatus;
  targetCount: number;
  onTargetCountChange: (count: number) => void;
  onStartGame: () => void;
  onResetGame: () => void;
  onOpenStudentModal: () => void;
  rosterLocked?: boolean;
  totalStudents: number;
  eligibleCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  animationSpeed: number;
  onSpeedChange: (speed: number) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  gameStatus,
  targetCount,
  onTargetCountChange,
  onStartGame,
  onResetGame,
  onOpenStudentModal,
  rosterLocked = false,
  totalStudents,
  eligibleCount,
  soundEnabled,
  onToggleSound,
  animationSpeed,
  onSpeedChange,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const isPlaying = gameStatus === 'hunting' || gameStatus === 'abducting' || gameStatus === 'preparing';
  const isAllCalled = totalStudents > 0 && eligibleCount === 0;

  return (
    <div className="w-full shrink-0 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 shadow-2xl flex items-center justify-between gap-2 sm:gap-4 text-white">
      {/* Left section: Bottom-left Shortcuts & Quota Selector */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        {/* Phím tắt ở góc dưới bên trái */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800/90 rounded-xl border border-slate-700/80 text-xs text-slate-300 font-medium">
          <span className="flex items-center gap-1 text-slate-400">
            <Keyboard className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold text-slate-300 hidden md:inline">Phím tắt:</span>
          </span>
          <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-emerald-400 font-mono text-[10px] font-bold">
            SPACE
          </span>
          <span className="text-[11px] text-slate-400 hidden xl:inline">Bắt đầu</span>
          <span className="text-slate-600 hidden xl:inline">·</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-400 font-mono text-[10px] font-bold">
            F
          </span>
          <span className="text-[11px] text-slate-400 hidden xl:inline">Toàn màn hình</span>
          <span className="text-slate-600 hidden xl:inline">·</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-400 font-mono text-[10px] font-bold">
            M
          </span>
          <span className="text-[11px] text-slate-400 hidden xl:inline">Âm</span>
        </div>

        {/* Quota Selector */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-800/90 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-700">
          <span className="text-xs font-bold text-slate-300 hidden sm:inline">Cần bắt:</span>
          <div className="flex items-center gap-1">
            <button
              disabled={isPlaying || targetCount <= 1}
              onClick={() => {
                soundManager.playClick();
                onTargetCountChange(Math.max(1, targetCount - 1));
              }}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-base font-black active:scale-90 transition shadow-sm"
            >
              -
            </button>
            <span className="w-7 sm:w-8 text-center font-black text-emerald-400 font-mono text-base sm:text-lg">
              {targetCount}
            </span>
            <button
              disabled={isPlaying || targetCount >= Math.min(10, Math.max(1, eligibleCount > 0 ? eligibleCount : totalStudents))}
              onClick={() => {
                soundManager.playClick();
                onTargetCountChange(targetCount + 1);
              }}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-base font-black active:scale-90 transition shadow-sm"
            >
              +
            </button>
          </div>
        </div>

        {/* Change Sĩ Số Lớp Trigger */}
        <button
          disabled={isPlaying || rosterLocked}
          onClick={() => {
            soundManager.playClick();
            onOpenStudentModal();
          }}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/90 hover:bg-slate-700 rounded-xl border border-slate-700 text-xs font-bold text-slate-200 transition active:scale-95 shadow-md"
        >
          <Hash className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">Sĩ Số</span> ({totalStudents} bạn)
        </button>
      </div>

      {/* Center: BIG CARTOON START / RADAR BUTTON */}
      <div className="flex items-center gap-2">
        <button
          disabled={isPlaying || totalStudents === 0}
          onClick={() => {
            soundManager.playClick();
            onStartGame();
          }}
          className={`px-5 sm:px-8 py-2.5 sm:py-3 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2.5 shadow-xl transition-all active:scale-95 ${
            isPlaying
              ? 'bg-slate-800 text-emerald-400 border border-emerald-500/50 cursor-not-allowed shadow-emerald-500/10'
              : isAllCalled
              ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 hover:from-amber-300 hover:to-rose-300 text-slate-950 shadow-amber-500/30 hover:shadow-amber-500/50 ring-4 ring-amber-400/30 animate-pulse'
              : 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 shadow-emerald-500/30 hover:shadow-emerald-500/50 ring-4 ring-emerald-400/30 animate-pulse'
          }`}
        >
          {isPlaying ? (
            <>
              <Radio className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              <span>Đang Quét...</span>
            </>
          ) : isAllCalled ? (
            <>
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              <span>BẮT ĐẦU VÒNG MỚI (SPACE)</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              <span>BẮT ĐẦU (SPACE)</span>
            </>
          )}
        </button>

        {isPlaying && (
          <button
            onClick={() => {
              soundManager.playClick();
              onResetGame();
            }}
            className="p-2.5 sm:p-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl transition active:scale-90 shadow-md"
            title="Dừng lại & Đặt lại"
          >
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}
      </div>

      {/* Right section: Speed, Sound, Fullscreen */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Speed Selector */}
        <div className="hidden md:flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700 text-xs">
          {[
            { label: 'Chậm', val: 0.8 },
            { label: 'Chuẩn', val: 1.0 },
            { label: 'Nhanh', val: 1.5 },
          ].map((sp) => (
            <button
              key={sp.label}
              onClick={() => {
                soundManager.playClick();
                onSpeedChange(sp.val);
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                animationSpeed === sp.val
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sp.label}
            </button>
          ))}
        </div>

        {/* Sound Toggle */}
        <button
          onClick={() => {
            onToggleSound();
          }}
          className="p-2 sm:p-2.5 bg-slate-800/90 hover:bg-slate-700 rounded-xl border border-slate-700 text-slate-200 transition active:scale-90"
          title={soundEnabled ? 'Tắt âm thanh (M)' : 'Bật âm thanh (M)'}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <VolumeX className="w-4 h-4 text-rose-400" />
          )}
        </button>

        {/* Fullscreen for classroom projector */}
        <button
          onClick={() => {
            soundManager.playClick();
            onToggleFullscreen();
          }}
          className="p-2 sm:p-2.5 bg-slate-800/90 hover:bg-slate-700 rounded-xl border border-slate-700 text-slate-200 transition active:scale-90"
          title={isFullscreen ? 'Thu nhỏ (F)' : 'Toàn màn hình máy chiếu (F)'}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4 text-amber-400" />
          ) : (
            <Maximize2 className="w-4 h-4 text-amber-400" />
          )}
        </button>
      </div>
    </div>
  );
};
