-- Batch 1 (audit 2026-06-11): Live-DB havde SEKS webhook-triggers mod notify-dispatcher —
-- to identiske pr. tabel ("push-on-message" + "push_messages" osv.). Hver besked,
-- match-anmodning og notifikation kaldte derfor dispatcheren to gange = DOBBELT PUSH.
-- Behold ét sæt (push-on-*), drop dubletterne.

drop trigger if exists push_messages on public.messages;
drop trigger if exists push_match_requests on public.match_requests;
drop trigger if exists push_notifications on public.notifications;
