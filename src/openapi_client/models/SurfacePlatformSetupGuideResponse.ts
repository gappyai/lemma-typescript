/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SurfaceIntegrationSetupGuide } from './SurfaceIntegrationSetupGuide.js';
import type { SurfacePlatform } from './SurfacePlatform.js';
export type SurfacePlatformSetupGuideResponse = {
    docs_path: string;
    integrations?: Array<SurfaceIntegrationSetupGuide>;
    platform: SurfacePlatform;
    summary: string;
    title: string;
};

