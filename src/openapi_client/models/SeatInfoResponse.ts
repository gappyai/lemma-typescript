/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response for seat availability info.
 */
export type SeatInfoResponse = {
    current_seats: number;
    has_available_seats: boolean;
    organization_id: string;
    seat_limit: (number | null);
    seats_remaining: (number | null);
};

