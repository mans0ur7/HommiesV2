import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface HouseholdMember {
  user_id: string;
  name: string;
  avatar_url: string | null;
}
export interface Expense {
  id: string;
  group_id: string;
  paid_by: string;
  title: string;
  amount: number;
  participants: string[];
  created_at: string;
}
export interface Task {
  id: string;
  group_id: string;
  title: string;
  assignee_id: string | null;
  due_date: string | null;
  done: boolean;
  created_by: string;
  created_at: string;
}
export interface Note {
  id: string;
  group_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

/**
 * Husstands-hub for en boliggruppe: medlemmer, udgifter (med balancer pr. person),
 * opgaver og opslagstavle. Realtime, så hele husstanden er i sync.
 */
export function useHousehold(groupId: string | null | undefined) {
  const { user } = useAuth();
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  // Only the FIRST fetch should show the loading state — realtime refetches
  // must not flip `loading` back and blank out the UI.
  const hasLoaded = useRef(false);

  const fetchAll = useCallback(async () => {
    if (!groupId) return;
    if (!hasLoaded.current) setLoading(true);

    const [{ data: memberRows }, { data: group }] = await Promise.all([
      supabase.from("housing_group_members").select("user_id").eq("group_id", groupId).eq("status", "accepted"),
      supabase.from("housing_groups").select("created_by").eq("id", groupId).maybeSingle(),
    ]);
    const ids = new Set<string>((memberRows ?? []).map((m: { user_id: string }) => m.user_id));
    if ((group as { created_by?: string } | null)?.created_by) ids.add((group as { created_by: string }).created_by);
    const idList = [...ids];

    const [{ data: profs }, { data: exp }, { data: tsk }, { data: nts }] = await Promise.all([
      supabase.from("profiles").select("user_id, name, avatar_url").in("user_id", idList.length ? idList : ["x"]),
      supabase.from("household_expenses").select("*").eq("group_id", groupId).order("created_at", { ascending: false }),
      supabase.from("household_tasks").select("*").eq("group_id", groupId).order("created_at", { ascending: false }),
      supabase.from("household_notes").select("*").eq("group_id", groupId).order("created_at", { ascending: false }),
    ]);

    const profMap = new Map((profs ?? []).map((p: { user_id: string; name: string; avatar_url: string | null }) => [p.user_id, p]));
    setMembers(idList.map((id) => ({ user_id: id, name: profMap.get(id)?.name ?? "Medlem", avatar_url: profMap.get(id)?.avatar_url ?? null })));
    setExpenses((exp ?? []) as Expense[]);
    setTasks((tsk ?? []) as Task[]);
    setNotes((nts ?? []) as Note[]);
    hasLoaded.current = true;
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    hasLoaded.current = false;
    fetchAll();
    if (!groupId) return;
    const channel = supabase
      .channel(`household-${groupId}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "household_expenses", filter: `group_id=eq.${groupId}` }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "household_tasks", filter: `group_id=eq.${groupId}` }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "household_notes", filter: `group_id=eq.${groupId}` }, () => fetchAll())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAll, groupId]);

  // Net balance per member: paid - owed. Positive = others owe them.
  // Only CURRENT members count — expenses involving people who have left the
  // group are skipped (or re-split among remaining participants) so the
  // balances always sum to ~0. The expense itself still shows in the list.
  const balances = new Map<string, number>();
  members.forEach((m) => balances.set(m.user_id, 0));
  for (const e of expenses) {
    const allParts = e.participants?.length ? e.participants : members.map((m) => m.user_id);
    const parts = allParts.filter((p) => balances.has(p));
    if (parts.length === 0 || !balances.has(e.paid_by)) continue;
    const share = e.amount / parts.length;
    balances.set(e.paid_by, (balances.get(e.paid_by) ?? 0) + e.amount);
    for (const p of parts) balances.set(p, (balances.get(p) ?? 0) - share);
  }

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

  // ── mutations ── all return true on success, false on failure (e.g. RLS
  // rejection or offline) so the UI can avoid false success toasts.
  const addExpense = async (title: string, amount: number, participants: string[]): Promise<boolean> => {
    if (!groupId || !user) return false;
    const { error } = await supabase.from("household_expenses").insert({ group_id: groupId, paid_by: user.id, title, amount, participants });
    if (error) {
      console.error("addExpense failed:", error);
      return false;
    }
    fetchAll();
    return true;
  };
  const deleteExpense = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from("household_expenses").delete().eq("id", id);
    if (error) {
      console.error("deleteExpense failed:", error);
      return false;
    }
    fetchAll();
    return true;
  };
  const addTask = async (title: string, assignee_id: string | null, due_date: string | null): Promise<boolean> => {
    if (!groupId || !user) return false;
    const { error } = await supabase.from("household_tasks").insert({ group_id: groupId, title, assignee_id, due_date, created_by: user.id });
    if (error) {
      console.error("addTask failed:", error);
      return false;
    }
    fetchAll();
    return true;
  };
  const toggleTask = async (id: string, done: boolean): Promise<boolean> => {
    const { error } = await supabase.from("household_tasks").update({ done, done_at: done ? new Date().toISOString() : null }).eq("id", id);
    if (error) {
      console.error("toggleTask failed:", error);
      return false;
    }
    fetchAll();
    return true;
  };
  const deleteTask = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from("household_tasks").delete().eq("id", id);
    if (error) {
      console.error("deleteTask failed:", error);
      return false;
    }
    fetchAll();
    return true;
  };
  const addNote = async (body: string): Promise<boolean> => {
    if (!groupId || !user) return false;
    const { error } = await supabase.from("household_notes").insert({ group_id: groupId, author_id: user.id, body });
    if (error) {
      console.error("addNote failed:", error);
      return false;
    }
    fetchAll();
    return true;
  };
  const deleteNote = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from("household_notes").delete().eq("id", id);
    if (error) {
      console.error("deleteNote failed:", error);
      return false;
    }
    fetchAll();
    return true;
  };

  const memberName = (id: string | null) => (id ? members.find((m) => m.user_id === id)?.name ?? "Tidligere medlem" : "Ingen");

  return {
    members, expenses, tasks, notes, balances, totalSpent, loading,
    addExpense, deleteExpense, addTask, toggleTask, deleteTask, addNote, deleteNote, memberName,
    refetch: fetchAll,
  };
}
