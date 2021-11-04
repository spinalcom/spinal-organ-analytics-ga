/**
 *
 * Function to calculate the number of tickets linked to the node and whose step is included in the stepIds array
 * @export
 * @param {string} nodeId - Id of node we want to count tickets on
 * @param {Array<String>} stepIds - Id of the steps we want to count the number of tickets on
 * @return {*} - Number of tickets
 */
export declare function getNumberTicket(nodeId: string, stepIds: Array<String>): Promise<number>;
/**
 *
 * Function that look for the ids of the ticket steps which represent an open ticket
 * @export
 * @return {*} - Ids of the ticket steps which represent an open ticket
 */
export declare function ticketsOuvertsFilter(): Promise<any>;
/**
 *
 * Function that gives the number of tickets of a node from his control endpoint ( faster because not calculating it again )
 * @export
 * @param {string} nodeId - Id of node we want to count tickets on
 * @return {*} Ticket count
 */
export declare function getNumberTicketFromControlEndpoint(nodeId: string): Promise<any>;
/**
 *
 * Function to calculate a room ticket count that are included in stepIds
 * @export
 * @param {string} nodeId - Id of node we want to count tickets on
 * @param {*} stepIds - Id of the steps we want to count the number of tickets on
 * @return {*} Number of tickets
 */
export declare function getRoomTicketCount(nodeId: string, stepIds: any): Promise<number>;
/**
 *
 * Function to calculate a floor ticket count that are included in stepIds
 * @export
 * @param {string} nodeId - Id of node we want to count tickets on
 * @param {*} stepIds - Id of the steps we want to count the number of tickets on
 * @return {*} Number of tickets
 */
export declare function getFloorTicketCount(nodeId: string, stepIds: any): Promise<number>;
/**
 *
 * Function to calculate a building ticket count that are included in stepIds
 * @export
 * @param {string} nodeId - Id of node we want to count tickets on
 * @param {*} stepIds - Id of the steps we want to count the number of tickets on
 * @return {*} Number of tickets
 */
export declare function getBuildingTicketCount(nodeId: string, stepIds: any): Promise<number>;
/**
 *
 * Function to update ticket control endpoints
 * @export
 * @param {string} nodeId - Id of node we want to update the control endpoint of
 * @param {string} nodeType - Type of the node (building, floor, room)
 * @param {*} targetNode - The control endpoint node we want to update
 * @param {*} stepIds - Id of the steps we want to count the number of tickets on
 */
export declare function updateTicketControlPoints(nodeId: string, nodeType: string, targetNode: any, stepIds: any): Promise<void>;
