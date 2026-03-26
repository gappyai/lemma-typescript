/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type FileInfo = {
    name: string;
    path: string;
    type: FileInfo.type;
    size?: (number | null);
    created?: (string | null);
    last_modified?: (string | null);
};
export namespace FileInfo {
    export enum type {
        FILE = 'file',
        DIRECTORY = 'directory',
    }
}

