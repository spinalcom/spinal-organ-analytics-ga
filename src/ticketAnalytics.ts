import { SpinalNode } from "spinal-model-graph";
import { SpinalGraphService } from "spinal-env-viewer-graph-service";
import { InputDataEndpointDataType, InputDataEndpointType}  from "spinal-model-bmsnetwork"

import * as utils from "./utils"


/**
 *
 * Function to calculate the number of tickets linked to the node and whose step is included in the stepIds array
 * @export
 * @param {string} nodeId - Id of node we want to count tickets on
 * @param {Array<String>} stepIds - Id of the steps we want to count the number of tickets on
 * @return {*} - Number of tickets
 */
export async function getNumberTicket(nodeId: string,stepIds : Array<String>){
    const tickets = await SpinalGraphService.getChildren(nodeId, ["SpinalSystemServiceTicketHasTicket"]);
    let count = 0;
    if(tickets.length != 0){
        for (const ticket of tickets){
            if (stepIds && stepIds.includes(ticket.stepId.get())){
                count +=1;
            }
        }
    }
    return count;
}

/**
 *
 * Function that look for the ids of the ticket steps which represent an open ticket
 * @export
 * @return {*} - Ids of the ticket steps which represent an open ticket
 */
export async function ticketsOuvertsFilter(){
    const stepNames = ["Attente de lect.avant Execution","Attente de réalisation","Réalisation partielle"];
    //const stepNames = ["Clôturée","Refusée","Archived"];
    const ctxt = await SpinalGraphService.getContextWithType("SpinalSystemServiceTicket");
    const contextId = ctxt[0].info.id.get();
    const steps = await SpinalGraphService.findInContext(contextId,contextId,(node: SpinalNode<any>) => {
        if(node.getType().get() == "SpinalSystemServiceTicketTypeStep" && stepNames.includes(node.getName().get()) ){
            (<any>SpinalGraphService)._addNode(node)
            return true;
        }
        else return false;
    });
    const stepIds = steps.map(el => el.get().id);
    return stepIds;

}

/**
 *
 * Function that gives the number of tickets of a node from his control endpoint ( faster because not calculating it again )
 * @export
 * @param {string} nodeId - Id of node we want to count tickets on
 * @return {*} Ticket count
 */
export async function getNumberTicketFromControlEndpoint(nodeId : string){
    const node = await utils.getControlEndpoint(nodeId,"Nombre de tickets")

    if (node != false){
        const bmsEndpoint = await node.element.load();
        return bmsEndpoint.get().currentValue;
    }
    return 0;
}

/**
 *
 * Function to calculate a room ticket count that are included in stepIds
 * @export
 * @param {string} nodeId - Id of node we want to count tickets on
 * @param {*} stepIds - Id of the steps we want to count the number of tickets on
 * @return {*} Number of tickets
 */
export async function  getRoomTicketCount(nodeId:string,stepIds){
    const equipments = await SpinalGraphService.getChildren(nodeId,["hasBimObject"]);
    let res = await getNumberTicket(nodeId,stepIds);
    for (const equipment of equipments) {
        res += await getNumberTicket(equipment.id.get(),stepIds);
    }
    return res;

}
/**
 *
 * Function to calculate a floor ticket count that are included in stepIds
 * @export
 * @param {string} nodeId - Id of node we want to count tickets on
 * @param {*} stepIds - Id of the steps we want to count the number of tickets on
 * @return {*} Number of tickets
 */
export async function  getFloorTicketCount(nodeId:string,stepIds){
    const rooms= await SpinalGraphService.getChildren(nodeId,["hasGeographicRoom"]);
    let res = await getNumberTicket(nodeId,stepIds);
    for (const room of rooms) {
        res += await getNumberTicket(room.id.get(),stepIds);
    }
    return res;
}

/**
 *
 * Function to calculate a building ticket count that are included in stepIds
 * @export
 * @param {string} nodeId - Id of node we want to count tickets on
 * @param {*} stepIds - Id of the steps we want to count the number of tickets on
 * @return {*} Number of tickets
 */
export async function  getBuildingTicketCount(nodeId:string,stepIds){
    const floors= await SpinalGraphService.getChildren(nodeId,["hasGeographicFloor"]);
    let res = await getNumberTicket(nodeId,stepIds);
    for (const floor of floors) {
        res += await getNumberTicketFromControlEndpoint(floor.id.get());
    }
    return res;
}

/**
 *
 * Function to update ticket control endpoints
 * @export
 * @param {string} nodeId - Id of node we want to update the control endpoint of
 * @param {string} nodeType - Type of the node (building, floor, room)
 * @param {*} targetNode - The control endpoint node we want to update
 * @param {*} stepIds - Id of the steps we want to count the number of tickets on
 */
export async function updateTicketControlPoints(nodeId : string, nodeType : string, targetNode , stepIds){
    let count = 0;
    if(nodeType == "geographicBuilding") {
        count = await getBuildingTicketCount(nodeId,stepIds);
    }
    else if (nodeType == "geographicFloor"){
        count = await getFloorTicketCount(nodeId,stepIds);
    }
    else if(nodeType == "geographicRoom"){
        count = await getRoomTicketCount(nodeId,stepIds);
    }
    utils.updateControlEndpointWithAnalytic(targetNode,count,InputDataEndpointDataType.Integer,InputDataEndpointType.Other)
}