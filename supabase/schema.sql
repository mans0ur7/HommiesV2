-- ============================================================
-- HOMMIES — Komplet database-skema
-- Kør dette i Supabase SQL Editor på dit nye projekt
-- ============================================================

-- UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE contract_status AS ENUM (
  'draft', 'ready', 'tenant_confirmed',
  'sent_to_penneo', 'partially_signed', 'signed', 'signing_failed'
);

-- ============================================================
-- UPDATED_AT TRIGGER (bruges på alle tabeller med updated_at)
-- ============================================================
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABELLER
-- ============================================================

-- Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  study TEXT,
  work TEXT,
  work_other TEXT,
  nationality TEXT,
  bio TEXT,
  avatar_url TEXT,
  images TEXT[],
  personality TEXT[],
  lifestyle TEXT[],
  languages TEXT[],
  monthly_budget INTEGER,
  rental_period TEXT,
  user_type TEXT,
  hidden_from_explore BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Properties
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT,
  monthly_rent INTEGER NOT NULL,
  deposit INTEGER,
  aconto INTEGER,
  utility_cost INTEGER,
  bills_included BOOLEAN,
  size_sqm INTEGER,
  room_count INTEGER,
  available_rooms INTEGER,
  bed_count INTEGER,
  bathroom_count INTEGER,
  living_area_count INTEGER,
  description TEXT,
  images TEXT[],
  floor_plan_url TEXT,
  amenities TEXT[],
  is_furnished BOOLEAN,
  is_multi_room BOOLEAN,
  is_published BOOLEAN DEFAULT false,
  property_type TEXT,
  gender_composition TEXT,
  male_count INTEGER,
  female_count INTEGER,
  max_occupants INTEGER,
  has_kitchen BOOLEAN,
  has_private_bathroom BOOLEAN,
  has_private_kitchen BOOLEAN,
  min_stay TEXT,
  available_from DATE,
  listing_period INTEGER,
  expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  rating_average NUMERIC,
  rating_count INTEGER,
  metro_lines TEXT[],
  s_train_lines TEXT[],
  bus_lines TEXT,
  boost_started_at TIMESTAMPTZ,
  boost_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER properties_updated_at BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Housing Groups
CREATE TABLE housing_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  city TEXT,
  area TEXT,
  budget_total INTEGER,
  budget_per_person INTEGER,
  desired_rooms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER housing_groups_updated_at BEFORE UPDATE ON housing_groups
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Housing Group Members
CREATE TABLE housing_group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES housing_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL DEFAULT 'roomie',
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  group_id UUID REFERENCES housing_groups(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Conversation Participants
CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Match Requests
CREATE TABLE match_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'roomie',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER match_requests_updated_at BEFORE UPDATE ON match_requests
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Connections
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_user_id UUID,
  target_property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  connection_type TEXT NOT NULL DEFAULT 'roomie',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, target_user_id),
  UNIQUE(user_id, target_property_id)
);

-- Ignored
CREATE TABLE ignored (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_user_id UUID,
  target_property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Blocked Users
CREATE TABLE blocked_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  blocked_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, blocked_user_id)
);

-- Favorites
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

