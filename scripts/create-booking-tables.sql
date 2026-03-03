-- Booking Services: what creators offer
CREATE TABLE IF NOT EXISTS booking_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  duration integer NOT NULL DEFAULT 30,
  price numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  type text NOT NULL DEFAULT 'video' CHECK (type IN ('video', 'phone', 'in-person')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE booking_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active booking services" ON booking_services;
CREATE POLICY "Anyone can view active booking services" ON booking_services
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Creators manage their own services" ON booking_services;
CREATE POLICY "Creators manage their own services" ON booking_services
  FOR ALL USING (auth.uid() = creator_id);

-- Creator Availability: weekly schedule
CREATE TABLE IF NOT EXISTS creator_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL DEFAULT '09:00',
  end_time time NOT NULL DEFAULT '17:00',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE creator_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active availability" ON creator_availability;
CREATE POLICY "Anyone can view active availability" ON creator_availability
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Creators manage their own availability" ON creator_availability;
CREATE POLICY "Creators manage their own availability" ON creator_availability
  FOR ALL USING (auth.uid() = creator_id);

-- Creator Blocked Dates: specific dates they're unavailable
CREATE TABLE IF NOT EXISTS creator_blocked_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  blocked_date date NOT NULL,
  reason text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE creator_blocked_dates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view blocked dates" ON creator_blocked_dates;
CREATE POLICY "Anyone can view blocked dates" ON creator_blocked_dates
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Creators manage their own blocked dates" ON creator_blocked_dates;
CREATE POLICY "Creators manage their own blocked dates" ON creator_blocked_dates
  FOR ALL USING (auth.uid() = creator_id);

-- Bookings: actual booking records
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_id uuid REFERENCES booking_services(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_email text NOT NULL,
  client_notes text DEFAULT '',
  booking_date date NOT NULL,
  booking_time text NOT NULL,
  duration integer NOT NULL DEFAULT 30,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  amount numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'free')),
  stripe_payment_id text,
  meeting_link text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Creators can view their bookings" ON bookings;
CREATE POLICY "Creators can view their bookings" ON bookings
  FOR SELECT USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Creators can update their bookings" ON bookings;
CREATE POLICY "Creators can update their bookings" ON bookings
  FOR UPDATE USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Anyone can create a booking" ON bookings;
CREATE POLICY "Anyone can create a booking" ON bookings
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Creators can delete their bookings" ON bookings;
CREATE POLICY "Creators can delete their bookings" ON bookings
  FOR DELETE USING (auth.uid() = creator_id);
