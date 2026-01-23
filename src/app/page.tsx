"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import { 
  Provider, 
  ProviderType, 
  getProviders, 
  saveProvider, 
  setActiveProviderId 
} from "@/lib/localstoragehelper";
import { GetModels } from "@/lib/apiservice";
import { CheckCircle2, XCircle, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";

interface OnboardingForm {
  name: string;
  type: ProviderType;
  baseUrl: string;
  port: number;
}

const PROVIDER_TYPES: { label: string; value: ProviderType; defaultPort: number }[] = [
  { label: "Ollama", value: "ollama", defaultPort: 11434 },
  { label: "LM Studio", value: "lm-studio", defaultPort: 1234 },
  { label: "llama.cpp", value: "llama-cpp", defaultPort: 8080 },
  { label: "Generic OpenAI API", value: "openai-generic", defaultPort: 8000 },
  { label: "Docker Runner", value: "docker-runner", defaultPort: 8080 },
];

export default function Home() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [connectionError, setConnectionError] = useState("");
  
  const { register, handleSubmit, setValue, watch } = useForm<OnboardingForm>({
    defaultValues: {
      name: "Local AI",
      type: "ollama",
      baseUrl: "http://127.0.0.1",
      port: 11434,
    },
  });

  const selectedType = watch("type");
  const currentUrl = watch("baseUrl");
  const currentPort = watch("port");

  useEffect(() => {
    setIsClient(true);
    
    // If providers exist, maybe redirect or pre-fill from first one
    const existing = getProviders();
    if (existing.length > 0) {
      const p = existing[0];
      setValue("name", p.name);
      setValue("type", p.type);
      
      const [url, port] = p.url.split(/:(?=\d+$)/);
      setValue("baseUrl", url);
      setValue("port", parseInt(port) || 80);
    }
  }, [setValue]);

  // Update default port when type changes
  useEffect(() => {
    const typeObj = PROVIDER_TYPES.find((t) => t.value === selectedType);
    if (typeObj && isClient) {
      setValue("port", typeObj.defaultPort);
      setConnectionStatus("idle");
    }
  }, [selectedType, setValue, isClient]);

  // Reset connection status if URL or Port changes
  useEffect(() => {
    setConnectionStatus("idle");
  }, [currentUrl, currentPort]);

  const testConnection = async () => {
    setConnectionStatus("testing");
    setConnectionError("");

    const fullUrl = `${currentUrl}:${currentPort}`;
    try {
      await GetModels(fullUrl, selectedType);
      setConnectionStatus("success");
    } catch (err: any) {
      setConnectionStatus("error");
      setConnectionError(err.message || "Could not reach backend");
    }
  };

  const onSubmit = (data: OnboardingForm) => {
    const newProvider: Provider = {
      id: uuidv4(),
      name: data.name,
      url: `${data.baseUrl}:${data.port}`,
      type: data.type,
    };
    
    saveProvider(newProvider);
    setActiveProviderId(newProvider.id);
    router.push("/chat");
  };

  if (!isClient) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-background font-[family-name:var(--font-geist-sans)]">
      <main className="max-w-md w-full space-y-12">
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="size-16 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/20 animate-pulse">
                <Sparkles className="size-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight">
            Convo Buddy
          </h1>
          <p className="text-muted-foreground text-lg text-pretty">
            Chat with your local LLMs through local agents.
          </p>
        </div>

        <div className="bg-card border rounded-2xl p-8 shadow-xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Setup your backend</h2>
            <p className="text-sm text-muted-foreground">Configure how ConvoBuddy connects to your AI.</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Friendly Name</Label>
              <Input
                id="name"
                placeholder="e.g. My Local M3"
                {...register("name", { required: "Name is required" })}
                className="h-12 border-2 focus-visible:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label>Backend Provider</Label>
              <Select
                value={selectedType}
                onValueChange={(val) => setValue("type", val as ProviderType)}
              >
                <SelectTrigger className="h-12 border-2 hover:border-primary/50 transition-colors">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDER_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="baseUrl">Base URL</Label>
                <Input
                  id="baseUrl"
                  placeholder="http://127.0.0.1"
                  {...register("baseUrl", { required: "Base URL is required" })}
                  className="h-12 border-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  type="number"
                  {...register("port", { required: "Port is required" })}
                  className="h-12 border-2"
                />
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <Button 
                type="button"
                variant="outline"
                onClick={testConnection}
                disabled={connectionStatus === "testing"}
                className="w-full h-11 border-2 flex items-center justify-center gap-2 transition-all hover:bg-muted"
              >
                {connectionStatus === "testing" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Testing...
                  </>
                ) : connectionStatus === "success" ? (
                  <>
                    <CheckCircle2 className="size-4 text-green-500" />
                    Connection Successful
                  </>
                ) : connectionStatus === "error" ? (
                  <>
                    <XCircle className="size-4 text-destructive" />
                    Connection Failed
                  </>
                ) : (
                  "Test Connection"
                )}
              </Button>

              {connectionError && (
                <p className="text-xs text-destructive text-center font-medium bg-destructive/10 p-2 rounded-lg border border-destructive/20 animate-in fade-in zoom-in-95">
                  {connectionError}
                </p>
              )}

              <Button 
                onClick={handleSubmit(onSubmit)} 
                size="lg"
                className={cn(
                  "w-full font-bold h-14 text-lg rounded-xl shadow-lg transition-all active:scale-[0.98]",
                  connectionStatus === "success" 
                    ? "bg-green-500 hover:bg-green-600 text-white shadow-green-500/20" 
                    : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20"
                )}
              >
                Start Chatting
              </Button>
            </div>
          </div>
        </div>
        
        <p className="text-center text-xs text-muted-foreground pt-4">
          All settings are stored locally in your browser.
        </p>
      </main>
    </div>
  );
}
