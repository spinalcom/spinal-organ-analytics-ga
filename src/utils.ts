
import { SpinalGraphService, SpinalNodeRef} from "spinal-env-viewer-graph-service";
import { SpinalContext, SpinalGraph, SpinalNode, SPINAL_RELATION_LST_PTR_TYPE, SPINAL_RELATION_PTR_LST_TYPE } from "spinal-model-graph";
import { SpinalTimeSeries, SpinalServiceTimeseries} from "spinal-model-timeseries"
import { spinalControlPointService } from "spinal-env-viewer-plugin-control-endpoint-service";
import { NetworkService, InputDataEndpoint }  from "spinal-model-bmsnetwork"


export const networkService = new NetworkService()


/**
 *
 * Function that returns rooms from the georaphic context
 * @export
 * @return {*} 
 */
export async function getRooms() {
    const context = SpinalGraphService.getContextWithType("geographicContext");

    if (context.length !== 0) {
        const contextId = context[0].info.id.get();

        const rooms = await SpinalGraphService.findInContext(contextId, contextId, (node: SpinalNode<any>) => {
            if (node.info.type.get() === "geographicRoom") {
                SpinalGraphService._addNode(node)
                return true;
            }
            return false;
        });

        return rooms;
    } else {
    
        return []; 
    }
}

/**
 *
 * Function that return the control endpoint that matches the nameFilter given in parameter
 * @export
 * @param {string} nodeId - Id of the object node ( building, room , floor, equipment)
 * @param {string} nameFilter - Name of the control endpoint we want to capture
 * @return {*} 
 */
export async function getControlEndpoint(nodeId:string, nameFilter:string){
    const NODE_TO_CONTROL_POINTS_RELATION = spinalControlPointService.ROOM_TO_CONTROL_GROUP // "hasControlPoints"
    const CONTROL_POINTS_TO_BMS_ENDPOINT_RELATION = "hasBmsEndpoint";
    let allControlPoints = await SpinalGraphService.getChildren(nodeId, [NODE_TO_CONTROL_POINTS_RELATION]);
    for (let controlPoint of allControlPoints) {
        // console.log(controlPoint);
        let allBmsEndpoints = await SpinalGraphService.getChildren(controlPoint.id.get(), [CONTROL_POINTS_TO_BMS_ENDPOINT_RELATION]);
        let test = allBmsEndpoints.filter(elt => elt.name.get() == nameFilter);
        if (test.length != 0) return test[0];
    }
    return false;
}


/**
 *
 * Function that returns a list of all bms devices in a specific room
 * @export
 * @param {string} nodeId - Id of the room
 * @return {*} 
 */
 export async function getBmsDevicesList(nodeId: string) {
    const result = [];
    const BimObjectList = await SpinalGraphService.getChildren(nodeId, ["hasBimObject"]); // gets the Bim Objects
      for (const BimObject of BimObjectList){

        const bmsdevice = await SpinalGraphService.getChildren(BimObject.id.get(),["hasBmsDevice"]);// gets the bls devices
        if (bmsdevice){
            result.push(...bmsdevice);
        }   
      }
    return result;

}
 





/**
 *
 * Function that filters a list of endpoints and returns the bmsEndpoints  whose name are in the filter list
 * @export
 * @param {*} bmsendpointList - List of bmsendpoints models
 * @param {string} filters  Liste of endpoints names 
 * @return {*} 
 */
export  function filterBmsEndpointList(bmsendpointList: any, filters: string[]): SpinalNodeRef[] {
    let outputBmsEndpoint: SpinalNodeRef[] = [];

    for (const bmsendpoint of bmsendpointList) {
        if (filters.some(filter => filters.includes(bmsendpoint.name.get()))){
            console.log(`Matching bmsendpoint: ${bmsendpoint.name.get()}, Filters: ${filters.join(", ")}\n`);
            outputBmsEndpoint.push(bmsendpoint);
        }
    }

    return outputBmsEndpoint;
}

   





/**
 * Function that calculates the average from a list of endpoints values 
 * @param EndpointsList 
 * @returns 
 */
export async function CalculateAnalytic(EndpointsList: SpinalNodeRef[]) {
    let values: number[] = [];
    let analytic = {
        average: NaN,
        minimum: NaN,
        maximum: NaN
    };

    for (const endpoint of EndpointsList) {
        const loaded = await endpoint.element.load();
        let value = loaded.currentValue.get();

        if (!Number.isNaN(value)) {
            values.push(value);
        } else {
            console.log("The value is NaN", endpoint.name.get());
        }
    }

    if (values.length > 0) {
        const sum = values.reduce((acc, curr) => acc + curr, 0);
        analytic.average = sum / values.length;
        analytic.minimum = Math.min(...values);
        analytic.maximum = Math.max(...values);
    }

    return analytic;
}




/**
 * Function that updates the current value of a controlenPoint with the average calculated in CalculateAnalytic
 * @param target 
 * @param valueToPush 
 * @param dataType 
 * @param type 
 */
export async function updateControlEndpointWithAnalytic(target:any, valueToPush:any, dataType:any, type:any){

    if(valueToPush != undefined){
        const input : InputDataEndpoint = {
            id: "",
            name: "",
            path: "",
            currentValue: valueToPush,
            unit: "",
            dataType: dataType,
            type: type,
            nodeTypeName: "BmsEndpoint"// should be SpinalBmsEndpoint.nodeTypeName || 'BmsEndpoint'
        };
        const time = new Date().setMinutes(0,0,0);   //Register in TimeSeries at hh:00:00
        await networkService.updateEndpoint(target,input,time);
    }
    else{
        console.log(valueToPush + " value to push in node : " + target.name.get() + " -- ABORTED !");
    }
}

/**
 * 
 * @param endpointList 
 * @param target 
 * @returns 
 */
export function removeFromlist(endpointList:Array<SpinalNodeRef> ,target:Array<string>): SpinalNodeRef[]{
 
    return endpointList.filter(x =>{
        return !target.includes(x.name.get())
    });
   
}



