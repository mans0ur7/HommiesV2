import { useState, useEffect } from "react";
import { User, Trash2 } from "lucide-react";
import { useRoomieReviews } from "@/hooks/useRoomieReviews";
import { ROOMIE_REVIEWS_ENABLED } from "@/lib/features";
import StarRating from "@/components/ratings/StarRating";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReputationBadge from "./ReputationBadge";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { da } from "date-fns/locale";

interface RoomieReviewsProps {
  userId: string;
  name?: string;
}

/**
 * "Omdømme som roomie": viser modtagne anmeldelser + gennemsnit, og lader en
 * forbundet bruger skrive/redigere/slette sin egen anmeldelse. Skjuler sig selv
 * hvis der hverken er anmeldelser eller mulighed for at skrive en.
 */
const RoomieReviews = ({ userId, name }: RoomieReviewsProps) => {
  const { reviews, count, average, canReview, myReview, submit, remove } = useRoomieReviews(userId);
  // Hooks skal kaldes ubetinget — flag-tjekket ligger derfor efter dem.
  const hidden = !ROOMIE_REVIEWS_ENABLED;
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setRating(myReview?.rating ?? 0);
      setComment(myReview?.comment ?? "");
    }
  }, [open, myReview]);

  if (hidden) return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Vælg en bedømmelse");
      return;
    }
    setSaving(true);
    const { error } = await submit(rating, comment);
    setSaving(false);
    if (error) {
      toast.error("Kunne ikke gemme anmeldelsen");
      return;
    }
    toast.success(myReview ? "Anmeldelse opdateret" : "Tak for din anmeldelse!");
    setOpen(false);
  };

  const handleDelete = async () => {
    await remove();
    toast.success("Anmeldelse slettet");
    setOpen(false);
  };

  if (count === 0 && !canReview) return null;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="h-px w-8 bg-foreground/40" />
          <span className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">Omdømme som roomie</span>
        </div>
        {canReview && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-full h-8 text-xs shrink-0"
            onClick={() => setOpen(true)}
          >
            {myReview ? "Rediger din anmeldelse" : "Skriv anmeldelse"}
          </Button>
        )}
      </div>

      {count > 0 ? (
        <>
          <ReputationBadge average={average} count={count} className="mb-4" />
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl border border-border/60 bg-card shadow-soft p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
                    {r.reviewer?.avatar_url ? (
                      <img src={r.reviewer.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{r.reviewer?.name ?? "Roomie"}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: da })}
                    </p>
                  </div>
                  <StarRating rating={r.rating} size="sm" />
                </div>
                {r.comment && <p className="text-sm text-foreground/80 leading-relaxed">{r.comment}</p>}
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Ingen anmeldelser endnu.{canReview ? " Vær den første." : ""}
        </p>
      )}

      <ResponsiveModal
        open={open}
        onOpenChange={setOpen}
        title={`Anmeld ${name ?? "denne roomie"}`}
        className="sm:max-w-md"
      >
        <div className="space-y-4">
          <div className="flex justify-center py-2">
            <StarRating rating={rating} size="lg" interactive onRatingChange={setRating} />
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Hvordan var det at bo med / være forbundet med dem? (valgfrit)"
            rows={3}
          />
          <div className="flex gap-2">
            {myReview && (
              <Button variant="outline" onClick={handleDelete} className="text-destructive" aria-label="Slet anmeldelse">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Annuller
            </Button>
            <Button onClick={handleSubmit} disabled={rating === 0 || saving} className="flex-1">
              {saving ? "Gemmer…" : "Gem"}
            </Button>
          </div>
        </div>
      </ResponsiveModal>
    </div>
  );
};

export default RoomieReviews;
