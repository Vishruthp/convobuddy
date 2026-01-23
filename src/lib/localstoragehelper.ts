import { Message } from "./apiservice";

export type ProviderType = "ollama" | "lm-studio" | "llama-cpp" | "openai-generic" | "docker-runner";

export interface Provider {
  id: string;
  name: string;
  url: string;
  type: ProviderType;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  provider: string; // This is now the Provider ID
  temperature: number;
  contextLength: number;
  createdAt: number;
  updatedAt: number;
}

const PROVIDERS_KEY = "convobuddy_providers";
const ACTIVE_PROVIDER_ID_KEY = "convobuddy_active_provider_id";

export const getProviders = (): Provider[] => {
  if (typeof window === "undefined") return [];
  
  // Migration logic
  const legacyProvider = localStorage.getItem("backendProvider") as ProviderType;
  const legacyUrl = localStorage.getItem("ollamaUrl");
  const legacyPort = localStorage.getItem("ollamaPort");
  
  const providersJson = localStorage.getItem(PROVIDERS_KEY);
  if (!providersJson && legacyProvider && legacyUrl && legacyPort) {
    // Perform migration
    const initialProvider: Provider = {
      id: "default-1",
      name: "Initial Provider",
      url: `${legacyUrl}:${legacyPort}`,
      type: legacyProvider
    };
    const initialList = [initialProvider];
    localStorage.setItem(PROVIDERS_KEY, JSON.stringify(initialList));
    localStorage.setItem(ACTIVE_PROVIDER_ID_KEY, initialProvider.id);
    
    // Cleanup legacy keys (optional but cleaner)
    return initialList;
  }

  return providersJson ? JSON.parse(providersJson) : [];
};

export const saveProvider = (provider: Provider) => {
  if (typeof window === "undefined") return;
  const providers = getProviders();
  const index = providers.findIndex((p) => p.id === provider.id);
  if (index > -1) {
    providers[index] = provider;
  } else {
    providers.push(provider);
  }
  localStorage.setItem(PROVIDERS_KEY, JSON.stringify(providers));
  
  // If no active provider, set this one
  if (!getActiveProviderId()) {
    setActiveProviderId(provider.id);
  }
};

export const deleteProvider = (id: string) => {
  if (typeof window === "undefined") return;
  const providers = getProviders().filter((p) => p.id !== id);
  localStorage.setItem(PROVIDERS_KEY, JSON.stringify(providers));
  if (getActiveProviderId() === id) {
    const nextProvider = providers[0];
    setActiveProviderId(nextProvider ? nextProvider.id : null);
  }
};

export const getActiveProviderId = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_PROVIDER_ID_KEY);
};

export const setActiveProviderId = (id: string | null) => {
  if (typeof window === "undefined") return;
  if (id) localStorage.setItem(ACTIVE_PROVIDER_ID_KEY, id);
  else localStorage.removeItem(ACTIVE_PROVIDER_ID_KEY);
};

export const getActiveProvider = (): Provider | null => {
  const id = getActiveProviderId();
  if (!id) return null;
  return getProviders().find(p => p.id === id) || null;
};

export const getBackendProviderType = (): ProviderType => {
  const active = getActiveProvider();
  return active ? active.type : "ollama";
};

export const getBackendUrl = (): string => {
  const active = getActiveProvider();
  if (active) return active.url;

  // Fallback for extreme cases (should be handled by migration)
  return "http://127.0.0.1:11434";
};

// Legacy support for older tools/sessions
export const getBackendProvider = (): ProviderType => getBackendProviderType();

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
