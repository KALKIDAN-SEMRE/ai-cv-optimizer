-- Create function to increment usage count
CREATE OR REPLACE FUNCTION public.increment_usage(
  p_session_id TEXT,
  p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record_id UUID;
BEGIN
  -- Try to find existing record
  SELECT id INTO v_record_id
  FROM public.usage_tracking
  WHERE (session_id = p_session_id OR user_id = p_user_id)
  LIMIT 1;

  IF v_record_id IS NOT NULL THEN
    -- Update existing record
    UPDATE public.usage_tracking
    SET 
      usage_count = usage_count + 1,
      last_used_at = NOW(),
      user_id = COALESCE(user_id, p_user_id)
    WHERE id = v_record_id;
  ELSE
    -- Insert new record
    INSERT INTO public.usage_tracking (session_id, user_id, usage_count, last_used_at)
    VALUES (p_session_id, p_user_id, 1, NOW());
  END IF;
END;
$$;