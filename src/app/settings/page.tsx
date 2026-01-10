// pages/settings.tsx
"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/theme-toggle";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BackendProvider } from "@/lib/localstoragehelper";

interface SettingsForm {
  provider: BackendProvider;
  ollamaUrl: string;
  ollamaPort: number;
}

const PROVIDERS: { label: string; value: BackendProvider; defaultPort: number }[] = [
  { label: "Ollama", value: "ollama", defaultPort: 11434 },
  { label: "LM Studio", value: "lm-studio", defaultPort: 1234 },
  { label: "llama.cpp", value: "llama-cpp", defaultPort: 8080 },
  { label: "Generic OpenAI API", value: "openai-generic", defaultPort: 8000 },
];

const SettingsPage = () => {
  const router = useRouter();
  const { register, handleSubmit, setValue, watch } = useForm<SettingsForm>({
    defaultValues: {
      provider: "ollama",
      ollamaUrl: "http://127.0.0.1",
      ollamaPort: 11434,
    },
  });
  const [savedSettings, setSavedSettings] = useState<SettingsForm | null>(null);

  const selectedProvider = watch("provider");

  // Update default port when provider changes
  useEffect(() => {
    const providerObj = PROVIDERS.find((p) => p.value === selectedProvider);
    if (providerObj && !savedSettings) {
      setValue("ollamaPort", providerObj.defaultPort);
    }
  }, [selectedProvider, setValue, savedSettings]);

  useEffect(() => {
    const savedOllamaUrl = localStorage.getItem("ollamaUrl");
    const savedPort = localStorage.getItem("ollamaPort");
    const savedProvider = localStorage.getItem("backendProvider") as BackendProvider;

    if (savedOllamaUrl && savedPort) {
      const port = parseInt(savedPort);
      const provider = savedProvider || "ollama";
      setSavedSettings({
        provider,
        ollamaUrl: savedOllamaUrl,
        ollamaPort: port,
      });
      setValue("provider", provider);
      setValue("ollamaUrl", savedOllamaUrl);
      setValue("ollamaPort", port);
    }
  }, [setValue]);

  const onSubmit = (data: SettingsForm) => {
    localStorage.setItem("backendProvider", data.provider);
    localStorage.setItem("ollamaUrl", data.ollamaUrl);
    localStorage.setItem("ollamaPort", data.ollamaPort.toString());
    router.push("/chat");
  };

  return (
    <div className="p-4 max-w-xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Settings</h1>
        <ModeToggle />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label>Backend Provider</Label>
          <Select
            value={selectedProvider}
            onValueChange={(val) => setValue("provider", val as BackendProvider)}
          >
            <SelectTrigger>
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

        <div className="space-y-2">
          <Label htmlFor="ollamaUrl">Base URL</Label>
          <Input
            id="ollamaUrl"
            placeholder="http://127.0.0.1"
            {...register("ollamaUrl", { required: "Base URL is required" })}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="port">Port</Label>
          <Input
            id="port"
            type="number"
            {...register("ollamaPort", { required: "Port is required" })}
            className="w-full"
          />
        </div>

        <Button type="submit" className="w-full py-6 text-lg font-bold">
          Save and Start Chatting
        </Button>
      </form>

      {savedSettings && (
        <div className="mt-8 p-4 border rounded-lg bg-muted/50">
          <h3 className="text-xl font-semibold mb-4 border-b pb-2">Active Configuration</h3>
          <div className="space-y-2 text-sm">
            <p className="flex justify-between">
              <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Provider</span>
              <span className="font-mono">{PROVIDERS.find(p => p.value === savedSettings.provider)?.label}</span>
            </p>
            <p className="flex justify-between">
              <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Base URL</span> 
              <code className="bg-muted px-1 rounded">{savedSettings.ollamaUrl}</code>
            </p>
            <p className="flex justify-between">
              <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Port</span> 
              <code className="bg-muted px-1 rounded">{savedSettings.ollamaPort}</code>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
