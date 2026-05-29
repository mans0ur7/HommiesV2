import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Bell, BellOff, Trash2, Edit2, MapPin, Mail, Search, Home, ChevronRight, CheckCheck, X } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import AppLayout from "@/components/navigation/AppLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { isNativeApp } from "@/lib/native";
import { useSearchAgents, CreateSearchAgentData } from "@/hooks/useSearchAgents";
import { useNotifications } from "@/hooks/useNotifications";
import SearchAgentWizard from "@/components/search-agents/SearchAgentWizard";
import SearchAgentModal from "@/components/search-agents/SearchAgentModal";
import { formatDistanceToNow } from "date-fns";
import { da } from "date-fns/locale";

// Pricing configuration
const MAX_FREE_AGENTS = 1;
const PRICE_PER_SLOT = 29;

const SearchAgents = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { user, profile, loading } = useAuth();
  const { searchAgents, isLoading, createAgent, updateAgent, deleteAgent, toggleAgent } = useSearchAgents();
  const availableSlots: number = (profile as any)?.search_agent_slots ?? 1;
  const usedSlots = searchAgents.length;
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any>(null);

  // Filter notifications related to search agents (new_property type)
  const propertyNotifications = notifications.filter(n => n.type === 'new_property');
  const unreadPropertyCount = propertyNotifications.filter(n => !n.is_read).length;

  // Redirect if not logged in or if landlord
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Only roomies can access this page
  if (profile?.user_type === "landlord") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center h-full py-20">
            <Search className="w-16 h-16 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold text-primary mb-2">{t("searchAgents.onlyRoomies")}</h1>
            <p className="text-muted-foreground text-center max-w-md">
              {t("searchAgents.onlyRoomiesBody")}
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleCreate = (data: CreateSearchAgentData) => {
    createAgent.mutate(data);
    setShowCreateModal(false);
  };

  const handleUpdate = (data: CreateSearchAgentData & { id: string }) => {
    updateAgent.mutate(data);
    setEditingAgent(null);
  };

  const handleDelete = (id: string) => {
    if (confirm(t("searchAgents.confirmDelete"))) {
      deleteAgent.mutate(id);
    }
  };

  const handleToggle = (id: string, currentState: boolean) => {
    toggleAgent.mutate({ id, is_active: !currentState });
  };

  const formatFilters = (agent: any) => {
    const filters: string[] = [];
    if (agent.min_rent || agent.max_rent) {
      const min = agent.min_rent ? `${agent.min_rent.toLocaleString()} kr` : "0 kr";
      const max = agent.max_rent ? `${agent.max_rent.toLocaleString()} kr` : "∞";
      filters.push(`${min} - ${max}/md`);
    }
    if (agent.min_rooms || agent.max_rooms) {
      const min = agent.min_rooms || 1;
      const max = agent.max_rooms || "∞";
      filters.push(`${min}-${max} værelser`);
    }
    if (agent.property_type) {
      filters.push(agent.property_type);
    }
    return filters;
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <AppLayout>
    <div className="min-h-screen bg-background flex flex-col">
      {!isMobile && <Navbar />}
      
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 md:px-6 lg:px-12 py-8 md:py-12">
        {/* Editorial Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 md:mb-12">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px w-8 bg-foreground/40" />
              <span className="text-xs uppercase tracking-[0.2em] text-foreground/60">{t("searchAgents.eyebrow")}</span>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-medium tracking-tight text-foreground leading-[1.05]">
              {t("searchAgents.title")}
            </h1>
            <p className="mt-3 text-sm md:text-base text-foreground/60 max-w-xl">
              {t("searchAgents.subtitle")}
            </p>
            <p className="mt-2 text-sm text-foreground/50">
              {t("searchAgents.slotsUsed", { used: usedSlots, total: availableSlots })}
              {usedSlots >= availableSlots && availableSlots > 0 && !isNativeApp() && (
                <span className="text-amber-500 ml-2">{t("searchAgents.buyExtra")}</span>
              )}
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="rounded-full bg-foreground text-background hover:bg-foreground/90 h-11 px-5"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("searchAgents.createAgent")}
          </Button>
        </div>

        {/* New Properties Notifications Section */}
        {propertyNotifications.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-primary">{t("searchAgents.newMatching")}</h2>
                {unreadPropertyCount > 0 && (
                  <Badge variant="destructive" className="rounded-full px-2 py-0.5 text-xs">
                    {unreadPropertyCount}
                  </Badge>
                )}
              </div>
              {unreadPropertyCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAllAsRead.mutate()}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <CheckCheck className="w-4 h-4 mr-1.5" />
                  {t("searchAgents.markAllRead")}
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {propertyNotifications.slice(0, 5).map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`transition-all hover:shadow-md ${!notification.is_read ? 'bg-secondary/10 border-secondary/30' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center flex-shrink-0">
                        <Home className="w-5 h-5 text-secondary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium truncate ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <span className="w-2 h-2 rounded-full bg-secondary flex-shrink-0" />
                          )}
                        </div>
                        {notification.message && (
                          <p className="text-sm text-muted-foreground truncate">{notification.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: da })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {notification.property_id && (
                          <Link to={`/property/${notification.property_id}`}>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                if (!notification.is_read) {
                                  markAsRead.mutate(notification.id);
                                }
                              }}
                            >
                              {t("searchAgents.seeProperty")}
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </Link>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteNotification.mutate(notification.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {propertyNotifications.length > 5 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  {t("searchAgents.moreNotifications", { count: propertyNotifications.length - 5 })}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Agents List */}
        <div className="flex items-center justify-between mb-4 mt-4">
          <div className="flex items-center gap-3">
            <div className="h-px w-6 bg-foreground/40" />
            <span className="text-xs uppercase tracking-[0.2em] text-foreground/60">{t("searchAgents.mySection")}</span>
          </div>
        </div>
        
        {searchAgents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-background py-14 px-6 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-foreground/60" />
            </div>
            <h3 className="text-xl md:text-2xl font-medium tracking-tight mb-2">{t("searchAgents.noAgents")}</h3>
            <p className="text-foreground/60 max-w-sm mb-6 text-sm">
              {t("searchAgents.noAgentsBody")}
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="rounded-full bg-foreground text-background hover:bg-foreground/90 h-11 px-5"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("searchAgents.createFirst")}
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {searchAgents.map((agent) => (
              <div
                key={agent.id}
                className={`relative rounded-2xl border border-border/60 bg-background p-5 transition-all hover:border-foreground/30 ${!agent.is_active ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium tracking-tight truncate pr-2">{agent.name}</h3>
                    <p className="flex items-center gap-1 mt-1 text-sm text-foreground/60">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">
                        {agent.area ? `${agent.area}, ${agent.city}` : agent.city || t("searchAgents.allDenmark")}
                      </span>
                    </p>
                  </div>
                  <Switch
                    checked={agent.is_active}
                    onCheckedChange={() => handleToggle(agent.id, agent.is_active)}
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {formatFilters(agent).map((filter, index) => (
                    <span key={index} className="text-xs px-2.5 py-1 rounded-full bg-muted text-foreground/80">
                      {filter}
                    </span>
                  ))}
                  {formatFilters(agent).length === 0 && (
                    <span className="text-xs px-2.5 py-1 rounded-full border border-border/60 text-foreground/60">
                      {t("searchAgents.allProperties")}
                    </span>
                  )}
                </div>

                {/* Notification Status */}
                <div className="flex items-center gap-4 text-xs text-foreground/60 mb-4 pt-4 border-t border-border/60">
                  <span className="flex items-center gap-1.5">
                    {agent.is_active ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                    {agent.notification_frequency === 'instant' ? t("searchAgents.instant") :
                     agent.notification_frequency === 'daily' ? t("searchAgents.daily") : t("searchAgents.weekly")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    {agent.email_notifications ? t("searchAgents.emailOn") : t("searchAgents.emailOff")}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-full border-border/60"
                    onClick={() => setEditingAgent(agent)}
                  >
                    <Edit2 className="w-4 h-4 mr-1.5" />
                    {t("searchAgents.edit")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(agent.id)}
                    className="rounded-full border-border/60 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 p-6 rounded-2xl bg-muted/40 border border-border/60">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-6 bg-foreground/40" />
            <span className="text-xs uppercase tracking-[0.2em] text-foreground/60">{t("searchAgents.howWorks")}</span>
          </div>
          <ul className="space-y-2.5 text-sm text-foreground/70">
            <li className="flex items-start gap-3">
              <span className="text-foreground font-medium">01</span>
              {t("searchAgents.step1")}
            </li>
            <li className="flex items-start gap-3">
              <span className="text-foreground font-medium">02</span>
              {t("searchAgents.step2")}
            </li>
            <li className="flex items-start gap-3">
              <span className="text-foreground font-medium">03</span>
              {t("searchAgents.step3")}
            </li>
          </ul>
        </div>
      </main>

      <Footer />

      {/* Create Modal (Wizard) */}
      {showCreateModal && (
        <SearchAgentWizard
          existingAgentsCount={usedSlots}
          maxFreeAgents={availableSlots}
          pricePerSlot={PRICE_PER_SLOT}
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreate}
          isLoading={createAgent.isPending}
        />
      )}

      {/* Edit Modal (Simple form) */}
      {editingAgent && (
        <SearchAgentModal
          agent={editingAgent}
          onClose={() => setEditingAgent(null)}
          onSave={handleUpdate}
          isLoading={updateAgent.isPending}
        />
      )}
    </div>
    </AppLayout>
  );
};

export default SearchAgents;
