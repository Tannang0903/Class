import postgres from "postgres";

let client: ReturnType<typeof postgres> | undefined;
function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL chưa được cấu hình.");
  client ??= postgres(url, { max: 5, prepare: false, ssl: "require" });
  return client;
}

export type ClassRow = { id: string; name: string; school_year: string; description: string; created_at: string; student_count: number };
export type StudentRow = { id: string; class_id: string; name: string; number: number | null };

export async function upsertUser(email: string, name?: string | null, image?: string | null) {
  const id = crypto.randomUUID();
  const rows = await sql()`INSERT INTO app.users (id,email,name,image)
    VALUES (${id},${email},${name ?? null},${image ?? null})
    ON CONFLICT(email) DO UPDATE SET name=excluded.name,image=excluded.image
    RETURNING id`;
  return rows[0].id as string;
}

export async function getUserId(email: string) {
  const rows = await sql()`SELECT id FROM app.users WHERE email=${email}`;
  return rows[0]?.id as string | undefined;
}

export async function listClasses(userId: string): Promise<ClassRow[]> {
  const rows = await sql()`SELECT c.id,c.name,c.school_year,c.description,c.created_at,
    COUNT(s.id)::int AS student_count FROM app.classes c
    LEFT JOIN app.students s ON s.class_id=c.id WHERE c.user_id=${userId}
    GROUP BY c.id ORDER BY c.created_at DESC,c.name`;
  return rows as unknown as ClassRow[];
}

export async function createClass(userId: string, name: string, schoolYear: string, description: string) {
  const id = crypto.randomUUID();
  await sql()`INSERT INTO app.classes(id,user_id,name,school_year,description)
    VALUES(${id},${userId},${name},${schoolYear},${description})`;
  return id;
}

export async function updateClass(userId: string, id: string, name: string, schoolYear: string, description: string) {
  const rows = await sql()`UPDATE app.classes SET name=${name},school_year=${schoolYear},description=${description}
    WHERE id=${id} AND user_id=${userId} RETURNING id`;
  return rows.length > 0;
}

export async function deleteClass(userId: string, id: string) {
  const rows = await sql()`DELETE FROM app.classes WHERE id=${id} AND user_id=${userId} RETURNING id`;
  return rows.length > 0;
}

export async function listStudents(userId: string, classId: string): Promise<StudentRow[] | null> {
  const owner = await sql()`SELECT id FROM app.classes WHERE id=${classId} AND user_id=${userId}`;
  if (!owner.length) return null;
  const rows = await sql()`SELECT id,class_id,name,number FROM app.students WHERE class_id=${classId}
    ORDER BY number NULLS LAST,name`;
  return rows as unknown as StudentRow[];
}

export async function createStudent(userId: string, classId: string, name: string, number: number | null) {
  const id = crypto.randomUUID();
  const rows = await sql()`INSERT INTO app.students(id,class_id,name,number)
    SELECT ${id},c.id,${name},${number} FROM app.classes c
    WHERE c.id=${classId} AND c.user_id=${userId} RETURNING id`;
  return rows.length ? id : null;
}

export async function deleteStudent(userId: string, classId: string, studentId: string) {
  const rows = await sql()`DELETE FROM app.students s USING app.classes c
    WHERE s.id=${studentId} AND s.class_id=${classId} AND c.id=s.class_id
    AND c.user_id=${userId} RETURNING s.id`;
  return rows.length > 0;
}
