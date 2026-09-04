REVOKE EXECUTE ON FUNCTION public.delete_own_account(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_own_account(uuid) TO service_role;