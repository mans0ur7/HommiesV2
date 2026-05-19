export interface Conversation {
  id: string;
  type: "landlord" | "roomie";
  updated_at: string;
  property_id?: string | null;
  group_id?: string | null;
  property?: {
    id: string;
    title: string;
    image?: string;
  } | null;
  groupInfo?: {
    id: string;
    name: string;
    memberCount: number;
    memberAvatars: (string | null)[];
  } | null;
  otherUser: {
    id: string;
    name: string;
    avatar_url: string | null;
    age: number | null;
    study: string | null;
  };
  lastMessage?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
  unreadCount: number;
}

export interface MatchRequest {
  id: string;
  sender_id: string;
  property_id?: string | null;
  status: string;
  type: "landlord" | "roomie";
  created_at: string;
  sender: {
    id: string;
    name: string;
    avatar_url: string | null;
    age: number | null;
    study: string | null;
  };
}
