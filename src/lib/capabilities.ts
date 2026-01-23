export const VISION_KEYWORDS = ["vision", "vl", "multimodal", "llava", "qwen2-vl", "pixtral"];

export const isVisionModel = (modelName: string) => {
  if (!modelName) return false;
  const name = modelName.toLowerCase();
  return VISION_KEYWORDS.some(kw => name.includes(kw));
};

export const isGenerationSupported = (provider: string) => {
  // As per user research, LM Studio does not support image generation
  return provider !== "lm-studio";
};
