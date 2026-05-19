import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CreditCard, Plus, Trash2, Sparkles, Clock, Search, Gift } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Launch period end date - same as MyListings.tsx
const LAUNCH_PERIOD_END = new Date('2026-03-01');
const isLaunchPeriodActive = () => new Date() < LAUNCH_PERIOD_END;

interface PaymentCard {
  id: string;
  last4: string;
  brand: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

const Payment = () => {
  const { user, loading, profile } = useAuth();
  const navigate = useNavigate();
  const isLandlord = profile?.user_type === "landlord";
  const isRoomie = profile?.user_type === "roomie";
  const [paymentCards, setPaymentCards] = useState<PaymentCard[]>([
    // Mock cards for demo
    { id: "1", last4: "4242", brand: "Visa", expMonth: 12, expYear: 2025, isDefault: true },
  ]);
  const [deleteCardDialog, setDeleteCardDialog] = useState<string | null>(null);
  const [showAddCardDialog, setShowAddCardDialog] = useState(false);
  const [cardForm, setCardForm] = useState({
    cardNumber: "",
    cardHolder: "",
    expMonth: "",
    expYear: "",
    cvv: "",
  });
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
  const [hasExistingListings, setHasExistingListings] = useState<boolean | null>(null);

  // Check if landlord has existing listings
  useEffect(() => {
    const checkExistingListings = async () => {
      if (!user?.id || !isLandlord) return;
      
      const { count, error } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (!error) {
        setHasExistingListings((count || 0) > 0);
      }
    };
    
    checkExistingListings();
  }, [user?.id, isLandlord]);

  // Check if launch offer is available for this landlord
  const isLaunchOfferEligible = useMemo(() => {
    if (!isLaunchPeriodActive()) return false;
    if (!isLandlord) return false;
    if (hasExistingListings === null) return false; // Still loading
    return !hasExistingListings; // Only eligible if no existing listings
  }, [isLandlord, hasExistingListings]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    const formatted = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
    return formatted.slice(0, 19);
  };

  const detectCardBrand = (cardNumber: string) => {
    const digits = cardNumber.replace(/\D/g, "");
    if (digits.startsWith("4")) return "Visa";
    if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return "Mastercard";
    if (/^3[47]/.test(digits)) return "Amex";
    return "Card";
  };

  const validateCardForm = () => {
    const errors: Record<string, string> = {};
    const digits = cardForm.cardNumber.replace(/\D/g, "");
    
    if (digits.length < 13 || digits.length > 16) {
      errors.cardNumber = "Kortnummer skal være 13-16 cifre";
    }
    
    if (!cardForm.cardHolder.trim() || cardForm.cardHolder.trim().length < 2) {
      errors.cardHolder = "Indtast kortholders navn";
    }
    
    const expMonth = parseInt(cardForm.expMonth);
    if (isNaN(expMonth) || expMonth < 1 || expMonth > 12) {
      errors.expMonth = "Ugyldig måned";
    }
    
    const currentYear = new Date().getFullYear();
    const expYear = parseInt(cardForm.expYear);
    if (isNaN(expYear) || expYear < currentYear || expYear > currentYear + 20) {
      errors.expYear = "Ugyldigt år";
    }
    
    if (!errors.expMonth && !errors.expYear) {
      const now = new Date();
      const expDate = new Date(expYear, expMonth - 1);
      if (expDate < now) {
        errors.expYear = "Kortet er udløbet";
      }
    }
    
    if (cardForm.cvv.length < 3 || cardForm.cvv.length > 4) {
      errors.cvv = "CVV skal være 3-4 cifre";
    }
    
    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddCard = () => {
    setShowAddCardDialog(true);
    setCardForm({ cardNumber: "", cardHolder: "", expMonth: "", expYear: "", cvv: "" });
    setCardErrors({});
  };

  const handleSubmitCard = () => {
    if (!validateCardForm()) return;
    
    const digits = cardForm.cardNumber.replace(/\D/g, "");
    const newCard: PaymentCard = {
      id: Date.now().toString(),
      last4: digits.slice(-4),
      brand: detectCardBrand(cardForm.cardNumber),
      expMonth: parseInt(cardForm.expMonth),
      expYear: parseInt(cardForm.expYear),
      isDefault: paymentCards.length === 0,
    };
    
    setPaymentCards(prev => [...prev, newCard]);
    setShowAddCardDialog(false);
    setCardForm({ cardNumber: "", cardHolder: "", expMonth: "", expYear: "", cvv: "" });
    
    toast({
      title: "Kort tilføjet",
      description: `${newCard.brand} •••• ${newCard.last4} er blevet tilføjet`,
    });
  };

  const handleDeleteCard = (cardId: string) => {
    setPaymentCards(prev => prev.filter(c => c.id !== cardId));
    setDeleteCardDialog(null);
    toast({
      title: "Kort fjernet",
      description: "Dit betalingskort er blevet fjernet",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-12 py-8 md:py-12">
        {/* Editorial Header */}
        <div className="mb-8 md:mb-12">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground mb-6 -ml-1 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Tilbage
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px w-8 bg-foreground/40" />
            <span className="text-xs uppercase tracking-[0.2em] text-foreground/60">Konto</span>
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-medium tracking-tight text-foreground leading-[1.05]">
            Betaling og priser.
          </h1>
          <p className="mt-3 text-sm md:text-base text-foreground/60 max-w-xl">
            Administrer dine betalingskort og se priser.
          </p>
        </div>

        <div className="space-y-8">
          {/* Payment Cards Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-secondary" />
                Betalingskort
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentCards.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Ingen betalingskort tilføjet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentCards.map((card) => (
                    <div 
                      key={card.id} 
                      className="flex items-center justify-between p-4 rounded-xl border border-border bg-card"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-8 bg-gradient-to-br from-primary to-primary/60 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{card.brand}</span>
                        </div>
                        <div>
                          <p className="font-medium">•••• •••• •••• {card.last4}</p>
                          <p className="text-sm text-muted-foreground">
                            Udløber {card.expMonth}/{card.expYear}
                            {card.isDefault && <span className="ml-2 text-secondary">(Standard)</span>}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setDeleteCardDialog(card.id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <Button 
                onClick={handleAddCard}
                variant="outline" 
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tilføj betalingskort
              </Button>
            </CardContent>
          </Card>

          {/* Pricing Section - Only visible for landlords */}
          {isLandlord && (
            <div className="space-y-6">
              {/* Launch Offer Banner - Only for first-time landlords */}
              {isLaunchOfferEligible && (
                <Card className="border-2 border-amber-500/50 bg-gradient-to-r from-amber-500/10 to-orange-500/10 overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-full blur-2xl -mr-10 -mt-10" />
                  <CardContent className="p-6 relative">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-1">🎉 Launch-tilbud: 50% rabat!</h3>
                        <p className="text-muted-foreground mb-3">
                          Som ny udlejer får du <span className="font-semibold text-amber-600">50% rabat</span> på din allerførste annonce.
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-700">Kun første annonce</span>
                          <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-700">Tidsbegrænset</span>
                          <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-700">Automatisk rabat</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-secondary" />
                    Annonceperioder
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground mb-4">
                    Vælg hvor længe din annonce skal være synlig
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
                      <div>
                        <p className="font-medium">7 dage</p>
                        <p className="text-sm text-muted-foreground">Kort periode</p>
                      </div>
                      <div className="text-right">
                        {isLaunchOfferEligible ? (
                          <>
                            <span className="text-sm text-muted-foreground line-through mr-2">99 kr</span>
                            <span className="text-xl font-bold text-green-600">49 kr</span>
                          </>
                        ) : (
                          <span className="text-xl font-bold text-foreground">99 kr</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl border-2 border-secondary bg-secondary/10">
                      <div>
                        <p className="font-medium">14 dage</p>
                        <p className="text-sm text-muted-foreground">Mest populær</p>
                      </div>
                      <div className="text-right">
                        {isLaunchOfferEligible ? (
                          <>
                            <span className="text-sm text-muted-foreground line-through mr-2">179 kr</span>
                            <span className="text-xl font-bold text-green-600">89 kr</span>
                          </>
                        ) : (
                          <span className="text-xl font-bold text-foreground">179 kr</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
                      <div>
                        <p className="font-medium">30 dage</p>
                        <p className="text-sm text-muted-foreground">Bedste værdi</p>
                      </div>
                      <div className="text-right">
                        {isLaunchOfferEligible ? (
                          <>
                            <span className="text-sm text-muted-foreground line-through mr-2">299 kr</span>
                            <span className="text-xl font-bold text-green-600">149 kr</span>
                          </>
                        ) : (
                          <span className="text-xl font-bold text-foreground">299 kr</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Boost Prices */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    Boost din annonce
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground mb-4">
                    Få din annonce vist øverst i søgeresultaterne
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
                      <div>
                        <p className="font-medium">24 timer</p>
                        <p className="text-sm text-muted-foreground">Hurtig synlighed</p>
                      </div>
                      <span className="text-xl font-bold text-amber-500">49 kr</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
                      <div>
                        <p className="font-medium">3 dage</p>
                        <p className="text-sm text-muted-foreground">God rækkevidde</p>
                      </div>
                      <span className="text-xl font-bold text-amber-500">99 kr</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl border-2 border-amber-500 bg-amber-500/10">
                      <div>
                        <p className="font-medium">7 dage</p>
                        <p className="text-sm text-muted-foreground">Maksimal eksponering</p>
                      </div>
                      <span className="text-xl font-bold text-amber-500">199 kr</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          )}

          {/* Pricing Section - Only visible for roomies */}
          {isRoomie && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-secondary" />
                  Søgeagenter
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Søgeagenter holder øje med nye værelser der matcher dine kriterier og giver dig besked med det samme.
                </p>
                
                <div className="space-y-3">
                  {/* First agent free */}
                  <div className="flex items-center justify-between p-4 rounded-xl border-2 border-green-500 bg-green-500/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Gift className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium">Din første søgeagent</p>
                        <p className="text-sm text-muted-foreground">Altid gratis</p>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-green-500">Gratis</span>
                  </div>

                  {/* Additional agents */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                        <Plus className="w-5 h-5 text-secondary" />
                      </div>
                      <div>
                        <p className="font-medium">Ekstra søgeagent-plads</p>
                        <p className="text-sm text-muted-foreground">Engangsbetaling pr. ekstra plads</p>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-secondary">29 kr</span>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground space-y-2">
                  <p className="font-medium text-foreground">Sådan virker det:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Din første søgeagent er altid gratis</li>
                    <li>Køb ekstra pladser for 29 kr (engangsbetaling)</li>
                    <li>Når du sletter en agent, frigøres pladsen til en ny</li>
                    <li>Få notifikationer når nye værelser matcher dine kriterier</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Card Dialog */}
      <AlertDialog open={!!deleteCardDialog} onOpenChange={() => setDeleteCardDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fjern betalingskort?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på, at du vil fjerne dette betalingskort?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuller</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCardDialog && handleDeleteCard(deleteCardDialog)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Fjern kort
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Card Dialog */}
      <Dialog open={showAddCardDialog} onOpenChange={setShowAddCardDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-secondary" />
              Tilføj betalingskort
            </DialogTitle>
            <DialogDescription>
              Indtast dine kortoplysninger nedenfor
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Card Number */}
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Kortnummer</Label>
              <div className="relative">
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={cardForm.cardNumber}
                  onChange={(e) => setCardForm({ ...cardForm, cardNumber: formatCardNumber(e.target.value) })}
                  className={cardErrors.cardNumber ? "border-destructive" : ""}
                />
                {cardForm.cardNumber && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                    {detectCardBrand(cardForm.cardNumber)}
                  </span>
                )}
              </div>
              {cardErrors.cardNumber && (
                <p className="text-sm text-destructive">{cardErrors.cardNumber}</p>
              )}
            </div>

            {/* Card Holder */}
            <div className="space-y-2">
              <Label htmlFor="cardHolder">Kortholders navn</Label>
              <Input
                id="cardHolder"
                placeholder="Anders Andersen"
                value={cardForm.cardHolder}
                onChange={(e) => setCardForm({ ...cardForm, cardHolder: e.target.value.slice(0, 50) })}
                className={cardErrors.cardHolder ? "border-destructive" : ""}
              />
              {cardErrors.cardHolder && (
                <p className="text-sm text-destructive">{cardErrors.cardHolder}</p>
              )}
            </div>

            {/* Expiry and CVV */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expMonth">Måned</Label>
                <Input
                  id="expMonth"
                  placeholder="MM"
                  maxLength={2}
                  value={cardForm.expMonth}
                  onChange={(e) => setCardForm({ ...cardForm, expMonth: e.target.value.replace(/\D/g, "").slice(0, 2) })}
                  className={cardErrors.expMonth ? "border-destructive" : ""}
                />
                {cardErrors.expMonth && (
                  <p className="text-xs text-destructive">{cardErrors.expMonth}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="expYear">År</Label>
                <Input
                  id="expYear"
                  placeholder="YYYY"
                  maxLength={4}
                  value={cardForm.expYear}
                  onChange={(e) => setCardForm({ ...cardForm, expYear: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                  className={cardErrors.expYear ? "border-destructive" : ""}
                />
                {cardErrors.expYear && (
                  <p className="text-xs text-destructive">{cardErrors.expYear}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  maxLength={4}
                  type="password"
                  value={cardForm.cvv}
                  onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                  className={cardErrors.cvv ? "border-destructive" : ""}
                />
                {cardErrors.cvv && (
                  <p className="text-xs text-destructive">{cardErrors.cvv}</p>
                )}
              </div>
            </div>

            {/* Security note */}
            <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
              <p>🔒 Dine kortoplysninger er sikre og krypterede</p>
            </div>

            {/* Submit button */}
            <Button 
              onClick={handleSubmitCard}
              className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              Tilføj kort
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Payment;