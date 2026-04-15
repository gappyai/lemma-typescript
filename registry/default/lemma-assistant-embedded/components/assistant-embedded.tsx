"use client";

import type { LemmaClient } from "lemma-sdk";
import { useAssistantController, type AssistantConversationScope } from "lemma-sdk/react";
import {
  AssistantThemeScope,
  type AssistantThemeMode,
} from "./assistant-chrome.js";
import {
  AssistantExperienceView,
  type AssistantExperienceViewProps,
} from "./assistant-experience.js";

export interface AssistantEmbeddedProps
  extends Omit<AssistantExperienceViewProps, "controller">,
    AssistantConversationScope {
  client: LemmaClient;
  enabled?: boolean;
  theme?: AssistantThemeMode;
}

export function AssistantEmbedded({
  client,
  podId,
  assistantName,
  assistantId,
  organizationId,
  enabled = true,
  theme = "auto",
  ...props
}: AssistantEmbeddedProps) {
  const controller = useAssistantController({
    client,
    podId: podId ?? undefined,
    assistantName: assistantName ?? undefined,
    assistantId: assistantId ?? undefined,
    organizationId: organizationId ?? undefined,
    enabled,
  });

  return (
    <AssistantThemeScope className="lemma-assistant-embedded" theme={theme}>
      <AssistantExperienceView controller={controller} {...props} />
    </AssistantThemeScope>
  );
}
