"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, GraduationCap, Play, Sparkles, Users } from "lucide-react";

type GameId = "frog" | "ufo";
type GameClass = { id: string; name: string; student_count: number; school_year: string };
type ClassStudent = { id: string; name: string; number: number | null };

const games: Record<GameId, { title: string; description: string; icon: string; tag: string }> = {
  frog: {
    title: "Ếch Đớp Bọ",
    description: "Những chú ếch đớp bọ để chọn học sinh lên bảng. Có chế độ tự động và tự bắt.",
    icon: "🐸",
    tag: "Ao sen vui nhộn",
  },
  ufo: {
    title: "UFO Khảo Bài",
    description: "Đĩa bay tìm học sinh để gọi tên. Chơi nhiều lượt và theo dõi ai đã được gọi.",
    icon: "🛸",
    tag: "Phiêu lưu vũ trụ",
  },
};

export function GameHub({ classes, onGoClasses }: { classes: GameClass[]; onGoClasses: () => void }) {
  const [gameId, setGameId] = useState<GameId | null>(null);
  const [classId, setClassId] = useState("");
  const [roster, setRoster] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const frameRef = useRef<HTMLIFrameElement>(null);
  const selectedClass = classes.find((item) => item.id === classId);

  const sendRoster = useCallback(() => {
    if (!roster) return;
    frameRef.current?.contentWindow?.postMessage({ type: "goi-ten:roster", students: roster }, window.location.origin);
  }, [roster]);

  useEffect(() => {
    if (!roster) return;
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frameRef.current?.contentWindow) return;
      if (event.data?.type === "goi-ten:ready") sendRoster();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [roster, sendRoster]);

  function selectGame(next: GameId) {
    setGameId(next);
    setClassId(classes.find((item) => item.student_count > 0)?.id ?? "");
    setRoster(null);
    setError("");
  }

  async function startGame() {
    if (!gameId || !classId) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/classes/${encodeURIComponent(classId)}/students`, { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Không tải được danh sách học sinh.");
      const names = (body as ClassStudent[]).map((student) => student.name.trim()).filter(Boolean);
      if (names.length === 0) throw new Error("Lớp này chưa có học sinh. Hãy thêm học sinh trước khi chơi.");
      if (gameId === "frog" && names.length < 2) throw new Error("Ếch Đớp Bọ cần ít nhất 2 học sinh để chọn người còn lại.");
      setRoster(names);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (gameId && roster) {
    return <div className="game-play-page">
      <div className="game-play-toolbar">
        <button className="game-back-button" onClick={() => setRoster(null)}><ArrowLeft size={17}/> Chọn lớp khác</button>
        <div><strong>{games[gameId].icon} {games[gameId].title}</strong><span>{selectedClass?.name} · {roster.length} học sinh</span></div>
        <button className="game-close-button" onClick={() => { setRoster(null); setGameId(null); }}>Tất cả trò chơi</button>
      </div>
      <iframe
        key={`${gameId}-${classId}`}
        ref={frameRef}
        className="game-frame"
        src={`/games/${gameId}/index.html`}
        title={`${games[gameId].title} - ${selectedClass?.name ?? "Lớp học"}`}
        allowFullScreen
        onLoad={sendRoster}
      />
    </div>;
  }

  if (gameId) {
    return <div className="game-hub-page">
      <button className="back-link" onClick={() => { setGameId(null); setError(""); }}><ArrowLeft size={16}/> Tất cả trò chơi</button>
      <div className="page-heading"><div><span className="overline">TẠO VÁN MỚI</span><h1>{games[gameId].icon} {games[gameId].title}</h1><p>Chọn lớp học để đưa danh sách thành viên vào trò chơi.</p></div></div>
      <div className="game-class-panel panel">
        <div className="game-class-heading"><span className="game-class-icon"><GraduationCap size={23}/></span><div><h2>Chọn lớp học</h2><p>Trò chơi sẽ dùng danh sách học sinh mới nhất của lớp.</p></div></div>
        {classes.length ? <div className="game-class-list">{classes.map((item) => <button
          key={item.id}
          className={`game-class-option ${classId === item.id ? "selected" : ""}`}
          onClick={() => { setClassId(item.id); setError(""); }}
        ><span className="game-class-radio"/><span className="game-class-name"><strong>{item.name}</strong><small>{item.school_year || "Năm học mới"}</small></span><span className="game-class-count"><Users size={15}/>{item.student_count} học sinh</span></button>)}</div> : <div className="game-class-empty"><p>Bạn chưa có lớp học nào.</p><button className="button secondary" onClick={onGoClasses}>Tạo lớp học <ArrowRight size={16}/></button></div>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="game-class-actions"><button className="button secondary" onClick={onGoClasses}><Users size={16}/> Quản lý lớp học</button><button className="button primary" disabled={!classId || loading} onClick={startGame}><Play size={17}/>{loading ? "Đang tải lớp..." : "Bắt đầu chơi"}</button></div>
      </div>
    </div>;
  }

  return <div className="game-hub-page">
    <div className="page-heading"><div><span className="overline">CÙNG CẢ LỚP VUI HỌC</span><h1>Trò chơi gọi tên <span className="heading-sparkle">✳</span></h1><p>Chọn một trò chơi, chọn lớp học rồi bắt đầu gọi tên.</p></div><span className="game-count-badge"><Sparkles size={15}/> 2 trò chơi</span></div>
    <div className="game-gallery">{(["frog", "ufo"] as const).map((id) => <button key={id} className={`game-gallery-card game-${id}`} onClick={() => selectGame(id)}>
      <span className="game-gallery-art"><span>{games[id].icon}</span><i/><i/><i/></span>
      <span className="game-gallery-body"><small>{games[id].tag}</small><strong>{games[id].title}</strong><span>{games[id].description}</span><b>Chọn trò chơi <ArrowRight size={16}/></b></span>
    </button>)}</div>
    {!classes.length && <div className="game-hub-hint"><GraduationCap size={19}/><span>Hãy tạo lớp và thêm học sinh để bắt đầu chơi.</span><button onClick={onGoClasses}>Quản lý lớp <ArrowRight size={15}/></button></div>}
  </div>;
}
