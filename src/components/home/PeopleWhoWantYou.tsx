import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { User, ArrowUpRight, Check, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePresence } from "@/hooks/usePresence";
import {
  useReceivedConnectionRequests,
  type ReceivedConnectionRequest,
} from "@/hooks/useReceivedConnectionRequests";

const MAX_VISIBLE = 6;

/**
 * "Nogen vil møde dig" — a horizontal row of inbound connection-request
 * avatars with inline accept / skip. Hidden entirely when there's nothing.
 */
const PeopleWhoWantYou = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isOnline } = usePresence();
  const { requests, refetch } = useReceivedConnectionRequests();
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleAccept = async (req: ReceivedConnectionRequest) => {
    if (!user || busyId) return;
    setBusyId(req.id);
    try {
      // Markér accepteret først (create-conversation kræver en accepteret match).
      const { error: updateError } = await supabase
        .from("match_requests")
        .update({ status: "accepted" })
        .eq("id", req.id);
      if (updateError) throw updateError;

      // Opret samtalen, så de to parter rent faktisk kan chatte (samme som Inbox-accept).
      // Tidligere manglede dette kald helt → man accepterede men fik ingen samtale.
      const { error: convError } = await supabase.functions.invoke("create-conversation", {
        body: {
          type: "roomie",
          participant_ids: [user.id, req.sender.user_id],
          property_id: null,
        },
      });
      if (convError) {
        // Rul tilbage så anmodningen kan accepteres igen.
        await supabase.from("match_requests").update({ status: "pending" }).eq("id", req.id);
        throw convError;
      }

      // Registrér forbindelsen (dublet ignoreres af unik-constraint).
      await supabase.from("connections").insert({
        user_id: user.id,
        target_user_id: req.sender.user_id,
        connection_type: "roomie",
      });

      toast.success(t("home.connectedToast"));
      await refetch();
    } catch (e) {
      console.error("Error accepting connection request:", e);
      toast.error(t("home.acceptError"));
    } finally {
      setBusyId(null);
    }
  };

  const handleSkip = async (req: ReceivedConnectionRequest) => {
    if (busyId) return;
    setBusyId(req.id);
    try {
      const { error } = await supabase
        .from("match_requests")
        .update({ status: "rejected" })
        .eq("id", req.id);
      if (error) throw error;
      await refetch();
    } catch (e) {
      console.error("Error skipping connection request:", e);
      toast.error(t("home.skipError"));
    } finally {
      setBusyId(null);
    }
  };

  if (!requests?.length) return null;

  const visible = requests.slice(0, MAX_VISIBLE);

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px w-8 bg-foreground/40" />
            <span className="text-[11px] uppercase tracking-[0.2em] text-foreground/60">
              {t("home.requestsEyebrow")}
            </span>
          </div>
          <h2 className="text-2xl md:text-4xl font-medium tracking-tight text-foreground">
            {t("home.peopleWhoWantYouTitle")}
          </h2>
        </div>
        <button
          onClick={() => navigate("/inbox")}
          className="hidden md:inline-flex items-center gap-1.5 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
        >
          {t("home.seeAllInInbox")}
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        <div
          className="flex items-stretch gap-4 pb-2"
          style={{ minWidth: "max-content" }}
        >
          {visible.map((req) => {
            const firstName = req.sender.name.split(" ")[0];
            const online = isOnline(req.sender.user_id);
            const busy = busyId === req.id;
            return (
              <div
                key={req.id}
                className="w-44 shrink-0 rounded-2xl border border-border/60 bg-background p-4 flex flex-col items-center text-center"
              >
                <button
                  onClick={() => navigate(`/user/${req.sender.user_id}`)}
                  className="relative w-16 h-16 rounded-full overflow-hidden border border-border/60 bg-muted mb-3"
                  aria-label={t("home.viewProfileAria", { name: firstName })}
                >
                  {req.sender.avatar_url ? (
                    <img
                      src={req.sender.avatar_url}
                      alt={req.sender.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-6 h-6 text-foreground/40" />
                    </div>
                  )}
                  {online && (
                    <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
                  )}
                </button>

                <p className="text-sm font-medium text-foreground truncate max-w-full">
                  {firstName}
                  {req.sender.age ? `, ${req.sender.age}` : ""}
                </p>
                {req.sender.study && (
                  <p className="text-xs text-foreground/50 truncate max-w-full mt-0.5">
                    {req.sender.study}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-4 w-full">
                  <button
                    onClick={() => handleSkip(req)}
                    disabled={busy}
                    className="flex-1 inline-flex items-center justify-center gap-1 h-9 rounded-full border border-border/60 text-xs font-medium text-foreground/60 hover:bg-muted disabled:opacity-50 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    {t("home.skip")}
                  </button>
                  <button
                    onClick={() => handleAccept(req)}
                    disabled={busy}
                    className="flex-1 inline-flex items-center justify-center gap-1 h-9 rounded-full bg-foreground text-background text-xs font-medium hover:bg-foreground/90 disabled:opacity-50 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {t("home.accept")}
                  </button>
                </div>
              </div>
            );
          })}

          {requests.length > MAX_VISIBLE && (
            <button
              onClick={() => navigate("/inbox")}
              className="w-44 shrink-0 rounded-2xl border border-dashed border-border/60 flex flex-col items-center justify-center gap-2 text-sm font-medium text-foreground/60 hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              <span>+{requests.length - MAX_VISIBLE}</span>
              <span className="text-xs">{t("home.seeAllInInbox")}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PeopleWhoWantYou;
