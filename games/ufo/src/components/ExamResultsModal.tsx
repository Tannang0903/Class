import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Play, Check, X, Sparkles } from 'lucide-react';
import { Student } from '../types';

interface ExamResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  abductedStudents: Student[];
  onExemptStudents?: (studentIds: string[]) => void;
  onRestartNewRound: () => void;
}

export const ExamResultsModal: React.FC<ExamResultsModalProps> = ({
  isOpen,
  onClose,
  abductedStudents,
  onExemptStudents,
  onRestartNewRound,
}) => {
  // Trigger confetti burst on open
  useEffect(() => {
    if (isOpen && abductedStudents.length > 0) {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#34d399', '#38bdf8', '#fbbf24', '#f43f5e', '#a855f7'],
      });
    }
  }, [isOpen, abductedStudents]);

  if (!isOpen || abductedStudents.length === 0) return null;

  const handleDone = () => {
    if (onExemptStudents) {
      onExemptStudents(abductedStudents.map((s) => s.id));
    }
    onClose();
  };

  const handleNextRound = () => {
    if (onExemptStudents) {
      onExemptStudents(abductedStudents.map((s) => s.id));
    }
    onRestartNewRound();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-emerald-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white">
        {/* Banner with UFO theme */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-3xl shadow-inner animate-bounce">
              🛸
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-emerald-100 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Đĩa bay đã bắt thành công
              </span>
              <h2 className="text-xl font-black">Danh Sách Lên Bảng Dò Bài!</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abducted Students List */}
        <div className="p-6 overflow-y-auto space-y-3.5 max-h-[60vh]">
          <p className="text-xs text-slate-300 font-medium">
            Có <strong className="text-emerald-400 font-bold">{abductedStudents.length}</strong> học sinh đã bị đĩa bay tóm gọn:
          </p>

          {abductedStudents.map((student, idx) => {
            const quote = student.speechBubble?.text || 'Em thuộc bài rồi mà thầy!';
            const isChum = quote.includes('chết chùm') || quote.includes('cứu');

            return (
              <div
                key={student.id}
                className="p-4 bg-slate-800/80 border-2 border-emerald-500/30 rounded-2xl hover:border-emerald-400 transition-all flex items-center justify-between gap-3 shadow-lg"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 font-black flex items-center justify-center text-lg shadow-md shadow-emerald-500/20">
                    #{idx + 1}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-amber-300 tracking-wide font-mono">
                      {student.name}
                    </h3>
                    <p className={`text-xs mt-0.5 font-bold ${isChum ? 'text-rose-400' : 'text-cyan-300'}`}>
                      &ldquo;{quote}&rdquo;
                    </p>
                  </div>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-black text-xs shrink-0">
                  Lên Bảng
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleDone}
            className="px-5 py-2.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition flex items-center gap-2 border border-slate-700"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            Xong Lượt Này
          </button>

          <button
            onClick={handleNextRound}
            className="px-6 py-2.5 text-xs font-black text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 active:scale-95 rounded-xl shadow-lg shadow-emerald-500/30 transition flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            Bắt Tiếp Lượt Mới
          </button>
        </div>
      </div>
    </div>
  );
};
