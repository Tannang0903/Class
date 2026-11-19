-- Chạy một lần trong Supabase SQL Editor. Chỉ backend dùng DATABASE_URL để truy cập schema này.
CREATE SCHEMA IF NOT EXISTS app;

CREATE TABLE IF NOT EXISTS app.users (
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text,
  image text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.classes (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  school_year text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.students (
  id uuid PRIMARY KEY,
  class_id uuid NOT NULL REFERENCES app.classes(id) ON DELETE CASCADE,
  name text NOT NULL,
  number integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS classes_user_idx ON app.classes(user_id);
CREATE INDEX IF NOT EXISTS students_class_idx ON app.students(class_id);

-- Schema app không nằm trong Supabase Data API; chỉ kết nối PostgreSQL phía server sử dụng.
REVOKE ALL ON SCHEMA app FROM anon, authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA app FROM anon, authenticated;
