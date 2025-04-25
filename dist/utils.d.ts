import { SpinalNodeRef } from "spinal-env-viewer-graph-service";
import { NetworkService } from "spinal-model-bmsnetwork";
export declare const networkService: NetworkService;
/**
 *
 * Function that returns rooms from the georaphic context
 * @export
 * @return {*}
 */
export declare function getRooms(): Promise<any>;
/**
 *
 * Function that return the control endpoint that matches the nameFilter given in parameter
 * @export
 * @param {string} nodeId - Id of the object node ( building, room , floor, equipment)
 * @param {string} nameFilter - Name of the control endpoint we want to capture
 * @return {*}
 */
export declare function getControlEndpoint(nodeId: string, nameFilter: string): Promise<false | SpinalNodeRef>;
/**
 *
 * Function that returns a list of all bms devices in a specific room
 * @export
 * @param {string} nodeId - Id of the room
 * @return {*}
 */
export declare function getBmsDevicesList(nodeId: string): Promise<any[]>;
/**
 *
 * Function that filters a list of endpoints and returns the bmsEndpoints  whose name are in the filter list
 * @export
 * @param {*} bmsendpointList - List of bmsendpoints models
 * @param {string} filters  Liste of endpoints names
 * @return {*}
 */
export declare function filterBmsEndpointList(bmsendpointList: any, filters: string[]): SpinalNodeRef[];
/**
 * Function that calculates the average from a list of endpoints values
 * @param EndpointsList
 * @returns
 */
export declare function CalculateAnalytic(EndpointsList: SpinalNodeRef[]): Promise<{
    average: number;
    minimum: number;
    maximum: number;
}>;
/**
 * Function that updates the current value of a controlenPoint with the average calculated in CalculateAnalytic
 * @param target
 * @param valueToPush
 * @param dataType
 * @param type
 */
export declare function updateControlEndpointWithAnalytic(target: any, valueToPush: any, dataType: any, type: any): Promise<void>;
/**
 *
 * @param endpointList
 * @param target
 * @returns
 */
export declare function removeFromlist(endpointList: Array<SpinalNodeRef>, target: Array<string>): SpinalNodeRef[];
