insert into public.plan_credits(plan, monthly_credits) values
  ('Basic', 1000)
, ('Pro', 5000)
, ('Enterprise', 20000)
on conflict (plan) do update set monthly_credits = excluded.monthly_credits;
