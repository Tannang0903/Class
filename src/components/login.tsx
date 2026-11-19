import { signIn } from "@/auth";
import { ArrowRight, BookOpen, GraduationCap, Sparkles, Users } from "lucide-react";
import Link from "next/link";

export function Login() {
  return <main className="login-page">
    <div className="login-glow one" /><div className="login-glow two" />
    <header className="login-header"><div className="brand"><span className="brand-mark"><GraduationCap size={22} strokeWidth={2.7}/></span><span>GọiTên<span className="brand-accent">.</span></span></div><span className="login-header-note">Không gian lớp học của bạn</span></header>
    <section className="login-content">
      <div className="login-copy"><div className="eyebrow"><Sparkles size={15}/> DÀNH CHO GIÁO VIÊN</div><h1>Mỗi cái tên,<br/><em>một niềm vui.</em></h1><p>Quản lý lớp học gọn gàng và chuẩn bị cho những phút giây gọi tên thật hào hứng.</p><div className="login-features"><span><Users size={17}/> Quản lý danh sách lớp</span><span><BookOpen size={17}/> Sẵn sàng cho trò chơi</span></div></div>
      <div className="login-card"><div className="login-card-art"><div className="art-circle art-circle-a"/><div className="art-circle art-circle-b"/><div className="art-icon"><GraduationCap size={38}/></div><div className="art-chip chip-a">Lớp 3A ✨</div><div className="art-chip chip-b">24 học sinh</div></div><div className="login-card-body"><div className="card-kicker">BẮT ĐẦU MIỄN PHÍ</div><h2>Chào mừng trở lại!</h2><p>Đăng nhập hoặc tạo tài khoản bằng Google để bắt đầu quản lý lớp học.</p><form action={async () => { "use server"; await signIn("google", { redirectTo: "/" }); }}><button className="google-button" type="submit"><svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6C44.4 38.03 46.98 31.68 46.98 24.55z"/><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.6.27-3.15.76-4.59l-7.98-6.2A23.9 23.9 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.92-2.13 15.89-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.97 6.19C6.51 42.62 14.62 48 24 48z"/></svg>Tiếp tục với Google<ArrowRight size={18}/></button></form><span className="login-footnote">Tài khoản mới sẽ được tạo tự động khi đăng nhập lần đầu.</span></div></div>
    </section>
    <footer className="login-footer">© 2026 GọiTên · Không gian học tập vui vẻ · <Link href="/privacy">Quyền riêng tư</Link></footer>
  </main>;
}
