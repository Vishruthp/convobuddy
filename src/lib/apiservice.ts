import axios from "axios";
import { getBackendProviderType, getBackendUrl } from "./localstoragehelper";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  images?: string[]; // Base64 strings (without prefix)
}

export const GenerateAIResponse = async (
  messages: Message[],
  model: string,
  options?: { temperature?: number; contextLength?: number }
): Promise<{ id?: string; model?: string; content: string; raw: any }> => {
  try {
    const baseUrl = getBackendUrl();
    const provider = getBackendProviderType();
    
    const endpoint = provider === "ollama" ? "/v1/chat/completions" : "/v1/chat/completions";
    
    // Convert to multimodal format if images are present
    const formattedMessages = messages.map(m => {
      if (m.images && m.images.length > 0) {
        return {
          role: m.role,
          content: [
            { type: "text", text: m.content },
            ...m.images.map(img => ({
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${img}` }
            }))
          ]
        };
      }
      return m;
    });

    const body: any = {
      model,
      messages: formattedMessages,
      stream: false,
    };

    if (options) {
      if (options.temperature !== undefined) body.temperature = options.temperature;
      if (options.contextLength !== undefined) {
        // For OpenAI /v1, max_tokens is the closest relative for completion length, 
        // but num_ctx is specific to model loading/server in some cases.
        // We'll pass it as max_tokens for OpenAI compatible
        body.max_tokens = options.contextLength;
      }
    }

    const resp = await axios.post(`${baseUrl}${endpoint}`, body);

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
  options?: { temperature?: number; contextLength?: number },
  signal?: AbortSignal
): Promise<void> => {
  const baseUrl = getBackendUrl();
  const provider = getBackendProviderType();
  
  const endpoint = provider === "ollama" ? "/api/chat" : "/v1/chat/completions";
  
  let body: any;
  if (provider === "ollama" && endpoint === "/api/chat") {
    body = { 
      model, 
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        images: m.images
      })), 
      stream: true 
    };
    if (options) {
      body.options = {
        temperature: options.temperature,
        num_ctx: options.contextLength
      };
    }
  } else {
    // OpenAI compatible /v1/chat/completions
    const formattedMessages = messages.map(m => {
      if (m.images && m.images.length > 0) {
        return {
          role: m.role,
          content: [
            { type: "text", text: m.content },
            ...m.images.map(img => ({
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${img}` }
            }))
          ]
        };
      }
      return m;
    });
    body = { model, messages: formattedMessages, stream: true };
    if (options) {
      if (options.temperature !== undefined) body.temperature = options.temperature;
      if (options.contextLength !== undefined) body.max_tokens = options.contextLength;
    }
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || errorData.message || response.statusText || "Failed to get response";
    throw new Error(errorMessage);
  }

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
          const json = JSON.parse(trimmedLine);
          if (json.message?.content) {
            onChunk(json.message.content);
          }
        } else {
          if (trimmedLine.startsWith("data: ")) {
            const dataStr = trimmedLine.slice(6);
            if (dataStr === "[DONE]") break;
            const json = JSON.parse(dataStr);
            const content = json.choices?.[0]?.delta?.content || "";
            if (content) onChunk(content);
          }
        }
      } catch (e) {
        console.warn("Possible partial chunk or parse error:", e, trimmedLine);
      }
    }
  }
};

export const GenerateImage = async (prompt: string, model: string): Promise<string> => {
  const baseUrl = getBackendUrl();
  const provider = getBackendProviderType();
  
  // standard OpenAI-compatible image endpoint
  const endpoint = "/v1/images/generations";
  
  const resp = await axios.post(`${baseUrl}${endpoint}`, {
    model,
    prompt,
    n: 1,
    size: "1024x1024",
    response_format: "b64_json"
  });

  const data = resp.data.data[0];
  return data.b64_json || data.url;
};

export const GetModels = async (testUrl?: string, testProvider?: string) => {
  const baseUrl = testUrl || getBackendUrl();
  const provider = testProvider || getBackendProviderType();
  
  const endpoint = provider === "ollama" ? "/api/tags" : "/v1/models";
  return axios.get(`${baseUrl}${endpoint}`);
};

export const PrepareMessages = (
  questions: string[],
  responses: string[],
  images?: string[][]
): Message[] => {
  const messages: Message[] = [];
  for (let i = 0; i < questions.length; i++) {
    messages.push({ 
      role: "user", 
      content: questions[i],
      images: images?.[i]
    });
    if (responses[i]) {
      messages.push({ role: "assistant", content: responses[i] });
    }
  }
  return messages;
};
