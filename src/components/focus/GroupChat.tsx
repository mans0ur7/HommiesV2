import { useState, useEffect, useRef } from "react";
import { HousingGroup } from "@/hooks/useHousingGroups";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender?: {
    name: string;
    avatar_url: string | null;
  };
}

interface GroupChatProps {
  group: HousingGroup;
}

const GroupChat = ({ group }: GroupChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch or create group conversation (and ensure caller is a participant)
  useEffect(() => {
    const fetchConversation = async () => {
      if (!group.id) return;

      const { data, error } = await supabase.functions.invoke("create-conversation", {
        body: { type: "group", group_id: group.id },
      });
      const convId = (data as any)?.conversation?.id as string | undefined;
      if (!error && convId) {
        setConversationId(convId);
      }
      setLoading(false);
    };

    fetchConversation();
  }, [group.id]);

  // Fetch messages when conversation exists
  useEffect(() => {
    const fetchMessages = async () => {
      if (!conversationId) return;

      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (msgs) {
        // Enrich with sender info
        const enrichedMessages = await Promise.all(
          msgs.map(async (msg) => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("name, avatar_url")
              .eq("user_id", msg.sender_id)
              .maybeSingle();
            return { ...msg, sender: profile };
          })
        );
        setMessages(enrichedMessages);

        // We're viewing the chat — mark others' messages read so the unread
        // indicator on the Focus tab clears.
        if (user) {
          await supabase
            .from("messages")
            .update({ read_at: new Date().toISOString() })
            .eq("conversation_id", conversationId)
            .neq("sender_id", user.id)
            .is("read_at", null);
          window.dispatchEvent(new Event("messages-read"));
        }
      }
    };

    fetchMessages();
  }, [conversationId, user]);

  // Subscribe to new messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`group-chat-${conversationId}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          const { data: profile } = await supabase
            .from("profiles")
            .select("name, avatar_url")
            .eq("user_id", newMsg.sender_id)
            .maybeSingle();
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, { ...newMsg, sender: profile }];
          });
          // Chat is open — immediately mark an incoming message read.
          if (user && newMsg.sender_id !== user.id) {
            await supabase
              .from("messages")
              .update({ read_at: new Date().toISOString() })
              .eq("id", newMsg.id);
            window.dispatchEvent(new Event("messages-read"));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || sending) return;

    // If no conversation exists yet, create one
    let convId = conversationId;
    if (!convId) {
      const { data, error: convError } = await supabase.functions.invoke("create-conversation", {
        body: {
          type: "group",
          group_id: group.id,
        },
      });

      const createdId = (data as any)?.conversation?.id as string | undefined;
      if (convError || !createdId) {
        console.error("Error creating conversation:", convError || data);
        return;
      }

      convId = createdId;
      setConversationId(createdId);
    }

    setSending(true);
    const { error } = await supabase.from("messages").insert({
      conversation_id: convId,
      sender_id: user.id,
      content: newMessage.trim(),
    });

    if (!error) {
      setNewMessage("");
    }
    setSending(false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="h-[500px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px] bg-background rounded-2xl border border-border/60">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
            <p className="font-medium mb-1">Ingen beskeder endnu</p>
            <p className="text-xs">Start en samtale med din gruppe!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                    isOwn
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-background border border-border/50 text-foreground rounded-bl-md"
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[11px] text-foreground/50 mt-1 px-1">
                  {!isOwn && msg.sender?.name && `${msg.sender.name} • `}
                  {formatTime(msg.created_at)}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-3 border-t border-border/60">
        <div className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Skriv din besked her..."
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            disabled={sending}
            className="rounded-full border-border/60 h-11 focus-visible:ring-1 focus-visible:ring-foreground/20"
          />
          <Button
            onClick={handleSend}
            disabled={sending || !newMessage.trim()}
            size="icon"
            className="rounded-full h-11 w-11 flex-shrink-0 bg-foreground text-background hover:bg-foreground/90"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GroupChat;
