-- Create enum for contract status
CREATE TYPE public.contract_status AS ENUM (
  'draft',
  'ready',
  'tenant_confirmed',
  'sent_to_penneo',
  'partially_signed',
  'signed',
  'signing_failed'
);

-- Create contracts table
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Relations
  landlord_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  match_request_id UUID REFERENCES public.match_requests(id) ON DELETE SET NULL,
  
  -- Status
  status contract_status NOT NULL DEFAULT 'draft',
  
  -- Party information (landlord)
  landlord_name TEXT,
  landlord_address TEXT,
  landlord_email TEXT,
  landlord_phone TEXT,
  landlord_cvr TEXT,
  
  -- Party information (tenant)
  tenant_name TEXT,
  tenant_address TEXT,
  tenant_email TEXT,
  tenant_phone TEXT,
  
  -- Property details
  property_address TEXT,
  property_postal_code TEXT,
  property_city TEXT,
  property_type TEXT,
  property_size_sqm INTEGER,
  property_room_count INTEGER,
  is_furnished BOOLEAN DEFAULT false,
  inventory_list TEXT,
  
  -- Period
  start_date DATE,
  is_time_limited BOOLEAN DEFAULT false,
  end_date DATE,
  notice_period_months INTEGER DEFAULT 3,
  
  -- Economy
  monthly_rent INTEGER,
  aconto INTEGER DEFAULT 0,
  deposit INTEGER,
  prepaid_rent INTEGER DEFAULT 0,
  payment_day INTEGER DEFAULT 1,
  payment_account TEXT,
  
  -- Rules
  pets_allowed BOOLEAN DEFAULT false,
  pets_description TEXT,
  smoking_allowed BOOLEAN DEFAULT false,
  subletting_allowed BOOLEAN DEFAULT false,
  maintenance_responsibility TEXT,
  
  -- House rules
  house_rules TEXT,
  
  -- Penneo integration
  penneo_case_id TEXT,
  penneo_signing_url_landlord TEXT,
  penneo_signing_url_tenant TEXT,
  landlord_signed_at TIMESTAMPTZ,
  tenant_signed_at TIMESTAMPTZ,
  signed_document_url TEXT,
  
  -- Failure handling
  failure_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ready_at TIMESTAMPTZ,
  tenant_confirmed_at TIMESTAMPTZ,
  sent_to_penneo_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Landlords can create contracts"
ON public.contracts
FOR INSERT
WITH CHECK (auth.uid() = landlord_id);

CREATE POLICY "Landlords can update their own contracts"
ON public.contracts
FOR UPDATE
USING (auth.uid() = landlord_id OR auth.uid() = tenant_id);

CREATE POLICY "Parties can view their contracts"
ON public.contracts
FOR SELECT
USING (auth.uid() = landlord_id OR auth.uid() = tenant_id);

CREATE POLICY "Landlords can delete draft contracts"
ON public.contracts
FOR DELETE
USING (auth.uid() = landlord_id AND status = 'draft');

-- Trigger for updated_at
CREATE TRIGGER update_contracts_updated_at
BEFORE UPDATE ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();