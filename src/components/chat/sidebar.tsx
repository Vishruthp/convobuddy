"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Trash2, PanelLeftClose, PanelLeft, Search, X } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = React.useState("");

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

  const filteredChats = chats.filter(chat => 
    (chat.title || "Untitled Chat").toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <div className="p-4 flex flex-col gap-4 border-b shrink-0">
        <div className="flex items-center justify-between">
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

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background border rounded-md py-2 pl-9 pr-8 text-xs focus-visible:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground p-0.5"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 mt-2">
        {chats.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground opacity-50">
            No chats yet.
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground opacity-50">
            No matches for "{searchQuery}"
          </div>
        ) : (
          filteredChats.map((chat) => (
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
