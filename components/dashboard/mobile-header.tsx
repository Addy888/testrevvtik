"use client"

import { Menu } from "lucide-react"

export default function MobileHeader({
  onMenuClick,
}: {
  onMenuClick: () => void
}) {
  return (
    <div className="flex items-center gap-3 border-b p-4 md:hidden">
      <button onClick={onMenuClick}>
        <Menu className="h-6 w-6" />
      </button>
      <span className="font-bold">RevvTik</span>
    </div>
  )
}