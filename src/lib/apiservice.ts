import axios from "axios";
import { getBackendProvider, getBackendUrl } from "./localstoragehelper";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export const GenerateAIResponse = async (
  messages: Message[],
  model: string
): Promise<{ id?: string; model?: string; content: string; raw: any }> => {
  try {
    const baseUrl = getBackendUrl();
    const provider = getBackendProvider();
    
    const endpoint = provider === "ollama" ? "/v1/chat/completions" : "/v1/chat/completions";
    
    const resp = await axios.post(`${baseUrl}${endpoint}`, {
      model,
      messages,
      stream: false,
    });

    const data = resp.data;
    let content = "";

    if (Array.isArray(data?.choices) && data.choices.length > 0) {
      const choice = data.choices[0];
      if (choice?.message?.content) content = choice.message.content;
      else if (choice?.text) content = choice.text;
    }

    if (!content) content = data?.message || data?.text || "";

    return { id: data?.id, model: data?.model || model, content, raw: data };
  } catch (error) {
    console.error("GenerateAIResponse error:", error);
    throw error;
  }
};

export const StreamAIResponse = async (
  messages: Message[],
  model: string,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal
): Promise<void> => {
  const baseUrl = getBackendUrl();
  const provider = getBackendProvider();
  
  // Ollama handles /api/chat natively slightly differently, but most local ones support /v1/chat/completions
  // If use /v1, it follows OpenAI format: data: {"choices": [{"delta": {"content": "..."}}]}
  const endpoint = provider === "ollama" ? "/api/chat" : "/v1/chat/completions";
  
  const body = provider === "ollama" 
    ? { model, messages, stream: true }
    : { model, messages, stream: true };

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.body) throw new Error("No response body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n");

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      try {
        if (provider === "ollama" && endpoint === "/api/chat") {
          // Native Ollama format
          const json = JSON.parse(trimmedLine);
          if (json.message?.content) {
            onChunk(json.message.content);
          }
        } else {
          // OpenAI compatible format (data: {...})
          if (trimmedLine.startsWith("data: ")) {
            const dataStr = trimmedLine.slice(6);
            if (dataStr === "[DONE]") break;
            const json = JSON.parse(dataStr);
            const content = json.choices?.[0]?.delta?.content || "";
            if (content) onChunk(content);
          }
        }
      } catch (e) {
        // Some chunks might be partial JSON due to buffering
        console.warn("Possible partial chunk or parse error:", e, trimmedLine);
      }
    }
  }
};

export const GetModels = async () => {
  const baseUrl = getBackendUrl();
  const provider = getBackendProvider();
  
  // Ollama natively uses /api/tags, others use /v1/models
  const endpoint = provider === "ollama" ? "/api/tags" : "/v1/models";
  return axios.get(`${baseUrl}${endpoint}`);
};

export const PrepareMessages = (
  questions: string[],
  responses: string[]
): Message[] => {
  const messages: Message[] = [];
  for (let i = 0; i < questions.length; i++) {
    messages.push({ role: "user", content: questions[i] });
    if (responses[i]) {
      messages.push({ role: "assistant", content: responses[i] });
    }
  }
  return messages;
};
