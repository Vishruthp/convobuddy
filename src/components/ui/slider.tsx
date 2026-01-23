"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChangeValue: (value: number) => void;
}

export function Slider({ label, value, min, max, step, onChangeValue, className, ...props }: SliderProps) {
  return (
    <div className={cn("space-y-2 w-full", className)}>
      {label && (
        <div className="flex justify-between items-center text-xs font-medium text-muted-foreground">
          <span>{label}</span>
          <span className="bg-muted px-1.5 py-0.5 rounded text-[10px] tabular-nums font-bold">
            {value}
          </span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChangeValue(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary hover:accent-primary/80 transition-all"
        {...props}
      />
    </div>
  )
}
