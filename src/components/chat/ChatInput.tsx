"use client";

import React, { useRef } from "react";
import { Image as ImageIcon, X, ArrowUpIcon, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  selectedImages: string[];
  isVisionModel: boolean;
  isStreaming: boolean;
  isModelSelected: boolean;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeImage: (index: number) => void;
  handleSubmit: () => void;
  handleStopGeneration: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleInput: () => void;
}

export function ChatInput({
  inputText,
  setInputText,
  selectedImages,
  isVisionModel,
  isStreaming,
  isModelSelected,
  onImageUpload,
  removeImage,
  handleSubmit,
  handleStopGeneration,
  handleKeyDown,
  handleInput,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Expose textareaRef if needed or handle resizing locally
  React.useEffect(() => {
    if (inputText === "" && textareaRef.current) {
        textareaRef.current.style.height = "auto";
    }
  }, [inputText]);

  return (
    <div className="max-w-3xl mx-auto space-y-2">
      {selectedImages.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-lg animate-in slide-in-from-bottom-2 duration-300">
          {selectedImages.map((img, idx) => (
            <div key={idx} className="relative group">
              <img 
                src={`data:image/jpeg;base64,${img}`} 
                className="size-16 rounded-md object-cover border"
                alt="Preview"
              />
              <button 
                onClick={() => removeImage(idx)}
                className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full size-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className={cn(
        "relative flex items-end gap-2 border rounded-xl p-2 focus-within:ring-1 focus-within:ring-ring bg-background",
        (!isModelSelected || isStreaming) && "opacity-50 pointer-events-none"
      )}>
        <input 
          type="file" 
          multiple 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef}
          onChange={onImageUpload}
        />
        
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="shrink-0 flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-lg text-muted-foreground hover:text-primary transition-colors",
                  !isVisionModel && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => {
                  if (isVisionModel) {
                    fileInputRef.current?.click();
                  }
                }}
                disabled={isStreaming || !isModelSelected}
              >
                <ImageIcon className="size-5" />
              </Button>
            </div>
          </TooltipTrigger>
          {!isVisionModel && isModelSelected && (
            <TooltipContent side="top">
              <p className="text-xs">Model does not support images</p>
            </TooltipContent>
          )}
        </Tooltip>

        <Textarea
          ref={textareaRef}
          placeholder={
            isModelSelected 
              ? isVisionModel 
                ? "Type a message or /image to generate..." 
                : "Type a message... (Image support not detected)"
              : "Select a model first"
          }
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
            disabled={!inputText.trim() && selectedImages.length === 0 || isStreaming || !isModelSelected}
          >
            <ArrowUpIcon className="size-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
