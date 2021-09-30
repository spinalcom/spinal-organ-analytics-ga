/**
 *
 * Function that takes in the node ID of an Endpoint node and return the current value of said Endpoint
 * @export
 * @param {string} endpointId
 * @return {*}  {*}
 */
export declare function getEndpointValue(endpointId: string): any;
/**
 *
 * Function that takes in the node ID of a ControlEndpoint node and return the current value of said ControlEndpoint
 * @export
 * @param {string} controlEndpointId
 * @return {*}  {*}
 */
export declare function getControlEndpointValue(controlEndpointId: string): any;
/**
 *
 *
 * @export
 * @param {string} controlEndpointId
 * @param {*} value
 */
export declare function setControlEndpointValue(controlEndpointId: string, value: any): void;
