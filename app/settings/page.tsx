"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { exportDatabase, restoreDatabase, initDB } from "@/lib/db"
import { Download, Upload, Trash2, Database, AlertTriangle } from "lucide-react"

export default function SettingsPage() {
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    setExporting(true)
    const data = await exportDatabase()
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `leetcode-mastery-backup-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    const text = await file.text()
    try {
      await restoreDatabase(text)
      alert("Database restored successfully!")
      window.location.reload()
    } catch (err) {
      alert("Failed to restore database: " + (err as Error).message)
    }
    setImporting(false)
  }

  const handleClear = async () => {
    if (!confirm("Are you sure? This will delete ALL data permanently.")) return
    const { db } = await import("@/lib/db")
    await db.delete()
    await initDB()
    alert("Database cleared. Reloading...")
    window.location.reload()
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your local data</p>
      </div>

      {/* Backup & Restore */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="w-4 h-4" />
            Backup & Restore
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            All data is stored locally in your browser. Export regularly to prevent data loss.
          </p>
          <div className="flex gap-3">
            <Button onClick={handleExport} disabled={exporting} className="gap-2">
              <Download className="w-4 h-4" />
              {exporting ? "Exporting..." : "Export Database"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()} 
              disabled={importing}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              {importing ? "Importing..." : "Import Database"}
            </Button>
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".json" 
              onChange={handleImport} 
              className="hidden" 
            />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-4 h-4" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Clear all local data. This action cannot be undone.
          </p>
          <Button variant="destructive" onClick={handleClear} className="gap-2">
            <Trash2 className="w-4 h-4" />
            Clear All Data
          </Button>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>LeetCode Mastery v1.0.0</p>
          <p>Built with Next.js 15, TypeScript, Tailwind CSS, and Dexie.js</p>
          <p>FSRS Algorithm v4.5 implementation for optimal spaced repetition scheduling.</p>
          <p className="pt-2 text-xs">
            All data remains on your device. No external servers are used.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
