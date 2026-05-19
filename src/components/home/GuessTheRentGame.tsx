import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { Home, MapPin, Sparkles, ArrowRight, RefreshCw, Trophy, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface Property {
  id: string;
  title: string;
  city: string;
  monthly_rent: number;
  images: string[] | null;
  size_sqm: number | null;
}

const GuessTheRentGame = () => {
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [guess, setGuess] = useState(5000);
  const [hasGuessed, setHasGuessed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [score, setScore] = useState<number | null>(null);

  const fetchRandomProperty = async () => {
    setIsLoading(true);
    setHasGuessed(false);
    setScore(null);
    setGuess(5000);
    
    try {
      // Get total count of published properties with images
      const { count } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true)
        .not('images', 'is', null);

      if (!count || count === 0) {
        setProperty(null);
        return;
      }

      // Get a random offset
      const randomOffset = Math.floor(Math.random() * count);

      const { data, error } = await supabase
        .from('properties')
        .select('id, title, city, monthly_rent, images, size_sqm')
        .eq('is_published', true)
        .not('images', 'is', null)
        .range(randomOffset, randomOffset)
        .limit(1)
        .single();

      if (error) throw error;
      
      if (data && data.images && data.images.length > 0) {
        setProperty(data);
        // Set initial guess to middle of range
        setGuess(Math.round(data.monthly_rent * 0.8 + Math.random() * data.monthly_rent * 0.4));
      }
    } catch (error) {
      console.error('Error fetching property:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomProperty();
  }, []);

  const handleGuess = () => {
    if (!property) return;
    
    const difference = Math.abs(guess - property.monthly_rent);
    const percentOff = (difference / property.monthly_rent) * 100;
    
    // Score from 0-100 based on how close they were
    const calculatedScore = Math.max(0, Math.round(100 - percentOff));
    setScore(calculatedScore);
    setHasGuessed(true);
  };

  const getScoreMessage = () => {
    if (score === null) return "";
    if (score >= 90) return "Perfekt! 🎯";
    if (score >= 70) return "Tæt på! 🔥";
    if (score >= 50) return "Ikke dårligt! 👍";
    if (score >= 30) return "Lidt ved siden af 😅";
    return "Prøv igen! 💪";
  };

  const getScoreColor = () => {
    if (score === null) return "text-muted-foreground";
    if (score >= 70) return "text-green-500";
    if (score >= 50) return "text-yellow-500";
    return "text-orange-500";
  };

  if (isLoading) {
    return (
      <section className="bg-primary py-12 lg:py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-primary-foreground/20 rounded w-48 mx-auto mb-4"></div>
              <div className="h-64 bg-primary-foreground/10 rounded-xl max-w-md mx-auto"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!property) {
    return (
      <section className="bg-primary py-12 lg:py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-primary-foreground mb-4">
              Gæt huslejen
            </h2>
            <p className="text-primary-foreground/70">Ingen værelser tilgængelige lige nu</p>
            <Button 
              onClick={() => navigate("/explore")}
              className="mt-4 bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              Udforsk værelser
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-primary py-10 lg:py-14 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute left-0 top-0 w-32 h-32 rounded-full bg-secondary/10 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute right-0 bottom-0 w-40 h-40 rounded-full bg-secondary/10 translate-x-1/2 translate-y-1/2"></div>
      
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Target className="w-5 h-5 text-secondary" />
            <span className="text-secondary font-medium text-sm uppercase tracking-wide">Mini-spil</span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold text-primary-foreground">
            Gæt <span className="text-secondary">huslejen</span>
          </h2>
        </div>

        <div className="max-w-lg mx-auto">
          <Card className="overflow-hidden border-0 shadow-xl">
            {/* Property Image */}
            <div className="relative h-48 md:h-56">
              <img 
                src={property.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop'} 
                alt={property.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <div className="flex items-center gap-2 text-white">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium">{property.city}</span>
                  {property.size_sqm && (
                    <>
                      <span className="text-white/50">•</span>
                      <span className="text-sm">{property.size_sqm} m²</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <CardContent className="p-5 space-y-5">
              {!hasGuessed ? (
                <>
                  {/* Guess Slider */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Dit gæt:</span>
                      <span className="text-2xl font-bold text-primary">
                        {guess.toLocaleString('da-DK')} kr/md
                      </span>
                    </div>
                    <Slider
                      value={[guess]}
                      onValueChange={(value) => setGuess(value[0])}
                      min={2000}
                      max={15000}
                      step={100}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>2.000 kr</span>
                      <span>15.000 kr</span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleGuess}
                    className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Gæt huslejen
                  </Button>
                </>
              ) : (
                <>
                  {/* Results */}
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center gap-2">
                      <Trophy className={cn("w-6 h-6", getScoreColor())} />
                      <span className={cn("text-xl font-bold", getScoreColor())}>
                        {getScoreMessage()}
                      </span>
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Dit gæt:</span>
                        <span className="font-medium">{guess.toLocaleString('da-DK')} kr/md</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rigtig pris:</span>
                        <span className="font-bold text-primary">{property.monthly_rent.toLocaleString('da-DK')} kr/md</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-muted-foreground">Score:</span>
                        <span className={cn("font-bold", getScoreColor())}>{score}/100</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      onClick={fetchRandomProperty}
                      variant="outline"
                      className="flex-1 gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Prøv igen
                    </Button>
                    <Button 
                      onClick={() => navigate(`/property/${property.id}`)}
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                    >
                      Se værelset
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default GuessTheRentGame;
