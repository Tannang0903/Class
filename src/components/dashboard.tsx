"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { signOut } from "next-auth/react";
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, CircleHelp, GraduationCap, LayoutGrid, LogOut, Menu, MoreHorizontal, Pencil, Plus, Search, Sparkles, Trash2, UserRound, Users, WandSparkles, X } from "lucide-react";
import { GameHub } from "./game-hub";

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
  const [studentModal, setStudentModal] = useState<Student | "new" | null>(null);
  const [rosterModal, setRosterModal] = useState(false);
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

  async function saveClass(form: { name: string; schoolYear: string; description: string; studentCount: number }) {
    const isEdit = classModal === "edit" && selectedId;
    const data = await api<{ id?: string }>(isEdit ? `/api/classes/${selectedId}` : "/api/classes", { method: isEdit ? "PATCH" : "POST", body: JSON.stringify(form) });
    await refreshClasses();
    if (isEdit) setStudents(await api<Student[]>(`/api/classes/${selectedId}/students`));
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
    await refreshClasses(); setStudentModal(null); setNotice("Đã thêm học sinh.");
  }

  async function renameStudent(id: string, name: string) {
    if (!selectedId) return;
    await api(`/api/classes/${selectedId}/students/${id}`, { method: "PATCH", body: JSON.stringify({ name }) });
    setStudents((rows) => rows.map((student) => student.id === id ? { ...student, name: name.trim() } : student));
    setStudentModal(null);
    setNotice("Đã cập nhật tên học sinh.");
  }

  async function saveRoster(names: string[]) {
    if (!selectedId || names.length !== students.length) return;
    await api(`/api/classes/${selectedId}/students`, {
      method: "PATCH",
      body: JSON.stringify({ students: students.map((student, index) => ({ id: student.id, name: names[index] })) }),
    });
    setStudents((rows) => rows.map((student, index) => ({ ...student, name: names[index].trim() })));
    setRosterModal(false);
    setNotice("Đã cập nhật danh sách học sinh.");
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
      <nav className="nav-list"><button className={`nav-item ${view === "game" ? "active" : ""}`} onClick={() => navigate("game")}><WandSparkles size={19}/> Trò chơi gọi tên <span className="nav-badge">2 trò chơi</span></button><button className={`nav-item ${view === "classes" ? "active" : ""}`} onClick={() => navigate("classes")}><Users size={19}/> Quản lý lớp học</button></nav>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><Sparkles size={18}/></div><strong>Sẵn sàng gọi tên?</strong><p>Chọn lớp học và bắt đầu với Ếch Đớp Bọ hoặc UFO Khảo Bài.</p></div><div className="sidebar-separator"/><div className="profile"><span className="avatar">{user.image ? <img src={user.image} alt="" referrerPolicy="no-referrer"/> : user.name.charAt(0).toUpperCase()}</span><span className="profile-text"><strong>{user.name}</strong><small>{user.email}</small></span><button className="icon-button logout" title="Đăng xuất" aria-label="Đăng xuất" onClick={() => signOut({ callbackUrl: "/" })}><LogOut size={18}/></button></div></div>
    </aside>
    {mobileNav && <button className="mobile-overlay" onClick={() => setMobileNav(false)} aria-label="Đóng menu"/>}
    <div className="main-area"><header className="topbar"><button className="icon-button mobile-menu" aria-label="Mở menu" onClick={() => setMobileNav(true)}><Menu size={22}/></button><div className="breadcrumb"><span>Không gian của bạn</span><span className="crumb-slash">/</span><strong>{view === "classes" ? selected ? selected.name : "Quản lý lớp học" : "Trò chơi gọi tên"}</strong></div><div className="topbar-right"><span className="topbar-date">Năm học 2026 – 2027</span><span className="top-avatar">{user.name.charAt(0).toUpperCase()}</span></div></header>
      {notice && <div className="toast" role="status"><Check size={16}/>{notice}<button aria-label="Đóng thông báo" onClick={() => setNotice("")}><X size={14}/></button></div>}
      <main className={`content ${view === "game" ? "game-content" : ""}`}>{view === "game" ? <GameHub onGoClasses={() => navigate("classes")} classes={classes}/> : selected ? <><button className="back-link" onClick={() => setSelectedId(null)}><ArrowLeft size={16}/> Tất cả lớp học</button><div className="page-heading detail-heading"><div><span className="overline">DANH SÁCH LỚP HỌC</span><h1>{selected.name}</h1><p>{selected.description || "Quản lý thành viên và chuẩn bị danh sách cho trò chơi gọi tên."}</p></div><div className="heading-actions"><div className="menu-wrap"><button className="button secondary small" onClick={() => setMenuOpen(!menuOpen)}><MoreHorizontal size={18}/> Tùy chọn <ChevronDown size={14}/></button>{menuOpen && <div className="dropdown"><button onClick={() => { setClassModal("edit"); setMenuOpen(false); }}>Chỉnh sửa lớp</button><button className="danger" onClick={removeClass}>Xóa lớp</button></div>}</div><button className="button secondary" onClick={() => setRosterModal(true)} disabled={studentLoading || students.length === 0}><Pencil size={17}/> Cập nhật danh sách</button><button className="button primary" onClick={() => setStudentModal("new")}><Plus size={18}/> Thêm học sinh</button></div></div><div className="class-meta"><span><Users size={16}/>{selected.student_count} học sinh</span><span><BookOpen size={16}/>{selected.school_year || "Chưa chọn năm học"}</span></div><div className="panel student-panel"><div className="panel-header"><div><h2>Danh sách học sinh</h2><p>{selected.student_count} thành viên trong lớp</p></div><label className="search-box student-search"><Search size={18}/><input placeholder="Tìm học sinh..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)}/></label></div>{studentLoading ? <div className="empty-small">Đang tải danh sách...</div> : filteredStudents.length ? <div className="student-table"><div className="student-table-head"><span>STT</span><span>HỌ VÀ TÊN</span><span></span></div>{filteredStudents.map((student, i) => <div className="student-row" key={student.id}><span className="student-number">{student.number ?? i + 1}</span><span className="student-name"><span className="student-avatar">{student.name.charAt(0).toUpperCase()}</span>{student.name}</span><span className="student-actions"><button className="icon-button edit-student" title={`Sửa tên ${student.name}`} aria-label={`Sửa tên ${student.name}`} onClick={() => setStudentModal(student)}><Pencil size={16}/></button><button className="icon-button delete-student" title={`Xóa ${student.name}`} aria-label={`Xóa ${student.name}`} onClick={() => removeStudent(student.id, student.name)}><Trash2 size={17}/></button></span></div>)}</div> : <div className="empty-small"><div className="empty-icon"><UserRound size={25}/></div><h3>{studentSearch ? "Không tìm thấy học sinh" : "Lớp học chưa có học sinh"}</h3><p>{studentSearch ? "Thử tìm bằng tên khác." : "Thêm học sinh để xây dựng danh sách lớp học."}</p>{!studentSearch && <button className="button primary small" onClick={() => setStudentModal("new")}><Plus size={16}/> Thêm học sinh đầu tiên</button>}</div>}</div></> : <><div className="page-heading"><div><span className="overline">TỔNG QUAN</span><h1>Quản lý lớp học <span className="heading-sparkle">✳</span></h1><p>Gói gọn mọi lớp học và danh sách học sinh trong một nơi.</p></div><button className="button primary" onClick={() => setClassModal("new")}><Plus size={19}/> Tạo lớp học</button></div><div className="stats-grid"><div className="stat-card"><span className="stat-icon mint"><BookOpen size={21}/></span><span className="stat-label">Tổng số lớp</span><strong>{classes.length.toString().padStart(2, "0")}</strong><small>Lớp học của bạn</small></div><div className="stat-card"><span className="stat-icon violet"><Users size={21}/></span><span className="stat-label">Tổng học sinh</span><strong>{totalStudents.toString().padStart(2, "0")}</strong><small>Trong tất cả lớp học</small></div><div className="stat-feature"><div><span className="feature-badge"><Sparkles size={14}/> ĐÃ CÓ 2 TRÒ CHƠI</span><h3>Biến giờ học thành<br/>niềm vui!</h3><p>Chọn lớp để chơi Ếch Đớp Bọ hoặc UFO Khảo Bài.</p></div><div className="feature-illustration"><div className="feature-bubble bubble-one">A</div><div className="feature-bubble bubble-two">✦</div><div className="feature-bubble bubble-three">B</div></div></div></div><div className="section-heading"><div><h2>Lớp học của bạn</h2><p>Chọn một lớp để xem và quản lý thành viên</p></div><label className="search-box"><Search size={18}/><input placeholder="Tìm lớp học..." value={search} onChange={(e) => setSearch(e.target.value)}/></label></div>{loading ? <div className="empty-state panel">Đang tải lớp học...</div> : filteredClasses.length ? <div className="class-grid">{filteredClasses.map((item, index) => <button className="class-card" key={item.id} onClick={() => setSelectedId(item.id)}><div className={`class-art art-${index % 4}`}><div className="class-art-blob blob-a"/><div className="class-art-blob blob-b"/><span className="class-art-icon"><GraduationCap size={36}/></span></div><div className="class-card-content"><div className="class-card-title"><h3>{item.name}</h3><ArrowRight size={18}/></div><p>{item.description || "Danh sách lớp học của bạn"}</p><div className="class-card-footer"><span><Users size={16}/>{item.student_count} học sinh</span><span>{item.school_year || "Năm học mới"}</span></div></div></button>)}<button className="class-add-card" onClick={() => setClassModal("new")}><span><Plus size={26}/></span><strong>Tạo lớp học mới</strong><small>Bắt đầu một lớp học mới</small></button></div> : <div className="empty-state panel"><div className="empty-icon"><LayoutGrid size={28}/></div><h3>{search ? "Không tìm thấy lớp học" : "Bắt đầu với lớp học đầu tiên"}</h3><p>{search ? "Thử một tên lớp khác." : "Tạo lớp học để thêm danh sách học sinh của bạn."}</p>{!search && <button className="button primary" onClick={() => setClassModal("new")}><Plus size={18}/> Tạo lớp học</button>}</div>}</>}</main>
    </div>
    {classModal && <ClassModal mode={classModal} initial={classModal === "edit" ? selected : undefined} onClose={() => setClassModal(null)} onSave={saveClass}/>}
    {studentModal && <StudentModal initial={studentModal === "new" ? undefined : studentModal} onClose={() => setStudentModal(null)} onAdd={addStudent} onRename={renameStudent}/>}
    {rosterModal && <RosterModal students={students} onClose={() => setRosterModal(false)} onSave={saveRoster}/>}
  </div>;
}

function ClassModal({ mode, initial, onClose, onSave }: {
  mode: "new" | "edit";
  initial?: ClassItem;
  onClose: () => void;
  onSave: (form: { name: string; schoolYear: string; description: string; studentCount: number }) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [schoolYear, setSchoolYear] = useState(initial?.school_year || "2026 - 2027");
  const [description, setDescription] = useState(initial?.description || "");
  const [studentCount, setStudentCount] = useState(mode === "edit" ? String(initial?.student_count ?? 0) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const count = Number(studentCount);
    if (studentCount.trim() === "" || !Number.isInteger(count) || count < 0 || count > 200) {
      setError("Sĩ số phải là số nguyên từ 0 đến 200.");
      return;
    }
    if (mode === "edit" && count < (initial?.student_count ?? 0) && !window.confirm(`Giảm sĩ số xuống ${count} sẽ xóa ${initial!.student_count - count} học sinh cuối danh sách, kể cả tên đã sửa. Tiếp tục?`)) return;
    setBusy(true);
    setError("");
    try { await onSave({ name, schoolYear, description, studentCount: count }); }
    catch (err) { setError((err as Error).message); setBusy(false); }
  }

  return <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="class-modal-title">
      <div className="modal-header"><span className="modal-icon"><BookOpen size={21}/></span><button className="icon-button" onClick={onClose} aria-label="Đóng"><X size={20}/></button></div>
      <h2 id="class-modal-title">{mode === "new" ? "Tạo lớp học mới" : "Chỉnh sửa lớp học"}</h2>
      <p className="modal-subtitle">Nhập sĩ số để tạo danh sách HS số 1, HS số 2… Bạn có thể sửa tên từng học sinh sau.</p>
      <form onSubmit={submit}>
        <label className="field-label">Tên lớp <span>*</span><input autoFocus required maxLength={100} placeholder="Ví dụ: Lớp 3A" value={name} onChange={(e) => setName(e.target.value)}/></label>
        <label className="field-label">Năm học<input maxLength={30} placeholder="Ví dụ: 2026 - 2027" value={schoolYear} onChange={(e) => setSchoolYear(e.target.value)}/></label>
        <label className="field-label">Số lượng học sinh <span>*</span><input type="number" min="0" max="200" step="1" required placeholder="Ví dụ: 40" value={studentCount} onChange={(e) => setStudentCount(e.target.value)}/><small className="field-help">Tăng sĩ số sẽ thêm học sinh mẫu. Giảm sĩ số sẽ xóa học sinh cuối danh sách.</small></label>
        <label className="field-label">Mô tả <small>(tùy chọn)</small><textarea maxLength={300} placeholder="Một vài điều về lớp học của bạn..." rows={3} value={description} onChange={(e) => setDescription(e.target.value)}/></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Hủy</button><button type="submit" className="button primary" disabled={busy}>{busy ? "Đang lưu..." : mode === "new" ? "Tạo lớp học" : "Lưu thay đổi"}<ArrowRight size={17}/></button></div>
      </form>
    </div>
  </div>;
}

function StudentModal({ initial, onClose, onAdd, onRename }: {
  initial?: Student;
  onClose: () => void;
  onAdd: (name: string, number: string) => Promise<void>;
  onRename: (id: string, name: string) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [number, setNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (initial) await onRename(initial.id, name);
      else await onAdd(name, number);
    } catch (err) { setError((err as Error).message); setBusy(false); }
  }

  return <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="student-modal-title">
      <div className="modal-header"><span className="modal-icon"><UserRound size={21}/></span><button className="icon-button" onClick={onClose} aria-label="Đóng"><X size={20}/></button></div>
      <h2 id="student-modal-title">{initial ? "Cập nhật tên học sinh" : "Thêm học sinh"}</h2>
      <p className="modal-subtitle">{initial ? `Sửa tên học sinh số ${initial.number ?? "—"} trong danh sách lớp.` : "Thêm một thành viên vào danh sách lớp học."}</p>
      <form onSubmit={submit}>
        <label className="field-label">Họ và tên <span>*</span><input autoFocus required maxLength={100} placeholder="Ví dụ: Nguyễn Minh Anh" value={name} onChange={(e) => setName(e.target.value)}/></label>
        {!initial && <label className="field-label">Số thứ tự <small>(tùy chọn)</small><input type="number" min="1" max="9999" placeholder="Ví dụ: 01" value={number} onChange={(e) => setNumber(e.target.value)}/></label>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Hủy</button><button type="submit" className="button primary" disabled={busy}>{busy ? "Đang lưu..." : initial ? "Lưu tên" : "Thêm học sinh"}<ArrowRight size={17}/></button></div>
      </form>
    </div>
  </div>;
}

function RosterModal({ students, onClose, onSave }: {
  students: Student[];
  onClose: () => void;
  onSave: (names: string[]) => Promise<void>;
}) {
  const [text, setText] = useState(students.map((student) => student.name).join("\n"));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const names = text.trimEnd().split(/\r?\n/).map((name) => name.trim());
    if (names.length !== students.length) {
      setError(`Danh sách cần đúng ${students.length} dòng, mỗi học sinh một dòng.`);
      return;
    }
    if (names.some((name) => !name || name.length > 100)) {
      setError("Mỗi dòng cần có tên từ 1 đến 100 ký tự.");
      return;
    }
    setBusy(true);
    setError("");
    try { await onSave(names); }
    catch (err) { setError((err as Error).message); setBusy(false); }
  }

  return <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="modal roster-modal" role="dialog" aria-modal="true" aria-labelledby="roster-modal-title">
      <div className="modal-header"><span className="modal-icon"><Users size={21}/></span><button className="icon-button" onClick={onClose} aria-label="Đóng"><X size={20}/></button></div>
      <h2 id="roster-modal-title">Cập nhật danh sách học sinh</h2>
      <p className="modal-subtitle">Nhập một tên trên mỗi dòng, theo đúng thứ tự hiện tại. Số thứ tự học sinh sẽ được giữ nguyên.</p>
      <form onSubmit={submit}>
        <label className="field-label">Danh sách tên ({students.length} học sinh)<textarea className="roster-textarea" autoFocus required spellCheck={false} value={text} onChange={(e) => setText(e.target.value)}/></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Hủy</button><button type="submit" className="button primary" disabled={busy}>{busy ? "Đang lưu..." : "Lưu danh sách"}<ArrowRight size={17}/></button></div>
      </form>
    </div>
  </div>;
}
