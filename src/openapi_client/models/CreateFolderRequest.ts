/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FileVisibility } from './FileVisibility.js';
export type CreateFolderRequest = {
    description?: (string | null);
    path: string;
    /**
     * Optional visibility override for the new folder.
     */
    visibility?: (FileVisibility | null);
};

