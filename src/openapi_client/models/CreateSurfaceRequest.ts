/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GmailSurfaceConfigInput } from './GmailSurfaceConfigInput.js';
import type { OutlookSurfaceConfigInput } from './OutlookSurfaceConfigInput.js';
import type { SlackCredentialsInput } from './SlackCredentialsInput.js';
import type { SlackSurfaceConfigInput } from './SlackSurfaceConfigInput.js';
import type { SurfaceCredentialMode } from './SurfaceCredentialMode.js';
import type { SurfaceRoutingScope } from './SurfaceRoutingScope.js';
import type { TeamsCredentialsInput } from './TeamsCredentialsInput.js';
import type { TeamsSurfaceConfigInput } from './TeamsSurfaceConfigInput.js';
import type { TelegramCredentialsInput } from './TelegramCredentialsInput.js';
import type { TelegramSurfaceConfigInput } from './TelegramSurfaceConfigInput.js';
import type { WhatsAppCredentialsInput } from './WhatsAppCredentialsInput.js';
import type { WhatsAppSurfaceConfigInput } from './WhatsAppSurfaceConfigInput.js';
export type CreateSurfaceRequest = {
    assistant_name: string;
    config: (SlackSurfaceConfigInput | TeamsSurfaceConfigInput | WhatsAppSurfaceConfigInput | TelegramSurfaceConfigInput | GmailSurfaceConfigInput | OutlookSurfaceConfigInput);
    credential_mode?: SurfaceCredentialMode;
    credentials?: ((SlackCredentialsInput | TeamsCredentialsInput | WhatsAppCredentialsInput | TelegramCredentialsInput) | null);
    routing_scope?: SurfaceRoutingScope;
};

