import React, { useState } from 'react';
import {
  Maximize2,
  Minimize2,
  HelpCircle,
} from 'lucide-react';
import { GameMode } from '../types';

interface HeaderBarProps {
  aliveCount: number;
  totalCount: number;
  isMuted?: boolean;
  onToggleMute?: () => void;
  gameMode?: GameMode;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  aliveCount,
  totalCount,
  gameMode = 'auto',
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <>
      <header className="absolute top-3 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
        {/* Title Banner - Cartoon style like in the video */}
        <div className="pointer-events-auto flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border-2 border-emerald-300">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-xl shadow-xs">
            🐸
          </div>
          <div>
            <h1 className="font-black text-xs sm:text-sm md:text-base text-stone-900 leading-tight tracking-tight flex items-center gap-1.5">
              <span>{gameMode === 'manual' ? '🎯 Tự bắt bọ - Ai bị bắt thì lên bảng' : 'Đớp đi, đớp đi, ai không bị đớp thì lên bảng'}</span>
              <span className="text-base">{gameMode === 'manual' ? '👅' : '😆'}</span>
            </h1>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs text-stone-500 font-bold">
              <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-black">
                {aliveCount} / {totalCount} còn bay
              </span>
              {gameMode === 'manual' ? (
                <span className="text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full font-black border border-rose-300">
                  🎯 Chế độ Tự bắt
                </span>
              ) : (
                <span className="text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full font-black border border-teal-300">
                  🎲 Chế độ Mặc định
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Toolbar */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl shadow-lg border-2 border-emerald-200">
          <button
            onClick={() => setShowHelp(true)}
            className="p-2 hover:bg-stone-100 text-stone-600 rounded-xl transition-colors cursor-pointer"
            title="Hướng dẫn luật chơi"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-stone-100 text-stone-600 rounded-xl transition-colors cursor-pointer"
            title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-emerald-700" />
            ) : (
              <Maximize2 className="w-4 h-4 text-emerald-700" />
            )}
          </button>
        </div>
      </header>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-4 border-emerald-400 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-emerald-950 text-lg flex items-center gap-2">
                <span>🐸</span> Luật chơi "Ếch đớp bọ lên bảng"
              </h3>
              <button
                onClick={() => setShowHelp(false)}
                className="text-stone-400 hover:text-stone-700 font-black text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-stone-700 space-y-2.5 leading-relaxed">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                <span className="font-black text-emerald-900 block mb-1">
                  1. Sĩ số & danh sách lớp:
                </span>
                Nhập số lượng học sinh (Ví dụ: <strong>40</strong>), hệ thống tự động sinh các chú bọ mang số thứ tự từ <strong>1 đến 40</strong> bay lượn sinh động! Thầy cô cũng có thể dán danh sách tên học sinh tùy thích.
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                <span className="font-black text-amber-900 block mb-1">
                  2. Chế độ Mặc định (Tự đớp - Sinh tồn):
                </span>
                Bấm <strong>BẮT ĐẦU ĐỚP</strong>. Các chú ếch đồng loạt phóng lưỡi đớp bọ. Cả lớp hồi hộp xem ai không bị đớp. <strong>Bạn sống sót cuối cùng sẽ lên bảng!</strong>
              </div>

              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200">
                <span className="font-black text-rose-900 block mb-1">
                  3. Chế độ Tự bắt (Kiểu Đào vàng):
                </span>
                Chỉ có <strong>1 chú ếch ở chính giữa</strong>, chiếc lưỡi đung đưa qua lại liên tục. Thầy cô hoặc học sinh <strong>Click chuột vào hồ</strong> hoặc bấm <strong>phím Space</strong> để phóng lưỡi bắt chú bọ trên đường bay &rarr; Chú bọ bị bắt sẽ được đưa lên đóa sen lên bảng!
              </div>

            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer"
            >
              Đã hiểu, vào đớp thôi! 👅
            </button>
          </div>
        </div>
      )}
    </>
  );
};
