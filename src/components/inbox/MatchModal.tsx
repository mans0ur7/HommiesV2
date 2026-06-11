import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface MatchModalProps {
  open: boolean;
  onClose: () => void;
  matchedUser: {
    name: string;
    avatar_url: string | null;
  } | null;
  currentUserAvatar?: string | null;
}

const MatchModal = ({
  open,
  onClose,
  matchedUser,
  currentUserAvatar,
}: MatchModalProps) => {
  if (!matchedUser) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden border-0 [&>button]:bg-background/30 [&>button]:text-primary-foreground [&>button]:rounded-full [&>button]:p-1.5 [&>button]:opacity-100 [&>button]:right-3 [&>button]:top-3">
        {/* Skjult titel for skærmlæsere (Radix kræver en DialogTitle). */}
        <DialogTitle className="sr-only">Det er et match!</DialogTitle>
        <div className="relative bg-gradient-to-b from-primary to-primary/80 text-primary-foreground p-8 text-center">
          {/* Decorative elements */}
          <div className="absolute top-4 left-8">
            <Sparkles className="h-5 w-5 text-secondary" />
          </div>
          <div className="absolute top-8 right-12">
            <Sparkles className="h-4 w-4 text-secondary" />
          </div>
          <div className="absolute bottom-20 left-12">
            <Sparkles className="h-3 w-3 text-secondary" />
          </div>

          <h2 className="text-3xl font-bold italic mb-2">Det er et match!</h2>
          <p className="text-primary-foreground/80 mb-8">Du har fundet din roomie</p>

          {/* Avatar circles */}
          <div className="flex justify-center items-center gap-[-20px] mb-8">
            <div className="relative z-10">
              <div className="w-28 h-28 rounded-full border-4 border-background overflow-hidden bg-muted">
                <img
                  src={currentUserAvatar || "/placeholder.svg"}
                  alt="You"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="relative -ml-6">
              <div className="w-28 h-28 rounded-full border-4 border-background overflow-hidden bg-muted">
                <img
                  src={matchedUser.avatar_url || "/placeholder.svg"}
                  alt={matchedUser.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* City silhouette */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg
              viewBox="0 0 400 80"
              className="w-full h-20"
              preserveAspectRatio="none"
            >
              <path
                d="M0,80 L0,60 L20,60 L20,40 L40,40 L40,50 L60,50 L60,30 L80,30 L80,50 L100,50 L100,20 L120,20 L120,45 L140,45 L140,35 L160,35 L160,55 L180,55 L180,25 L200,25 L200,40 L220,40 L220,15 L240,15 L240,45 L260,45 L260,30 L280,30 L280,50 L300,50 L300,20 L320,20 L320,40 L340,40 L340,55 L360,55 L360,35 L380,35 L380,60 L400,60 L400,80 Z"
                fill="hsl(var(--secondary))"
                opacity="0.9"
              />
            </svg>
          </div>
        </div>

        <div className="p-6 bg-background">
          <Button onClick={onClose} className="w-full" size="lg">
            Start samtale med {matchedUser.name}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MatchModal;
