"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Provider,
  getProviders,
  saveProvider,
  setActiveProviderId,
} from "@/lib/localstoragehelper";
import { Sparkles } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { ProviderForm } from "@/components/ProviderForm";

export default function Home() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleCreateProvider = (data: {
    name: string;
    url: string;
    type: any;
  }) => {
    const newProvider: Provider = {
      id: uuidv4(),
      ...data,
    };

    saveProvider(newProvider);
    setActiveProviderId(newProvider.id);
    router.push("/chat");
  };

  if (!isClient) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-background font-[family-name:var(--font-geist-sans)]">
      <main className="max-w-xl w-full space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-6xl font-extrabold tracking-tight">
            Convo Buddy
          </h2>
          <p className="text-muted-foreground text-xl text-pretty max-w-sm mx-auto font-medium">
            Local LLM experience, simplified.
          </p>
        </div>

        <div className="bg-card border-2 rounded-3xl p-8 shadow-2xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">Setup your backend</h2>
          </div>

          <ProviderForm
            onSubmit={handleCreateProvider}
            submitLabel="Start Chatting"
          />
        </div>

        <div className="flex flex-col items-center gap-4">
          <p className="text-center text-xs text-muted-foreground font-medium uppercase tracking-[0.2em]">
            Privacy First • Local Only • Encrypted
          </p>
        </div>
      </main>
    </div>
  );
}
