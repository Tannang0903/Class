import type { Metadata } from "next";
import "./globals.css";
import "./game-hub.css";

export const metadata: Metadata = {
  title: "Gọi tên lớp học",
  description: "Quản lý lớp học và chuẩn bị trò chơi gọi tên học sinh.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
