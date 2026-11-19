import { NextResponse } from "next/server";
import { createClass, listClasses } from "@/lib/db";
import { currentUserId, error, textField } from "@/lib/api";

export async function GET() {
  const userId = await currentUserId();
  if (!userId) return error("Bạn cần đăng nhập.", 401);
  return NextResponse.json(await listClasses(userId));
}

export async function POST(request: Request) {
  const userId = await currentUserId();
  if (!userId) return error("Bạn cần đăng nhập.", 401);
  const body = await request.json().catch(() => null);
  const name = textField(body?.name);
  if (!name) return error("Tên lớp không được để trống.");
  const id = await createClass(userId, name, textField(body?.schoolYear, 30), textField(body?.description, 300));
  return NextResponse.json({ id }, { status: 201 });
}
