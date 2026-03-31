/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type FileInfo = {
    created?: (string | null);
    last_modified?: (string | null);
    name: string;
    path: string;
    size?: (number | null);
    type: FileInfo.type;
};
export namespace FileInfo {
    export enum type {
        FILE = 'file',
        DIRECTORY = 'directory',
    }
}

