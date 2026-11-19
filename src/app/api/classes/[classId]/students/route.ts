import { NextResponse } from "next/server";
import { createStudent, listStudents } from "@/lib/db";
import { currentUserId, error, textField } from "@/lib/api";

type Context = { params: Promise<{ classId: string }> };
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
