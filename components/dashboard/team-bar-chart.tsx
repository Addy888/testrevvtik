'use client'

import * as React from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export type TeamBarPoint = { name: string; score: number }

export default function TeamBarChart({ data }: { data: TeamBarPoint[] }) {
  if (!data.length) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
        No team scores yet.
      </div>
    )
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
