"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
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
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardDescription>{card.title}</CardDescription>
        <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
          {card.value}
        </CardTitle>
        {card.badge ? (
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              {card.icon}
              {card.badge}
            </Badge>
          </div>
        ) : null}
      </CardHeader>
      {card.description ? (
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">{card.description}</div>
        </CardFooter>
      ) : null}
    </Card>
  )
}

export function SectionCards({ cards = [] }: SectionCardsProps) {
  return (
    <div className="*:data-[slot=card]:shadow-sm @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
      {cards.map((card) => (
        <SectionCard card={card} key={card.title} />
      ))}
    </div>
  )
}
