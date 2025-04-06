"use client"
import Image from "next/image";
import { redirect  } from 'next/navigation';

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
      <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
        Convo Buddy
      </h1>
      <p className="leading-7 [&:not(:first-child)]:mt-2"> Convo Buddy is a tool that helps you chat with your local llms </p>
      <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
      <li>
        <h3>Local AI Connection</h3>
         <p>Enjoy fast, reliable, and secure AI interactions directly on your device without relying on external servers.</p>
      </li>
      <li>
        <h3>Seamless Model Switching</h3>
         <p>Switch between various AI models easily to cater to your needs—from casual chats to complex problem-solving.</p>
      </li>
       <li>
         <h3>Real-Time Responses</h3>
         <p>Get instant AI replies powered by a local Ollama instance, ensuring responsive and intelligent conversations.</p>
      </li>
      <li>
        <h3>User-Friendly Interface</h3>
        <p>Experience a clean and intuitive interface that makes chatting with ConvoBuddy a delightful experience.</p>
      </li>
      </ul>
      <div className="flex flex-col gap-4 justify-items-center">
        <button className="bg-[#FFD700] text-[#000000] font-bold py-2 px-4 rounded-lg" onClick={() => 
          {
              if (localStorage.getItem("ollamaUrl") === null || localStorage.getItem("ollamaPort") === null) {
                redirect('/settings');
              }
              else {
                redirect('/chat');
              }
          }}> Start Chat </button>
      </div>
      </main>    

      <footer className="row-start-3 text-center text-sm text-gray-500">
        <p>© 2025 Convo Buddy. All rights reserved.</p>
        <p>
          Built with Next.js & Shadcn Check out our{" "}
          <a href="/privacy" className="text-blue-500 hover:underline">
            Privacy Policy
          </a>.
        </p>
      </footer>
    </div>
  );
}
