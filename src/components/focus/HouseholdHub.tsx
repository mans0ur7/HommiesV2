import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Plus, Users, Wallet, ListChecks, StickyNote, Trash2, Check,
  Receipt, ArrowRight, CalendarDays, FileText, MessageCircle, PartyPopper,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useHousehold } from "@/hooks/useHousehold";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { da } from "date-fns/locale";
import type { HousingGroup } from "@/hooks/useHousingGroups";

const fmt = (n: number) => Math.round(Math.abs(n)).toLocaleString("da-DK");

const Avatar = ({ url, name, size = "w-8 h-8" }: { url: string | null; name: string; size?: string }) => (
  <div className={`${size} rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0`}>
    {url ? <img src={url} alt={name} className="w-full h-full object-cover" /> : (
      <span className="text-xs font-medium text-muted-foreground">{name.charAt(0)}</span>
    )}
  </div>
);

interface HouseholdHubProps {
  group: HousingGroup;
  onBack: () => void;
  /** Rendered inside the group's tab strip — hides its own back button and the
   *  duplicate group-name title (the group header already provides them). */
  embedded?: boolean;
}

const HouseholdHub = ({ group, onBack, embedded = false }: HouseholdHubProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    members, expenses, tasks, notes, balances, totalSpent, loading,
    addExpense, deleteExpense, addTask, toggleTask, deleteTask, addNote, deleteNote, memberName,
  } = useHousehold(group.id);

  const [expenseOpen, setExpenseOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [expTitle, setExpTitle] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expParts, setExpParts] = useState<string[]>([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskAssignee, setTaskAssignee] = useState<string>("none");
  const [taskDue, setTaskDue] = useState("");
  const [noteBody, setNoteBody] = useState("");

  useEffect(() => {
    if (expenseOpen) setExpParts(members.map((m) => m.user_id));
  }, [expenseOpen, members]);

  const myBalance = balances.get(user?.id ?? "") ?? 0;
  const openTasks = tasks.filter((t) => !t.done);
  const doneTasks = tasks.filter((t) => t.done);

  const submitExpense = async () => {
    const amount = parseFloat(expAmount.replace(",", "."));
    if (!expTitle.trim() || !amount || amount <= 0) {
      toast.error("Udfyld titel og et gyldigt beløb");
      return;
    }
    if (expParts.length === 0) {
      toast.error("Vælg mindst én at dele med");
      return;
    }
    await addExpense(expTitle.trim(), amount, expParts);
    setExpTitle(""); setExpAmount(""); setExpenseOpen(false);
    toast.success("Udgift tilføjet");
  };

  const submitTask = async () => {
    if (!taskTitle.trim()) {
      toast.error("Skriv en opgave");
      return;
    }
    await addTask(taskTitle.trim(), taskAssignee === "none" ? null : taskAssignee, taskDue || null);
    setTaskTitle(""); setTaskAssignee("none"); setTaskDue(""); setTaskOpen(false);
    toast.success("Opgave tilføjet");
  };

  const submitNote = async () => {
    if (!noteBody.trim()) return;
    await addNote(noteBody.trim());
    setNoteBody("");
  };

  return (
    <div className="min-h-full">
      {/* Hero */}
      <div className="hero-mesh border-b border-border/60">
        <div className="max-w-3xl mx-auto px-4 md:px-6 pt-5 pb-6">
          {!embedded && (
            <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground transition-colors mb-4">
              <ArrowLeft className="w-4 h-4" /> Tilbage til gruppen
            </button>
          )}
          <div className="flex items-center gap-3 mb-1.5">
            <div className="h-px w-8 bg-foreground/40" />
            <span className="text-[11px] uppercase tracking-[0.2em] text-foreground/60">Husstand</span>
          </div>
          {!embedded && (
            <h1 className="text-3xl md:text-5xl font-display text-foreground leading-[1.05]">{group.name}</h1>
          )}
          <div className={`${embedded ? "mt-2" : "mt-4"} flex items-center justify-between gap-3 flex-wrap`}>
            <div className="flex items-center -space-x-2">
              {members.map((m) => (
                <div key={m.user_id} className="ring-2 ring-background rounded-full">
                  <Avatar url={m.avatar_url} name={m.name} />
                </div>
              ))}
              <span className="ml-3.5 text-sm text-muted-foreground">{members.length} beboere</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">I alt delt</p>
              <p className="text-xl font-display text-foreground">{fmt(totalSpent)} kr</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-8">
        {/* Your balance hero card */}
        <div className={`rounded-3xl p-5 shadow-soft border ${myBalance >= 0 ? "bg-secondary/15 border-secondary/40" : "bg-destructive/5 border-destructive/30"}`}>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-foreground/60 mb-1">
            <Wallet className="w-3.5 h-3.5" /> Din balance
          </div>
          {Math.round(myBalance) === 0 ? (
            <p className="text-2xl font-display text-foreground">I er kvit 🤝</p>
          ) : myBalance > 0 ? (
            <p className="text-2xl font-display text-foreground">Du får <span className="text-secondary-foreground">{fmt(myBalance)} kr</span></p>
          ) : (
            <p className="text-2xl font-display text-foreground">Du skylder <span className="text-destructive">{fmt(myBalance)} kr</span></p>
          )}
          {/* per-member balances */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {members.filter((m) => m.user_id !== user?.id).map((m) => {
              const b = balances.get(m.user_id) ?? 0;
              return (
                <div key={m.user_id} className="flex items-center justify-between gap-2 rounded-xl bg-background/60 px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar url={m.avatar_url} name={m.name} size="w-6 h-6" />
                    <span className="text-sm text-foreground truncate">{m.name}</span>
                  </div>
                  <span className={`text-sm font-medium ${b >= 0 ? "text-secondary-foreground" : "text-destructive"}`}>
                    {Math.round(b) === 0 ? "kvit" : `${b > 0 ? "+" : "−"}${fmt(b)} kr`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => navigate("/documents")} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card shadow-soft hover-lift p-4 text-left">
            <span className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center shrink-0"><FileText className="w-5 h-5 text-secondary-foreground" /></span>
            <div className="min-w-0"><p className="text-sm font-medium text-foreground">Husorden</p><p className="text-xs text-muted-foreground truncate">Jeres fælles regler</p></div>
          </button>
          <button onClick={onBack} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card shadow-soft hover-lift p-4 text-left">
            <span className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center shrink-0"><MessageCircle className="w-5 h-5 text-secondary-foreground" /></span>
            <div className="min-w-0"><p className="text-sm font-medium text-foreground">Gruppe-chat</p><p className="text-xs text-muted-foreground truncate">Skriv til husstanden</p></div>
          </button>
        </div>

        {/* Tasks */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-display text-foreground flex items-center gap-2"><ListChecks className="w-5 h-5 text-secondary-foreground" /> Opgaver</h2>
            <Button size="sm" variant="outline" className="rounded-full h-8 text-xs" onClick={() => setTaskOpen(true)}><Plus className="w-3.5 h-3.5 mr-1" /> Tilføj</Button>
          </div>
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground rounded-2xl border border-dashed border-border/60 p-4 text-center">Ingen opgaver endnu — fordel rengøring, indkøb og regninger.</p>
          ) : (
            <div className="space-y-2">
              {[...openTasks, ...doneTasks].map((t) => (
                <div key={t.id} className={`flex items-center gap-3 rounded-2xl border border-border/60 bg-card shadow-soft p-3 ${t.done ? "opacity-60" : ""}`}>
                  <button onClick={() => toggleTask(t.id, !t.done)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${t.done ? "bg-foreground border-foreground text-background" : "border-border hover:border-foreground/50"}`}>
                    {t.done && <Check className="w-3.5 h-3.5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium text-foreground ${t.done ? "line-through" : ""}`}>{t.title}</p>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                      <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" /> {memberName(t.assignee_id)}</span>
                      {t.due_date && <span className="inline-flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {new Date(t.due_date).toLocaleDateString("da-DK", { day: "numeric", month: "short" })}</span>}
                    </div>
                  </div>
                  <button onClick={() => deleteTask(t.id)} aria-label="Slet" className="w-7 h-7 rounded-full flex items-center justify-center text-foreground/40 hover:text-destructive hover:bg-muted transition-colors shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Expenses */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-display text-foreground flex items-center gap-2"><Receipt className="w-5 h-5 text-secondary-foreground" /> Udgifter</h2>
            <Button size="sm" variant="outline" className="rounded-full h-8 text-xs" onClick={() => setExpenseOpen(true)}><Plus className="w-3.5 h-3.5 mr-1" /> Tilføj</Button>
          </div>
          {expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground rounded-2xl border border-dashed border-border/60 p-4 text-center">Ingen udgifter endnu. Tilføj fælles regninger, så fordeler vi automatisk hvem der skylder hvem.</p>
          ) : (
            <div className="space-y-2">
              {expenses.map((e) => (
                <div key={e.id} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card shadow-soft p-3">
                  <span className="w-9 h-9 rounded-xl bg-secondary/15 flex items-center justify-center shrink-0"><Wallet className="w-4 h-4 text-secondary-foreground" /></span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{e.title}</p>
                    <p className="text-[11px] text-muted-foreground">Betalt af {memberName(e.paid_by)} · delt mellem {e.participants?.length || members.length}</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground shrink-0">{fmt(e.amount)} kr</span>
                  {(e.paid_by === user?.id || group.created_by === user?.id) && (
                    <button onClick={() => deleteExpense(e.id)} aria-label="Slet" className="w-7 h-7 rounded-full flex items-center justify-center text-foreground/40 hover:text-destructive hover:bg-muted transition-colors shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Wall */}
        <section>
          <h2 className="text-xl font-display text-foreground flex items-center gap-2 mb-3"><StickyNote className="w-5 h-5 text-secondary-foreground" /> Opslagstavle</h2>
          <div className="flex items-center gap-2 mb-3">
            <Input value={noteBody} onChange={(e) => setNoteBody(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submitNote(); }} placeholder="Skriv et opslag til husstanden…" className="rounded-full" />
            <Button onClick={submitNote} disabled={!noteBody.trim()} className="rounded-full shrink-0 h-10 w-10 p-0"><ArrowRight className="w-4 h-4" /></Button>
          </div>
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ingen opslag endnu. Skriv en besked, et husmøde-tidspunkt, eller en påmindelse.</p>
          ) : (
            <div className="space-y-2">
              {notes.map((n) => (
                <div key={n.id} className="rounded-2xl border border-border/60 bg-card shadow-soft p-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2"><Avatar url={members.find((m) => m.user_id === n.author_id)?.avatar_url ?? null} name={memberName(n.author_id)} size="w-6 h-6" /><span className="text-xs font-medium text-foreground">{memberName(n.author_id)}</span><span className="text-[11px] text-muted-foreground">· {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: da })}</span></div>
                    {(n.author_id === user?.id || group.created_by === user?.id) && (
                      <button onClick={() => deleteNote(n.id)} aria-label="Slet" className="text-foreground/40 hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    )}
                  </div>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{n.body}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2 pb-6">
          <PartyPopper className="w-3.5 h-3.5" /> Jeres hjem — bygget sammen.
        </div>
      </div>

      {/* Add expense modal */}
      <ResponsiveModal open={expenseOpen} onOpenChange={setExpenseOpen} title="Tilføj udgift" className="sm:max-w-md">
        <div className="space-y-4">
          <div className="space-y-1.5"><Label>Hvad?</Label><Input value={expTitle} onChange={(e) => setExpTitle(e.target.value)} placeholder="Fx husleje, indkøb, internet" /></div>
          <div className="space-y-1.5"><Label>Beløb (kr)</Label><Input value={expAmount} onChange={(e) => setExpAmount(e.target.value)} inputMode="decimal" placeholder="0" /></div>
          <div className="space-y-1.5">
            <Label>Del mellem</Label>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => {
                const on = expParts.includes(m.user_id);
                return (
                  <button key={m.user_id} type="button" onClick={() => setExpParts((p) => on ? p.filter((x) => x !== m.user_id) : [...p, m.user_id])} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all ${on ? "bg-foreground text-background border-foreground" : "border-border/60 text-foreground/70 hover:border-foreground/40"}`}>
                    <Avatar url={m.avatar_url} name={m.name} size="w-5 h-5" /> {m.user_id === user?.id ? "Dig" : m.name}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">Du betalte — beløbet deles ligeligt mellem de valgte.</p>
          </div>
          <Button onClick={submitExpense} className="w-full rounded-full">Tilføj udgift</Button>
        </div>
      </ResponsiveModal>

      {/* Add task modal */}
      <ResponsiveModal open={taskOpen} onOpenChange={setTaskOpen} title="Tilføj opgave" className="sm:max-w-md">
        <div className="space-y-4">
          <div className="space-y-1.5"><Label>Opgave</Label><Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Fx tag skraldet ud, gør køkkenet rent" /></div>
          <div className="space-y-1.5">
            <Label>Hvem?</Label>
            <Select value={taskAssignee} onValueChange={setTaskAssignee}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ingen / alle</SelectItem>
                {members.map((m) => <SelectItem key={m.user_id} value={m.user_id}>{m.user_id === user?.id ? "Dig" : m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Frist (valgfri)</Label><Input type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} /></div>
          <Button onClick={submitTask} className="w-full rounded-full">Tilføj opgave</Button>
        </div>
      </ResponsiveModal>
    </div>
  );
};

export default HouseholdHub;
