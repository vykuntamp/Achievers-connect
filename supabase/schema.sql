-- =============================================================
-- Achievers Connect — Supabase Schema
-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query)
-- =============================================================

-- Extensions ---------------------------------------------------
create extension if not exists "pgcrypto";

-- =============================================================
-- ENUMS
-- =============================================================
do $$ begin
  create type tuition_type as enum ('home', 'online', 'home_visit');
exception when duplicate_object then null; end $$;

do $$ begin
  create type attendance_status as enum ('present', 'absent', 'leave');
exception when duplicate_object then null; end $$;

do $$ begin
  create type announcement_audience as enum ('all', 'home', 'online', 'home_visit');
exception when duplicate_object then null; end $$;

-- =============================================================
-- TABLES
-- =============================================================

-- Students -----------------------------------------------------
create table if not exists public.students (
  id              uuid primary key default gen_random_uuid(),
  teacher_id      uuid not null references auth.users(id) on delete cascade,
  student_name    text not null,
  parent_name     text,
  parent_email    text,
  parent_mobile   text,
  class_grade     text,
  tuition_type    tuition_type not null default 'home',
  subjects        text[] not null default '{}',
  joining_date    date not null default current_date,
  monthly_fee     numeric(10,2),
  -- Public secure token used for the parent portal URL (no login required)
  portal_token    uuid not null default gen_random_uuid(),
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Batches ------------------------------------------------------
create table if not exists public.batches (
  id            uuid primary key default gen_random_uuid(),
  teacher_id    uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  description   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Batch <-> Student (many-to-many) -----------------------------
create table if not exists public.batch_students (
  batch_id    uuid not null references public.batches(id) on delete cascade,
  student_id  uuid not null references public.students(id) on delete cascade,
  primary key (batch_id, student_id)
);

-- Class Updates (one lesson record per batch/date) -------------
create table if not exists public.class_updates (
  id              uuid primary key default gen_random_uuid(),
  teacher_id      uuid not null references auth.users(id) on delete cascade,
  batch_id        uuid references public.batches(id) on delete set null,
  subject         text,
  topic_covered   text,
  homework        text,
  teacher_remarks text,
  class_date      date not null default current_date,
  created_at      timestamptz not null default now()
);

-- Attendance (per student, linked to a class update) -----------
create table if not exists public.attendance (
  id               uuid primary key default gen_random_uuid(),
  teacher_id       uuid not null references auth.users(id) on delete cascade,
  class_update_id  uuid references public.class_updates(id) on delete cascade,
  student_id       uuid not null references public.students(id) on delete cascade,
  batch_id         uuid references public.batches(id) on delete set null,
  status           attendance_status not null default 'present',
  attendance_date  date not null default current_date,
  created_at       timestamptz not null default now()
);

-- Announcements ------------------------------------------------
create table if not exists public.announcements (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  body        text not null,
  audience    announcement_audience not null default 'all',
  created_at  timestamptz not null default now()
);

-- =============================================================
-- INDEXES
-- =============================================================
create index if not exists idx_students_teacher      on public.students(teacher_id);
create index if not exists idx_students_portal_token on public.students(portal_token);
create index if not exists idx_students_tuition      on public.students(tuition_type);
create index if not exists idx_batches_teacher       on public.batches(teacher_id);
create index if not exists idx_batch_students_batch  on public.batch_students(batch_id);
create index if not exists idx_batch_students_stud   on public.batch_students(student_id);
create index if not exists idx_class_updates_teacher on public.class_updates(teacher_id);
create index if not exists idx_class_updates_batch   on public.class_updates(batch_id);
create index if not exists idx_class_updates_date    on public.class_updates(class_date);
create index if not exists idx_attendance_teacher    on public.attendance(teacher_id);
create index if not exists idx_attendance_student    on public.attendance(student_id);
create index if not exists idx_attendance_date       on public.attendance(attendance_date);
create index if not exists idx_announce_teacher      on public.announcements(teacher_id);

-- =============================================================
-- updated_at trigger
-- =============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_students_updated on public.students;
create trigger trg_students_updated before update on public.students
  for each row execute function public.set_updated_at();

drop trigger if exists trg_batches_updated on public.batches;
create trigger trg_batches_updated before update on public.batches
  for each row execute function public.set_updated_at();

-- =============================================================
-- ROW LEVEL SECURITY
-- Teacher/Admin: full access to own rows only.
-- Parents: NO direct table access. They read via a SECURITY DEFINER
--          RPC keyed by the student's portal_token (see below).
-- =============================================================
alter table public.students       enable row level security;
alter table public.batches        enable row level security;
alter table public.batch_students enable row level security;
alter table public.class_updates  enable row level security;
alter table public.attendance     enable row level security;
alter table public.announcements  enable row level security;

-- Students
drop policy if exists "own students" on public.students;
create policy "own students" on public.students
  for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);

-- Batches
drop policy if exists "own batches" on public.batches;
create policy "own batches" on public.batches
  for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);

-- Batch students (owner of the parent batch)
drop policy if exists "own batch_students" on public.batch_students;
create policy "own batch_students" on public.batch_students
  for all using (
    exists (select 1 from public.batches b where b.id = batch_id and b.teacher_id = auth.uid())
  ) with check (
    exists (select 1 from public.batches b where b.id = batch_id and b.teacher_id = auth.uid())
  );

-- Class updates
drop policy if exists "own class_updates" on public.class_updates;
create policy "own class_updates" on public.class_updates
  for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);

-- Attendance
drop policy if exists "own attendance" on public.attendance;
create policy "own attendance" on public.attendance
  for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);

-- Announcements
drop policy if exists "own announcements" on public.announcements;
create policy "own announcements" on public.announcements
  for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);

-- =============================================================
-- PARENT PORTAL — public read via secure token (no login)
-- A SECURITY DEFINER function bypasses RLS but only returns the
-- single student matching the token, plus their related records.
-- =============================================================
create or replace function public.get_parent_portal(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student   public.students;
  v_result    jsonb;
begin
  select * into v_student from public.students
   where portal_token = p_token and is_active = true;

  if not found then
    return null;
  end if;

  select jsonb_build_object(
    'student', jsonb_build_object(
      'student_name', v_student.student_name,
      'class_grade',  v_student.class_grade,
      'tuition_type', v_student.tuition_type,
      'subjects',     v_student.subjects
    ),
    'attendance', coalesce((
      select jsonb_agg(jsonb_build_object(
        'date',   a.attendance_date,
        'status', a.status
      ) order by a.attendance_date desc)
      from public.attendance a where a.student_id = v_student.id
    ), '[]'::jsonb),
    'class_updates', coalesce((
      select jsonb_agg(jsonb_build_object(
        'date',     cu.class_date,
        'subject',  cu.subject,
        'topic',    cu.topic_covered,
        'homework', cu.homework,
        'remarks',  cu.teacher_remarks
      ) order by cu.class_date desc)
      from public.class_updates cu
      join public.batch_students bs on bs.batch_id = cu.batch_id
      where bs.student_id = v_student.id
    ), '[]'::jsonb),
    'announcements', coalesce((
      select jsonb_agg(jsonb_build_object(
        'title', an.title,
        'body',  an.body,
        'date',  an.created_at
      ) order by an.created_at desc)
      from public.announcements an
      where an.teacher_id = v_student.teacher_id
        and (an.audience = 'all' or an.audience::text = v_student.tuition_type::text)
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end $$;

-- Allow anonymous (parent) calls to the RPC only
grant execute on function public.get_parent_portal(uuid) to anon, authenticated;
