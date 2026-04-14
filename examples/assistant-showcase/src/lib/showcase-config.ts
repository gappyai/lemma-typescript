import type { AssistantRadiusScale } from "@/components/lemma/assistant/index.ts"

export type PreviewMode = "assistant" | "embedded" | "chrome"

export interface PreviewConfig {
  enabled: boolean
  title: string
  subtitle: string
  placeholder: string
  showConversationList: boolean
  showModelPicker: boolean
  showNewConversationButton: boolean
  radius: AssistantRadiusScale
  controlDraft: boolean
  draft: string
  useCustomEmptyState: boolean
  useCustomConversationLabel: boolean
  useCustomMessageRenderer: boolean
  useCustomPresentedFileRenderer: boolean
  useCustomToolRenderer: boolean
}

export function defaultPreviewConfig(): PreviewConfig {
  return {
    enabled: true,
    title: "Lemma Assistant Preview",
    subtitle: "Testing the exported assistant components.",
    placeholder: "Message Lemma Assistant",
    showConversationList: true,
    showModelPicker: false,
    showNewConversationButton: true,
    radius: "sm",
    controlDraft: false,
    draft: "Help me understand what this assistant can do.",
    useCustomEmptyState: false,
    useCustomConversationLabel: false,
    useCustomMessageRenderer: false,
    useCustomPresentedFileRenderer: false,
    useCustomToolRenderer: false,
  }
}
