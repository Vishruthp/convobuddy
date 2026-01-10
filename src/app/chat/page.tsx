"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StreamAIResponse, GetModels, Message } from "@/lib/apiservice";
import { 
  getBackendProvider, 
  saveChat, 
  getChats, 
  getChatById, 
  ChatSession, 
  getActiveChatId, 
  setActiveChatId 
} from "@/lib/localstoragehelper";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ModeToggle } from "@/components/theme-toggle";
import { ArrowUpIcon, Settings, Server, Square } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { Sidebar } from "@/components/chat/sidebar";
import { v4 as uuidv4 } from "uuid";
import { cn } from "@/lib/utils";

export default function Chat() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [model, setModel] = useState("");
  const [modelsList, setModelsList] = useState<string[]>([]);
  const [isModelSelected, setIsModelSelected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [provider, setProvider] = useState("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollTo({
      top: messagesEndRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  // Initial load
  useEffect(() => {
    const activeProvider = getBackendProvider();
    setProvider(activeProvider);

    GetModels()
      .then((resp: any) => {
        const models = resp.data.data || resp.data.models || [];
        const names = models.map((item: any) => item.id || item.name || item.model);
        setModelsList(names);
      })
      .catch((err) => console.error("Failed to fetch models", err));

    const lastId = getActiveChatId();
    if (lastId) {
      loadChat(lastId);
    }
  }, []);

  const loadChat = (id: string) => {
    const allChats = getChats();
    const chat = allChats.find(c => c.id === id);
    if (chat) {
      setCurrentChatId(id);
      setMessages(chat.messages);
      setModel(chat.model);
      setIsModelSelected(true);
      setActiveChatId(id);
    }
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setIsModelSelected(false);
    setModel("");
    setActiveChatId(null);
  };

  const handleSelectChat = (id: string) => {
    loadChat(id);
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  };

  const handleSubmit = async () => {
    if (!inputText.trim() || isStreaming || !model) return;

    abortControllerRef.current = new AbortController();
    const userMessage: Message = { role: "user", content: inputText };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInputText("");
    setIsStreaming(true);

    // Initial save or update for new chat
    let chatId = currentChatId;
    if (!chatId) {
      chatId = uuidv4();
      setCurrentChatId(chatId);
      setActiveChatId(chatId);
      
      const newChat: ChatSession = {
        id: chatId,
        title: inputText.slice(0, 40) + (inputText.length > 40 ? "..." : ""),
        messages: newMessages,
        model,
        provider: getBackendProvider(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      saveChat(newChat);
    }

    try {
      let currentResponse = "";
      const updatedMessagesWithPlaceholder = [...newMessages, { role: "assistant", content: "" } as Message];
      setMessages(updatedMessagesWithPlaceholder);

      await StreamAIResponse(newMessages, model, (chunk) => {
        currentResponse += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { 
            role: "assistant", 
            content: currentResponse 
          };
          
          // Save incrementally
          if (chatId) {
            const allChats = getChats();
            const existingChat = allChats.find(c => c.id === chatId);
            if (existingChat) {
              saveChat({
                ...existingChat,
                messages: updated,
                updatedAt: Date.now(),
              });
            }
          }
          
          return updated;
        });
      }, abortControllerRef.current.signal);
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Generation stopped by user");
      } else {
        console.error("Streaming error:", error);
        setMessages((prev) => [
          ...prev, 
          { role: "assistant", content: "**Error:** Failed to get response. Please check your backend connection." }
        ]);
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
      // Final save after streaming completes or errors
      if (chatId) {
        const allChats = getChats();
        const existingChat = allChats.find(c => c.id === chatId);
        if (existingChat) {
          saveChat({
            ...existingChat,
            messages: messages, // Use the final messages state
            updatedAt: Date.now(),
          });
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const getProviderLabel = (p: string) => {
    switch (p) {
      case "ollama": return "Ollama";
      case "lm-studio": return "LM Studio";
      case "llama-cpp": return "llama.cpp";
      case "openai-generic": return "OpenAI";
      default: return "Local AI";
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <h1 className="font-bold text-xl hidden sm:block">ConvoBuddy</h1>
              <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20 flex items-center gap-1">
                <Server className="size-3" />
                {getProviderLabel(provider)}
              </span>
            </Link>
            <Select
              value={model}
              onValueChange={(value) => {
                setModel(value);
                setIsModelSelected(true);
              }}
            >
              <SelectTrigger className="w-[180px] sm:w-[240px]">
                <SelectValue placeholder="Select a Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {modelsList.length > 0 ? (
                    modelsList.map((m, i) => (
                      <SelectItem key={i} value={m}>
                        {m}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No models found</SelectItem>
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
            <Button variant="ghost" size="icon" asChild>
              <Link href="/settings">
                <Settings className="size-5" />
              </Link>
            </Button>
          </div>
        </header>

        {/* Chat Area */}
        <main 
          ref={messagesEndRef}
          className="flex-1 overflow-y-auto p-4 space-y-6"
        >
          {messages.length === 0 && !isStreaming ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-70">
              <h2 className="text-2xl font-semibold italic">What can I help you with today?</h2>
              {!isModelSelected && (
                <p className="text-muted-foreground animate-bounce">
                  Please select a model to start chatting
                </p>
              )}
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-8 pb-32">
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2 text-sm md:text-base",
                    msg.role === "user" 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-muted prose prose-sm dark:prose-invert rounded-tl-none border shadow-sm"
                  )}>
                    {msg.role === "user" ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <Markdown remarkPlugins={[remarkGfm]}>
                        {msg.content || (isStreaming && i === messages.length - 1 ? "..." : "")}
                      </Markdown>
                    )}
                  </div>
                </div>
              ))}
              {isStreaming && (
                <div className="h-4 w-full flex justify-center">
                   <div className="animate-pulse text-xs text-muted-foreground">
                     {getProviderLabel(provider)} is thinking...
                   </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Input Area */}
        <div className="border-t p-4 pb-8 bg-background/80 backdrop-blur-sm">
          <div className={cn(
            "max-w-3xl mx-auto relative flex items-end gap-2 border rounded-xl p-2 focus-within:ring-1 focus-within:ring-ring",
            !isModelSelected && "opacity-50 pointer-events-none"
          )}>
            <Textarea
              ref={textareaRef}
              placeholder={isModelSelected ? "Type your message..." : "Select a model first"}
              className="flex-1 min-h-[44px] max-h-[200px] bg-transparent border-none focus-visible:ring-0 shadow-none resize-none pt-2 px-3 transition-all"
              rows={1}
              value={inputText}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onChange={(e) => setInputText(e.target.value)}
              disabled={!isModelSelected || isStreaming}
            />
            {isStreaming ? (
              <Button 
                size="icon" 
                variant="destructive"
                className="rounded-lg shrink-0"
                onClick={handleStopGeneration}
              >
                <Square className="size-5 fill-current" />
              </Button>
            ) : (
              <Button 
                size="icon" 
                className="rounded-lg shrink-0"
                onClick={handleSubmit}
                disabled={!inputText.trim() || isStreaming || !model}
              >
                <ArrowUpIcon className="size-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
