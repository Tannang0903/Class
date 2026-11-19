import { auth } from "@/auth";
import { getUserId } from "@/lib/db";
import { NextResponse } from "next/server";

export async function currentUserId() {
  const session = await auth();
  return session?.user?.email ? await getUserId(session.user.email) : undefined;
}

export function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function textField(value: unknown, limit = 100) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

export function studentCountField(value: unknown) {
  const count = typeof value === "number" || (typeof value === "string" && value.trim() !== "") ? Number(value) : NaN;
  return Number.isInteger(count) && count >= 0 && count <= 200 ? count : null;
}
