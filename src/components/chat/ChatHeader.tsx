"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { Server, Info, SlidersHorizontal, Settings, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/theme-toggle";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ChatHeaderProps {
  providerName: string;
  model: string;
  modelsList: string[];
  isLoadingModels: boolean;
  fetchError: string | null;
  temperature: number;
  contextLength: number;
  showParams: boolean;
  isModelSelected: boolean;
  onModelChange: (value: string) => void;
  onFetchModels: () => void;
  onToggleParams: (show: boolean) => void;
  onSetTemperature: (value: number) => void;
  onSetContextLength: (value: number) => void;
  isVisionModel: (model: string) => boolean;
}

export function ChatHeader({
  providerName,
  model,
  modelsList,
  isLoadingModels,
  fetchError,
  temperature,
  contextLength,
  showParams,
  isModelSelected,
  onModelChange,
  onFetchModels,
  onToggleParams,
  onSetTemperature,
  onSetContextLength,
  isVisionModel,
}: ChatHeaderProps) {
  const paramsRef = useRef<HTMLDivElement>(null);

  // Note: Click outside logic moved to parent or kept here if needed. 
  // Let's keep the ref and use it in the parent for consistency if possible, 
  // but for a clean extraction, we'll keep the UI here.

  return (
    <header className="flex items-center justify-between p-4 border-b shrink-0">
      <div className="flex items-center gap-4 min-w-0">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <h1 className="font-bold text-xl hidden sm:block">ConvoBuddy</h1>
          <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20 flex items-center gap-1">
            <Server className="size-3" />
            {providerName}
          </span>
          {!isVisionModel(model) && (
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
              <Info className="size-3" />
              Text-only
            </span>
          )}
        </Link>
        <Select
          value={model}
          onValueChange={onModelChange}
          disabled={isLoadingModels || !!fetchError}
        >
          <SelectTrigger className="w-[180px] sm:w-[240px]">
            {isLoadingModels ? (
              <div className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : (
              <SelectValue placeholder={fetchError ? "Error fetching" : "Select a Model"} />
            )}
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {fetchError ? (
                <div className="p-2 space-y-2">
                  <p className="text-xs text-destructive font-medium">{fetchError}</p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full text-[10px] h-7"
                    onClick={(e) => {
                      e.preventDefault();
                      onFetchModels();
                    }}
                  >
                    Retry
                  </Button>
                </div>
              ) : modelsList.length > 0 ? (
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
      <div className="flex items-center gap-2 relative">
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
              "rounded-lg", 
              (temperature !== 0.7 || contextLength !== 4096) && "text-primary bg-primary/5",
              showParams && "bg-muted text-primary"
            )}
            onClick={() => onToggleParams(!showParams)}
          >
            <SlidersHorizontal className="size-5" />
          </Button>

          {showParams && (
            <div 
              className="absolute right-0 top-full mt-2 w-80 p-4 space-y-4 bg-popover border rounded-xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200"
            >
              <div className="flex items-center justify-between pb-2 border-b">
                <h4 className="font-semibold text-sm">Model Parameters</h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2 text-[10px]"
                  onClick={() => {
                    onSetTemperature(0.7);
                    onSetContextLength(4096);
                  }}
                >
                  Reset
                </Button>
              </div>
              
              <div className="space-y-6 pt-2">
                <Slider 
                  label="Temperature" 
                  value={temperature} 
                  min={0} 
                  max={2} 
                  step={0.1} 
                  onChangeValue={onSetTemperature}
                />
                <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
                  Controls creativity. 0 is deterministic, 2 is maximum variety.
                </p>

                <Slider 
                  label="Context Length" 
                  value={contextLength} 
                  min={512} 
                  max={32768} 
                  step={512} 
                  onChangeValue={onSetContextLength}
                />
                <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
                  Maximum memory size for this chat session.
                </p>
              </div>
            </div>
          )}
        </div>
        
        <ModeToggle />
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings">
            <Settings className="size-5" />
          </Link>
        </Button>
      </div>
    </header>
  );
}
