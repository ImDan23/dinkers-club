-- Supabase Database Schema for Dinkers Club

-- 1. Courts Table
create table public.courts (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text,
    price numeric not null default 200,
    image_url text,
    created_at timestamptz default now()
);

-- 2. Bookings Table
create table public.bookings (
    id uuid primary key default gen_random_uuid(),
    court_id uuid references public.courts(id) on delete cascade,
    booking_date date not null,
    time_slot text not null, -- e.g., "08:00 AM - 09:00 AM"
    user_name text not null,
    user_email text not null,
    user_phone text,
    skill_level text,
    status text not null default 'confirmed',
    created_at timestamptz default now(),
    
    -- Prevent double booking for the same court, date, and time
    unique(court_id, booking_date, time_slot)
);

-- 3. Initial Data
insert into public.courts (name, description, image_url)
values 
('The Championship Court', 'Pro-grade surface, Elite lighting', 'https://images.unsplash.com/photo-1626224580194-860c3d35700d?q=80&w=800&auto=format&fit=crop'),
('The Baseline Arena', 'Indoor, Climate controlled', 'https://images.unsplash.com/photo-1599586120429-48281b6f0ece?q=80&w=800&auto=format&fit=crop'),
('VIP Lounge Court', 'Private seating, Luxury lounge', 'https://images.unsplash.com/photo-1608245449230-4ac19c63326b?q=80&w=800&auto=format&fit=crop');

-- 4. Security (RLS)
alter table public.courts enable row level security;
alter table public.bookings enable row level security;

create policy "Allow public read access to courts" on public.courts for select to public using (true);
create policy "Allow public to create bookings" on public.bookings for insert to public with check (true);
create policy "Allow public to read bookings" on public.bookings for select to public using (true);
