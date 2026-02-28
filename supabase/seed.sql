-- Learn N Grow - realistic seed data for functional testing
-- Run this in Supabase SQL Editor after applying schema.sql

begin;

-- Reset data in dependency-safe order
truncate table public.attendance, public.finances, public.students restart identity;

-- Students (mix of active/inactive, morning/evening, varied fees)
insert into public.students (name, phone, batch, join_date, status, monthly_fee, teacher)
values
  ('Aarav Sharma', '+91-9876543210', 'morning', '2025-08-08', 'active', 3000, 'Neha Verma'),
  ('Meera Joshi', '+91-9876543211', 'evening', '2025-09-14', 'active', 3000, 'Rahul Mehta'),
  ('Rohan Verma', '+91-9876543212', 'morning', '2025-10-05', 'active', 3000, 'Neha Verma'),
  ('Isha Kapoor', '+91-9876543213', 'evening', '2025-11-20', 'active', 3000, 'Rahul Mehta'),
  ('Kabir Singh', '+91-9876543214', 'morning', '2025-12-07', 'inactive', 3000, 'Neha Verma'),
  ('Anaya Mishra', '+91-9876543215', 'evening', '2025-12-17', 'active', 3000, 'Rahul Mehta'),
  ('Sanya Negi', '+91-9876543216', 'morning', '2025-10-11', 'active', 3200, 'Neha Verma'),
  ('Dev Malik', '+91-9876543217', 'evening', '2025-09-25', 'active', 2800, 'Rahul Mehta'),
  ('Priya Rawat', '+91-9876543218', 'morning', '2025-11-03', 'active', 3000, 'Neha Verma'),
  ('Yash Bhatia', '+91-9876543219', 'evening', '2025-12-01', 'active', 3000, 'Rahul Mehta'),
  ('Ritika Sood', '+91-9876543220', 'morning', '2025-10-19', 'inactive', 3000, 'Neha Verma'),
  ('Harsh Pandey', '+91-9876543221', 'evening', '2025-12-09', 'active', 3500, 'Rahul Mehta');

-- Student fee transactions: January 2026 (all active = paid)
insert into public.finances (
  transaction_date, category, type, amount, status, description, note, student_id
)
select
  date '2026-01-05',
  'Student Fee',
  'income',
  s.monthly_fee,
  'paid',
  'January 2026 fee',
  'Seeded monthly payment',
  s.id
from public.students s
where s.status = 'active';

-- Student fee transactions: February 2026 (mix of paid/pending for testing)
insert into public.finances (
  transaction_date, category, type, amount, status, description, note, student_id
)
select
  date '2026-02-06',
  'Student Fee',
  'income',
  s.monthly_fee,
  case
    when s.phone in (
      '+91-9876543212',
      '+91-9876543213',
      '+91-9876543215',
      '+91-9876543221'
    ) then 'pending'
    else 'paid'
  end,
  'February 2026 fee',
  'Seeded monthly payment',
  s.id
from public.students s
where s.status = 'active';

-- Operating expenses: January and February 2026
insert into public.finances (
  transaction_date, category, type, amount, status, description, note
)
values
  ('2026-01-03', 'Rent',      'expense', 25000, 'paid', 'Center rent - Jan',      'Seeded expense'),
  ('2026-01-10', 'Salary',    'expense', 42000, 'paid', 'Tutor payroll - Jan',    'Seeded expense'),
  ('2026-01-12', 'Utilities', 'expense',  5200, 'paid', 'Electricity/Internet',   'Seeded expense'),
  ('2026-01-18', 'Marketing', 'expense',  7800, 'paid', 'Instagram ads - Jan',    'Seeded expense'),
  ('2026-01-22', 'Supplies',  'expense',  3300, 'paid', 'Stationery and print',   'Seeded expense'),
  ('2026-02-03', 'Rent',      'expense', 25000, 'paid', 'Center rent - Feb',      'Seeded expense'),
  ('2026-02-10', 'Salary',    'expense', 43000, 'paid', 'Tutor payroll - Feb',    'Seeded expense'),
  ('2026-02-12', 'Utilities', 'expense',  5600, 'paid', 'Electricity/Internet',   'Seeded expense'),
  ('2026-02-18', 'Marketing', 'expense',  8200, 'paid', 'Lead generation ads',    'Seeded expense'),
  ('2026-02-20', 'Supplies',  'expense',  2900, 'paid', 'Classroom material',     'Seeded expense');

-- Attendance: February 2026 weekdays for active students (deterministic present/absent mix)
with weekdays as (
  select d::date as day
  from generate_series(date '2026-02-01', date '2026-02-28', interval '1 day') d
  where extract(isodow from d) < 6
),
active_students as (
  select id, name, batch, teacher
  from public.students
  where status = 'active'
)
insert into public.attendance (student_id, student_name, batch, teacher, attendance_date, status)
select
  s.id,
  s.name,
  s.batch,
  s.teacher,
  w.day,
  case
    when ((extract(day from w.day)::int + ascii(substring(s.name, 1, 1))) % 8) = 0 then 'absent'
    else 'present'
  end
from active_students s
cross join weekdays w;

-- Dummy access roles for existing Auth users:
-- - first created user -> admin
-- - remaining users -> students_only
with ranked_users as (
  select
    u.id,
    row_number() over (order by u.created_at asc) as position
  from auth.users u
  where u.deleted_at is null
)
insert into public.app_user_roles (user_id, role)
select
  r.id,
  case when r.position = 1 then 'admin' else 'students_only' end
from ranked_users r
on conflict (user_id)
do update
set
  role = excluded.role,
  updated_at = now();

commit;
