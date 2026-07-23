"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  ListChecks, 
  Brain, 
  TrendingDown, 
  Target,
  Settings,
  Command
} from "lucide-react"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/problems", label: "Problems", icon: ListChecks },
  { href: "/patterns", label: "Patterns", icon: Target },
  { href: "/forgetting-curve", label: "Forgetting Curve", icon: TrendingDown },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="fixed left-0 top-0 z-50 h-screen w-16 border-r bg-background/80 backdrop-blur-xl flex flex-col items-center py-6 gap-2 lg:w-64 lg:items-start lg:px-4">
      <Link href="/" className="flex items-center gap-3 px-2 mb-8">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Brain className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="hidden lg:block font-bold text-lg tracking-tight">LeetCode Mastery</span>
      </Link>

      <div className="flex-1 flex flex-col gap-1 w-full">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
              <span className="hidden lg:block">{item.label}</span>
            </Link>
          )
        })}
      </div>

      <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all w-full">
        <Command className="w-5 h-5" />
        <span className="hidden lg:block">Command</span>
        <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium ml-auto">
          ⌘K
        </kbd>
      </button>
    </nav>
  )
}
