import { NextResponse } from "next/server";
import { deleteStudent } from "@/lib/db";
import { currentUserId, error } from "@/lib/api";

type Context = { params: Promise<{ classId: string; studentId: string }> };
export async function DELETE(_: Request, { params }: Context) {
  const userId = await currentUserId();
  if (!userId) return error("Bạn cần đăng nhập.", 401);
  const { classId, studentId } = await params;
  if (!(await deleteStudent(userId, classId, studentId))) return error("Không tìm thấy học sinh.", 404);
  return NextResponse.json({ ok: true });
}
