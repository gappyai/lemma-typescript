import { useState } from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { LemmaRecordDetailsCard } from "@/components/lemma/lemma-record-details-card"
import { LemmaSchemaForm } from "@/components/lemma/lemma-schema-form"
import { LemmaRecordsTable } from "@/components/lemma/lemma-records-table"
import { LemmaAgentRunPanel } from "@/components/lemma/lemma-agent-run-panel"
import { LemmaWorkflowStartForm } from "@/components/lemma/lemma-workflow-start-form"
import { getClient, getShowcaseConfig } from "@/lib/client"

const SHOWCASE_CONFIG = getShowcaseConfig()
const client = getClient()

type ComponentKey =
  | "button"
  | "badge"
  | "card"
  | "input"
  | "label"
  | "select"
  | "switch"
  | "textarea"
  | "checkbox"
  | "separator"

const COMPONENT_LIST: Array<{ key: ComponentKey; label: string }> = [
  { key: "button", label: "Button" },
  { key: "badge", label: "Badge" },
  { key: "card", label: "Card" },
  { key: "input", label: "Input" },
  { key: "label", label: "Label" },
  { key: "select", label: "Select" },
  { key: "switch", label: "Switch" },
  { key: "textarea", label: "Textarea" },
  { key: "checkbox", label: "Checkbox" },
  { key: "separator", label: "Separator" },
]

function ButtonShowcase() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Button</CardTitle>
        <CardDescription>All variants across sm, default, and lg sizes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(["sm", "default", "lg"] as const).map((size) => (
          <div key={size} className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">{size}</Label>
            <div className="flex flex-wrap gap-2">
              <Button size={size}>Default</Button>
              <Button size={size} variant="secondary">Secondary</Button>
              <Button size={size} variant="outline">Outline</Button>
              <Button size={size} variant="destructive">Destructive</Button>
              <Button size={size} variant="ghost">Ghost</Button>
              <Button size={size} variant="link">Link</Button>
            </div>
          </div>
        ))}
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Icon</Label>
          <div className="flex flex-wrap gap-2">
            <Button size="icon">A</Button>
            <Button size="icon-sm">B</Button>
            <Button size="icon-lg">C</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function BadgeShowcase() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Badge</CardTitle>
        <CardDescription>All badge variants.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      </CardContent>
    </Card>
  )
}

function CardShowcase() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Card</CardTitle>
        <CardDescription>Full card example with header, content, and description.</CardDescription>
      </CardHeader>
      <CardContent>
        <Card>
          <CardHeader>
            <CardTitle>Nested Card Title</CardTitle>
            <CardDescription>Nested card description showing how cards compose.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Content inside a nested card with themed text.</p>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}

function InputShowcase() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Input</CardTitle>
        <CardDescription>Default, with placeholder, disabled, and with label.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="exp-input-default">Default</Label>
          <Input id="exp-input-default" defaultValue="Hello world" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="exp-input-placeholder">With placeholder</Label>
          <Input id="exp-input-placeholder" placeholder="Enter text..." />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="exp-input-disabled">Disabled</Label>
          <Input id="exp-input-disabled" disabled value="Cannot edit" />
        </div>
      </CardContent>
    </Card>
  )
}

function LabelShowcase() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Label</CardTitle>
        <CardDescription>Default label rendering.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Label>Standalone label</Label>
        <Label className="text-muted-foreground">Muted label</Label>
      </CardContent>
    </Card>
  )
}

function SelectShowcase() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Select</CardTitle>
        <CardDescription>Select with trigger, content, and items.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Choose option</Label>
          <Select defaultValue="alpha">
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alpha">Alpha</SelectItem>
              <SelectItem value="beta">Beta</SelectItem>
              <SelectItem value="gamma">Gamma</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}

function SwitchShowcase() {
  const [on, setOn] = useState(true)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Switch</CardTitle>
        <CardDescription>On/off, with label, and disabled.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Switch checked={on} onCheckedChange={setOn} />
          <Label>{on ? "On" : "Off"}</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked defaultChecked />
          <Label>Default on</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch disabled />
          <Label>Disabled</Label>
        </div>
      </CardContent>
    </Card>
  )
}

function TextareaShowcase() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Textarea</CardTitle>
        <CardDescription>Default, with label, and disabled.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="exp-ta-default">Default</Label>
          <Textarea id="exp-ta-default" placeholder="Write something..." rows={3} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="exp-ta-label">With label</Label>
          <Textarea id="exp-ta-label" defaultValue="Pre-filled content" rows={3} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="exp-ta-disabled">Disabled</Label>
          <Textarea id="exp-ta-disabled" disabled rows={3} defaultValue="Cannot edit" />
        </div>
      </CardContent>
    </Card>
  )
}

function CheckboxShowcase() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Checkbox</CardTitle>
        <CardDescription>Checked, unchecked, with label, and disabled.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Checkbox defaultChecked />
          <Label>Checked</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox />
          <Label>Unchecked</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox disabled />
          <Label>Disabled</Label>
        </div>
      </CardContent>
    </Card>
  )
}

function SeparatorShowcase() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Separator</CardTitle>
        <CardDescription>Horizontal and vertical separators.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Horizontal</Label>
          <Separator className="my-3" />
        </div>
        <div className="flex h-8 items-center gap-4">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Vertical</Label>
          <Separator orientation="vertical" />
          <span className="text-sm text-muted-foreground">Side by side</span>
        </div>
      </CardContent>
    </Card>
  )
}

