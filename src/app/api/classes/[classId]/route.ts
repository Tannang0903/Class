import { NextResponse } from "next/server";
import { deleteClass, updateClass } from "@/lib/db";
import { currentUserId, error, textField } from "@/lib/api";

type Context = { params: Promise<{ classId: string }> };
export async function PATCH(request: Request, { params }: Context) {
  const userId = await currentUserId();
  if (!userId) return error("Bạn cần đăng nhập.", 401);
  const { classId } = await params;
  const body = await request.json().catch(() => null);
  const name = textField(body?.name);
  if (!name) return error("Tên lớp không được để trống.");
  if (!(await updateClass(userId, classId, name, textField(body?.schoolYear, 30), textField(body?.description, 300)))) return error("Không tìm thấy lớp.", 404);
  return NextResponse.json({ ok: true });
}
export async function DELETE(_: Request, { params }: Context) {
  const userId = await currentUserId();
  if (!userId) return error("Bạn cần đăng nhập.", 401);
  const { classId } = await params;
  if (!(await deleteClass(userId, classId))) return error("Không tìm thấy lớp.", 404);
  return NextResponse.json({ ok: true });
}
