-- 1. Make user_id nullable on drgreen_clients and drgreen_orders
ALTER TABLE public.drgreen_clients ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.drgreen_orders ALTER COLUMN user_id DROP NOT NULL;

-- 2. Auto-link trigger: when a profile is created (on signup), link any existing cached drgreen_clients/orders
CREATE OR REPLACE FUNCTION public.auto_link_drgreen_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _email text;
BEGIN
  SELECT email INTO _email FROM auth.users WHERE id = NEW.id;
  
  IF _email IS NOT NULL THEN
    UPDATE public.drgreen_clients
    SET user_id = NEW.id, updated_at = now()
    WHERE lower(email) = lower(_email)
      AND user_id IS NULL;

    UPDATE public.drgreen_orders
    SET user_id = NEW.id, updated_at = now()
    WHERE lower(customer_email) = lower(_email)
      AND user_id IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Attach trigger to profiles table (fires after profile insert, which happens on signup)
CREATE TRIGGER on_profile_created_link_drgreen
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_link_drgreen_on_signup();