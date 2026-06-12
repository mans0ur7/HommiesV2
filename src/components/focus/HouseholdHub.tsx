import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Plus, Users, Wallet, ListChecks, StickyNote, Trash2, Check,
  Receipt, ArrowRight, CalendarDays, FileText, MessageCircle, PartyPopper,
  Repeat, Banknote, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useHousehold,
  type Task,
  type TaskRecurrence,
  type HouseholdMember,
  type PlannedTransfer,
} from "@/hooks/useHousehold";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  formatDistanceToNow, format, startOfMonth, addMonths, getDaysInMonth,
  isSameDay, isToday, differenceInCalendarDays,
} from "date-fns";
import { da } from "date-fns/locale";
import { hapticLight, hapticSuccess } from "@/lib/haptics";
import type { HousingGroup } from "@/hooks/useHousingGroups";

const fmt = (n: number) => {
  const v = Math.abs(n);
  return v.toLocaleString("da-DK", { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 });
};

/** Under en halv krone fra hinanden = kvit (undgår "Du skylder 0 kr" pga. flydende kommatal). */
const isSettled = (n: number) => Math.abs(n) < 0.5;

/**
 * Parser et beløb skrevet på dansk: "12.500" → 12500, "12.500,50" → 12500.5,
 * "99,5" → 99.5, "99.5" → 99.5. Returnerer null hvis ugyldigt eller <= 0.
 */
