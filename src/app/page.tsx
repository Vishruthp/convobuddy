"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleStartChat = () => {
    const url = localStorage.getItem("ollamaUrl");
    const port = localStorage.getItem("ollamaPort");

    if (!url || !port) {
      router.push("/settings");
    } else {
      router.push("/chat");
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start text-center sm:text-left">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          Convo Buddy
        </h1>
        <p className="leading-7 text-muted-foreground whitespace-pre-wrap max-w-lg">
          Convo Buddy is a tool that helps you chat with your local LLMs through local agents.
        </p>
        <div className="flex flex-col gap-4">
          <Button
            size="lg"
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-8 py-6 text-lg"
            onClick={handleStartChat}
            disabled={!isClient}
          >
            Start Chat
          </Button>
        </div>
      </main>
    </div>
  );
}
