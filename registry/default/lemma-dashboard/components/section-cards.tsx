"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export interface SectionCardItem {
  title: string
  value: React.ReactNode
  description?: string
  icon?: React.ReactNode
  badge?: React.ReactNode
}

export interface SectionCardsProps {
  cards?: SectionCardItem[]
}

function SectionCard({ card }: { card: SectionCardItem }) {
  return (
    <Card className="relative @container/card overflow-hidden border-border/70 shadow-[0_1px_0_rgba(255,255,255,0.55),0_12px_28px_-30px_rgba(15,23,42,0.22)]">
      <CardHeader className="relative">
        {card.badge ? (
          <Badge className="absolute right-4 top-4" variant="secondary">
            {card.badge}
          </Badge>
        ) : null}
        <CardDescription className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {card.icon}
          {card.title}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-2xl font-semibold leading-tight tracking-tight">{card.value}</div>
        {card.description ? (
          <div className="mt-1 text-sm text-muted-foreground">{card.description}</div>
        ) : null}
      </CardContent>
    </Card>
  )
}

export function SectionCards({ cards = [] }: SectionCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {cards.map((card) => (
        <SectionCard card={card} key={card.title} />
      ))}
    </div>
  )
}
