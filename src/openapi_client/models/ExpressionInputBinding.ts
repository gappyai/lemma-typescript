/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Resolve a workflow input value from execution context using workflow expressions.
 */
export type ExpressionInputBinding = {
    type?: string;
    /**
     * Expression evaluated against the shared execution context. Expressions currently use JMESPath syntax. Example: `start.payload.issue.key` or `collect_input.amount`.
     */
    value: string;
};

