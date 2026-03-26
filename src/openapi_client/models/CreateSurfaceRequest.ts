/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EmailSurfaceConfigCreate } from './EmailSurfaceConfigCreate.js';
import type { SlackSurfaceConfigCreate } from './SlackSurfaceConfigCreate.js';
import type { TeamsSurfaceConfigCreate } from './TeamsSurfaceConfigCreate.js';
import type { WhatsAppSurfaceConfigCreate } from './WhatsAppSurfaceConfigCreate.js';
export type CreateSurfaceRequest = {
    assistant_name: string;
    config: (SlackSurfaceConfigCreate | TeamsSurfaceConfigCreate | WhatsAppSurfaceConfigCreate | EmailSurfaceConfigCreate);
};

