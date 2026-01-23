"use client";

import React from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Message } from "@/lib/apiservice";

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
  isModelSelected: boolean;
  providerLabel: string;
}

export function MessageList({
  messages,
  isStreaming,
  isModelSelected,
  providerLabel,
}: MessageListProps) {
  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-70">
        <h2 className="text-2xl font-semibold italic">What can I help you with today?</h2>
        {!isModelSelected && (
          <p className="text-muted-foreground animate-bounce">
            Please select a model to start chatting
          </p>
        )}
      </div>
    );
  }

  return (
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
            {msg.images && msg.images.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {msg.images.map((img, idx) => (
                  <img 
                    key={idx} 
                    src={`data:image/jpeg;base64,${img}`} 
                    alt="Uploaded content" 
                    className="max-w-[200px] max-h-[200px] rounded-lg object-cover"
                  />
                ))}
              </div>
            )}
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
             {providerLabel} is thinking...
           </div>
        </div>
      )}
    </div>
  );
}
