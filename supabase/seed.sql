-- =============================================================
-- Achievers Connect — Sample Data
-- Run AFTER schema.sql AND after you have created a teacher account
-- (sign up once in the app), then replace :TEACHER_ID below.
--
-- Find your teacher id:  select id, email from auth.users;
-- =============================================================

-- 1. Set your teacher id here ---------------------------------
\set TEACHER_ID 'PASTE-YOUR-AUTH-USER-UUID-HERE'

-- 2. Students --------------------------------------------------
insert into public.students
  (teacher_id, student_name, parent_name, parent_email, parent_mobile, class_grade, tuition_type, subjects, joining_date, monthly_fee)
values
  (:'TEACHER_ID', 'Aarav Sharma',  'Rohit Sharma',  'rohit.sharma@example.com',  '9000000001', 'Class 8',  'home',       array['Maths','Science'],        '2025-06-01', 3000),
  (:'TEACHER_ID', 'Diya Patel',    'Meena Patel',   'meena.patel@example.com',   '9000000002', 'Class 10', 'online',     array['Physics','Chemistry'],    '2025-05-15', 4000),
  (:'TEACHER_ID', 'Kabir Reddy',   'Suresh Reddy',  'suresh.reddy@example.com',  '9000000003', 'Class 9',  'home_visit', array['Maths','English'],        '2025-07-01', 3500),
  (:'TEACHER_ID', 'Ananya Iyer',   'Lakshmi Iyer',  'lakshmi.iyer@example.com',  '9000000004', 'Class 8',  'home',       array['Maths','Science','English'],'2025-06-10', 3200);

-- 3. Batches ---------------------------------------------------
insert into public.batches (teacher_id, name, description) values
  (:'TEACHER_ID', 'Class 8 — Evening', 'Mon/Wed/Fri 5:00 PM'),
  (:'TEACHER_ID', 'Class 10 — Online', 'Tue/Thu 7:00 PM');

-- 4. Assign students to batches --------------------------------
insert into public.batch_students (batch_id, student_id)
select b.id, s.id
from public.batches b
join public.students s on s.teacher_id = b.teacher_id
where b.name = 'Class 8 — Evening' and s.class_grade = 'Class 8';

insert into public.batch_students (batch_id, student_id)
select b.id, s.id
from public.batches b
join public.students s on s.teacher_id = b.teacher_id
where b.name = 'Class 10 — Online' and s.student_name = 'Diya Patel';

-- 5. A sample class update + attendance ------------------------
with cu as (
  insert into public.class_updates
    (teacher_id, batch_id, subject, topic_covered, homework, teacher_remarks, class_date)
  select :'TEACHER_ID', b.id, 'Maths', 'Linear Equations', 'Exercise 4.2 Q1-Q10', 'Good participation today.', current_date
  from public.batches b where b.name = 'Class 8 — Evening'
  returning id, batch_id
)
insert into public.attendance (teacher_id, class_update_id, student_id, batch_id, status, attendance_date)
select :'TEACHER_ID', cu.id, bs.student_id, cu.batch_id, 'present', current_date
from cu join public.batch_students bs on bs.batch_id = cu.batch_id;

-- 6. An announcement -------------------------------------------
insert into public.announcements (teacher_id, title, body, audience) values
  (:'TEACHER_ID', 'Holiday Notice', 'No classes this Friday due to a local holiday.', 'all');

-- Done. Visit a parent portal with:
--   select student_name, portal_token from public.students;
--   URL:  /portal/<portal_token>
