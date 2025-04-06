"use client"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "../../components/app-sidebar";
import { ModeToggle } from "@/components/theme-toggle";
 
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      {/* <AppSidebar />
      */}
      <main>
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  )
}