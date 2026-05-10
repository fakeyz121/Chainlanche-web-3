import { useState, useEffect, useRef } from "react";
import { useListConversations, useListMessages, useSendMessage, useCreateConversation } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageSquare, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function MessagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [newRecipientId, setNewRecipientId] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations, refetch: refetchConvs } = useListConversations();
  const { data: messages, refetch: refetchMessages } = useListMessages(
    activeConvId!,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { query: { enabled: !!activeConvId, refetchInterval: 5000 } as any }
  );

  const sendMessage = useSendMessage({
    mutation: {
      onSuccess: () => {
        setNewMessage("");
        refetchMessages();
      },
    },
  });

  const createConversation = useCreateConversation({
    mutation: {
      onSuccess: (conv) => {
        setNewRecipientId("");
        refetchConvs();
        setActiveConvId(conv.id);
      },
      onError: () => {
        toast({ title: "Could not create conversation", variant: "destructive" });
      },
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeConv = conversations?.find((c) => c.id === activeConvId);
  const otherUserId = activeConv
    ? activeConv.participantIds.find((id) => id !== user?.id) ?? null
    : null;
  const otherParticipant = activeConv?.participants?.find((p) => p.id !== user?.id);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConvId) return;
    sendMessage.mutate({ id: activeConvId, data: { content: newMessage } });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Messages</h1>
        <p className="text-muted-foreground text-sm mt-1">Communicate with clients and freelancers.</p>
      </div>

      <div className="glass-card rounded-xl overflow-hidden flex h-[calc(100vh-220px)] min-h-[500px]">
        {/* Sidebar */}
        <div className="w-72 flex-shrink-0 border-r border-white/5 flex flex-col">
          {/* New Conversation */}
          <div className="p-3 border-b border-white/5">
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="User ID to message..."
                value={newRecipientId}
                onChange={(e) => setNewRecipientId(e.target.value)}
                className="bg-muted/20 border-white/10 text-white text-xs placeholder:text-muted-foreground/50 h-8"
              />
              <Button
                size="sm"
                className="h-8 px-2 bg-purple-600 hover:bg-purple-500 text-white border-0"
                onClick={() => {
                  if (!newRecipientId) return;
                  createConversation.mutate({ data: { participantId: Number(newRecipientId) } });
                }}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {!conversations || conversations.length === 0 ? (
              <div className="p-4 text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-30" />
                <p className="text-xs text-muted-foreground">No conversations yet</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const otherP = conv.participants?.find((p) => p.id !== user?.id);
                const otherId = conv.participantIds.find((id) => id !== user?.id);
                const isActive = conv.id === activeConvId;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className={`w-full p-3 flex items-center gap-3 text-left hover:bg-white/5 transition-colors border-b border-white/3 ${
                      isActive ? "bg-purple-500/10 border-l-2 border-l-purple-500" : ""
                    }`}
                  >
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-sm text-white font-bold flex-shrink-0">
                      {(otherP?.username ?? String(otherId ?? "?"))[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{otherP?.username ?? `User #${otherId}`}</div>
                      <div className="text-xs text-muted-foreground">
                        {conv.lastMessage ? new Date(conv.lastMessage.createdAt).toLocaleDateString() : "No messages"}
                      </div>
                    </div>
                    {(conv.unreadCount ?? 0) > 0 && (
                      <div className="h-5 w-5 rounded-full bg-purple-600 flex items-center justify-center text-xs text-white flex-shrink-0">
                        {conv.unreadCount}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {!activeConvId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-muted-foreground text-sm">Select a conversation to start chatting</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-sm text-white font-bold">
                  {(otherParticipant?.username ?? String(otherUserId ?? "?"))[0]?.toUpperCase()}
                </div>
                <span className="font-medium text-white text-sm">{otherParticipant?.username ?? `User #${otherUserId}`}</span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {!messages || messages.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-muted-foreground text-sm">No messages yet. Say hello!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.senderId === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-xs lg:max-w-sm px-4 py-2 rounded-2xl text-sm ${
                          isOwn
                            ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-br-sm"
                            : "glass-card border-white/5 text-foreground rounded-bl-sm"
                        }`}>
                          <p>{msg.content}</p>
                          <p className={`text-xs mt-1 ${isOwn ? "text-purple-200/60" : "text-muted-foreground"}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-3 border-t border-white/5 flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="bg-muted/20 border-white/10 text-white placeholder:text-muted-foreground/50 flex-1"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-0 px-4"
                  disabled={sendMessage.isPending || !newMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
