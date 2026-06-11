import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Send, MoreHorizontal, User, Ban, Trash2, Star, Home, FileSignature, ChevronLeft, UsersRound, Check, CheckCheck, MessageCircle, Copy, Flag, ImageIcon } from "lucide-react";
import { useLongPress } from "@/hooks/useLongPress";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { usePropertyRating } from "@/hooks/usePropertyRating";
import { usePresence } from "@/hooks/usePresence";
import RatingPrompt from "@/components/ratings/RatingPrompt";
import TypingIndicator from "./TypingIndicator";
import SharePropertyModal from "./SharePropertyModal";
import PropertyCardBubble from "./PropertyCardBubble";
import type { Conversation } from "@/types/inbox";
import { submitReport } from "@/lib/bugReport";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Renders a single chat bubble with a long-press / right-click context menu
// (copy + optional report). Kept inline so we don't have to re-thread all the
// message state through props.
const MessageBubble = ({
  isOwn,
  content,
  imageUrl,
  onCopy,
  onReport,
  onImageClick,
}: {
  isOwn: boolean;
  content: string;
  imageUrl?: string | null;
  onCopy: () => void;
  onReport?: () => void;
  onImageClick?: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const longPress = useLongPress(() => setOpen(true));
  const isImageOnly = !!imageUrl && (!content || content.trim() === "");
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          {...longPress}
          className={`shadow-sm select-none cursor-default overflow-hidden ${
            isImageOnly
              ? "rounded-2xl"
              : isOwn
                ? "rounded-2xl px-4 py-2.5 bg-primary text-primary-foreground rounded-br-md"
                : "rounded-2xl px-4 py-2.5 bg-background border border-border/50 text-foreground rounded-bl-md"
          }`}
        >
          {imageUrl && (
            <img
              src={imageUrl}
              alt=""
              onClick={onImageClick}
              className={`block max-w-[240px] max-h-[240px] object-cover cursor-zoom-in ${
                isImageOnly ? "" : isOwn ? "-mx-4 -mt-2.5 mb-2" : "-mx-4 -mt-2.5 mb-2"
              }`}
            />
          )}
          {!isImageOnly && (
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent align="center" side="top" className="w-44 p-1">
        <button
          onClick={() => { onCopy(); setOpen(false); }}
          className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted flex items-center gap-2"
        >
          <Copy className="w-4 h-4" /> Kopiér
        </button>
        {onReport && (
          <button
            onClick={() => { onReport(); setOpen(false); }}
            className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted text-destructive flex items-center gap-2"
          >
            <Flag className="w-4 h-4" /> Rapportér besked
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
};

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read_at: string | null;
  image_url?: string | null;
  property_card_id?: string | null;
}

interface ChatAreaProps {
  conversation: Conversation | null;
  currentUserId: string;
  currentUserAvatar?: string | null;
  onMessageSent: () => void;
  onConversationDeleted?: () => void;
  onBack?: () => void;
  showBackButton?: boolean;
}

const ChatArea = ({
  conversation,
  currentUserId,
  currentUserAvatar,
  onMessageSent,
  onConversationDeleted,
  onBack,
  showBackButton = false,
}: ChatAreaProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isBlocking, setIsBlocking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reportingMessageId, setReportingMessageId] = useState<string | null>(null);
  const [reportingSent, setReportingSent] = useState(false);
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showShareProperty, setShowShareProperty] = useState(false);
  const [showRatingPrompt, setShowRatingPrompt] = useState(false);
  const [manualRatingTriggered, setManualRatingTriggered] = useState(false);

  // When a user long-presses a message and chooses "Report", send it to support
  // tagged with the message ID + the offender. Reuses the existing bug-report
  // edge function so we don't need new infra.
  useEffect(() => {
    if (!reportingMessageId || reportingSent) return;
    const msg = messages.find((m) => m.id === reportingMessageId);
    if (!msg) return;
    setReportingSent(true);
    const description =
      `[MESSAGE REPORT]\n` +
      `Reported message id: ${msg.id}\n` +
      `Conversation: ${conversation.id}\n` +
      `Sender: ${conversation.otherUser.name ?? conversation.otherUser.id} (${msg.sender_id})\n\n` +
      `Content:\n${msg.content}`;
    submitReport(description, "problem", undefined)
      .then(() => toast.success("Beskeden er rapporteret. Tak."))
      .catch(() => toast.error("Kunne ikke sende rapport"))
      .finally(() => {
        setReportingMessageId(null);
        setReportingSent(false);
      });
  }, [reportingMessageId, reportingSent, messages, conversation]);

  // For group contract selection
  const [showContractMemberSelect, setShowContractMemberSelect] = useState(false);
  const [groupMembers, setGroupMembers] = useState<{ id: string; name: string; avatar_url: string | null }[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  
  const isLandlord = profile?.user_type === "landlord";
  const { isOnline } = usePresence();
  const otherUserOnline = conversation && !conversation.groupInfo && isOnline(conversation.otherUser.id);

  // Check if user can rate this property (7-day eligibility)
  const { canRate, ratableProperty, markAsRated } = usePropertyRating(
    conversation?.property_id || undefined
  );

  // Automatic rating prompt disabled - users can still rate manually via star button

  // Trigger manual rating prompt
  const handleManualRating = () => {
    setManualRatingTriggered(true);
    setShowRatingPrompt(true);
  };

  // Handle contract button click - for group chats, show member selection modal
  const handleContractClick = async () => {
    if (!conversation) return;

    // For group conversations, fetch members and show selection modal
    if (conversation.groupInfo) {
      setLoadingMembers(true);
      setShowContractMemberSelect(true);

      // Get all participants except current user
      const { data: participants } = await supabase
        .from("conversation_participants")
        .select("user_id")
        .eq("conversation_id", conversation.id)
        .neq("user_id", currentUserId);

      if (participants) {
        const members = await Promise.all(
          participants.map(async (p) => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("name, avatar_url")
              .eq("user_id", p.user_id)
              .maybeSingle();
            return {
              id: p.user_id,
              name: profile?.name || "Ukendt",
              avatar_url: profile?.avatar_url || null,
            };
          })
        );
        setGroupMembers(members);
      }
      setLoadingMembers(false);
    } else {
      // For 1:1 conversations, navigate directly
      const params = new URLSearchParams({ tenant: conversation.otherUser.id });
      if (conversation.property_id) {
        params.set("property", conversation.property_id);
      }
      navigate(`/documents/new?${params.toString()}`);
    }
  };

  const handleSelectMemberForContract = (memberId: string) => {
    setShowContractMemberSelect(false);
    const params = new URLSearchParams({ tenant: memberId });
    if (conversation?.property_id) {
      params.set("property", conversation.property_id);
    }
    navigate(`/documents/new?${params.toString()}`);
  };

  // Scroll INSIDE the messages panel (not the whole page)
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversation) {
      fetchMessages();
      markMessagesAsRead();

      // One channel handles both Postgres changes and Broadcast typing events
      const channel = supabase
        .channel(`chat:${conversation.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversation.id}`,
          },
          (payload) => {
            const newMsg = payload.new as Message;
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            if (newMsg.sender_id !== currentUserId) {
              markMessagesAsRead();
            }
          }
        )
        .on("broadcast", { event: "typing" }, (payload) => {
          if (payload.payload?.sender_id === currentUserId) return;
          setIsTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
        })
        .subscribe();

      typingChannelRef.current = channel;

      return () => {
        supabase.removeChannel(channel);
        typingChannelRef.current = null;
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        setIsTyping(false);
      };
    } else {
      setMessages([]);
    }
  }, [conversation?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    // Avoid scrollIntoView() which can scroll the entire page
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  const fetchMessages = async () => {
    if (!conversation) return;

    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data);
    }
  };

  const markMessagesAsRead = async () => {
    if (!conversation) return;

    const { error } = await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", conversation.id)
      .neq("sender_id", currentUserId)
      .is("read_at", null);

    if (!error) {
      // Notify badge to refresh immediately (realtime UPDATE may be unreliable)
      window.dispatchEvent(new CustomEvent("messages-read"));
    }
  };

  const handleSendPropertyCard = async (propertyId: string) => {
    if (!conversation || sending) return;
    setSending(true);
    setShowShareProperty(false);
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversation.id,
          sender_id: currentUserId,
          content: " ",
          property_card_id: propertyId,
        })
        .select()
        .single();
      if (error) throw error;
      if (data) {
        setMessages((prev) => [...prev, data]);
        // conversations.updated_at bumpes af DB-triggeren bump_conversation_updated_at
        onMessageSent();
      }
    } catch (e: unknown) {
      console.error("[chat] property card send failed", e);
      toast.error(t("chat.shareProperty.sendFailed"));
    } finally {
      setSending(false);
    }
  };

  const handleSendImage = async (file: File) => {
    if (!conversation || sending) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("chat.imageOnly"));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error(t("chat.imageTooLarge"));
      return;
    }

    setSending(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${currentUserId}/${conversation.id}-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("chat-images")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("chat-images").getPublicUrl(path);
      const publicUrl = pub.publicUrl;

      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversation.id,
          sender_id: currentUserId,
          content: " ",
          image_url: publicUrl,
        })
        .select()
        .single();
      if (error) throw error;

      if (data) {
        setMessages((prev) => [...prev, data]);
        onMessageSent();
      }
    } catch (e: unknown) {
      console.error("[chat] image send failed", e);
      toast.error(t("chat.imageSendFailed"));
    } finally {
      setSending(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !conversation || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage("");

    // Optimistic update - add message immediately to UI
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      sender_id: currentUserId,
      created_at: new Date().toISOString(),
      read_at: null,
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    // Send message to database
    const { data, error } = await supabase.from("messages").insert({
      conversation_id: conversation.id,
      sender_id: currentUserId,
      content: messageContent,
    }).select().single();

    if (error) {
      console.error("Error sending message:", error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
      setNewMessage(messageContent); // Restore message
      toast.error("Kunne ikke sende besked");
    } else if (data) {
      // Replace optimistic message with real one
      setMessages((prev) =>
        prev.map((m) => m.id === optimisticMessage.id ? data : m)
      );

      // Throttled server-side; safe to fire-and-forget after every send.
      supabase.rpc("refresh_my_response_time").then(({ error: rpcErr }) => {
        if (rpcErr) console.warn("[response-time] refresh failed", rpcErr.message);
      });

      onMessageSent();
    }

    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTyping = () => {
    typingChannelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { sender_id: currentUserId },
    });
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center px-8">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-secondary flex items-center justify-center">
            <MessageCircle className="w-7 h-7 text-secondary-foreground" strokeWidth={1.75} />
          </div>
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-px w-8 bg-foreground/30" />
            <span className="text-[11px] uppercase tracking-[0.2em] text-foreground/50">Beskeder</span>
            <div className="h-px w-8 bg-foreground/30" />
          </div>
          <p className="text-xl font-medium tracking-tight text-foreground">Vælg en samtale</p>
          <p className="text-sm text-foreground/55 mt-1.5 max-w-[220px] mx-auto leading-relaxed">
            Vælg en samtale fra listen for at begynde at chatte
          </p>
        </div>
      </div>
    );
  }

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("da-DK", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-background min-h-0">
      {/* Chat Header - Mobile optimized. safe-area-top keeps it clear of the
          iOS status bar / Dynamic Island when AppLayout's header is hidden. */}
      <div className="flex-shrink-0 bg-background/80 backdrop-blur-lg border-b border-border/60 safe-area-top">
        {/* Main header row */}
        <div className="flex items-center px-3 md:px-6 py-2 md:py-3 gap-2 md:gap-4">
          {/* Mobile back button */}
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden flex-shrink-0 h-8 w-8 rounded-full hover:bg-muted"
              onClick={onBack}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {conversation.groupInfo ? (
              <div className="relative w-9 h-9 md:w-11 md:h-11 rounded-full bg-muted border border-border/60 overflow-hidden">
                {conversation.groupInfo.memberAvatars.slice(0, 3).map((avatar, idx) => (
                  <img
                    key={idx}
                    src={avatar || "/placeholder.svg"}
                    alt="Gruppemedlem"
                    className={`w-4 h-4 md:w-5 md:h-5 rounded-full border border-background object-cover absolute ${
                      idx === 0 ? "top-0.5 left-0.5" : idx === 1 ? "bottom-0.5 right-0.5" : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    }`}
                  />
                ))}
                {conversation.groupInfo.memberAvatars.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ) : conversation.otherUser.avatar_url ? (
              <img
                src={conversation.otherUser.avatar_url}
                alt={conversation.otherUser.name}
                className="w-9 h-9 md:w-11 md:h-11 rounded-full object-cover border border-border/60"
              />
            ) : (
              <div className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-muted flex items-center justify-center border border-border/60">
                <User className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
              </div>
            )}
            {otherUserOnline && (
              <div
                className="absolute bottom-0 right-0 w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 rounded-full border-2 border-background"
                title="Online nu"
              />
            )}
          </div>

          {/* Name and info - takes remaining space */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm md:text-base truncate">
                {conversation.groupInfo?.name || conversation.otherUser.name}
              </span>
              {/* Type badge - shows if it's a landlord or roomie conversation */}
              {!conversation.groupInfo && (
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] md:text-xs font-semibold ${
                  conversation.type === "landlord"
                    ? "bg-foreground text-background"
                    : "bg-secondary text-secondary-foreground"
                }`}>
                  {conversation.type === "landlord" ? (
                    <>
                      <Home className="w-3 h-3" />
                      Udlejer
                    </>
                  ) : (
                    <>
                      <User className="w-3 h-3" />
                      Roomie
                    </>
                  )}
                </span>
              )}
            </div>
            {conversation.groupInfo && (
              <span className="text-[10px] md:text-xs text-muted-foreground">
                {conversation.groupInfo.memberCount} medlemmer
              </span>
            )}
          </div>

          {/* Action buttons - compact on mobile */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Rating button */}
            {conversation.property_id && (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-7 w-7 md:h-9 md:w-9 hover:bg-yellow-500/10"
                onClick={handleManualRating}
                title="Bedøm annonce"
              >
                <Star className="h-3.5 w-3.5 md:h-5 md:w-5 text-yellow-500" />
              </Button>
            )}
            
            {/* Contract button - landlords only */}
            {isLandlord && (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-7 w-7 md:h-9 md:w-9 hover:bg-primary/10"
                onClick={handleContractClick}
                title={conversation.groupInfo ? "Vælg medlem til husorden" : "Start husorden"}
              >
                <FileSignature className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
              </Button>
            )}
            
            {/* More menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-7 w-7 md:h-9 md:w-9 hover:bg-muted">
                  <MoreHorizontal className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-background/95 backdrop-blur-lg border-border/50">
                {!conversation.groupInfo && (
                  <>
                    <DropdownMenuItem 
                      onClick={() => navigate(`/user/${conversation.otherUser.id}`)}
                      className="cursor-pointer"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Se profil
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={async () => {
                        if (isBlocking) return;
                        setIsBlocking(true);
                        try {
                          const { error } = await supabase.from("blocked_users").insert({
                            user_id: currentUserId,
                            blocked_user_id: conversation.otherUser.id,
                          });
                          if (error) throw error;
                          toast.success(`${conversation.otherUser.name} er blevet blokeret`);
                          onConversationDeleted?.();
                        } catch (error) {
                          console.error("Error blocking user:", error);
                          toast.error("Kunne ikke blokere bruger");
                        } finally {
                          setIsBlocking(false);
                        }
                      }}
                      disabled={isBlocking}
                      className="cursor-pointer text-orange-600 focus:text-orange-600"
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      {isBlocking ? "Blokerer..." : "Bloker bruger"}
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem 
                  onClick={async () => {
                    if (isDeleting) return;
                    setIsDeleting(true);
                    try {
                      const { error } = await supabase
                        .from("conversation_participants")
                        .delete()
                        .eq("conversation_id", conversation.id)
                        .eq("user_id", currentUserId);
                      
                      if (error) throw error;
                      toast.success("Samtale slettet");
                      onConversationDeleted?.();
                    } catch (error) {
                      console.error("Error deleting conversation:", error);
                      toast.error("Kunne ikke slette samtale");
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeleting ? "Sletter..." : "Slet samtale"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Property info - separate row on mobile for more space */}
        {conversation.property && (
          <button
            onClick={() => navigate(`/property/${conversation.property!.id}`)}
            className="flex items-center gap-1.5 px-3 md:px-6 pb-2 text-[10px] md:text-xs text-primary hover:text-primary/80 transition-colors group w-full"
          >
            <div className="w-4 h-4 rounded bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
              <Home className="w-2.5 h-2.5" />
            </div>
            <span className="truncate font-medium">{conversation.property.title}</span>
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-3"
      >
        {messages.map((message, index) => {
          const isOwn = message.sender_id === currentUserId;
          const showAvatar = index === 0 || messages[index - 1]?.sender_id !== message.sender_id;
          const isLastOwnMessage = isOwn && (index === messages.length - 1 || messages[index + 1]?.sender_id !== currentUserId);
          
          return (
            <div
              key={message.id}
              className={`flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"}`}
            >
              {/* Other user avatar */}
              {!isOwn && showAvatar && (
                <div className="flex-shrink-0 mb-1">
                  {conversation.otherUser.avatar_url ? (
                    <img
                      src={conversation.otherUser.avatar_url}
                      alt={`Profilbillede af ${conversation.otherUser.name || 'bruger'}`}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center" aria-label={`${conversation.otherUser.name || 'Bruger'} har intet profilbillede`}>
                      <User className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                    </div>
                  )}
                </div>
              )}
              {!isOwn && !showAvatar && <div className="w-7" />}
              
              <div className={`max-w-[75%] group ${isOwn ? "items-end" : "items-start"}`}>
                {message.property_card_id ? (
                  <PropertyCardBubble
                    propertyId={message.property_card_id}
                    isOwn={isOwn}
                    onOpen={() => navigate(`/property/${message.property_card_id}`)}
                  />
                ) : (
                <MessageBubble
                  isOwn={isOwn}
                  content={message.content}
                  imageUrl={message.image_url}
                  onImageClick={message.image_url ? () => window.open(message.image_url || "", "_blank") : undefined}
                  onCopy={() => {
                    navigator.clipboard.writeText(message.content);
                    toast.success("Besked kopieret");
                  }}
                  onReport={!isOwn ? () => {
                    setReportingMessageId(message.id);
                  } : undefined}
                />
                )}
                <div className={`flex items-center gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}>
                  <span className={`text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity`}>
                    {formatMessageTime(message.created_at)}
                  </span>
                  {/* Read receipts for own messages */}
                  {isOwn && isLastOwnMessage && (
                    <span className="text-muted-foreground/70">
                      {message.read_at ? (
                        <CheckCheck className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Typing indicator */}
        {isTyping && <TypingIndicator />}
      </div>

      {/* Rating Prompt Modal */}
      {showRatingPrompt && conversation?.property_id && (
        <RatingPrompt
          propertyId={ratableProperty?.propertyId || conversation.property_id}
          propertyTitle={ratableProperty?.propertyTitle || "denne bolig"}
          matchRequestId={ratableProperty?.matchRequestId}
          onClose={() => {
            setShowRatingPrompt(false);
            setManualRatingTriggered(false);
          }}
          onRated={() => {
            if (ratableProperty) markAsRated();
            setShowRatingPrompt(false);
            setManualRatingTriggered(false);
          }}
          isManual={manualRatingTriggered}
        />
      )}

      {/* Group member selection modal for contracts */}
      <Dialog open={showContractMemberSelect} onOpenChange={setShowContractMemberSelect}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UsersRound className="w-5 h-5 text-primary" />
              Vælg lejer til kontrakt
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Husordener oprettes individuelt. Vælg hvilken person fra gruppen du vil lave husorden med:
            </p>
            {loadingMembers ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-muted" />
                    <div className="h-4 w-24 bg-muted rounded" />
                  </div>
                ))}
              </div>
            ) : groupMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Ingen medlemmer fundet
              </p>
            ) : (
              <div className="space-y-2">
                {groupMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => handleSelectMemberForContract(member.id)}
                    className="w-full flex items-center gap-3 p-3 bg-muted/30 hover:bg-primary/10 rounded-lg transition-colors text-left group"
                  >
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt={member.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-border group-hover:ring-primary/50"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center ring-2 ring-border group-hover:ring-primary/50">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {member.name}
                      </span>
                    </div>
                    <FileSignature className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <SharePropertyModal
        open={showShareProperty}
        onClose={() => setShowShareProperty(false)}
        onPick={handleSendPropertyCard}
      />

      {/* Icebreaker quick replies — only on a fresh conversation */}
      {messages.length === 0 && !sending && (
        <div className="px-4 md:px-6 pb-2 flex flex-wrap gap-2 flex-shrink-0">
          {(conversation.property
            ? [
                t("chat.icebreakers.stillAvailable"),
                t("chat.icebreakers.canIVisit"),
                t("chat.icebreakers.utilitiesIncluded"),
              ]
            : [
                t("chat.icebreakers.hiNice"),
                t("chat.icebreakers.lookingTogether"),
                t("chat.icebreakers.whichArea"),
              ]
          ).map((text) => (
            <button
              key={text}
              onClick={() => setNewMessage(text)}
              className="px-3 py-1.5 rounded-full bg-muted/60 hover:bg-muted text-xs text-foreground/80 hover:text-foreground transition-colors border border-border/40"
            >
              {text}
            </button>
          ))}
        </div>
      )}

      <div className="px-4 pt-4 pb-[calc(1rem+var(--safe-bottom))] md:px-6 bg-background/80 backdrop-blur-lg border-t flex-shrink-0">
        <div className="flex items-center gap-2 md:gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleSendImage(f);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={sending}
            onClick={() => fileInputRef.current?.click()}
            aria-label={t("chat.sendImage")}
            className="flex-shrink-0 h-11 w-11 md:h-12 md:w-12 rounded-full text-muted-foreground hover:text-foreground"
          >
            <ImageIcon className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={sending}
            onClick={() => setShowShareProperty(true)}
            aria-label={t("chat.shareProperty.title")}
            className="flex-shrink-0 h-11 w-11 md:h-12 md:w-12 rounded-full text-muted-foreground hover:text-foreground inline-flex"
          >
            <Home className="h-5 w-5" />
          </Button>
          <Input
            placeholder={t("chat.inputPlaceholder")}
            value={newMessage}
            onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-muted/40 border-0 rounded-full h-11 md:h-12 px-5 text-sm focus:bg-muted/60 transition-colors"
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            size="icon"
            className="flex-shrink-0 h-11 w-11 md:h-12 md:w-12 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
