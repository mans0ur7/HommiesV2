
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.contracts REPLICA IDENTITY FULL;
ALTER TABLE public.housing_group_members REPLICA IDENTITY FULL;
ALTER TABLE public.group_requests REPLICA IDENTITY FULL;
ALTER TABLE public.match_requests REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contracts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.housing_group_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
