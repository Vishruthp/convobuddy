import { Message } from "./apiservice";

export type BackendProvider = "ollama" | "lm-studio" | "llama-cpp" | "openai-generic";

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  provider: BackendProvider;
  createdAt: number;
  updatedAt: number;
}

export const getBackendProvider = (): BackendProvider => {
  if (typeof window === "undefined") return "ollama";
  return (localStorage.getItem("backendProvider") as BackendProvider) || "ollama";
};

export const getBackendUrl = (): string => {
  if (typeof window === "undefined") return "http://127.0.0.1:11434";

  const provider = getBackendProvider();
  const host = (localStorage.getItem("ollamaUrl") || "http://127.0.0.1").trim();
  
  let defaultPort = "11434";
  if (provider === "lm-studio") defaultPort = "1234";
  if (provider === "llama-cpp") defaultPort = "8080";

  const port = (localStorage.getItem("ollamaPort") || defaultPort).trim();

  const normalizedHost = host.replace(/:\d+$/, "");
  const finalHost = normalizedHost.startsWith("http")
    ? normalizedHost
    : `http://${normalizedHost}`;

  return `${finalHost}:${port}`;
};

const CHATS_KEY = "convobuddy_chats";
const ACTIVE_CHAT_KEY = "convobuddy_active_chat";
const LAST_MODEL_KEY = "convobuddy_last_model";

export const getLastUsedModel = (): string => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(LAST_MODEL_KEY) || "";
};

export const setLastUsedModel = (model: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_MODEL_KEY, model);
};

export const getChats = (): ChatSession[] => {
  if (typeof window === "undefined") return [];
  const chats = localStorage.getItem(CHATS_KEY);
  return chats ? JSON.parse(chats) : [];
};

export const saveChat = (chat: ChatSession) => {
  if (typeof window === "undefined") return;
  const chats = getChats();
  const index = chats.findIndex((c) => c.id === chat.id);
  if (index > -1) {
    chats[index] = { ...chat, updatedAt: Date.now() };
  } else {
    chats.unshift({ ...chat, createdAt: Date.now(), updatedAt: Date.now() });
  }
  localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
};

export const getChatById = (id: string): ChatSession | undefined => {
  return getChats().find((c) => c.id === id);
};

export const deleteChat = (id: string) => {
  if (typeof window === "undefined") return;
  const chats = getChats().filter((c) => c.id !== id);
  localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
  if (getActiveChatId() === id) {
    setActiveChatId(null);
  }
};

export const getActiveChatId = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_CHAT_KEY);
};

export const setActiveChatId = (id: string | null) => {
  if (typeof window === "undefined") return;
  if (id) localStorage.setItem(ACTIVE_CHAT_KEY, id);
  else localStorage.removeItem(ACTIVE_CHAT_KEY);
};
