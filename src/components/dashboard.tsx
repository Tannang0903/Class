"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { signOut } from "next-auth/react";
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, CircleHelp, GraduationCap, LayoutGrid, LogOut, Menu, MoreHorizontal, Plus, Search, Sparkles, Trash2, UserRound, Users, WandSparkles, X } from "lucide-react";

type User = { name: string; email: string; image?: string };
type ClassItem = { id: string; name: string; school_year: string; description: string; created_at: string; student_count: number };
type Student = { id: string; class_id: string; name: string; number: number | null };
type View = "classes" | "game";

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...options?.headers } });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || "Đã có lỗi xảy ra.");
  return body as T;
}

export function Dashboard({ user }: { user: User }) {
  const [view, setView] = useState<View>("classes");
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentLoading, setStudentLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [classModal, setClassModal] = useState<"new" | "edit" | null>(null);
  const [studentModal, setStudentModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const selected = classes.find((item) => item.id === selectedId);

  const refreshClasses = useCallback(async () => {
    try { setClasses(await api<ClassItem[]>("/api/classes")); }
    catch (err) { setNotice((err as Error).message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void refreshClasses(); }, [refreshClasses]);
  useEffect(() => {
    if (!selectedId) { setStudents([]); return; }
    setStudentLoading(true);
    void api<Student[]>(`/api/classes/${selectedId}/students`).then(setStudents).catch((err) => setNotice(err.message)).finally(() => setStudentLoading(false));
  }, [selectedId]);

  const filteredClasses = useMemo(() => classes.filter((item) => item.name.toLocaleLowerCase("vi").includes(search.toLocaleLowerCase("vi"))), [classes, search]);
  const filteredStudents = useMemo(() => students.filter((item) => item.name.toLocaleLowerCase("vi").includes(studentSearch.toLocaleLowerCase("vi"))), [students, studentSearch]);
  const totalStudents = classes.reduce((sum, item) => sum + item.student_count, 0);

  async function saveClass(form: { name: string; schoolYear: string; description: string }) {
    const isEdit = classModal === "edit" && selectedId;
    const data = await api<{ id?: string }>(isEdit ? `/api/classes/${selectedId}` : "/api/classes", { method: isEdit ? "PATCH" : "POST", body: JSON.stringify(form) });
    await refreshClasses();
    if (!isEdit && data.id) setSelectedId(data.id);
    setClassModal(null); setNotice(isEdit ? "Đã cập nhật lớp học." : "Đã tạo lớp học mới.");
  }

  async function removeClass() {
    if (!selectedId || !window.confirm(`Xóa lớp “${selected?.name}” và toàn bộ danh sách học sinh?`)) return;
    try { await api(`/api/classes/${selectedId}`, { method: "DELETE" }); setSelectedId(null); await refreshClasses(); setMenuOpen(false); setNotice("Đã xóa lớp học."); }
    catch (err) { setNotice((err as Error).message); }
  }

  async function addStudent(name: string, number: string) {
    if (!selectedId) return;
    await api(`/api/classes/${selectedId}/students`, { method: "POST", body: JSON.stringify({ name, number }) });
    setStudents(await api<Student[]>(`/api/classes/${selectedId}/students`));
    await refreshClasses(); setStudentModal(false); setNotice("Đã thêm học sinh.");
  }

  async function removeStudent(id: string, name: string) {
    if (!selectedId || !window.confirm(`Xóa ${name} khỏi lớp?`)) return;
    try { await api(`/api/classes/${selectedId}/students/${id}`, { method: "DELETE" }); setStudents((rows) => rows.filter((row) => row.id !== id)); await refreshClasses(); setNotice("Đã xóa học sinh."); }
    catch (err) { setNotice((err as Error).message); }
  }

  function navigate(next: View) { setView(next); setSelectedId(null); setMobileNav(false); setSearch(""); }

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? "mobile-open" : ""}`}>
      <div className="brand sidebar-brand"><span className="brand-mark"><GraduationCap size={21} strokeWidth={2.6}/></span><span>GọiTên<span className="brand-accent">.</span></span></div>
      <div className="nav-label">KHÔNG GIAN CỦA BẠN</div>
      <nav className="nav-list"><button className={`nav-item ${view === "game" ? "active" : ""}`} onClick={() => navigate("game")}><WandSparkles size={19}/> Trò chơi gọi tên <span className="nav-badge">Sắp có</span></button><button className={`nav-item ${view === "classes" ? "active" : ""}`} onClick={() => navigate("classes")}><Users size={19}/> Quản lý lớp học</button></nav>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><Sparkles size={18}/></div><strong>Sẵn sàng gọi tên?</strong><p>Tạo lớp và thêm học sinh để chuẩn bị cho trò chơi sắp ra mắt.</p></div><div className="sidebar-separator"/><div className="profile"><span className="avatar">{user.image ? <img src={user.image} alt="" referrerPolicy="no-referrer"/> : user.name.charAt(0).toUpperCase()}</span><span className="profile-text"><strong>{user.name}</strong><small>{user.email}</small></span><button className="icon-button logout" title="Đăng xuất" aria-label="Đăng xuất" onClick={() => signOut({ callbackUrl: "/" })}><LogOut size={18}/></button></div></div>
    </aside>
    {mobileNav && <button className="mobile-overlay" onClick={() => setMobileNav(false)} aria-label="Đóng menu"/>}
    <div className="main-area"><header className="topbar"><button className="icon-button mobile-menu" aria-label="Mở menu" onClick={() => setMobileNav(true)}><Menu size={22}/></button><div className="breadcrumb"><span>Không gian của bạn</span><span className="crumb-slash">/</span><strong>{view === "classes" ? selected ? selected.name : "Quản lý lớp học" : "Trò chơi gọi tên"}</strong></div><div className="topbar-right"><span className="topbar-date">Năm học 2026 – 2027</span><span className="top-avatar">{user.name.charAt(0).toUpperCase()}</span></div></header>
      {notice && <div className="toast" role="status"><Check size={16}/>{notice}<button aria-label="Đóng thông báo" onClick={() => setNotice("")}><X size={14}/></button></div>}
      <main className="content">{view === "game" ? <GamePlaceholder onGoClasses={() => navigate("classes")} classes={classes}/> : selected ? <><button className="back-link" onClick={() => setSelectedId(null)}><ArrowLeft size={16}/> Tất cả lớp học</button><div className="page-heading detail-heading"><div><span className="overline">DANH SÁCH LỚP HỌC</span><h1>{selected.name}</h1><p>{selected.description || "Quản lý thành viên và chuẩn bị danh sách cho trò chơi gọi tên."}</p></div><div className="heading-actions"><div className="menu-wrap"><button className="button secondary small" onClick={() => setMenuOpen(!menuOpen)}><MoreHorizontal size={18}/> Tùy chọn <ChevronDown size={14}/></button>{menuOpen && <div className="dropdown"><button onClick={() => { setClassModal("edit"); setMenuOpen(false); }}>Chỉnh sửa lớp</button><button className="danger" onClick={removeClass}>Xóa lớp</button></div>}</div><button className="button primary" onClick={() => setStudentModal(true)}><Plus size={18}/> Thêm học sinh</button></div></div><div className="class-meta"><span><Users size={16}/>{selected.student_count} học sinh</span><span><BookOpen size={16}/>{selected.school_year || "Chưa chọn năm học"}</span></div><div className="panel student-panel"><div className="panel-header"><div><h2>Danh sách học sinh</h2><p>{selected.student_count} thành viên trong lớp</p></div><label className="search-box student-search"><Search size={18}/><input placeholder="Tìm học sinh..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)}/></label></div>{studentLoading ? <div className="empty-small">Đang tải danh sách...</div> : filteredStudents.length ? <div className="student-table"><div className="student-table-head"><span>STT</span><span>HỌ VÀ TÊN</span><span></span></div>{filteredStudents.map((student, i) => <div className="student-row" key={student.id}><span className="student-number">{student.number ?? i + 1}</span><span className="student-name"><span className="student-avatar">{student.name.charAt(0).toUpperCase()}</span>{student.name}</span><button className="icon-button delete-student" title={`Xóa ${student.name}`} aria-label={`Xóa ${student.name}`} onClick={() => removeStudent(student.id, student.name)}><Trash2 size={17}/></button></div>)}</div> : <div className="empty-small"><div className="empty-icon"><UserRound size={25}/></div><h3>{studentSearch ? "Không tìm thấy học sinh" : "Lớp học chưa có học sinh"}</h3><p>{studentSearch ? "Thử tìm bằng tên khác." : "Thêm học sinh để xây dựng danh sách lớp học."}</p>{!studentSearch && <button className="button primary small" onClick={() => setStudentModal(true)}><Plus size={16}/> Thêm học sinh đầu tiên</button>}</div>}</div></> : <><div className="page-heading"><div><span className="overline">TỔNG QUAN</span><h1>Quản lý lớp học <span className="heading-sparkle">✳</span></h1><p>Gói gọn mọi lớp học và danh sách học sinh trong một nơi.</p></div><button className="button primary" onClick={() => setClassModal("new")}><Plus size={19}/> Tạo lớp học</button></div><div className="stats-grid"><div className="stat-card"><span className="stat-icon mint"><BookOpen size={21}/></span><span className="stat-label">Tổng số lớp</span><strong>{classes.length.toString().padStart(2, "0")}</strong><small>Lớp học của bạn</small></div><div className="stat-card"><span className="stat-icon violet"><Users size={21}/></span><span className="stat-label">Tổng học sinh</span><strong>{totalStudents.toString().padStart(2, "0")}</strong><small>Trong tất cả lớp học</small></div><div className="stat-feature"><div><span className="feature-badge"><Sparkles size={14}/> SẮP RA MẮT</span><h3>Biến giờ học thành<br/>niềm vui!</h3><p>Trò chơi gọi tên sẽ sử dụng danh sách lớp của bạn.</p></div><div className="feature-illustration"><div className="feature-bubble bubble-one">A</div><div className="feature-bubble bubble-two">✦</div><div className="feature-bubble bubble-three">B</div></div></div></div><div className="section-heading"><div><h2>Lớp học của bạn</h2><p>Chọn một lớp để xem và quản lý thành viên</p></div><label className="search-box"><Search size={18}/><input placeholder="Tìm lớp học..." value={search} onChange={(e) => setSearch(e.target.value)}/></label></div>{loading ? <div className="empty-state panel">Đang tải lớp học...</div> : filteredClasses.length ? <div className="class-grid">{filteredClasses.map((item, index) => <button className="class-card" key={item.id} onClick={() => setSelectedId(item.id)}><div className={`class-art art-${index % 4}`}><div className="class-art-blob blob-a"/><div className="class-art-blob blob-b"/><span className="class-art-icon"><GraduationCap size={36}/></span></div><div className="class-card-content"><div className="class-card-title"><h3>{item.name}</h3><ArrowRight size={18}/></div><p>{item.description || "Danh sách lớp học của bạn"}</p><div className="class-card-footer"><span><Users size={16}/>{item.student_count} học sinh</span><span>{item.school_year || "Năm học mới"}</span></div></div></button>)}<button className="class-add-card" onClick={() => setClassModal("new")}><span><Plus size={26}/></span><strong>Tạo lớp học mới</strong><small>Bắt đầu một lớp học mới</small></button></div> : <div className="empty-state panel"><div className="empty-icon"><LayoutGrid size={28}/></div><h3>{search ? "Không tìm thấy lớp học" : "Bắt đầu với lớp học đầu tiên"}</h3><p>{search ? "Thử một tên lớp khác." : "Tạo lớp học để thêm danh sách học sinh của bạn."}</p>{!search && <button className="button primary" onClick={() => setClassModal("new")}><Plus size={18}/> Tạo lớp học</button>}</div>}</>}</main>
    </div>
    {classModal && <ClassModal mode={classModal} initial={classModal === "edit" ? selected : undefined} onClose={() => setClassModal(null)} onSave={saveClass}/>}
    {studentModal && <StudentModal onClose={() => setStudentModal(false)} onSave={addStudent}/>}
  </div>;
}

function GamePlaceholder({ onGoClasses, classes }: { onGoClasses: () => void; classes: ClassItem[] }) {
  return <><div className="page-heading"><div><span className="overline">SẮP RA MẮT</span><h1>Trò chơi gọi tên <span className="heading-sparkle">✳</span></h1><p>Chọn lớp học và gọi tên các thành viên theo cách thật thú vị.</p></div></div><div className="game-panel panel"><div className="game-orbit"><span className="orbit-center"><WandSparkles size={44}/></span><span className="orbit-dot dot-a">A</span><span className="orbit-dot dot-b">B</span><span className="orbit-dot dot-c">C</span></div><span className="feature-badge"><Sparkles size={14}/> ĐANG PHÁT TRIỂN</span><h2>Một trò chơi mới đang đến!</h2><p>Danh sách học sinh từ lớp bạn tạo sẽ sẵn sàng để chọn khi trò chơi gọi tên ra mắt.</p><button className="button primary" onClick={onGoClasses}><Users size={18}/> Quản lý {classes.length ? `${classes.length} lớp học` : "lớp học"} <ArrowRight size={17}/></button></div></>;
}

function ClassModal({ mode, initial, onClose, onSave }: { mode: "new" | "edit"; initial?: ClassItem; onClose: () => void; onSave: (form: { name: string; schoolYear: string; description: string }) => Promise<void> }) {
  const [name, setName] = useState(initial?.name || ""); const [schoolYear, setSchoolYear] = useState(initial?.school_year || "2026 - 2027"); const [description, setDescription] = useState(initial?.description || ""); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function submit(e: React.FormEvent) { e.preventDefault(); setBusy(true); setError(""); try { await onSave({ name, schoolYear, description }); } catch (err) { setError((err as Error).message); setBusy(false); } }
  return <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="class-modal-title"><div className="modal-header"><span className="modal-icon"><BookOpen size={21}/></span><button className="icon-button" onClick={onClose} aria-label="Đóng"><X size={20}/></button></div><h2 id="class-modal-title">{mode === "new" ? "Tạo lớp học mới" : "Chỉnh sửa lớp học"}</h2><p className="modal-subtitle">{mode === "new" ? "Thêm thông tin để bắt đầu xây dựng danh sách lớp." : "Cập nhật thông tin lớp học của bạn."}</p><form onSubmit={submit}><label className="field-label">Tên lớp <span>*</span><input autoFocus required maxLength={100} placeholder="Ví dụ: Lớp 3A" value={name} onChange={(e) => setName(e.target.value)}/></label><label className="field-label">Năm học<input maxLength={30} placeholder="Ví dụ: 2026 - 2027" value={schoolYear} onChange={(e) => setSchoolYear(e.target.value)}/></label><label className="field-label">Mô tả <small>(tùy chọn)</small><textarea maxLength={300} placeholder="Một vài điều về lớp học của bạn..." rows={3} value={description} onChange={(e) => setDescription(e.target.value)}/></label>{error && <p className="form-error">{error}</p>}<div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Hủy</button><button type="submit" className="button primary" disabled={busy}>{busy ? "Đang lưu..." : mode === "new" ? "Tạo lớp học" : "Lưu thay đổi"}<ArrowRight size={17}/></button></div></form></div></div>;
}

function StudentModal({ onClose, onSave }: { onClose: () => void; onSave: (name: string, number: string) => Promise<void> }) {
  const [name, setName] = useState(""); const [number, setNumber] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function submit(e: React.FormEvent) { e.preventDefault(); setBusy(true); setError(""); try { await onSave(name, number); } catch (err) { setError((err as Error).message); setBusy(false); } }
  return <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="student-modal-title"><div className="modal-header"><span className="modal-icon"><UserRound size={21}/></span><button className="icon-button" onClick={onClose} aria-label="Đóng"><X size={20}/></button></div><h2 id="student-modal-title">Thêm học sinh</h2><p className="modal-subtitle">Thêm một thành viên vào danh sách lớp học.</p><form onSubmit={submit}><label className="field-label">Họ và tên <span>*</span><input autoFocus required maxLength={100} placeholder="Ví dụ: Nguyễn Minh Anh" value={name} onChange={(e) => setName(e.target.value)}/></label><label className="field-label">Số thứ tự <small>(tùy chọn)</small><input type="number" min="1" max="9999" placeholder="Ví dụ: 01" value={number} onChange={(e) => setNumber(e.target.value)}/></label>{error && <p className="form-error">{error}</p>}<div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Hủy</button><button type="submit" className="button primary" disabled={busy}>{busy ? "Đang lưu..." : "Thêm học sinh"}<ArrowRight size={17}/></button></div></form></div></div>;
}
