create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
	if new.email is null then
		return new;
	end if;

	insert into public.users (id, email, "userId")
	values (
		new.id,
		new.email,
		coalesce(new.raw_user_meta_data ->> 'userId', new.phone, new.email, new.id::text)
	)
	on conflict (id) do update set email = excluded.email;
	return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
	after insert or update on auth.users
	for each row execute function public.handle_new_auth_user();

insert into public.users (id, email, "userId")
select
	id,
	email,
	coalesce(raw_user_meta_data ->> 'userId', phone, email, id::text)
from auth.users
where email is not null
on conflict (id) do update set email = excluded.email;

alter table public.users enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "Users can read their own profile" on public.users;
create policy "Users can read their own profile"
	on public.users for select to authenticated
	using ((select auth.uid()) = id);

drop policy if exists "Users can read their own transactions" on public.transactions;
create policy "Users can read their own transactions"
	on public.transactions for select to authenticated
	using ((select auth.uid()) = "userId");

drop policy if exists "Users can create their own transactions" on public.transactions;
create policy "Users can create their own transactions"
	on public.transactions for insert to authenticated
	with check ((select auth.uid()) = "userId");

drop policy if exists "Users can update their own transactions" on public.transactions;
create policy "Users can update their own transactions"
	on public.transactions for update to authenticated
	using ((select auth.uid()) = "userId")
	with check ((select auth.uid()) = "userId");

drop policy if exists "Users can delete their own transactions" on public.transactions;
create policy "Users can delete their own transactions"
	on public.transactions for delete to authenticated
	using ((select auth.uid()) = "userId");

grant select on public.users to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;