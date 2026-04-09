/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConvertedArtifactResponse } from './ConvertedArtifactResponse.js';
export type ConvertedFileResponse = {
    artifacts?: Array<ConvertedArtifactResponse>;
    detected_languages?: Array<string>;
    extraction_mode: string;
    generated_at: string;
    source_mime_type?: (string | null);
    source_name: string;
    source_path: string;
};

