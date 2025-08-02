"use client";
import { redirect } from "next/navigation";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          Convo Buddy
        </h1>
        <p className="leading-7 [&:not(:first-child)]:mt-2">
          Convo Buddy is a tool that helps you chat with your local llms
        </p>
        <div className="flex flex-col gap-4 justify-items-center">
          <button
            className="bg-[#FFD700] text-[#000000] font-bold py-2 px-4 rounded-lg"
            onClick={() => {
              if (
                localStorage.getItem("ollamaUrl") === null ||
                localStorage.getItem("ollamaPort") === null
              ) {
                redirect("/settings");
              } else {
                redirect("/chat");
              }
            }}
          >
            Start Chat
          </button>
        </div>
      </main>
    </div>
  );
}
