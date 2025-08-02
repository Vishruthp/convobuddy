import axios from "axios";
import { ollamaUrl } from "./localstoragehelper";

export const GenerateAIResponse = async (messages: any, model: string) => {
  return axios.post("http://localhost:11434/api/chat", {
    model: model,
    messages: messages,
    stream: false,
  });
};

export const GetModels = async () => {
  return axios.get(ollamaUrl() + "/api/tags");
};

export const AskAIAction = async (
  newQuestions: string[],
  responses: string[]
) => {
  try {
    const messages = [];

    for (let i = 0; i < newQuestions.length; i++) {
      messages.push({ role: "user", content: newQuestions[i] });
      if (responses.length > i) {
        messages.push({ role: "assistant", content: responses[i] });
      }
    }
    return messages;
  } catch (error) {
    console.error("Error in AskAIAction:", error);
  }
};
