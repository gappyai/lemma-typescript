/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Configuration for Loop node.
 */
export type LoopNodeConfig = {
    /**
     * Path to array in execution state
     */
    items_path: string;
    /**
     * Variable name for current item
     */
    item_var_name?: string;
    /**
     * ID of the node to execute for each item
     */
    child_node_id: string;
};

