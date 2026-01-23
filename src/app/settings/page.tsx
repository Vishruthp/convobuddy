"use client";
import React, { useState, useEffect } from "react";
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
import { 
  Provider, 
  ProviderType, 
  getProviders, 
  saveProvider, 
  deleteProvider, 
  getActiveProviderId, 
  setActiveProviderId 
} from "@/lib/localstoragehelper";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  ArrowLeft, 
  Server, 
  Globe, 
  Box, 
  Cpu, 
  Laptop
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { cn } from "@/lib/utils";

interface ProviderForm {
  name: string;
  url: string;
  type: ProviderType;
}

const PROVIDER_TYPES: { label: string; value: ProviderType; icon: React.ReactNode }[] = [
  { label: "Ollama", value: "ollama", icon: <Cpu className="size-4" /> },
  { label: "LM Studio", value: "lm-studio", icon: <Laptop className="size-4" /> },
  { label: "llama.cpp", value: "llama-cpp", icon: <Server className="size-4" /> },
  { label: "Generic OpenAI", value: "openai-generic", icon: <Globe className="size-4" /> },
  { label: "Docker Runner", value: "docker-runner", icon: <Box className="size-4" /> },
];

const SettingsPage = () => {
  const router = useRouter();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const { register, handleSubmit, setValue, watch, reset } = useForm<ProviderForm>({
    defaultValues: {
      name: "",
      url: "http://127.0.0.1:11434",
      type: "ollama",
    },
  });

  const selectedType = watch("type");

  useEffect(() => {
    setProviders(getProviders());
    setActiveId(getActiveProviderId());
  }, []);

  const handleSave = (data: ProviderForm) => {
    const newProvider: Provider = {
      id: editingProvider?.id || uuidv4(),
      ...data,
    };
    saveProvider(newProvider);
    setProviders(getProviders());
    setActiveId(getActiveProviderId());
    setIsAdding(false);
    setEditingProvider(null);
    reset();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this provider?")) {
      deleteProvider(id);
      setProviders(getProviders());
      setActiveId(getActiveProviderId());
    }
  };

  const startEdit = (p: Provider, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProvider(p);
    setValue("name", p.name);
    setValue("url", p.url);
    setValue("type", p.type);
    setIsAdding(true);
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingProvider(null);
    reset();
  };

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/chat")}>
            <ArrowLeft className="size-5" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        </div>
        <ModeToggle />
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">AI Providers</h2>
          {!isAdding && (
            <Button size="sm" onClick={() => setIsAdding(true)} className="gap-2">
              <Plus className="size-4" />
              Add Provider
            </Button>
          )}
        </div>

        {isAdding ? (
          <div className="p-6 border rounded-xl bg-card shadow-sm space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-bold">{editingProvider ? "Edit Provider" : "New Provider"}</h3>
            <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
              <div className="space-y-2">
                <Label>Provider Name</Label>
                <Input 
                  {...register("name", { required: true })} 
                  placeholder="e.g. Local Ollama" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={selectedType}
                    onValueChange={(val) => setValue("type", val as ProviderType)}
                  >
                    <SelectTrigger>
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
                  <Label>Base URL</Label>
                  <Input 
                    {...register("url", { required: true })} 
                    placeholder="http://127.0.0.1:11434" 
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1">
                  {editingProvider ? "Update" : "Save"} Provider
                </Button>
                <Button variant="outline" type="button" onClick={cancelEdit}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="grid gap-3">
            {providers.length === 0 ? (
              <div className="p-8 border border-dashed rounded-xl text-center text-muted-foreground">
                No providers configured. Add one to start chatting.
              </div>
            ) : (
              providers.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setActiveProviderId(p.id);
                    setActiveId(p.id);
                  }}
                  className={cn(
                    "group flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all hover:border-primary/50",
                    activeId === p.id ? "bg-primary/5 border-primary shadow-sm" : "bg-card"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-2 rounded-lg",
                      activeId === p.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {PROVIDER_TYPES.find(t => t.value === p.type)?.icon || <Server className="size-5" />}
                    </div>
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        {p.name}
                        {activeId === p.id && (
                          <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">{p.url}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="size-8"
                      onClick={(e) => startEdit(p, e)}
                    >
                      <Edit2 className="size-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="size-8 text-destructive hover:bg-destructive/10"
                      onClick={(e) => handleDelete(p.id, e)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="pt-8 border-t">
        <Button 
          className="w-full h-12 text-lg font-bold" 
          onClick={() => router.push("/chat")}
          disabled={!activeId}
        >
          {activeId ? "Back to Chat" : "Add a Provider to Continue"}
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;
