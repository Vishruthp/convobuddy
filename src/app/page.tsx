"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GenerateImage,
  StreamAIResponse,
  GetModels,
  Message,
} from "@/lib/apiservice";
import {
  getBackendProviderType,
  getActiveProvider,
  saveChat,
  getChats,
  ChatSession,
  getActiveChatId,
  setActiveChatId,
  getLastUsedModel,
  setLastUsedModel,
  Provider,
  getProviders,
  saveProvider,
  setActiveProviderId,
} from "@/lib/localstoragehelper";
import { Sidebar } from "@/components/chat/sidebar";
import { v4 as uuidv4 } from "uuid";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { isVisionModel, isGenerationSupported } from "@/lib/capabilities";
import { ProviderForm } from "@/components/ProviderForm";
import { Sparkles } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // App Shell State
  const [isClient, setIsClient] = useState(false);
  const [hasProviders, setHasProviders] = useState<boolean | null>(null);

  // Chat State
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [model, setModel] = useState("");
  const [modelsList, setModelsList] = useState<string[]>([]);
  const [isModelSelected, setIsModelSelected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeProvider, setActiveProvider] = useState<Provider | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [temperature, setTemperature] = useState(0.7);
  const [contextLength, setContextLength] = useState(4096);
  const [showParams, setShowParams] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollTo({
      top: messagesEndRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  const fetchModels = async () => {
    setIsLoadingModels(true);
    setFetchError(null);
    try {
      const resp: any = await GetModels();
      const models = resp.data.data || resp.data.models || [];
      const names = models.map(
        (item: any) => item.id || item.name || item.model,
      );
      setModelsList(names);
    } catch (err: any) {
      console.error("Failed to fetch models", err);
      setFetchError(err.message || "Failed to connect to backend");
    } finally {
      setIsLoadingModels(false);
    }
  };

  useEffect(() => {
    setIsClient(true);
    const providers = getProviders();
    const exists = providers.length > 0;
    setHasProviders(exists);

    if (exists) {
      initChat();
    }
  }, []);

  const initChat = () => {
    const providerObj = getActiveProvider();
    setActiveProvider(providerObj);
    fetchModels();

    const lastId = getActiveChatId();
    if (lastId) {
      loadChat(lastId);
    } else {
      const lastModel = getLastUsedModel();
      if (lastModel) {
        setModel(lastModel);
        setIsModelSelected(true);
      }
    }
  };

  const loadChat = (id: string) => {
    const allChats = getChats();
    const chat = allChats.find((c) => c.id === id);
    if (chat) {
      setCurrentChatId(id);
      setMessages(chat.messages);
      setModel(chat.model);
      setTemperature(chat.temperature ?? 0.7);
      setContextLength(chat.contextLength ?? 4096);
      setIsModelSelected(true);
      setActiveChatId(id);
    }
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setTemperature(0.7);
    setContextLength(4096);
    setActiveChatId(null);
  };

  const handleSelectChat = (id: string) => {
    loadChat(id);
  };

  const onImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(",")[1];
        setSelectedImages((prev) => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
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

    if (inputText.trim().startsWith("/image")) {
      await handleImageGeneration();
      return;
    }

    abortControllerRef.current = new AbortController();
    const userMessage: Message = {
      role: "user",
      content: inputText,
      images: selectedImages.length > 0 ? selectedImages : undefined,
    };
    const newMessages = [...messages, userMessage];

    setMessages(newMessages);
    setInputText("");
    setSelectedImages([]);
    setIsStreaming(true);

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
        provider: activeProvider?.id || "default",
        temperature,
        contextLength,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      saveChat(newChat);
    }

    try {
      let currentResponse = "";
      const updatedMessagesWithPlaceholder = [
        ...newMessages,
        { role: "assistant", content: "" } as Message,
      ];
      setMessages(updatedMessagesWithPlaceholder);

      await StreamAIResponse(
        newMessages,
        model,
        (chunk) => {
          currentResponse += chunk;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: currentResponse,
            };

            if (chatId) {
              const allChats = getChats();
              const existingChat = allChats.find((c) => c.id === chatId);
              if (existingChat) {
                saveChat({
                  ...existingChat,
                  messages: updated,
                  temperature,
                  contextLength,
                  updatedAt: Date.now(),
                });
              }
            }

            return updated;
          });
        },
        { temperature, contextLength },
        abortControllerRef.current.signal,
      );
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Generation stopped by user");
      } else {
        console.error("Streaming error:", error);
        let errorMsg =
          "Failed to get response. Please check your backend connection.";

        if (error.message?.includes("support images")) {
          errorMsg =
            "**Error:** The selected model does not support images. Please switch to a vision-capable model (like `llava`).";
        } else if (error.message) {
          errorMsg = `**Error:** ${error.message}`;
        }

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: errorMsg },
        ]);
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleImageGeneration = async () => {
    const prompt = inputText.replace("/image", "").trim();
    if (!prompt) return;

    if (!isGenerationSupported(activeProvider?.type || "")) {
      const assistantMessage: Message = {
        role: "assistant",
        content: `**Information:** Image generation is not supported on **${activeProvider?.name || "this provider"}**. \n\nLM Studio and most local LLM servers are primarily for Text-to-Text and Vision-to-Text tasks. For image generation, you would typically need a dedicated Stable Diffusion server or a cloud API like DALL-E.`,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setInputText("");
      return;
    }

    const userMessage: Message = { role: "user", content: inputText };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsStreaming(true);

    try {
      const b64 = await GenerateImage(prompt, model);
      const assistantMessage: Message = {
        role: "assistant",
        content: `![Generated Image](data:image/png;base64,${b64})`,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      let chatId = currentChatId;
      if (!chatId) {
        chatId = uuidv4();
        setCurrentChatId(chatId);
        setActiveChatId(chatId);
        const newChat: ChatSession = {
          id: chatId,
          title: `Generated: ${prompt.slice(0, 20)}...`,
          messages: [...messages, userMessage, assistantMessage],
          model,
          provider: activeProvider?.id || "default",
          temperature,
          contextLength,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        saveChat(newChat);
      } else {
        const allChats = getChats();
        const existingChat = allChats.find((c) => c.id === chatId);
        if (existingChat) {
          saveChat({
            ...existingChat,
            messages: [...messages, userMessage, assistantMessage],
            temperature,
            contextLength,
            updatedAt: Date.now(),
          });
        }
      }
    } catch (error) {
      console.error("Image generation error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "**Error:** Failed to generate image." },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCreateProvider = (data: {
    name: string;
    url: string;
    type: any;
  }) => {
    const newProvider: Provider = {
      id: uuidv4(),
      ...data,
    };
    saveProvider(newProvider);
    setActiveProviderId(newProvider.id);

    // Trigger State Switch
    setHasProviders(true);
    initChat();
  };

  if (!isClient || hasProviders === null) return null;

  if (!hasProviders) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-background font-[family-name:var(--font-geist-sans)]">
        <main className="max-w-xl w-full space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-6xl font-extrabold tracking-tight">
              Convo Buddy
            </h2>
            <p className="text-muted-foreground text-xl text-pretty max-w-sm mx-auto font-medium">
              Local LLM experience, simplified.
            </p>
          </div>

          <div className="bg-card border-2 rounded-3xl p-8 shadow-2xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">Setup your backend</h2>
            </div>

            <ProviderForm
              onSubmit={handleCreateProvider}
              submitLabel="Start Chatting"
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          currentChatId={currentChatId}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <ChatHeader
            providerName={activeProvider?.name || "Select Provider"}
            model={model}
            modelsList={modelsList}
            isLoadingModels={isLoadingModels}
            fetchError={fetchError}
            temperature={temperature}
            contextLength={contextLength}
            showParams={showParams}
            isModelSelected={isModelSelected}
            onModelChange={(value) => {
              setModel(value);
              setIsModelSelected(true);
              setLastUsedModel(value);
            }}
            onFetchModels={fetchModels}
            onToggleParams={setShowParams}
            onSetTemperature={setTemperature}
            onSetContextLength={setContextLength}
            isVisionModel={isVisionModel}
          />

          <main
            ref={messagesEndRef}
            className="flex-1 overflow-y-auto p-4 space-y-6"
          >
            <MessageList
              messages={messages}
              isStreaming={isStreaming}
              isModelSelected={isModelSelected}
              providerLabel={activeProvider?.name || "AI"}
            />
          </main>

          <footer className="border-t p-4 pb-8 bg-background/80 backdrop-blur-sm">
            <ChatInput
              inputText={inputText}
              setInputText={setInputText}
              selectedImages={selectedImages}
              isVisionModel={isVisionModel(model)}
              isStreaming={isStreaming}
              isModelSelected={isModelSelected}
              onImageUpload={onImageUpload}
              removeImage={removeImage}
              handleSubmit={handleSubmit}
              handleStopGeneration={handleStopGeneration}
              handleKeyDown={handleKeyDown}
              handleInput={() => {}}
            />
          </footer>
        </div>
      </div>
    </TooltipProvider>
  );
}
