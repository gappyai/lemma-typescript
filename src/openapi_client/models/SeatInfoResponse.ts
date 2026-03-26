/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response for seat availability info.
 */
export type SeatInfoResponse = {
    organization_id: string;
    has_available_seats: boolean;
    seat_limit: (number | null);
    current_seats: number;
    seats_remaining: (number | null);
};

