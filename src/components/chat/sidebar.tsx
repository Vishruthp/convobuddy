"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Trash2, PanelLeftClose, PanelLeft } from "lucide-react";
import { ChatSession, getChats, deleteChat } from "@/lib/localstoragehelper";
import { cn } from "@/lib/utils";

interface SidebarProps {
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  className?: string;
}

export function Sidebar({ currentChatId, onSelectChat, onNewChat, className }: SidebarProps) {
  const [chats, setChats] = React.useState<ChatSession[]>([]);
  const [isOpen, setIsOpen] = React.useState(true);

  const refreshChats = React.useCallback(() => {
    setChats(getChats());
  }, []);

  React.useEffect(() => {
    refreshChats();
    // Refresh chats when storage changes (e.g., from another tab or during saves)
    window.addEventListener("storage", refreshChats);
    return () => window.removeEventListener("storage", refreshChats);
  }, [refreshChats, currentChatId]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this chat?")) {
      deleteChat(id);
      refreshChats();
    }
  };

  if (!isOpen) {
    return (
      <div className="flex p-2 items-start justify-center border-r bg-muted/30">
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
          <PanelLeft className="size-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col w-64 border-r bg-muted/30 h-full transition-all duration-300", className)}>
      <div className="p-4 flex items-center justify-between border-b shrink-0">
        <Button 
          onClick={onNewChat} 
          className="flex-1 mr-2 gap-2 h-9 text-xs font-semibold"
          variant="outline"
        >
          <Plus className="size-4" />
          New Chat
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
          <PanelLeftClose className="size-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 mt-2">
        {chats.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground opacity-50">
            No chats yet.
          </div>
        ) : (
          chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left group",
                currentChatId === chat.id 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "hover:bg-muted text-muted-foreground"
              )}
            >
              <MessageSquare className="size-4 shrink-0" />
              <span className="truncate flex-1">{chat.title || "Untitled Chat"}</span>
              <Trash2 
                className="size-4 opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity shrink-0" 
                onClick={(e) => handleDelete(e, chat.id)}
              />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
