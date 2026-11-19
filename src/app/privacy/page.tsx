import Link from "next/link";
import { GraduationCap } from "lucide-react";
import styles from "./privacy.module.css";

export const metadata = { title: "Chính sách quyền riêng tư | GọiTên" };

export default function PrivacyPage() {
  return <main className={styles.page}><div className={styles.wrap}>
    <Link href="/" className="brand"><span className="brand-mark"><GraduationCap size={21}/></span><span>GọiTên<span className="brand-accent">.</span></span></Link>
    <article className={styles.card}><span className="overline">CẬP NHẬT NGÀY 19/11/2026</span><h1>Chính sách quyền riêng tư</h1>
      <p>Ứng dụng GọiTên giúp giáo viên quản lý lớp học và danh sách học sinh. Trang này mô tả dữ liệu ứng dụng xử lý trong phiên bản hiện tại.</p>
      <h2>Thông tin được lưu</h2><p>Khi bạn đăng nhập bằng Google, ứng dụng nhận tên, địa chỉ email và ảnh đại diện của tài khoản Google. Ứng dụng không nhận hoặc lưu mật khẩu Google của bạn. Ứng dụng cũng lưu tên lớp, năm học, mô tả lớp, tên học sinh và số thứ tự do bạn nhập.</p>
      <h2>Mục đích sử dụng</h2><p>Dữ liệu được dùng để xác thực tài khoản, duy trì phiên đăng nhập, hiển thị các lớp thuộc về bạn và chuẩn bị danh sách cho trò chơi gọi tên. Ứng dụng không bán dữ liệu của bạn.</p>
      <h2>Nơi lưu và quyền truy cập</h2><p>Dữ liệu lớp học được lưu trong cơ sở dữ liệu Supabase. Các thao tác qua ứng dụng yêu cầu đăng nhập và kiểm tra quyền sở hữu lớp. Phiên đăng nhập được lưu bằng cookie bảo mật của ứng dụng.</p>
      <h2>Xóa dữ liệu và liên hệ</h2><p>Bạn có thể xóa học sinh hoặc lớp học trong ứng dụng. Nếu muốn xóa toàn bộ tài khoản và dữ liệu liên quan, hãy gửi yêu cầu tới <a href="mailto:tannang09032002@gmail.com">tannang09032002@gmail.com</a>.</p>
    </article>
  </div></main>;
}
