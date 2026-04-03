import type { LemmaClient } from "../../client.js";
import { useAssistantController, type AssistantConversationScope } from "../useAssistantController.js";
import { AssistantExperienceView, type AssistantExperienceViewProps } from "./AssistantExperience.js";

export interface AssistantEmbeddedProps
  extends Omit<AssistantExperienceViewProps, "controller">,
    AssistantConversationScope {
  client: LemmaClient;
  enabled?: boolean;
}

export function AssistantEmbedded({
  client,
  podId,
  assistantId,
  organizationId,
  enabled = true,
  ...props
}: AssistantEmbeddedProps) {
  const controller = useAssistantController({
    client,
    podId: podId ?? undefined,
    assistantId: assistantId ?? undefined,
    organizationId: organizationId ?? undefined,
    enabled,
  });

  return <AssistantExperienceView controller={controller} {...props} />;
}
