-- Create dosage tracking table
CREATE TABLE public.dosage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strain_name TEXT NOT NULL,
  dosage_amount NUMERIC NOT NULL,
  dosage_unit TEXT NOT NULL DEFAULT 'g',
  consumption_method TEXT NOT NULL DEFAULT 'inhalation',
  effects_noted TEXT,
  symptom_relief INTEGER CHECK (symptom_relief >= 1 AND symptom_relief <= 10),
  side_effects TEXT,
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on dosage_logs
ALTER TABLE public.dosage_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for dosage_logs
CREATE POLICY "Users can view their own dosage logs"
ON public.dosage_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dosage logs"
ON public.dosage_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dosage logs"
ON public.dosage_logs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dosage logs"
ON public.dosage_logs FOR DELETE
USING (auth.uid() = user_id);

-- Create app_role enum for admin functionality
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Add reviewer fields to prescription_documents
ALTER TABLE public.prescription_documents 
ADD COLUMN reviewed_by UUID REFERENCES auth.users(id),
ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN review_notes TEXT;

-- Allow admins to view and update all prescription documents
CREATE POLICY "Admins can view all prescription documents"
ON public.prescription_documents FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all prescription documents"
ON public.prescription_documents FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Add expiry notification tracking
ALTER TABLE public.prescription_documents
ADD COLUMN expiry_notification_sent BOOLEAN DEFAULT false,
ADD COLUMN expiry_notification_sent_at TIMESTAMP WITH TIME ZONE;