const SHOWCASE_MAP: Record<ComponentKey, () => JSX.Element> = {
  button: ButtonShowcase,
  badge: BadgeShowcase,
  card: CardShowcase,
  input: InputShowcase,
  label: LabelShowcase,
  select: SelectShowcase,
  switch: SwitchShowcase,
  textarea: TextareaShowcase,
  checkbox: CheckboxShowcase,
  separator: SeparatorShowcase,
}

const MOCK_SCHEMA = {
  type: "object" as const,
  properties: {
    name: { type: "string" as const, title: "Name", description: "Agent display name" },
    query: { type: "string" as const, title: "Query", description: "Search query text" },
  },
  required: ["name", "query"],
}

interface ShadcnExplorerPageProps {
  podId: string | null
}

export function ShadcnExplorerPage({ podId }: ShadcnExplorerPageProps) {
  const [activeKeys, setActiveKeys] = useState<Set<ComponentKey>>(
    new Set(["button", "badge", "card"]),
  )

  const toggleKey = (key: ComponentKey) => {
    setActiveKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  return (
    <div className="space-y-8 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">shadcn Explorer</h1>
        <p className="text-sm text-muted-foreground">Interactively explore, compose, and mix shadcn components with Lemma primitives.</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Component Inventory</h2>
        <div className="flex flex-wrap gap-2">
          {COMPONENT_LIST.map(({ key, label }) => (
            <Badge
              key={key}
              variant={activeKeys.has(key) ? "default" : "outline"}
              className={cn(
                "cursor-pointer select-none transition-colors",
                activeKeys.has(key)
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
              )}
              onClick={() => toggleKey(key)}
            >
              {label}
            </Badge>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Live Preview</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          {COMPONENT_LIST.map(({ key }) => {
            if (!activeKeys.has(key)) return null
            const Showcase = SHOWCASE_MAP[key]
            return <Showcase key={key} />
          })}
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Compositions</h2>
        <p className="text-sm text-muted-foreground">Pre-built compositions mixing shadcn + Lemma components.</p>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Record Card</CardTitle>
              <CardDescription>Card + LemmaRecordDetailsCard side by side.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <Card size="sm">
                  <CardHeader>
                    <CardTitle>shadcn Card</CardTitle>
                    <CardDescription>Standard shadcn card panel.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Input placeholder="Search records..." />
                      <Button className="w-full" size="sm">Search</Button>
                    </div>
                  </CardContent>
                </Card>
                <LemmaRecordDetailsCard
                  client={client}
                  podId={SHOWCASE_CONFIG.podId || undefined}
                  recordId=""
                  tableName=""
                  title="Lemma Record Details"
                  description="View record details from the Lemma registry."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Form Builder</CardTitle>
              <CardDescription>Card + LemmaSchemaForm + shadcn Button actions.</CardDescription>
            </CardHeader>
            <CardContent>
              <Card size="sm">
                <CardHeader>
                  <CardTitle>Agent Input Form</CardTitle>
                  <CardDescription>Schema-driven form from the Lemma registry.</CardDescription>
                </CardHeader>
                <CardContent>
                  <LemmaSchemaForm
                    schema={MOCK_SCHEMA}
                    onSubmit={async () => {}}
                    submitLabel="Run Agent"
                    title=""
                    description=""
                  />
                  <Separator className="my-4" />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Cancel</Button>
                    <Button size="sm">Save Draft</Button>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Table</CardTitle>
              <CardDescription>Card + LemmaRecordsTable with shadcn Badge for status.</CardDescription>
            </CardHeader>
            <CardContent>
              <Card size="sm">
                <CardHeader>
                  <CardTitle>Records Overview</CardTitle>
                  <CardDescription>Table with status badges.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge>Active</Badge>
                    <Badge variant="secondary">Pending</Badge>
                    <Badge variant="destructive">Failed</Badge>
                    <Badge variant="outline">Archived</Badge>
                  </div>
                  <LemmaRecordsTable
                    client={client}
                    podId={SHOWCASE_CONFIG.podId || undefined}
                    tableName=""
                    columns={[]}
                    title=""
                    description=""
                  />
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agent Panel</CardTitle>
              <CardDescription>Card + LemmaAgentRunPanel with shadcn Separator.</CardDescription>
            </CardHeader>
            <CardContent>
              <Card size="sm">
                <CardHeader>
                  <CardTitle>Agent Run Status</CardTitle>
                  <CardDescription>Monitor agent execution in real time.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Idle</Badge>
                    <span className="text-sm text-muted-foreground">No active runs</span>
                  </div>
                  <Separator className="my-3" />
                  <LemmaAgentRunPanel
                    client={client}
                    podId={SHOWCASE_CONFIG.podId || undefined}
                    agentName=""
                    title=""
                    description=""
                  />
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workflow Launcher</CardTitle>
              <CardDescription>Card + LemmaWorkflowStartForm with shadcn Button.</CardDescription>
            </CardHeader>
            <CardContent>
              <Card size="sm">
                <CardHeader>
                  <CardTitle>Start Workflow</CardTitle>
                  <CardDescription>Launch a workflow from the registry form.</CardDescription>
                </CardHeader>
                <CardContent>
                  <LemmaWorkflowStartForm
                    client={client}
                    podId={SHOWCASE_CONFIG.podId || undefined}
                    workflowName=""
                    submitLabel="Launch"
                    title=""
                    description=""
                  />
                  <Separator className="my-3" />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">View History</Button>
                    <Button size="sm">Quick Launch</Button>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
