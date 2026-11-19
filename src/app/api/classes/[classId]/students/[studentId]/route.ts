import { NextResponse } from "next/server";
import { deleteStudent, updateStudent } from "@/lib/db";
import { currentUserId, error, textField } from "@/lib/api";

type Context = { params: Promise<{ classId: string; studentId: string }> };
export async function PATCH(request: Request, { params }: Context) {
  const userId = await currentUserId();
  if (!userId) return error("Bạn cần đăng nhập.", 401);
  const name = textField((await request.json().catch(() => null))?.name);
  if (!name) return error("Tên học sinh không được để trống.");
  const { classId, studentId } = await params;
  if (!(await updateStudent(userId, classId, studentId, name))) return error("Không tìm thấy học sinh.", 404);
  return NextResponse.json({ ok: true });
}
export async function DELETE(_: Request, { params }: Context) {
  const userId = await currentUserId();
  if (!userId) return error("Bạn cần đăng nhập.", 401);
  const { classId, studentId } = await params;
  if (!(await deleteStudent(userId, classId, studentId))) return error("Không tìm thấy học sinh.", 404);
  return NextResponse.json({ ok: true });
}
