/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * User response schema.
 */
export type UserResponse = {
    id: string;
    email: string;
    is_verified: boolean;
    is_active: boolean;
    is_superuser: boolean;
    first_name?: (string | null);
    last_name?: (string | null);
    mobile_number?: (string | null);
    country?: (string | null);
    timezone?: (string | null);
    date_of_birth?: (string | null);
    created_at: string;
    updated_at: string;
};

