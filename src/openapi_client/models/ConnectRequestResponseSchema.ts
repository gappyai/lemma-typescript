/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for connect request response.
 */
export type ConnectRequestResponseSchema = {
    id: string;
    user_id: string;
    application_id: string;
    authorization_url: (string | null);
    status: string;
    attributes: (Record<string, any> | null);
    created_at: string;
    updated_at: string;
};

