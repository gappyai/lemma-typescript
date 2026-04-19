/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssistantSurfaceStatus } from './AssistantSurfaceStatus.js';
import type { GmailSurfaceConfig } from './GmailSurfaceConfig.js';
import type { OutlookSurfaceConfig } from './OutlookSurfaceConfig.js';
import type { SlackSurfaceConfig } from './SlackSurfaceConfig.js';
import type { SurfaceCredentialMode } from './SurfaceCredentialMode.js';
import type { SurfaceRoutingScope } from './SurfaceRoutingScope.js';
import type { SurfaceWebhookMode } from './SurfaceWebhookMode.js';
import type { TeamsSurfaceConfig } from './TeamsSurfaceConfig.js';
import type { TelegramSurfaceConfig } from './TelegramSurfaceConfig.js';
import type { WhatsAppSurfaceConfig } from './WhatsAppSurfaceConfig.js';
export type AssistantSurfaceResponse = {
    assistant_id: string;
    assistant_name?: (string | null);
    config: (SlackSurfaceConfig | TeamsSurfaceConfig | WhatsAppSurfaceConfig | TelegramSurfaceConfig | GmailSurfaceConfig | OutlookSurfaceConfig);
    credential_mode?: SurfaceCredentialMode;
    id: string;
    is_active: boolean;
    pod_id: string;
    routing_scope?: SurfaceRoutingScope;
    status?: AssistantSurfaceStatus;
    surface_type: string;
    webhook_mode?: SurfaceWebhookMode;
    webhook_url?: (string | null);
};

