import { NetworkService } from "spinal-model-bmsnetwork";
export declare const networkService: NetworkService;
/**
 *
 * Function that returns the analytic groups ( first room analytics then floor analytics then building analytics )
 * @export
 * @return {*}
 */
export declare function getAnalyticsGroup(): Promise<any[]>;
/**
 *
 * Function that calculate the sum of all endpoints current values given in parameter
 * @export
 * @param {*} bmsEndpoints - list of endpoint nodes
 * @return {*}
 */
export declare function sumTimeSeriesOfBmsEndpoints(bmsEndpoints: any): Promise<number>;
/**
 *
 * Function that calculate the sum of all endpoints values differences between last hour and current value
 * @export
 * @param {*} bmsEndpoints - list of endpoint nodes
 * @return {*}
 */
export declare function sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints: any): Promise<number>;
/**
 *
 * Function that return the control endpoint that matches the nameFilter given in parameter
 * @export
 * @param {string} nodeId - Id of the object node ( building, room , floor, equipment)
 * @param {string} nameFilter - Name of the control endpoint we want to capture
 * @return {*}
 */
export declare function getControlEndpoint(nodeId: string, nameFilter: string): Promise<false | import("spinal-env-viewer-graph-service/declarations/GraphManagerService").SpinalNodeRef>;
/**
 *
 * Function that returns all endpoints whose name contains the nameFilter
 * @export
 * @param {string} nodeId - Id of the object node ( building, room , floor, equipment)
 * @param {string} nameFilter - Substring of the endpoints name used to capture them
 * @return {*}
 */
export declare function getEndpoints(nodeId: string, nameFilter: string): Promise<any>;
/**
 *
 * Function that gives a control endpoint current value from an object id and the name of the control endpoint
 * @export
 * @param {string} nodeId - Id of the object node ( building, room , floor, equipment)
 * @param {string} controlEndpoint - Exact name of the control endpoint
 * @return {*}
 */
export declare function getValueFromControlEndpoint(nodeId: string, controlEndpoint: string): Promise<any>;
/**
 *
 * Function that filters a list of endpoints and returns the bmsEndpoints attached to the endpoints and whose name contain the filter
 * @export
 * @param {*} endpointList - List of endpoints nodes
 * @param {string} filter
 * @return {*}
 */
export declare function filterBmsEndpoint(endpointList: any, filter: string): Promise<any[]>;
/**
 *
 * Function that calculate an analytic value using the control endpoints of children nodes
 * @export
 * @param {string} elementId - Id of the object node we want to calculate analytic value of
 * @param {("geographicFloor" | "geographicBuilding")} typeOfElement - Type of the object node, either building or floor
 * @param {string} controlEndpointName - Name of the control endpoint used
 * @return {*}
 */
export declare function calculateAnalyticsFromChildren(elementId: string, typeOfElement: "geographicFloor" | "geographicBuilding", controlEndpointName: string): Promise<number>;
/**
 *
 * Function that updates a control endpoint value
 * @export
 * @param {*} target - Node to update
 * @param {*} valueToPush - The new value
 * @param {*} dataType - Type of the data ( see InputDataEndpoint data types)
 * @param {*} type - Type ( not really used )
 */
export declare function updateControlEndpointWithAnalytic(target: any, valueToPush: any, dataType: any, type: any): Promise<void>;
