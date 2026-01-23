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
import { BackendProvider } from "@/lib/localstoragehelper";
import { GetModels } from "@/lib/apiservice";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsForm {
  provider: BackendProvider;
  ollamaUrl: string;
  ollamaPort: number;
}

const PROVIDERS: { label: string; value: BackendProvider; defaultPort: number }[] = [
  { label: "Ollama", value: "ollama", defaultPort: 11434 },
  { label: "LM Studio", value: "lm-studio", defaultPort: 1244 },
  { label: "llama.cpp", value: "llama-cpp", defaultPort: 8080 },
  { label: "Generic OpenAI API", value: "openai-generic", defaultPort: 8000 },
];

export default function Home() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [connectionError, setConnectionError] = useState("");
  
  const { register, handleSubmit, setValue, watch } = useForm<SettingsForm>({
    defaultValues: {
      provider: "ollama",
      ollamaUrl: "http://127.0.0.1",
      ollamaPort: 11434,
    },
  });

  const selectedProvider = watch("provider");
  const currentUrl = watch("ollamaUrl");
  const currentPort = watch("ollamaPort");

  useEffect(() => {
    setIsClient(true);
    
    // Pre-fill from localStorage
    const savedOllamaUrl = localStorage.getItem("ollamaUrl");
    const savedPort = localStorage.getItem("ollamaPort");
    const savedProvider = localStorage.getItem("backendProvider") as BackendProvider;

    if (savedOllamaUrl && savedPort) {
      setValue("provider", savedProvider || "ollama");
      setValue("ollamaUrl", savedOllamaUrl);
      setValue("ollamaPort", parseInt(savedPort));
    }
  }, [setValue]);

  // Update default port when provider changes
  useEffect(() => {
    const providerObj = PROVIDERS.find((p) => p.value === selectedProvider);
    if (providerObj && isClient) {
      setValue("ollamaPort", providerObj.defaultPort);
      setConnectionStatus("idle");
    }
  }, [selectedProvider, setValue, isClient]);

  // Reset connection status if URL or Port changes
  useEffect(() => {
    setConnectionStatus("idle");
  }, [currentUrl, currentPort]);

  const testConnection = async () => {
    setConnectionStatus("testing");
    setConnectionError("");

    // Temporarily save to localStorage so GetModels uses the current inputs
    localStorage.setItem("backendProvider", selectedProvider);
    localStorage.setItem("ollamaUrl", currentUrl);
    localStorage.setItem("ollamaPort", currentPort.toString());

    try {
      await GetModels();
      setConnectionStatus("success");
    } catch (err: any) {
      setConnectionStatus("error");
      setConnectionError(err.message || "Could not reach backend");
    }
  };

  const onSubmit = (data: SettingsForm) => {
    localStorage.setItem("backendProvider", data.provider);
    localStorage.setItem("ollamaUrl", data.ollamaUrl);
    localStorage.setItem("ollamaPort", data.ollamaPort.toString());
    router.push("/chat");
  };

  if (!isClient) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-background font-[family-name:var(--font-geist-sans)]">
      <main className="max-w-md w-full space-y-12">
        <div className="text-center space-y-4">
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
              <Label>Backend Provider</Label>
              <Select
                value={selectedProvider}
                onValueChange={(val) => setValue("provider", val as BackendProvider)}
              >
                <SelectTrigger className="h-12 border-2 hover:border-primary/50 transition-colors">
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="ollamaUrl">Base URL</Label>
                <Input
                  id="ollamaUrl"
                  placeholder="http://127.0.0.1"
                  {...register("ollamaUrl", { required: "Base URL is required" })}
                  className="h-12 border-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  type="number"
                  {...register("ollamaPort", { required: "Port is required" })}
                  className="h-12 border-2"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Button 
                type="button"
                variant="outline"
                onClick={testConnection}
                disabled={connectionStatus === "testing"}
                className="w-full h-11 border-2 flex items-center justify-center gap-2"
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
                    : "bg-yellow-400 hover:bg-yellow-500 text-black shadow-yellow-400/20"
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