const parseDanishAmount = (s: string): number | null => {
  let t = s.trim().replace(/\s+/g, "");
  if (!t) return null;
  const hasDot = t.includes(".");
  const hasComma = t.includes(",");
  if (hasDot && hasComma) {
    // Dansk format: punktum er tusindtalsseparator, komma er decimal.
    t = t.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    t = t.replace(",", ".");
  } else if (hasDot && /^\d{1,3}(\.\d{3})+$/.test(t)) {
    // "12.500" er tolv tusinde fem hundrede — ikke 12,5.
    t = t.replace(/\./g, "");
  }
  const n = Number(t);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** Date-only strings parses som UTC af `new Date(...)` og kan skride en dag — parse lokalt. */
const parseLocalDate = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const formatDueDate = (s: string) =>
  parseLocalDate(s).toLocaleDateString("da-DK", { day: "numeric", month: "short" });

const RECURRENCE_LABEL: Record<TaskRecurrence, string> = {
  weekly: "Hver uge",
  biweekly: "Hver 2. uge",
  monthly: "Hver måned",
};

/**
 * Forekommer opgaven på en given dato? Engangsopgaver rammer kun deres frist.
 * Åbne gentagne opgaver projiceres fremad fra deres anker (due_date), så
 * kalenderen kan vise "toiletrengøring hver søndag" en måned frem.
 */
const occursOn = (t: Task, date: Date): boolean => {
  if (!t.due_date) return false;
  const anchor = parseLocalDate(t.due_date);
  if (isSameDay(anchor, date)) return true;
  if (!t.recurrence || t.done || date < anchor) return false;
  if (t.recurrence === "monthly") {
    return date.getDate() === Math.min(anchor.getDate(), getDaysInMonth(date));
  }
  const diff = differenceInCalendarDays(date, anchor);
  return diff > 0 && diff % (t.recurrence === "weekly" ? 7 : 14) === 0;
};

const WEEKDAYS = ["man", "tir", "ons", "tor", "fre", "lør", "søn"];

/** Månedskalender over husstandens opgaver: grid med prikker + dagsliste under. */
const TaskCalendar = ({
  tasks, members, memberName,
}: { tasks: Task[]; members: HouseholdMember[]; memberName: (id: string | null) => string }) => {
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  });

  const daysInMonth = getDaysInMonth(viewMonth);
  const offset = (viewMonth.getDay() + 6) % 7; // ugen starter mandag
  const cells: (Date | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(viewMonth.getFullYear(), viewMonth.getMonth(), i + 1)),
  ];
  const tasksOn = (date: Date) => tasks.filter((t) => occursOn(t, date));
  const selectedTasks = tasksOn(selected);
  const monthLabel = format(viewMonth, "LLLL yyyy", { locale: da });

  const changeMonth = (delta: number) => {
    const next = addMonths(viewMonth, delta);
    setViewMonth(next);
    setSelected(new Date(next.getFullYear(), next.getMonth(), 1));
  };

  return (
    <div className="space-y-4">
      {/* Måned-navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => changeMonth(-1)} aria-label="Forrige måned" className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center text-foreground/70">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <p className="text-sm font-medium text-foreground capitalize">{monthLabel}</p>
        <button onClick={() => changeMonth(1)} aria-label="Næste måned" className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center text-foreground/70">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d) => (
          <span key={d} className="text-center text-[10px] uppercase tracking-wide text-muted-foreground py-1">{d}</span>
        ))}
        {cells.map((date, idx) =>
          date ? (
            <button
              key={idx}
              onClick={() => setSelected(date)}
              aria-label={format(date, "d. MMMM", { locale: da })}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
                isSameDay(date, selected)
                  ? "bg-foreground text-background"
                  : isToday(date)
                    ? "ring-1 ring-foreground/40 text-foreground hover:bg-muted"
                    : "text-foreground hover:bg-muted"
              }`}
            >
              <span>{date.getDate()}</span>
              <span className="flex gap-0.5 h-1">
                {tasksOn(date).slice(0, 3).map((t) => (
                  <span key={t.id} className={`w-1 h-1 rounded-full ${isSameDay(date, selected) ? "bg-background" : "bg-secondary-foreground/60"}`} />
                ))}
              </span>
            </button>
          ) : (
            <span key={idx} />
          ),
        )}
      </div>

      {/* Dagens opgaver */}
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-foreground/60 mb-2 capitalize">
          {format(selected, "EEEE d. MMMM", { locale: da })}
        </p>
        {selectedTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ingen opgaver denne dag.</p>
        ) : (
          <div className="space-y-1.5">
            {selectedTasks.map((t) => (
              <div key={t.id} className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-card px-3 py-2">
                <Avatar
                  url={members.find((m) => m.user_id === t.assignee_id)?.avatar_url ?? null}
                  name={memberName(t.assignee_id)}
                  size="w-6 h-6"
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm text-foreground truncate ${t.done ? "line-through opacity-60" : ""}`}>{t.title}</p>
                  <p className="text-[11px] text-muted-foreground">{memberName(t.assignee_id)}</p>
                </div>
                {t.recurrence && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted rounded-full px-2 py-0.5 shrink-0">
                    <Repeat className="w-2.5 h-2.5" /> {RECURRENCE_LABEL[t.recurrence]}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

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
    members, expenses, tasks, notes, settlements, balances, settlementPlan, totalSpent, loading,
    addExpense, deleteExpense, addTask, toggleTask, deleteTask, addNote, deleteNote,
    addSettlement, deleteSettlement, memberName,
  } = useHousehold(group.id);

  const [expenseOpen, setExpenseOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [expTitle, setExpTitle] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expParts, setExpParts] = useState<string[]>([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskAssignee, setTaskAssignee] = useState<string>("none");
  const [taskDue, setTaskDue] = useState("");
  const [taskRecur, setTaskRecur] = useState<"none" | TaskRecurrence>("none");
  const [noteBody, setNoteBody] = useState("");
  const [settlingTo, setSettlingTo] = useState<string | null>(null);

  const myBalance = balances.get(user?.id ?? "") ?? 0;
  const openTasks = tasks.filter((t) => !t.done);
  const doneTasks = tasks.filter((t) => t.done);

  const openExpenseModal = () => {
    // Seed participants here (not in an effect) so a realtime refetch of
    // `members` can't reset the user's selection while the modal is open.
    setExpParts(members.map((m) => m.user_id));
    setExpenseOpen(true);
  };

  const submitExpense = async () => {
    const amount = parseDanishAmount(expAmount);
    if (!expTitle.trim() || amount === null) {
      toast.error("Udfyld titel og et gyldigt beløb");
      return;
    }
    if (expParts.length === 0) {
      toast.error("Vælg mindst én at dele med");
      return;
    }
    const ok = await addExpense(expTitle.trim(), amount, expParts);
    if (!ok) {
      toast.error("Kunne ikke gemme udgiften — prøv igen");
      return;
    }
    setExpTitle(""); setExpAmount(""); setExpenseOpen(false);
    toast.success("Udgift tilføjet");
  };

  const submitTask = async () => {
    if (!taskTitle.trim()) {
      toast.error("Skriv en opgave");
      return;
    }
    if (taskRecur !== "none" && !taskDue) {
      toast.error("Vælg den første dato, så vi ved hvilken ugedag opgaven gentages");
      return;
    }
    const ok = await addTask(
      taskTitle.trim(),
      taskAssignee === "none" ? null : taskAssignee,
      taskDue || null,
      taskRecur === "none" ? null : taskRecur,
    );
    if (!ok) {
      toast.error("Kunne ikke gemme opgaven — prøv igen");
      return;
    }
    setTaskTitle(""); setTaskAssignee("none"); setTaskDue(""); setTaskRecur("none"); setTaskOpen(false);
    toast.success(taskRecur === "none" ? "Opgave tilføjet" : "Gentaget opgave tilføjet 🔁");
  };

  const handleSettle = async (p: PlannedTransfer) => {
    setSettlingTo(p.to);
    const ok = await addSettlement(p.to, p.amount);
    setSettlingTo(null);
    if (ok) {
      hapticSuccess();
      toast.success(`Registreret — du har sendt ${fmt(p.amount)} kr til ${memberName(p.to)} ✅`);
    } else {
      toast.error("Kunne ikke registrere betalingen — prøv igen");
    }
  };

  const handleDeleteSettlement = async (id: string) => {
    const ok = await deleteSettlement(id);
    if (!ok) toast.error("Kunne ikke fortryde afregningen — prøv igen");
  };

  const submitNote = async () => {
    if (!noteBody.trim()) return;
    const ok = await addNote(noteBody.trim());
    if (!ok) {
      toast.error("Kunne ikke gemme opslaget — prøv igen");
      return;
    }
    setNoteBody("");
  };

  const handleToggleTask = async (id: string, done: boolean) => {
    if (done) hapticSuccess(); else hapticLight();
    const ok = await toggleTask(id, done);
    if (!ok) toast.error("Kunne ikke opdatere opgaven — prøv igen");
  };

  const handleDeleteTask = async (id: string) => {
    const ok = await deleteTask(id);
    if (!ok) toast.error("Kunne ikke slette opgaven — prøv igen");
  };

  const handleDeleteExpense = async (id: string) => {
    const ok = await deleteExpense(id);
    if (!ok) toast.error("Kunne ikke slette udgiften — prøv igen");
  };

  const handleDeleteNote = async (id: string) => {
    const ok = await deleteNote(id);
    if (!ok) toast.error("Kunne ikke slette opslaget — prøv igen");
  };

  if (loading) {
    // Skeleton, så "I er kvit 🤝" / "0 beboere" aldrig blinker før data er hentet.
    return (
      <div className="min-h-full">
        <div className="max-w-3xl mx-auto px-3 md:px-6 pt-5 pb-6 space-y-6">
          <div className="h-28 rounded-2xl bg-muted/40 animate-pulse" />
          <div className="h-44 rounded-2xl bg-muted/40 animate-pulse" />
          <div className="h-32 rounded-2xl bg-muted/40 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {/* Hero */}
      <div className="hero-mesh border-b border-border/60 md:rounded-3xl md:overflow-hidden">
        <div className="max-w-3xl mx-auto px-3 md:px-6 pt-5 pb-6">
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
              <span className="ml-3.5 text-sm text-muted-foreground">{members.length} {members.length === 1 ? "beboer" : "beboere"}</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">I alt delt</p>
              <p className="text-xl font-display text-foreground">{fmt(totalSpent)} kr</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-3 md:px-6 py-6 space-y-8">
        {/* Your balance hero card */}
        <div className={`rounded-3xl p-5 shadow-soft border ${isSettled(myBalance) ? "bg-secondary/15 border-secondary/40" : myBalance > 0 ? "bg-emerald-500/10 border-emerald-500/30" : "bg-destructive/5 border-destructive/30"}`}>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-foreground/60 mb-1">
            <Wallet className="w-3.5 h-3.5" /> Din balance
          </div>
          {isSettled(myBalance) ? (
            <p className="text-2xl font-display text-foreground">I er kvit 🤝</p>
          ) : myBalance > 0 ? (
            <p className="text-2xl font-display text-foreground">Du får <span className="text-emerald-700">{fmt(myBalance)} kr</span></p>
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
                  <span className={`text-sm font-medium ${isSettled(b) ? "text-muted-foreground" : b > 0 ? "text-emerald-700" : "text-destructive"}`}>
                    {isSettled(b) ? "kvit" : `${b > 0 ? "+" : "−"}${fmt(b)} kr`}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Afregningsplan: hvem sender hvad til hvem for at gå i nul */}
          {settlementPlan.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border/40 space-y-2">
              <p className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">Sådan går I i nul</p>
              {settlementPlan.map((p) => {
                const fromMe = p.from === user?.id;
                const toMe = p.to === user?.id;
                return (
                  <div key={`${p.from}-${p.to}`} className="flex items-center justify-between gap-2 rounded-xl bg-background/60 px-3 py-2">
                    <span className="text-sm text-foreground min-w-0 truncate">
                      {fromMe ? (
                        <>Send <strong>{fmt(p.amount)} kr</strong> til {memberName(p.to)}</>
                      ) : toMe ? (
                        <>{memberName(p.from)} skylder dig <strong>{fmt(p.amount)} kr</strong></>
                      ) : (
                        <>{memberName(p.from)} → {memberName(p.to)} · {fmt(p.amount)} kr</>
                      )}
                    </span>
                    {fromMe ? (
                      <Button
                        size="sm"
                        onClick={() => handleSettle(p)}
                        disabled={settlingTo !== null}
                        className="rounded-full h-8 text-xs shrink-0"
                      >
                        <Banknote className="w-3.5 h-3.5 mr-1" />
                        {settlingTo === p.to ? "Registrerer…" : "Penge sendt"}
                      </Button>
                    ) : (
                      <span className="text-[11px] text-muted-foreground shrink-0">afventer</span>
                    )}
                  </div>
                );
              })}
              <p className="text-[11px] text-muted-foreground">Overfør fx via MobilePay, og tryk "Penge sendt" — så streges gælden ud for alle.</p>
            </div>
          )}

          {/* Afregnings-historik: betalte beløb streges over, som opgaver */}
          {settlements.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {settlements.slice(0, 5).map((s) => (
                <div key={s.id} className="flex items-center gap-2 text-[12px] text-muted-foreground">
                  <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span className="line-through truncate">
                    {s.from_user === user?.id ? "Du" : memberName(s.from_user)} sendte {fmt(s.amount)} kr til {s.to_user === user?.id ? "dig" : memberName(s.to_user)}
                  </span>
                  <span className="shrink-0">· {formatDistanceToNow(new Date(s.created_at), { addSuffix: true, locale: da })}</span>
                  {(s.from_user === user?.id || group.created_by === user?.id) && (
                    <button
                      onClick={() => handleDeleteSettlement(s.id)}
                      aria-label="Fortryd afregning"
                      className="ml-auto shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-foreground/40 hover:text-destructive hover:bg-muted transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
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
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="rounded-full h-8 text-xs" onClick={() => setCalendarOpen(true)}><CalendarDays className="w-3.5 h-3.5 mr-1" /> Kalender</Button>
              <Button size="sm" variant="outline" className="rounded-full h-8 text-xs" onClick={() => setTaskOpen(true)}><Plus className="w-3.5 h-3.5 mr-1" /> Tilføj</Button>
            </div>
          </div>
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground rounded-2xl border border-dashed border-border/60 p-4 text-center">Ingen opgaver endnu — fordel rengøring, indkøb og regninger.</p>
          ) : (
            <div className="space-y-2">
              {[...openTasks, ...doneTasks].map((t) => (
                <div key={t.id} className={`flex items-center gap-3 rounded-2xl border border-border/60 bg-card shadow-soft p-3 ${t.done ? "opacity-60" : ""}`}>
                  <button onClick={() => handleToggleTask(t.id, !t.done)} aria-label={t.done ? "Markér som ikke udført" : "Markér som udført"} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${t.done ? "bg-foreground border-foreground text-background" : "border-border hover:border-foreground/50"}`}>
                    {t.done && <Check className="w-3.5 h-3.5 animate-scale-in" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium text-foreground ${t.done ? "line-through" : ""}`}>{t.title}</p>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                      <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" /> {memberName(t.assignee_id)}</span>
                      {t.due_date && <span className="inline-flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {formatDueDate(t.due_date)}</span>}
                      {t.recurrence && <span className="inline-flex items-center gap-1 text-secondary-foreground"><Repeat className="w-3 h-3" /> {RECURRENCE_LABEL[t.recurrence]}</span>}
                    </div>
                  </div>
                  {(t.created_by === user?.id || group.created_by === user?.id) && (
                    <button onClick={() => handleDeleteTask(t.id)} aria-label="Slet" className="w-9 h-9 rounded-full flex items-center justify-center text-foreground/40 hover:text-destructive hover:bg-muted transition-colors shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Expenses */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-display text-foreground flex items-center gap-2"><Receipt className="w-5 h-5 text-secondary-foreground" /> Udgifter</h2>
            <Button size="sm" variant="outline" className="rounded-full h-8 text-xs" onClick={openExpenseModal}><Plus className="w-3.5 h-3.5 mr-1" /> Tilføj</Button>
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
                    <button onClick={() => handleDeleteExpense(e.id)} aria-label="Slet" className="w-9 h-9 rounded-full flex items-center justify-center text-foreground/40 hover:text-destructive hover:bg-muted transition-colors shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
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
            <Button onClick={submitNote} disabled={!noteBody.trim()} aria-label="Send opslag" className="rounded-full shrink-0 h-10 w-10 p-0"><ArrowRight className="w-4 h-4" /></Button>
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
                      <button onClick={() => handleDeleteNote(n.id)} aria-label="Slet" className="text-foreground/40 hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
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
                  <button key={m.user_id} type="button" aria-pressed={on} onClick={() => setExpParts((p) => on ? p.filter((x) => x !== m.user_id) : [...p, m.user_id])} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all ${on ? "bg-foreground text-background border-foreground" : "border-border/60 text-foreground/70 hover:border-foreground/40"}`}>
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
          <div className="space-y-1.5">
            <Label>Gentages</Label>
            <Select value={taskRecur} onValueChange={(v) => setTaskRecur(v as "none" | TaskRecurrence)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aldrig</SelectItem>
                <SelectItem value="weekly">Hver uge</SelectItem>
                <SelectItem value="biweekly">Hver 2. uge</SelectItem>
                <SelectItem value="monthly">Hver måned</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{taskRecur === "none" ? "Frist (valgfri)" : "Første gang"}</Label>
            <Input type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} />
            {taskRecur !== "none" && (
              <p className="text-xs text-muted-foreground">Når opgaven sættes som udført, oprettes næste gang automatisk — fx "toiletrengøring hver søndag".</p>
            )}
          </div>
          <Button onClick={submitTask} className="w-full rounded-full">Tilføj opgave</Button>
        </div>
      </ResponsiveModal>

      {/* Opgave-kalender */}
      <ResponsiveModal open={calendarOpen} onOpenChange={setCalendarOpen} title="Opgave-kalender" className="sm:max-w-lg">
        <TaskCalendar tasks={tasks} members={members} memberName={memberName} />
      </ResponsiveModal>
    </div>
  );
};

export default HouseholdHub;
