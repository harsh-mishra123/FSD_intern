import Sidebar from "../components/Sidebar";
import { useEffect, useMemo, useState } from "react";
import { Send, MessageSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "../context/AuthContext";
import { createAnnouncement, fetchAllUsers, fetchAnnouncements } from "../services/announcementService";
import { connectSocket, onAnnouncement } from "../services/socketService";

export default function Dashboard() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState("all");
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const { user: currentUser } = useAuth();

  const isAdmin = currentUser?.role === "admin";

  const recipientOptions = useMemo(() => {
    return users
      .filter((candidate) => candidate._id !== currentUser?.id)
      .map((candidate) => ({
        id: candidate._id,
        label: `${candidate.name} (${candidate.role})`,
      }));
  }, [currentUser?.id, users]);

  useEffect(() => {
    const loadInitialData = async () => {
      if (!currentUser?.token) {
        return;
      }

      try {
        setIsLoading(true);
        setError("");

        const [announcementList, allUsers] = await Promise.all([
          fetchAnnouncements(currentUser.token),
          isAdmin ? fetchAllUsers(currentUser.token) : Promise.resolve([]),
        ]);

        setMessages(announcementList);
        setUsers(allUsers);
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Could not load announcements");
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [currentUser?.token, isAdmin]);

  useEffect(() => {
    if (currentUser?.token) {
      connectSocket(currentUser.token);

      const handleNewAnnouncement = (incomingMessage) => {
        setMessages((prevMessages) => {
          if (prevMessages.some((msg) => msg._id === incomingMessage._id)) {
            return prevMessages;
          }
          return [...prevMessages, incomingMessage];
        });
      };

      const unsubscribe = onAnnouncement(handleNewAnnouncement);

      return () => {
        unsubscribe();
      };
    }
  }, [currentUser?.token]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser?.token || !isAdmin) {
      return;
    }

    try {
      setIsSending(true);

      let payload;
      if (selectedRecipient === 'all' || selectedRecipient === 'users' || selectedRecipient === 'admins') {
        payload = {
          token: currentUser.token,
          content: newMessage,
          target: selectedRecipient,
        };
      } else {
        payload = {
          token: currentUser.token,
          content: newMessage,
          recipientId: selectedRecipient,
        };
      }

      await createAnnouncement(payload);

      // The socket listener handles adding the message (with deduplication)
      setNewMessage('');
      setSelectedRecipient('all');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not send announcement');
    } finally {
      setIsSending(false);
    }
  };

  const formatDateTime = (value) => {
    return new Date(value).toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isOwnAnnouncement = (announcement) => {
    return String(announcement.sender) === currentUser?.id;
  };

  return (
    <Sidebar>
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Welcome back, {currentUser?.name}. Here's what's happening.</p>
        </div>

        <Card className="flex flex-col h-150 shadow-lg overflow-hidden border-indigo-100/50">
          <CardHeader className="border-b bg-gradient-to-r from-indigo-50/80 to-purple-50/80 pb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              <CardTitle className="text-lg text-slate-800">Real-time Announcements</CardTitle>
            </div>
            <CardDescription>
              {isAdmin
                ? "Broadcast to everyone or target a specific user/admin."
                : "Live announcements from admins with full announcement history."}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50/50">
            {isLoading && <p className="text-sm text-muted-foreground">Loading announcements...</p>}
            {error && !isLoading && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}
            {!isLoading && messages.length === 0 && (
              <p className="text-sm text-muted-foreground">No announcements yet.</p>
            )}

            {messages.map((msg) => {
              const isCurrentUser = isOwnAnnouncement(msg);
              const isDirect = msg.announcementType === "direct";
              return (
                <div key={msg._id} className={`flex items-start gap-4 ${isCurrentUser ? "flex-row-reverse" : ""}`}>
                  <Avatar className="w-10 h-10 border-0 shadow-sm">
                    <AvatarFallback className={isCurrentUser ? "bg-indigo-600 text-white font-medium" : "bg-white text-purple-700 font-medium border border-purple-100"}>
                      {msg.senderName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"} max-w-[70%]`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{msg.senderName}</span>
                      <span className="text-xs text-muted-foreground">{formatDateTime(msg.createdAt)}</span>
                      {isDirect && (
                        <span className="text-[11px] uppercase tracking-wide rounded bg-amber-100 text-amber-700 px-2 py-0.5">
                          Private
                        </span>
                      )}
                    </div>
                    <div className={`px-4 py-3 rounded-2xl ${isCurrentUser ? "bg-indigo-600 text-white shadow hover:bg-indigo-700 transition-colors rounded-tr-sm" : "bg-white border border-purple-100/50 text-slate-800 shadow-sm rounded-tl-sm"}`}>
                      <p className="whitespace-pre-wrap wrap-break-word">{msg.content}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>

          <div className="p-4 border-t bg-white">
            <form onSubmit={handleSendMessage} className="flex space-x-3">
              {isAdmin && (
                <select
                  value={selectedRecipient}
                  onChange={(e) => setSelectedRecipient(e.target.value)}
                  className="h-10 min-w-44 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="all">All Users & Admins</option>
                  <option value="users">All Users</option>
                  <option value="admins">All Admins</option>
                  {recipientOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
              <Input
                type="text"
                placeholder={isAdmin ? "Type an announcement..." : "Only admins can send announcements"}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 bg-slate-50 border-slate-200 focus:border-indigo-300 focus:ring-indigo-200"
                disabled={!isAdmin || isSending}
              />
              <Button type="submit" size="default" className="shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white" disabled={!isAdmin || isSending}>
                <Send className="w-4 h-4 mr-2" />
                {isSending ? "Sending..." : "Send"}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </Sidebar>
  );
}
