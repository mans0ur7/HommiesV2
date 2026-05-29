import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2, Flag, ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { submitReport } from "@/lib/bugReport";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

type Reason = "spam" | "fake" | "inappropriate" | "harassment" | "other";

interface ReportUserModalProps {
  open: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedUserName?: string;
  /** Called after a successful report + block so the parent can dismiss the profile view. */
  onReported?: () => void;
}

const ReportUserModal = ({ open, onClose, reportedUserId, reportedUserName, onReported }: ReportUserModalProps) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [reason, setReason] = useState<Reason>("spam");
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);
  const [alsoBlock, setAlsoBlock] = useState(true);

  const reasonLabels: Record<Reason, string> = {
    spam: t("report.reasonSpam"),
    fake: t("report.reasonFake"),
    inappropriate: t("report.reasonInappropriate"),
    harassment: t("report.reasonHarassment"),
    other: t("report.reasonOther"),
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error(t("report.loginRequired"));
      return;
    }
    setSending(true);
    try {
      const description =
        `[USER REPORT]\n` +
        `Reported user: ${reportedUserName ?? "(unknown name)"} (${reportedUserId})\n` +
        `Reason: ${reason}\n` +
        `Also blocked: ${alsoBlock ? "yes" : "no"}\n\n` +
        `Details from reporter:\n${details.trim() || "(no extra details)"}`;
      await submitReport(description, "problem", user.email);

      if (alsoBlock) {
        const { error: blockError } = await supabase
          .from("blocked_users")
          .insert({ user_id: user.id, blocked_user_id: reportedUserId });
        // duplicate-block isn't a real error — ignore unique-violation
        if (blockError && !blockError.message?.includes("duplicate")) {
          console.warn("Block failed:", blockError.message);
        }
      }

      toast.success(t("report.sent"));
      setDetails("");
      setReason("spam");
      setAlsoBlock(true);
      onClose();
      onReported?.();
    } catch (err) {
      console.error("Report failed:", err);
      toast.error(t("report.sendFailed"));
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !sending && !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-destructive" />
            {t("report.title")}
          </DialogTitle>
          <DialogDescription>
            {reportedUserName
              ? t("report.bodyNamed", { name: reportedUserName })
              : t("report.body")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="text-sm font-medium text-foreground mb-2 block">
              {t("report.reasonLabel")}
            </Label>
            <RadioGroup value={reason} onValueChange={(v) => setReason(v as Reason)} className="space-y-2">
              {(Object.keys(reasonLabels) as Reason[]).map((r) => (
                <div key={r} className="flex items-center space-x-2">
                  <RadioGroupItem value={r} id={`reason-${r}`} />
                  <Label htmlFor={`reason-${r}`} className="text-sm font-normal cursor-pointer">
                    {reasonLabels[r]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="report-details" className="text-sm font-medium text-foreground mb-1 block">
              {t("report.detailsLabel")}
            </Label>
            <Textarea
              id="report-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={t("report.detailsPlaceholder")}
              rows={3}
            />
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={alsoBlock}
              onChange={(e) => setAlsoBlock(e.target.checked)}
              className="mt-0.5"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                {t("report.alsoBlock")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("report.alsoBlockHint")}
              </p>
            </div>
          </label>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} disabled={sending}>
            {t("report.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={sending} variant="destructive">
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t("report.sending")}
              </>
            ) : (
              t("report.send")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportUserModal;
