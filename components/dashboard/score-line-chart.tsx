'use client'

import * as React from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

type ScorePoint = {
  label: string
  value: number
}

export default function ScoreLineChart({ data }: { data: ScorePoint[] }) {
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

