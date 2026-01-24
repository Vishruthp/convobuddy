"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Provider, ProviderType } from "@/lib/localstoragehelper";
import { GetModels } from "@/lib/apiservice";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Cpu,
  Laptop,
  Server,
  Globe,
  Box,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const PROVIDER_TYPES: {
  label: string;
  value: ProviderType;
  icon: React.ReactNode;
  defaultUrl: string;
}[] = [
  {
    label: "LM Studio",
    value: "lm-studio",
    icon: <Laptop className="size-4" />,
    defaultUrl: "http://127.0.0.1:1244",
  },
  {
    label: "Ollama",
    value: "ollama",
    icon: <Cpu className="size-4" />,
    defaultUrl: "http://127.0.0.1:11434",
  },
  {
    label: "llama.cpp",
    value: "llama-cpp",
    icon: <Server className="size-4" />,
    defaultUrl: "http://127.0.0.1:8080",
  },
  {
    label: "Generic OpenAI",
    value: "openai-generic",
    icon: <Globe className="size-4" />,
    defaultUrl: "http://127.0.0.1:8000",
  },
  {
    label: "Docker Runner",
    value: "docker-runner",
    icon: <Box className="size-4" />,
    defaultUrl: "http://127.0.0.1:12434",
  },
];

interface ProviderFormValues {
  name: string;
  type: ProviderType;
  url: string;
}

interface ProviderFormProps {
  initialData?: Provider;
  onSubmit: (data: ProviderFormValues) => void;
  onCancel?: () => void;
  submitLabel?: string;
  variant?: "default" | "compact";
}

export function ProviderForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Save Provider",
  variant = "default",
}: ProviderFormProps) {
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "testing" | "success" | "error"
  >("idle");
  const [connectionError, setConnectionError] = useState("");

  const { register, handleSubmit, setValue, watch, reset } =
    useForm<ProviderFormValues>({
      defaultValues: {
        name: initialData?.name || "Local AI",
        type: initialData?.type || "ollama",
        url: initialData?.url || "http://127.0.0.1:11434",
      },
    });

  const selectedType = watch("type");
  const currentUrl = watch("url");

  // Sync with initialData when it changes (e.g. when entering edit mode)
  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        type: initialData.type,
        url: initialData.url,
      });
    }
  }, [initialData, reset]);

  // Update default URL when type changes ONLY if we are not editing
  useEffect(() => {
    if (!initialData) {
      const typeObj = PROVIDER_TYPES.find((t) => t.value === selectedType);
      if (typeObj) {
        setValue("url", typeObj.defaultUrl);
        setConnectionStatus("idle");
      }
    }
  }, [selectedType, setValue, initialData]);

  // Reset connection status if URL changes
  useEffect(() => {
    setConnectionStatus("idle");
  }, [currentUrl]);

  const testConnection = async () => {
    setConnectionStatus("testing");
    setConnectionError("");

    try {
      await GetModels(currentUrl, selectedType);
      setConnectionStatus("success");
    } catch (err: any) {
      setConnectionStatus("error");
      setConnectionError(err.message || "Could not reach backend");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label
          htmlFor="name"
          className="text-sm font-semibold uppercase tracking-wider text-muted-foreground"
        >
          Provider Name
        </Label>
        <Input
          id="name"
          placeholder="e.g. My Mac Studio"
          {...register("name", { required: "Name is required" })}
          className={cn(
            "h-12 border-2 focus-visible:ring-primary/20",
            variant === "default" && "text-lg",
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Type
          </Label>
          <Select
            value={selectedType}
            onValueChange={(val) => setValue("type", val as ProviderType)}
          >
            <SelectTrigger className="w-full h-12 border-2 hover:border-primary/50 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROVIDER_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  <div className="flex items-center gap-2">
                    {t.icon}
                    {t.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="url"
            className="text-sm font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Base URL
          </Label>
          <Input
            id="url"
            placeholder="http://127.0.0.1:11434"
            {...register("url", { required: "Base URL is required" })}
            className="h-12 border-2 font-mono"
          />
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={testConnection}
          disabled={connectionStatus === "testing"}
          className="w-full h-12 border-2 flex items-center justify-center gap-3 transition-all hover:bg-muted font-bold"
        >
          {connectionStatus === "testing" ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Connecting...
            </>
          ) : connectionStatus === "success" ? (
            <>
              <CheckCircle2 className="size-5 text-green-500" />
              Connection Successful
            </>
          ) : connectionStatus === "error" ? (
            <>
              <XCircle className="size-5 text-destructive" />
              Connection Failed
            </>
          ) : (
            "Test Connection"
          )}
        </Button>

        {connectionError && (
          <p className="text-xs text-destructive text-center font-medium bg-destructive/10 p-3 rounded-xl border border-destructive/20 animate-in fade-in zoom-in-95 leading-relaxed">
            {connectionError}
          </p>
        )}

        <div className="flex gap-2">
          <Button
            type="submit"
            size="lg"
            className={cn(
              "flex-1 font-black h-14 text-lg rounded-2xl shadow-xl transition-all active:scale-[0.98] uppercase tracking-widest",
              connectionStatus === "success"
                ? "bg-green-500 hover:bg-green-600 text-white shadow-green-500/20"
                : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20",
            )}
          >
            {submitLabel}
          </Button>
          {onCancel && (
            <Button
              variant="outline"
              type="button"
              onClick={onCancel}
              className="h-14 px-8 rounded-2xl border-2 font-bold uppercase tracking-wider"
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
