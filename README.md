# Gọi Tên Lớp Học

Ứng dụng Next.js cho giáo viên: đăng nhập bằng Google, quản lý lớp và học sinh, chơi Ếch Đớp Bọ và UFO Khảo Bài với danh sách của lớp đã chọn. Nâng cấp gói sẽ được bổ sung sau.

## Yêu cầu

- Node.js 20 trở lên và pnpm
- Một project Supabase Free
- Một OAuth Client loại Web application trên Google Cloud

## Cấu hình Supabase

1. Tạo project trên Supabase.
2. Mở **SQL Editor**, chạy nội dung `supabase/schema.sql` một lần.
3. Vào **Connect → Transaction pooler** và sao chép connection string PostgreSQL vào `DATABASE_URL` trong `.env.local`. Connection string chỉ được dùng trên server. Nếu mật khẩu chứa ký tự đặc biệt, hãy dùng chuỗi do Supabase cung cấp hoặc mã hóa phần mật khẩu trong URL.

Các bảng nằm trong schema `app`, không được truy cập qua Supabase Data API. API của Next.js kiểm tra phiên và chủ sở hữu lớp trước mỗi thao tác.

## Cấu hình Google OAuth

1. Trong Google Auth Platform, tạo OAuth Client loại **Web application**.
2. Thêm `http://localhost:3000/api/auth/callback/google` vào **Authorized redirect URIs**.
3. Khi triển khai, thêm `https://<địa-chỉ-ứng-dụng>/api/auth/callback/google`.
4. Điền `AUTH_GOOGLE_ID` và `AUTH_GOOGLE_SECRET` vào `.env.local`.
5. Trong **Audience**, thêm Gmail thử nghiệm hoặc chuyển app sang Production khi đã hoàn tất Branding.

## Chạy trên máy

Sao chép `.env.example` thành `.env.local`, thay tất cả giá trị mẫu. Tạo `AUTH_SECRET` bằng `openssl rand -base64 32`.

```bash
pnpm install
pnpm dev
```

Mở `http://localhost:3000`. Khi triển khai, đặt cùng các biến môi trường trên máy chủ và đổi `AUTH_URL` thành URL HTTPS công khai.

## Trò chơi gọi tên

Vào **Trò chơi gọi tên**, chọn Ếch Đớp Bọ hoặc UFO Khảo Bài, chọn lớp đã có học sinh rồi bấm **Bắt đầu chơi**. Danh sách học sinh được tải từ API của lớp khi bắt đầu ván. Ếch Đớp Bọ cần ít nhất hai học sinh; UFO Khảo Bài có thể chơi với một học sinh.

Nguồn của hai trò chơi nằm trong `games/frog` và `games/ufo`. Bản đã biên dịch nằm trong `public/games` để Next.js và Vercel phục vụ trực tiếp. Sau khi sửa mã nguồn trò chơi, chạy:

```bash
npm install --prefix games
npm run check --prefix games
npm run build --prefix games
```

Commit cả mã nguồn và bản đã biên dịch trong `public/games` để bản deploy dùng phiên bản mới nhất.

Không đưa `.env.local` hoặc connection string lên Git. Nếu Client Secret đã lộ, hãy tạo secret mới trong Google Cloud trước khi công khai ứng dụng.
