import { NextResponse } from "next/server";
import { createStudent, listStudents, updateStudentNames } from "@/lib/db";
import { currentUserId, error, textField } from "@/lib/api";

type Context = { params: Promise<{ classId: string }> };
export async function PATCH(request: Request, { params }: Context) {
  const userId = await currentUserId();
  if (!userId) return error("Bạn cần đăng nhập.", 401);
  const body = await request.json().catch(() => null);
  if (!Array.isArray(body?.students) || body.students.length > 200) return error("Danh sách học sinh không hợp lệ.");
  const students = (body.students as unknown[]).map((student) => {
    if (!student || typeof student !== "object") return null;
    const row = student as Record<string, unknown>;
    const name = textField(row.name);
    return typeof row.id === "string" && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(row.id) && name ? { id: row.id, name } : null;
  });
  if (students.some((student) => !student)) return error("Mỗi học sinh cần có tên hợp lệ.");
  if (!(await updateStudentNames(userId, (await params).classId, students as { id: string; name: string }[]))) return error("Danh sách lớp đã thay đổi. Hãy tải lại trang rồi thử tiếp.", 409);
  return NextResponse.json({ ok: true });
}
export async function GET(_: Request, { params }: Context) {
  const userId = await currentUserId();
  if (!userId) return error("Bạn cần đăng nhập.", 401);
  const rows = await listStudents(userId, (await params).classId);
  return rows ? NextResponse.json(rows) : error("Không tìm thấy lớp.", 404);
}
export async function POST(request: Request, { params }: Context) {
  const userId = await currentUserId();
  if (!userId) return error("Bạn cần đăng nhập.", 401);
  const body = await request.json().catch(() => null);
  const name = textField(body?.name);
  if (!name) return error("Tên học sinh không được để trống.");
  const rawNumber = body?.number;
  const number = rawNumber === "" || rawNumber === null || rawNumber === undefined ? null : Number(rawNumber);
  if (number !== null && (!Number.isInteger(number) || number < 1 || number > 9999)) return error("Số thứ tự phải từ 1 đến 9999.");
  const id = await createStudent(userId, (await params).classId, name, number);
  return id ? NextResponse.json({ id }, { status: 201 }) : error("Không tìm thấy lớp.", 404);
}
