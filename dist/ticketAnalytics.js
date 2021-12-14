"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTicketControlPoints = exports.getBuildingTicketCount = exports.getFloorTicketCount = exports.getRoomTicketCount = exports.getNumberTicketFromControlEndpoint = exports.ticketsOuvertsFilter = exports.getNumberTicket = void 0;
const spinal_env_viewer_graph_service_1 = require("spinal-env-viewer-graph-service");
const spinal_model_bmsnetwork_1 = require("spinal-model-bmsnetwork");
const utils = require("./utils");
/**
 *
 * Function to calculate the number of tickets linked to the node and whose step is included in the stepIds array
 * @export
 * @param {string} nodeId - Id of node we want to count tickets on
 * @param {Array<String>} stepIds - Id of the steps we want to count the number of tickets on
 * @return {*} - Number of tickets
 */
async function getNumberTicket(nodeId, stepIds) {
    const tickets = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId, ["SpinalSystemServiceTicketHasTicket"]);
    let count = 0;
    if (tickets.length != 0) {
        for (const ticket of tickets) {
            if (stepIds && stepIds.includes(ticket.stepId.get())) {
                count += 1;
            }
        }
    }
    return count;
}
exports.getNumberTicket = getNumberTicket;
/**
 *
 * Function that look for the ids of the ticket steps which represent an open ticket
 * @export
 * @return {*} - Ids of the ticket steps which represent an open ticket
 */
async function ticketsOuvertsFilter() {
    const stepNames = ["Attente de lect.avant Execution", "Attente de réalisation", "Réalisation partielle"];
    //const stepNames = ["Clôturée","Refusée","Archived"];
    const ctxt = await spinal_env_viewer_graph_service_1.SpinalGraphService.getContextWithType("SpinalSystemServiceTicket");
    const contextId = ctxt[0].info.id.get();
    const steps = await spinal_env_viewer_graph_service_1.SpinalGraphService.findInContext(contextId, contextId, (node) => {
        if (node.getType().get() == "SpinalSystemServiceTicketTypeStep" && stepNames.includes(node.getName().get())) {
            spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(node);
            return true;
        }
        else
            return false;
    });
    const stepIds = steps.map(el => el.get().id);
    return stepIds;
}
exports.ticketsOuvertsFilter = ticketsOuvertsFilter;
/**
 *
 * Function that gives the number of tickets of a node from his control endpoint ( faster because not calculating it again )
 * @export
 * @param {string} nodeId - Id of node we want to count tickets on
 * @return {*} Ticket count
 */
async function getNumberTicketFromControlEndpoint(nodeId) {
    const node = await utils.getControlEndpoint(nodeId, "Nombre de tickets");
    if (node != false) {
        const bmsEndpoint = await node.element.load();
        return bmsEndpoint.get().currentValue;
    }
    return 0;
}
exports.getNumberTicketFromControlEndpoint = getNumberTicketFromControlEndpoint;
/**
 *
 * Function to calculate a room ticket count that are included in stepIds
 * @export
 * @param {string} nodeId - Id of node we want to count tickets on
 * @param {*} stepIds - Id of the steps we want to count the number of tickets on
 * @return {*} Number of tickets
 */
async function getRoomTicketCount(nodeId, stepIds) {
    const equipments = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId, ["hasBimObject"]);
    let res = await getNumberTicket(nodeId, stepIds);
    for (const equipment of equipments) {
        res += await getNumberTicket(equipment.id.get(), stepIds);
    }
    return res;
}
exports.getRoomTicketCount = getRoomTicketCount;
/**
 *
 * Function to calculate a floor ticket count that are included in stepIds
 * @export
 * @param {string} nodeId - Id of node we want to count tickets on
 * @param {*} stepIds - Id of the steps we want to count the number of tickets on
 * @return {*} Number of tickets
 */
async function getFloorTicketCount(nodeId, stepIds) {
    const rooms = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId, ["hasGeographicRoom"]);
    let res = await getNumberTicket(nodeId, stepIds);
    for (const room of rooms) {
        res += await getNumberTicket(room.id.get(), stepIds);
    }
    return res;
}
exports.getFloorTicketCount = getFloorTicketCount;
/**
 *
 * Function to calculate a building ticket count that are included in stepIds
 * @export
 * @param {string} nodeId - Id of node we want to count tickets on
 * @param {*} stepIds - Id of the steps we want to count the number of tickets on
 * @return {*} Number of tickets
 */
async function getBuildingTicketCount(nodeId, stepIds) {
    const floors = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId, ["hasGeographicFloor"]);
    let res = await getNumberTicket(nodeId, stepIds);
    for (const floor of floors) {
        res += await getNumberTicketFromControlEndpoint(floor.id.get());
    }
    return res;
}
exports.getBuildingTicketCount = getBuildingTicketCount;
/**
 *
 * Function to update ticket control endpoints
 * @export
 * @param {string} nodeId - Id of node we want to update the control endpoint of
 * @param {string} nodeType - Type of the node (building, floor, room)
 * @param {*} targetNode - The control endpoint node we want to update
 * @param {*} stepIds - Id of the steps we want to count the number of tickets on
 */
async function updateTicketControlPoints(nodeId, nodeType, targetNode, stepIds) {
    let count = 0;
    if (nodeType == "geographicBuilding") {
        count = await getBuildingTicketCount(nodeId, stepIds);
    }
    else if (nodeType == "geographicFloor") {
        count = await getFloorTicketCount(nodeId, stepIds);
    }
    else if (nodeType == "geographicRoom") {
        count = await getRoomTicketCount(nodeId, stepIds);
    }
    utils.updateControlEndpointWithAnalytic(targetNode, count, spinal_model_bmsnetwork_1.InputDataEndpointDataType.Integer, spinal_model_bmsnetwork_1.InputDataEndpointType.Other);
}
exports.updateTicketControlPoints = updateTicketControlPoints;
//# sourceMappingURL=ticketAnalytics.js.map