import type { LemmaClient } from "lemma-sdk";
import { useAssistantController, type AssistantConversationScope } from "lemma-sdk/react";
import {
  AssistantThemeScope,
  type AssistantThemeMode,
} from "../../lemma-assistant-experience/components/assistant-chrome";
import {
  AssistantExperienceView,
  type AssistantExperienceViewProps,
} from "../../lemma-assistant-experience/components/assistant-experience";

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
