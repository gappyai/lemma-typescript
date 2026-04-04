import type { LemmaClient } from "../../client.js";
import { useAssistantController, type AssistantConversationScope } from "../useAssistantController.js";
import { AssistantThemeScope, type AssistantThemeMode } from "./AssistantChrome.js";
import { AssistantExperienceView, type AssistantExperienceViewProps } from "./AssistantExperience.js";

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
  assistantId,
  organizationId,
  enabled = true,
  theme = "auto",
  ...props
}: AssistantEmbeddedProps) {
  const controller = useAssistantController({
    client,
    podId: podId ?? undefined,
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
