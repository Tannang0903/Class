import React, { useState, useEffect } from 'react';
import { SpeedLevel, Student, GameMode } from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  Users,
  Zap,
  Sliders,
  ChevronRight,
  ChevronLeft,
  Volume2,
  VolumeX,
  Target,
  Gamepad2,
} from 'lucide-react';

interface SidebarProps {
  students: Student[];
  studentCount: number;
  onStudentCountChange: (count: number) => void;
  winnerCount: number;
  onWinnerCountChange: (count: number) => void;
  speed: SpeedLevel;
  onSpeedChange: (speed: SpeedLevel) => void;
  frogCount: number;
  onFrogCountChange: (count: number) => void;
  gameMode: GameMode;
  onGameModeChange: (mode: GameMode) => void;
  isPlaying: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onToggleAbsent: (id: number) => void;
  onUpdateStudentsList: (newList: Student[]) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  winners?: Student[] | null;
  onExcludeAndContinue?: (winnerIds: number[]) => void;
  onManualShoot?: () => void;
  rosterLocked?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  students,
  studentCount,
  onStudentCountChange,
  winnerCount,
  onWinnerCountChange,
  speed,
  onSpeedChange,
  frogCount,
  onFrogCountChange,
  gameMode,
  onGameModeChange,
  isPlaying,
  onStart,
  onPause,
  onReset,
  onToggleAbsent,
  onUpdateStudentsList,
  isMuted,
  onToggleMute,
  isCollapsed,
  onToggleCollapse,
  winners = null,
  onExcludeAndContinue,
  onManualShoot,
  rosterLocked = false,
}) => {
  const [activeTab, setActiveTab] = useState<'controls' | 'list'>('controls');
  const [customNamesText, setCustomNamesText] = useState('');
  const [showCustomNamesModal, setShowCustomNamesModal] = useState(false);

  // Local text inputs to prevent uncontrolled input jumping/capping glitches
  const [studentInputStr, setStudentInputStr] = useState<string>(String(studentCount));
  const [frogInputStr, setFrogInputStr] = useState<string>(String(frogCount));

  useEffect(() => {
    setStudentInputStr(String(studentCount));
  }, [studentCount]);

  useEffect(() => {
    setFrogInputStr(String(frogCount));
  }, [frogCount]);

  const handleOpenCustomNames = () => {
    const text = students.map((s) => s.name || `Số ${s.number}`).join('\n');
    setCustomNamesText(text);
    setShowCustomNamesModal(true);
  };

  const handleApplyCustomNames = () => {
    const lines = customNamesText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length > 0) {
      const newStudents: Student[] = lines.map((name, i) => ({
        id: i + 1,
        number: i + 1,
        name: name,
        isAbsent: false,
      }));
      onUpdateStudentsList(newStudents);
    }
    setShowCustomNamesModal(false);
  };

  return (
    <>
      {/* Toggle button when collapsed */}
      {isCollapsed && (
        <button
          onClick={onToggleCollapse}
          className="fixed top-4 right-4 z-40 bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-3 rounded-2xl shadow-xl flex items-center gap-2 border-2 border-white transition-all transform active:scale-95 cursor-pointer"
          title="Mở Bảng Điều Khiển"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm hidden sm:inline">Bảng Điều Khiển</span>
        </button>
      )}

      {/* Main Sidebar Container - Docked cleanly */}
      <aside
        className={`h-full w-80 md:w-96 bg-white/95 backdrop-blur-md border-l border-emerald-100 shadow-2xl z-40 flex flex-col transition-all duration-300 shrink-0 ${
          isCollapsed ? 'hidden' : 'flex'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐸</span>
            <div>
              <h2 className="font-black text-base tracking-wide">
                DANH SÁCH LỚP HỌC
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleMute}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
              title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-rose-200" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={onToggleCollapse}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
              title="Thu nhỏ bảng điều khiển"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-50 shrink-0">
          <button
            onClick={() => setActiveTab('controls')}
            className={`flex-1 py-2.5 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'controls'
                ? 'text-emerald-700 border-b-2 border-emerald-600 bg-white'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <Sliders className="w-4 h-4" />
            CÀI ĐẶT & ĐIỀU KHIỂN
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-2.5 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'list'
                ? 'text-emerald-700 border-b-2 border-emerald-600 bg-white'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <Users className="w-4 h-4" />
            DANH SÁCH
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {activeTab === 'controls' ? (
            <>
              {/* CHỌN CHẾ ĐỘ CHƠI */}
              <div className="bg-emerald-50/80 border border-emerald-200 p-3 rounded-2xl">
                <label className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Gamepad2 className="w-4 h-4 text-emerald-600" />
                  Chế độ chơi
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-emerald-900/10 rounded-xl">
                  <button
                    onClick={() => onGameModeChange('auto')}
                    className={`py-2 px-2 rounded-lg font-black text-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      gameMode === 'auto'
                        ? 'bg-white text-emerald-900 shadow-md border-2 border-emerald-500 scale-[1.02]'
                        : 'text-emerald-800 hover:bg-white/50 border-2 border-transparent'
                    }`}
                  >
                    <span className="text-base">🎲</span>
                    <span className="whitespace-nowrap">Mặc định</span>
                  </button>
                  <button
                    onClick={() => onGameModeChange('manual')}
                    className={`py-2 px-2 rounded-lg font-black text-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      gameMode === 'manual'
                        ? 'bg-white text-rose-900 shadow-md border-2 border-rose-500 scale-[1.02]'
                        : 'text-emerald-800 hover:bg-white/50 border-2 border-transparent'
                    }`}
                  >
                    <span className="text-base">🎯</span>
                    <span className="whitespace-nowrap">Tự bắt</span>
                  </button>
                </div>
              </div>

              {/* SĨ SỐ HỌC SINH */}
              <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-2xl">
                <label className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1 mb-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  Sĩ số học sinh
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  value={studentInputStr}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setStudentInputStr(val);
                    const num = parseInt(val);
                    if (!isNaN(num) && num >= 2 && num <= 100) {
                      onStudentCountChange(num);
                    }
                  }}
                  onBlur={() => {
                    const num = parseInt(studentInputStr);
                    if (isNaN(num) || num < 2) {
                      setStudentInputStr('2');
                      onStudentCountChange(2);
                    } else if (num > 100) {
                      setStudentInputStr('100');
                      onStudentCountChange(100);
                    } else {
                      setStudentInputStr(String(num));
                      onStudentCountChange(num);
                    }
                  }}
                  disabled={rosterLocked || (gameMode === 'auto' && isPlaying)}
                  placeholder="40"
                  className="w-full px-4 py-2 text-center font-black text-emerald-900 bg-white border-2 border-emerald-300 rounded-xl focus:outline-none focus:border-emerald-600 text-2xl shadow-inner disabled:opacity-50"
                />

                <div className="mt-2.5 pt-2 border-t border-emerald-200/60 flex justify-between items-center text-[11px]">
                  <span className="text-stone-500">{rosterLocked ? 'Danh sách từ lớp đã chọn' : 'Mặc định đánh số tự động'}</span>
                  {!rosterLocked && <button
                    onClick={handleOpenCustomNames}
                    disabled={gameMode === 'auto' && isPlaying}
                    className="text-emerald-700 hover:text-emerald-900 font-bold underline disabled:opacity-50 cursor-pointer"
                  >
                    Dán tên học sinh (tùy chọn)
                  </button>}
                </div>
              </div>

              {/* CÁC MỤC CHỈ HIỂN THỊ Ở CHẾ ĐỘ MẶC ĐỊNH (ẨN HOÀN TOÀN Ở CHẾ ĐỘ TỰ BẮT) */}
              {gameMode === 'auto' && (
                <>
                  {/* SỐ LƯỢNG CHÚ ẾCH */}
                  <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-2xl">
                    <label className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1 mb-2">
                      <span>🐸</span>
                      Số lượng chú ếch
                    </label>

                    <input
                      type="text"
                      inputMode="numeric"
                      value={frogInputStr}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setFrogInputStr(val);
                        const num = parseInt(val);
                        if (!isNaN(num) && num >= 1 && num <= 10) {
                          onFrogCountChange(num);
                        }
                      }}
                      onBlur={() => {
                        const num = parseInt(frogInputStr);
                        if (isNaN(num) || num < 1) {
                          setFrogInputStr('1');
                          onFrogCountChange(1);
                        } else if (num > 10) {
                          setFrogInputStr('10');
                          onFrogCountChange(10);
                        } else {
                          setFrogInputStr(String(num));
                          onFrogCountChange(num);
                        }
                      }}
                      disabled={isPlaying}
                      placeholder="2"
                      className="w-full px-4 py-2 text-center font-black text-emerald-900 bg-white border-2 border-emerald-300 rounded-xl focus:outline-none focus:border-emerald-600 text-2xl shadow-inner disabled:opacity-50"
                    />
                  </div>

                  {/* SỐ BẠN CẦN CHỌN & TỐC ĐỘ */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Số bạn lên bảng */}
                    <div className="bg-stone-50 border border-stone-200 p-2.5 rounded-2xl">
                      <label className="text-[11px] font-black text-stone-700 uppercase tracking-wider block mb-1">
                        Cần chọn
                      </label>
                      <div className="flex gap-1">
                        {[1, 2, 3].map((num) => (
                          <button
                            key={num}
                            onClick={() => onWinnerCountChange(num)}
                            disabled={isPlaying}
                            className={`flex-1 py-1 rounded-lg font-bold text-xs border cursor-pointer ${
                              winnerCount === num
                                ? 'bg-amber-500 text-white border-amber-600'
                                : 'bg-white text-stone-700 border-stone-200 disabled:opacity-50'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tốc độ đớp */}
                    <div className="bg-stone-50 border border-stone-200 p-2.5 rounded-2xl">
                      <label className="text-[11px] font-black text-stone-700 uppercase tracking-wider block mb-1 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        Tốc độ
                      </label>
                      <select
                        value={speed}
                        onChange={(e) => onSpeedChange(e.target.value as SpeedLevel)}
                        className="w-full text-xs font-bold bg-white border border-stone-300 rounded-lg py-1 px-1 focus:outline-none focus:border-emerald-600 text-stone-800"
                      >
                        <option value="slow">Chậm (Hồi hộp)</option>
                        <option value="normal">Vừa (Chuẩn)</option>
                        <option value="fast">Nhanh</option>
                        <option value="turbo">Siêu tốc 🚀</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

            </>
          ) : (
            /* TAB: DANH SÁCH CHI TIẾT HỌC SINH */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-stone-600 bg-stone-100 p-2 rounded-xl font-medium">
                <span>Nhấn để báo vắng</span>
                <span className="font-bold text-emerald-700">
                  {students.filter((s) => !s.isAbsent && !s.hasAnswered).length} sẵn sàng
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {students.map((student) => {
                  return (
                    <button
                      key={student.id}
                      onClick={() => onToggleAbsent(student.id)}
                      disabled={isPlaying}
                      className={`p-2 rounded-xl text-left border text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        student.isAbsent
                          ? 'bg-stone-100 text-stone-400 border-dashed border-stone-300 line-through'
                          : student.hasAnswered
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-medium'
                          : 'bg-white border-stone-200 hover:border-emerald-400 text-stone-800'
                      }`}
                    >
                      <span className="font-bold truncate">
                        {student.name || `Số ${student.number}`}
                      </span>
                      {student.isAbsent ? (
                        <span className="text-[10px] text-rose-500 font-semibold no-underline ml-1">
                          Vắng
                        </span>
                      ) : student.hasAnswered ? (
                        <span className="text-[10px] text-emerald-600 font-bold no-underline ml-1">
                          ✓ Đã gọi
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action Controls Footer */}
        <div className="p-4 bg-white border-t border-stone-200 shadow-inner space-y-2 shrink-0">
          {winners && winners.length > 0 && (!isPlaying || gameMode === 'manual') && (
            <div className="space-y-2">
              <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-center">
                <span className="text-xs font-black text-amber-900 block mb-1">
                  🎉 {gameMode === 'manual' ? `Đã bắt lên đóa sen (${winners.length} bạn):` : 'Đã lên lá sen:'}
                </span>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {winners.map((w, idx) => (
                    <span
                      key={w.id}
                      className={`px-2 py-0.5 rounded-full text-xs font-bold border shadow-xs ${
                        idx === winners.length - 1 && gameMode === 'manual'
                          ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}
                    >
                      #{idx + 1}: {w.name || `Số ${w.number}`}
                      {idx === winners.length - 1 && gameMode === 'manual' && ' (Mới nhất ✨)'}
                    </span>
                  ))}
                </div>
              </div>
              {onExcludeAndContinue && (
                <button
                  onClick={() => onExcludeAndContinue(winners.map((w) => w.id))}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-md border border-emerald-400 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <span>✓</span> {gameMode === 'manual' ? 'Đã gọi xong - Làm mới đóa sen' : 'Chọn bạn tiếp theo'}
                </button>
              )}
            </div>
          )}

          {/* Bắt đầu đớp / Bắn lưỡi và Đặt lại cùng 1 hàng */}
          <div className="flex gap-2">
            {gameMode === 'manual' ? (
              <button
                onClick={onManualShoot}
                className="flex-[2] py-3.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600 hover:from-rose-600 hover:to-amber-600 text-white font-black text-sm rounded-xl shadow-lg border-2 border-rose-300 flex items-center justify-center gap-1.5 transform active:scale-[0.98] transition-all cursor-pointer animate-pulse"
                title="Bấm hoặc gõ phím Space để bắn lưỡi"
              >
                <Target className="w-4 h-4 fill-current" />
                BẮN LƯỠI 🎯 (Space)
              </button>
            ) : !isPlaying ? (
              <button
                onClick={onStart}
                className="flex-[2] py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-sm rounded-xl shadow-md border-2 border-emerald-400 flex items-center justify-center gap-1.5 transform active:scale-[0.98] transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                BẮT ĐẦU ĐỚP 👅
              </button>
            ) : (
              <button
                onClick={onPause}
                className="flex-[2] py-3.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-black text-sm rounded-xl shadow-md border-2 border-rose-400 flex items-center justify-center gap-1.5 transform active:scale-[0.98] transition-all cursor-pointer animate-pulse"
              >
                <Pause className="w-4 h-4 fill-current" />
                TẠM DỪNG ĐỚP
              </button>
            )}

            <button
              onClick={onReset}
              className="flex-1 py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl border-2 border-stone-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Đặt lại
            </button>
          </div>
        </div>
      </aside>

      {/* Modal Custom Names */}
      {showCustomNamesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-4 border-emerald-400 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-emerald-950 text-lg flex items-center gap-2">
                <span>📝</span> Dán danh sách tên học sinh
              </h3>
              <button
                onClick={() => setShowCustomNamesModal(false)}
                className="text-stone-400 hover:text-stone-700 font-black text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-stone-600">
              Mỗi học sinh một dòng. Nếu bạn không muốn nhập tên, bạn chỉ cần nhập số lượng ở bảng điều khiển bên ngoài!
            </p>
            <textarea
              rows={8}
              value={customNamesText}
              onChange={(e) => setCustomNamesText(e.target.value)}
              placeholder="Nguyễn Văn A&#10;Trần Thị B&#10;Lê Hoàng C..."
              className="w-full p-3 border-2 border-emerald-200 rounded-2xl text-xs font-mono focus:outline-none focus:border-emerald-600 shadow-inner"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowCustomNamesModal(false)}
                className="px-4 py-2 text-stone-600 font-bold text-xs rounded-xl hover:bg-stone-100 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleApplyCustomNames}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer"
              >
                Lưu & Áp dụng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