-- Group Requests
CREATE TABLE group_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES housing_groups(id) ON DELETE CASCADE NOT NULL,
  property_id UUID NOT NULL,
  landlord_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT,
  desired_rooms INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER group_requests_updated_at BEFORE UPDATE ON group_requests
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Search Agents
CREATE TABLE search_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  city TEXT,
  area TEXT,
  min_rent INTEGER,
  max_rent INTEGER,
  min_rooms INTEGER,
  max_rooms INTEGER,
  property_type TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  notification_frequency TEXT NOT NULL DEFAULT 'instant',
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER search_agents_updated_at BEFORE UPDATE ON search_agents
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  group_id UUID REFERENCES housing_groups(id) ON DELETE SET NULL,
  search_agent_id UUID REFERENCES search_agents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contracts
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  landlord_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  match_request_id UUID REFERENCES match_requests(id) ON DELETE SET NULL,
  status contract_status NOT NULL DEFAULT 'draft',
  monthly_rent INTEGER,
  deposit INTEGER,
  prepaid_rent INTEGER,
  aconto INTEGER,
  start_date DATE,
  end_date DATE,
  is_time_limited BOOLEAN,
  notice_period_months INTEGER,
  property_address TEXT,
  property_city TEXT,
  property_postal_code TEXT,
  property_type TEXT,
  property_size_sqm INTEGER,
  property_room_count INTEGER,
  is_furnished BOOLEAN,
  pets_allowed BOOLEAN,
  pets_description TEXT,
  smoking_allowed BOOLEAN,
  subletting_allowed BOOLEAN,
  payment_day INTEGER,
  payment_account TEXT,
  house_rules TEXT,
  maintenance_responsibility TEXT,
  inventory_list TEXT,
  landlord_name TEXT,
  landlord_address TEXT,
  landlord_email TEXT,
  landlord_phone TEXT,
  landlord_cvr TEXT,
  tenant_name TEXT,
  tenant_address TEXT,
  tenant_email TEXT,
  tenant_phone TEXT,
  ready_at TIMESTAMPTZ,
  tenant_confirmed_at TIMESTAMPTZ,
  sent_to_penneo_at TIMESTAMPTZ,
  landlord_signed_at TIMESTAMPTZ,
  tenant_signed_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  signed_document_url TEXT,
  penneo_case_id TEXT,
  penneo_signing_url_landlord TEXT,
  penneo_signing_url_tenant TEXT,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER contracts_updated_at BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Ratings
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  match_request_id UUID REFERENCES match_requests(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Views
CREATE TABLE views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_user_id UUID,
  target_property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Property Reports
CREATE TABLE property_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  comment TEXT,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FUNKTIONER (bruges i RLS policies)
-- ============================================================

CREATE OR REPLACE FUNCTION is_conversation_member(_conversation_id UUID, _user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = _conversation_id AND user_id = _user_id
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_group_creator(_group_id UUID, _user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM housing_groups
    WHERE id = _group_id AND created_by = _user_id
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_group_member(_group_id UUID, _user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM housing_group_members
    WHERE group_id = _group_id AND user_id = _user_id AND status = 'accepted'
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_housing_group_member(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM housing_group_members
    WHERE group_id = p_group_id AND user_id = p_user_id AND status = 'accepted'
  ) OR EXISTS (
    SELECT 1 FROM housing_groups
    WHERE id = p_group_id AND created_by = p_user_id
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION landlord_has_group_request(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_requests
    WHERE group_id = p_group_id AND landlord_id = p_user_id
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE ignored ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE housing_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE housing_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE views ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_reports ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "profiles_delete" ON profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Properties
CREATE POLICY "properties_select_published" ON properties FOR SELECT USING (is_published = true OR auth.uid() = user_id);
CREATE POLICY "properties_insert" ON properties FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "properties_update" ON properties FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "properties_delete" ON properties FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Conversations
CREATE POLICY "conversations_select" ON conversations FOR SELECT TO authenticated
  USING (is_conversation_member(id, auth.uid()));
CREATE POLICY "conversations_insert" ON conversations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "conversations_update" ON conversations FOR UPDATE TO authenticated
  USING (is_conversation_member(id, auth.uid()));

-- Conversation Participants
CREATE POLICY "cp_select" ON conversation_participants FOR SELECT TO authenticated
  USING (is_conversation_member(conversation_id, auth.uid()));
CREATE POLICY "cp_insert" ON conversation_participants FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "cp_delete" ON conversation_participants FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Messages
CREATE POLICY "messages_select" ON messages FOR SELECT TO authenticated
  USING (is_conversation_member(conversation_id, auth.uid()));
CREATE POLICY "messages_insert" ON messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND is_conversation_member(conversation_id, auth.uid()));
CREATE POLICY "messages_update" ON messages FOR UPDATE TO authenticated
  USING (is_conversation_member(conversation_id, auth.uid()));

-- Match Requests
CREATE POLICY "mr_select" ON match_requests FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "mr_insert" ON match_requests FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());
CREATE POLICY "mr_update" ON match_requests FOR UPDATE TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Connections
CREATE POLICY "connections_select" ON connections FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "connections_insert" ON connections FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "connections_delete" ON connections FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Ignored
CREATE POLICY "ignored_select" ON ignored FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "ignored_insert" ON ignored FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "ignored_delete" ON ignored FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Blocked Users
CREATE POLICY "blocked_select" ON blocked_users FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "blocked_insert" ON blocked_users FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "blocked_delete" ON blocked_users FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Favorites
CREATE POLICY "favorites_select" ON favorites FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "favorites_insert" ON favorites FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "favorites_delete" ON favorites FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Housing Groups
CREATE POLICY "hg_select" ON housing_groups FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR is_housing_group_member(id, auth.uid()));
CREATE POLICY "hg_insert" ON housing_groups FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "hg_update" ON housing_groups FOR UPDATE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "hg_delete" ON housing_groups FOR DELETE TO authenticated USING (created_by = auth.uid());

-- Housing Group Members
CREATE POLICY "hgm_select" ON housing_group_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR invited_by = auth.uid() OR is_group_creator(group_id, auth.uid()));
CREATE POLICY "hgm_insert" ON housing_group_members FOR INSERT TO authenticated
  WITH CHECK (invited_by = auth.uid());
CREATE POLICY "hgm_update" ON housing_group_members FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR is_group_creator(group_id, auth.uid()));
CREATE POLICY "hgm_delete" ON housing_group_members FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR is_group_creator(group_id, auth.uid()));

