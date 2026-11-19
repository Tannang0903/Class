import React, { useState, useEffect, useCallback } from 'react';
import { UfoCanvas } from './components/UfoCanvas';
import { ControlBar } from './components/ControlBar';
import { StudentInputModal } from './components/StudentInputModal';
import { ExamResultsModal } from './components/ExamResultsModal';
import { Student, GameStatus } from './types';
import { soundManager } from './utils/audio';

const INITIAL_STUDENT_NAMES = Array.from({ length: 40 }, (_, idx) => {
  const num = String(idx + 1).padStart(2, '0');
  return `STT ${num}`;
});

export const App: React.FC = () => {
  // Students and Game State
  const [students, setStudents] = useState<Student[]>(() => {
    return INITIAL_STUDENT_NAMES.map((name, i) => {
      const isMale = i % 2 === 0;
      return {
        id: `stu_${i + 1}`,
        name,
        gender: isMale ? 'male' : 'female',
        x: 0,
        y: 0,
        targetX: 0,
        speed: 0.6,
        direction: 1,
        state: 'walking',
        liftProgress: 0,
        colorTheme: {
          shirt: '#ffffff',
          pants: isMale ? '#1e3a8a' : '#0369a1',
          hair: isMale ? (i % 3 === 0 ? '#1e293b' : '#3b1d11') : (i % 3 === 0 ? '#451a03' : '#1e1b4b'),
          skin: '#fed7aa',
        },
      };
    });
  });

  const [targetCount, setTargetCount] = useState<number>(1);
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [animationSpeed, setAnimationSpeed] = useState<number>(1.0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Modals & Panels
  const [isStudentModalOpen, setIsStudentModalOpen] = useState<boolean>(false);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState<boolean>(false);
  const [abductedStudents, setAbductedStudents] = useState<Student[]>([]);

  // Students who have already been called today
  const [exemptedStudentIds, setExemptedStudentIds] = useState<Set<string>>(new Set());
  const [classRosterLoaded, setClassRosterLoaded] = useState(false);

  // Active playable students (excluding exempted)
  const activePlayableStudents = students.filter((s) => !exemptedStudentIds.has(s.id));

  // Auto clamp targetCount if students count changes
  useEffect(() => {
    const maxAvailable = activePlayableStudents.length > 0 ? activePlayableStudents.length : students.length;
    if (maxAvailable > 0 && targetCount > maxAvailable) {
      setTargetCount(Math.max(1, Math.min(10, maxAvailable)));
    }
  }, [activePlayableStudents.length, students.length, targetCount]);

  // Sync fullscreen state with document fullscreen changes (e.g. Esc key pressed)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Update students when teacher inputs a new class list / size
  const handleSaveStudents = useCallback(
    (names: string[]) => {
      const newStudents: Student[] = names.map((name, i) => {
        const isMale = i % 2 === 0;
        return {
          id: `stu_${Date.now()}_${i}`,
          name,
          gender: isMale ? 'male' : 'female',
          x: 0,
          y: 0,
          targetX: 0,
          speed: 0.6,
          direction: 1,
          state: 'walking',
          liftProgress: 0,
          lane: i % 4,
          colorTheme: {
            shirt: '#ffffff',
            pants: isMale ? '#1e3a8a' : '#0369a1',
            hair: isMale ? (i % 3 === 0 ? '#1e293b' : '#3b1d11') : (i % 3 === 0 ? '#451a03' : '#1e1b4b'),
            skin: '#fed7aa',
          },
        };
      });

      setStudents(newStudents);
      setExemptedStudentIds(new Set());
      setGameStatus('idle');
    },
    []
  );

  // Receive the chosen classroom from the authenticated Next.js page.
  useEffect(() => {
    if (window.parent === window) return;
    const receiveRoster = (event: MessageEvent) => {
      if (event.source !== window.parent || event.origin !== window.location.origin) return;
      if (event.data?.type !== 'goi-ten:roster' || !Array.isArray(event.data.students)) return;
      const names = event.data.students.filter((name: unknown): name is string => typeof name === 'string' && name.trim().length > 0).map((name: string) => name.trim().slice(0, 100));
      handleSaveStudents(names);
      setClassRosterLoaded(true);
    };
    window.addEventListener('message', receiveRoster);
    window.parent.postMessage({ type: 'goi-ten:ready' }, window.location.origin);
    return () => window.removeEventListener('message', receiveRoster);
  }, [handleSaveStudents]);

  // Handle Abducted Callback from Canvas
  const handleAbductedStudents = useCallback((caught: Student[]) => {
    setAbductedStudents(caught);
    setGameStatus('idle');
    setIsResultsModalOpen(true);
  }, []);

  // Mark students as called / exempted
  const handleExemptStudents = useCallback((ids: string[]) => {
    setExemptedStudentIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  // Game Control Actions
  const handleStartGame = useCallback(() => {
    if (activePlayableStudents.length === 0) {
      setExemptedStudentIds(new Set());
    }
    soundManager.playClick();
    setGameStatus('hunting');
  }, [activePlayableStudents.length]);

  const handleResetGame = useCallback(() => {
    soundManager.playClick();
    setGameStatus('idle');
  }, []);

  const handleToggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      soundManager.setEnabled(next);
      return next;
    });
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (gameStatus === 'idle') {
          handleStartGame();
        } else if (gameStatus === 'hunting' || gameStatus === 'abducting') {
          handleResetGame();
        }
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        handleToggleFullscreen();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        handleToggleSound();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStatus, handleStartGame, handleResetGame, handleToggleFullscreen, handleToggleSound]);

  return (
    <div className="h-screen h-[100dvh] max-h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950 font-sans select-none">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md shrink-0 z-40">
        <div className="max-w-[1700px] mx-auto px-3 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-400 p-0.5 shadow-md shadow-emerald-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-xl sm:text-2xl">
                🛸
              </div>
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-wide text-white leading-tight">
                UFO DÒ BÀI
              </h1>
            </div>
          </div>

          {/* Classroom Stats badge in Header */}
          <button
            onClick={() => setIsStudentModalOpen(true)}
            disabled={classRosterLoaded}
            className="flex items-center gap-2 sm:gap-3 px-3.5 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-xl text-xs text-slate-300 font-medium transition active:scale-95 shadow-xs"
            title="Nhấp để cài đặt sĩ số học sinh"
          >
            <span>Sĩ số: <strong className="text-emerald-400 font-bold">{students.length}</strong></span>
            <span className="text-slate-600">·</span>
            <span>Chưa gọi: <strong className="text-cyan-400 font-bold">{activePlayableStudents.length}</strong></span>
            <span className="text-slate-600">·</span>
            <span>Đã gọi: <strong className="text-amber-400 font-bold">{exemptedStudentIds.size}</strong></span>
          </button>
        </div>
      </header>

      {/* Main Classroom Gaming Arena - Fits 100% on 1 screen without scrolling */}
      <main className="max-w-[1700px] mx-auto w-full px-2 sm:px-4 py-2 flex-1 min-h-0 flex flex-col gap-2 overflow-hidden">
        {/* THE CANVAS ARENA - Dynamically fits available height */}
        <div className="relative flex-1 min-h-0 w-full overflow-hidden">
          <UfoCanvas
            students={students}
            exemptedStudentIds={exemptedStudentIds}
            targetCount={targetCount}
            gameStatus={gameStatus}
            onGameStatusChange={setGameStatus}
            onAbductedStudents={handleAbductedStudents}
            animationSpeed={animationSpeed}
          />
        </div>

        {/* TEACHER CONTROL BAR */}
        <ControlBar
          gameStatus={gameStatus}
          targetCount={targetCount}
          onTargetCountChange={setTargetCount}
          onStartGame={handleStartGame}
          onResetGame={handleResetGame}
          onOpenStudentModal={() => setIsStudentModalOpen(true)}
          rosterLocked={classRosterLoaded}
          totalStudents={students.length}
          eligibleCount={activePlayableStudents.length}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          animationSpeed={animationSpeed}
          onSpeedChange={setAnimationSpeed}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
        />
      </main>

      {/* Student List Input Modal */}
      <StudentInputModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        currentStudents={students}
        onSaveStudents={handleSaveStudents}
      />

      {/* Abduction Result Announcement Modal */}
      <ExamResultsModal
        isOpen={isResultsModalOpen}
        onClose={() => setIsResultsModalOpen(false)}
        abductedStudents={abductedStudents}
        onExemptStudents={handleExemptStudents}
        onRestartNewRound={() => {
          setIsResultsModalOpen(false);
          handleStartGame();
        }}
      />
    </div>
  );
};

export default App;
