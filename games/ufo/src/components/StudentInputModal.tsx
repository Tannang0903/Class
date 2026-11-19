import React, { useState } from 'react';
import { Check, X, Hash } from 'lucide-react';
import { Student } from '../types';

interface StudentInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStudents: Student[];
  onSaveStudents: (names: string[]) => void;
}

export const StudentInputModal: React.FC<StudentInputModalProps> = ({
  isOpen,
  onClose,
  currentStudents,
  onSaveStudents,
}) => {
  const [studentCount, setStudentCount] = useState<number>(() =>
    currentStudents.length > 0 ? currentStudents.length : 40
  );

  if (!isOpen) return null;

  const generateNamesByCount = (count: number): string[] => {
    const list: string[] = [];
    const padLen = count >= 100 ? 3 : 2;
    for (let i = 1; i <= count; i++) {
      const numStr = String(i).padStart(padLen, '0');
      list.push(`STT ${numStr}`);
    }
    return list;
  };

  const handleApply = () => {
    const validCount = Math.max(2, Math.min(80, Number(studentCount) || 40));
    const names = generateNamesByCount(validCount);
    onSaveStudents(names);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200 text-slate-900">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-slate-900">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shadow-xs">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Cài Đặt Sĩ Số Lớp</h2>
              <p className="text-xs font-medium text-slate-500">
                Tự động đánh số thứ tự từ STT 01 đến hết
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 bg-white">
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">
              Nhập sĩ số học sinh của lớp:
            </label>
            <div className="flex items-center gap-3 bg-slate-50 px-5 py-3 rounded-2xl border-2 border-slate-300 focus-within:border-emerald-600 focus-within:bg-white transition">
              <input
                type="number"
                min={2}
                max={80}
                value={studentCount}
                onChange={(e) =>
                  setStudentCount(Math.max(1, Math.min(80, Number(e.target.value))))
                }
                className="w-24 text-center text-3xl font-black text-emerald-700 focus:outline-none"
                autoFocus
              />
              <span className="text-sm font-bold text-slate-600">học sinh</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-950 hover:bg-slate-200 rounded-xl transition"
          >
            Hủy Bỏ
          </button>
          <button
            onClick={handleApply}
            className="px-6 py-2.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-lg hover:shadow-emerald-600/25 transition flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Lưu Sĩ Số ({studentCount} Học Sinh)
          </button>
        </div>
      </div>
    </div>
  );
};
