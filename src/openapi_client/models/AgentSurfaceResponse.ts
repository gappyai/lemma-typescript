/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AgentSurfaceStatus } from './AgentSurfaceStatus.js';
import type { GmailSurfaceConfig } from './GmailSurfaceConfig.js';
import type { OutlookSurfaceConfig } from './OutlookSurfaceConfig.js';
import type { SlackSurfaceConfig } from './SlackSurfaceConfig.js';
import type { SurfaceCredentialMode } from './SurfaceCredentialMode.js';
import type { SurfaceRoutingScope } from './SurfaceRoutingScope.js';
import type { SurfaceWebhookMode } from './SurfaceWebhookMode.js';
import type { TeamsSurfaceConfig } from './TeamsSurfaceConfig.js';
import type { TelegramSurfaceConfig } from './TelegramSurfaceConfig.js';
import type { WhatsAppSurfaceConfig } from './WhatsAppSurfaceConfig.js';
export type AgentSurfaceResponse = {
    agent_id?: (string | null);
    agent_name?: (string | null);
    config: (SlackSurfaceConfig | TeamsSurfaceConfig | WhatsAppSurfaceConfig | TelegramSurfaceConfig | GmailSurfaceConfig | OutlookSurfaceConfig);
    credential_mode?: SurfaceCredentialMode;
    id: string;
    is_active: boolean;
    pod_id: string;
    routing_scope?: SurfaceRoutingScope;
    status?: AgentSurfaceStatus;
    surface_type: string;
    uses_default_agent?: boolean;
    webhook_mode?: SurfaceWebhookMode;
    webhook_url?: (string | null);
};

