import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Bug, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { isNativeApp } from "@/lib/native";
import { submitReport } from "@/lib/bugReport";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const BugReportButton = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  // Hidden on the auth/profile-setup flow and during native onboarding.
  const hidden =
    pathname.startsWith("/auth") ||
    pathname.startsWith("/complete-profile") ||
    (pathname === "/" && !user && isNativeApp());
  if (hidden) return null;

  const handleSend = async () => {
    if (!text.trim()) {
      toast.error("Beskriv venligst fejlen kort");
      return;
    }
    setSending(true);
    try {
      await submitReport(text, "bug", user?.email);
      setText("");
      setOpen(false);
      toast.success("Tak! Vi har modtaget din rapport.");
    } catch {
      toast.error("Kunne ikke sende. Prøv igen om lidt.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Rapportér en fejl"
        title="Rapportér en fejl"
        className="fixed z-40 right-4 md:right-6 bottom-24 md:bottom-6 w-12 h-12 rounded-full bg-foreground text-background shadow-lg flex items-center justify-center hover:bg-foreground/90 active:scale-95 transition-all"
        style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <Bug className="w-5 h-5" />
      </button>

      <Dialog open={open} onOpenChange={(o) => !sending && setOpen(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rapportér en fejl</DialogTitle>
            <DialogDescription>
              Beskriv kort hvad der gik galt. Vi får din besked direkte og vender
              tilbage til dig.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Hvad skete der? Hvad prøvede du at gøre?"
            rows={5}
            autoFocus
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={sending}>
              Annuller
            </Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sender…
                </>
              ) : (
                "Send"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BugReportButton;