-- Group Requests
CREATE POLICY "gr_select" ON group_requests FOR SELECT TO authenticated
  USING (landlord_id = auth.uid() OR is_housing_group_member(group_id, auth.uid()));
CREATE POLICY "gr_insert" ON group_requests FOR INSERT TO authenticated WITH CHECK (landlord_id = auth.uid());
CREATE POLICY "gr_update" ON group_requests FOR UPDATE TO authenticated
  USING (landlord_id = auth.uid() OR is_housing_group_member(group_id, auth.uid()));

-- Search Agents
CREATE POLICY "sa_select" ON search_agents FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "sa_insert" ON search_agents FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "sa_update" ON search_agents FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "sa_delete" ON search_agents FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Notifications
CREATE POLICY "notif_select" ON notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notif_insert" ON notifications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "notif_update" ON notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Contracts
CREATE POLICY "contracts_select" ON contracts FOR SELECT TO authenticated
  USING (landlord_id = auth.uid() OR tenant_id = auth.uid());
CREATE POLICY "contracts_insert" ON contracts FOR INSERT TO authenticated WITH CHECK (landlord_id = auth.uid());
CREATE POLICY "contracts_update" ON contracts FOR UPDATE TO authenticated
  USING (landlord_id = auth.uid() OR tenant_id = auth.uid());

-- Ratings
CREATE POLICY "ratings_select" ON ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "ratings_insert" ON ratings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "ratings_update" ON ratings FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Views
CREATE POLICY "views_select" ON views FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "views_insert" ON views FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Property Reports
CREATE POLICY "reports_select" ON property_reports FOR SELECT TO authenticated USING (reporter_user_id = auth.uid());
CREATE POLICY "reports_insert" ON property_reports FOR INSERT TO authenticated WITH CHECK (reporter_user_id = auth.uid());

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars', 'avatars', true),
  ('property-images', 'property-images', true),
  ('floor-plans', 'floor-plans', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "avatars_select" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "avatars_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars');
CREATE POLICY "avatars_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "property_images_select" ON storage.objects FOR SELECT USING (bucket_id = 'property-images');
CREATE POLICY "property_images_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'property-images');
CREATE POLICY "property_images_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'property-images');
CREATE POLICY "property_images_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'property-images');

CREATE POLICY "floor_plans_select" ON storage.objects FOR SELECT USING (bucket_id = 'floor-plans');
CREATE POLICY "floor_plans_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'floor-plans');

-- ============================================================
-- REALTIME (aktiver realtime på messaging-tabeller)
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE match_requests;
