'use client'

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'

export interface UniversPersonnelData {
  niveau_conscience: number   // 1-10
  energie: number             // 1-10
  equilibre: number           // 1-10
  contribution: number        // 1-10
}

interface Props {
  data: UniversPersonnelData
  height?: number
}

const AXIS_LABELS: Record<keyof UniversPersonnelData, string> = {
  niveau_conscience: 'Conscience',
  energie: 'Énergie',
  equilibre: 'Équilibre',
  contribution: 'Contribution',
}

export default function UniversPersonnelRadar({ data, height = 280 }: Props) {
  const chartData = (Object.keys(AXIS_LABELS) as (keyof UniversPersonnelData)[]).map((key) => ({
    axis: AXIS_LABELS[key],
    value: data[key],
    fullMark: 10,
  }))

  return (
    <div style={{ width: '100%', height }} aria-label="Univers personnel sur 4 axes">
      <ResponsiveContainer>
        <RadarChart data={chartData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid stroke="rgba(255,255,255,0.08)" gridType="polygon" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
          />
          <PolarRadiusAxis
            domain={[0, 10]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="Toi"
            dataKey="value"
            stroke="#7C3AED"
            strokeWidth={2}
            fill="url(#universGradient)"
            fillOpacity={0.55}
          />
          <defs>
            <linearGradient id="universGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.4} />
            </linearGradient>
          </defs>
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
