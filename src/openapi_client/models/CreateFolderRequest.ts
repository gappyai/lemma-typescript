/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FileVisibility } from './FileVisibility.js';
export type CreateFolderRequest = {
    description?: (string | null);
    name: string;
    parent_id?: (string | null);
    /**
     * Optional visibility override for the new folder.
     */
    visibility?: (FileVisibility | null);
};

