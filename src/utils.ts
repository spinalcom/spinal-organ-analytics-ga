
import { SpinalGraphService} from "spinal-env-viewer-graph-service";
import { SpinalContext, SpinalGraph, SpinalNode, SPINAL_RELATION_LST_PTR_TYPE, SPINAL_RELATION_PTR_LST_TYPE } from "spinal-model-graph";
import { SpinalTimeSeries} from "spinal-model-timeseries"
import { spinalControlPointService } from "spinal-env-viewer-plugin-control-endpoint-service";
import { NetworkService, InputDataEndpoint }  from "spinal-model-bmsnetwork"


export const networkService = new NetworkService()

/**
 *
 * Function that returns the analytic groups ( first room analytics then floor analytics then building analytics )
 * @export
 * @return {*} 
 */
export async function getAnalyticsGroup() {
    const context = SpinalGraphService.getContextWithType("AnalyticGroupContext");
        let orderedAnalyticGroups = [];
        if(context.length !=0 ){
            const contextId = context[0].info.id.get();
            let analyticGroups = await SpinalGraphService.findInContext(contextId, contextId, (elt: SpinalNode<any>) => {
                if(elt.info.type.get() == "AnalyticGroup"){
                    (<any>SpinalGraphService)._addNode(elt);
                    return true;
                }
                else return false;
            });
            // classement Piece puis Etage puis Batiment
            let bat = analyticGroups.filter(group => (group.name.get() == "Bâtiment" || group.name.get() == "Batiment" || group.name.get() == "Building"));
            let flr = analyticGroups.filter(group => (group.name.get() == "Etage" || group.name.get() == "Etages"));
            let rom = analyticGroups.filter(group => (group.name.get() == "Pièces" || group.name.get() == "Pièce" || group.name.get() == "Pieces" || group.name.get() == "Piece"));
            orderedAnalyticGroups = rom.concat(flr, bat);
            return orderedAnalyticGroups;
        }
} 

/**
 * 
 * Function that calculate the sum of all endpoints current values given in parameter
 * @export
 * @param {*} bmsEndpoints - list of endpoint nodes
 * @return {*} 
 */
export async function sumTimeSeriesOfBmsEndpoints(bmsEndpoints: any) {
    let sum = 0;
    for (let bms of bmsEndpoints) {
        let timeSeriesModel = await SpinalGraphService.getChildren(bms.id.get(), ["hasTimeSeries"]);
        if(timeSeriesModel.length !=0){
            let timeSeriesNode = SpinalGraphService.getRealNode(timeSeriesModel[0].id.get());
            let spinalTs = await timeSeriesNode.getElement();
            let currentData = await spinalTs.getCurrent();
            if(currentData != undefined){
                sum += currentData.value;
            }
        }
        
    }
    return sum;
}

/**
 *
 * Function that calculate the sum of all endpoints values differences between last hour and current value
 * @export
 * @param {*} bmsEndpoints - list of endpoint nodes
 * @return {*} 
 */
export async function sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints: any) {
    let sum = 0;
    for (let bms of bmsEndpoints) {
        let timeSeriesModel = await SpinalGraphService.getChildren(bms.id.get(), ["hasTimeSeries"]);
        let timeSeriesNode = SpinalGraphService.getRealNode(timeSeriesModel[0].id.get());
        let spinalTs : SpinalTimeSeries = await timeSeriesNode.getElement();
        
        let valueLastHour = undefined
        let value = undefined
        let data = await spinalTs.getDataFromLastHours();
        for await ( const x of data){
            if (!valueLastHour) {
                valueLastHour = x.value;
            }
            value = x.value;
        }
        //console.log("h-1 value:",valueLastHour, " | current value:",value);
        sum += (value - valueLastHour);
    }
    //console.log(" TOTAL DIFFERENCE : ", sum);
    return sum;
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
 * Function that returns all endpoints whose name contains the nameFilter 
 * @export
 * @param {string} nodeId - Id of the object node ( building, room , floor, equipment)
 * @param {string} nameFilter - Substring of the endpoints name used to capture them
 * @return {*} 
 */
export async function getEndpoints(nodeId: string, nameFilter: string) {
    const element_to_endpoint_relation = "hasEndPoint";
    const node = SpinalGraphService.getRealNode(nodeId);
    const EndpointProfils = await SpinalGraphService.getChildren(nodeId, [element_to_endpoint_relation]);
    for (const endpointProfil of EndpointProfils) { // pour chaque profil de control endpoint
        const endpointsModels = await SpinalGraphService.getChildren(endpointProfil.id.get(), ["hasBmsEndpoint"]);
        const endpoints = endpointsModels.map(el => el.get());
        for (const endpoint of endpoints) {
            if (endpoint.name.get() == nameFilter) return endpoint.id.get()
        }
    }
    return undefined;
}

/**
 *
 * Function that gives a control endpoint current value from an object id and the name of the control endpoint
 * @export
 * @param {string} nodeId - Id of the object node ( building, room , floor, equipment)
 * @param {string} controlEndpoint - Exact name of the control endpoint 
 * @return {*} 
 */
export async function getValueFromControlEndpoint (nodeId :string , controlEndpoint : string){
    const node = await this.getControlEndpoint(nodeId,controlEndpoint)

    if (node != false){
        const bmsEndpoint = await node.element.load();
        return bmsEndpoint.get().currentValue;
    }
    return 0;
}

/**
 *
 * Function that filters a list of endpoints and returns the bmsEndpoints attached to the endpoints and whose name contain the filter
 * @export
 * @param {*} endpointList - List of endpoints nodes
 * @param {string} filter
 * @return {*} 
 */
export async function filterBmsEndpoint(endpointList: any, filter: string) {
    let outputBmsEndpoint = [];
    for (const endpoint of endpointList) {
        let bmsEndpoints = await SpinalGraphService.getChildren(endpoint.id.get(), ["hasBmsEndpoint"]);
        for (const bms of bmsEndpoints) {
            if (bms.name.get().includes(filter)) outputBmsEndpoint.push(bms);
            // if(bms.name.get().includes(filter)) outputBmsEndpoint.push(bms.name.get());
        }
    }
    return outputBmsEndpoint;
}

/**
 *
 * Function that calculate an analytic value using the control endpoints of children nodes
 * @export
 * @param {string} elementId - Id of the object node we want to calculate analytic value of
 * @param {("geographicFloor" | "geographicBuilding")} typeOfElement - Type of the object node, either building or floor
 * @param {string} controlEndpointName - Name of the control endpoint used
 * @return {*} 
 */
export async function calculateAnalyticsFromChildren(elementId : string, typeOfElement : "geographicFloor" | "geographicBuilding",controlEndpointName : string){
    if(typeOfElement == "geographicFloor"){
        // on récupère les rooms dans l'étage
        const rooms = await SpinalGraphService.getChildren(elementId,["hasGeographicRoom"]);
        // Pour chaque room
        let res= 0;
        let count = 0;
        for(const room of rooms) {
            const monitorable = await getControlEndpoint(room.id.get(),"Monitorable")
            if (monitorable != false){
                const valueMonitorable = await monitorable.element.load();
                // Si la room est monitorée
                if (valueMonitorable.get().currentValue == "Monitorée"){
                    // On récupère le controlEndpoint
                    const controlEndpoint = await getControlEndpoint(room.id.get(),controlEndpointName);
                    if (controlEndpoint != false){
                        const loaded = await controlEndpoint.element.load();
                        let val = loaded.get().currentValue;
                        if(val>0){
                            res =  res + val;
                            count += 1;
                        }
                        
                    }
                }
            }
        } // fin boucle sur les rooms
        if(count == 0) return 0;
        return res/count;

    } else if(typeOfElement == "geographicBuilding") {
        const floors = await SpinalGraphService.getChildren(elementId,["hasGeographicFloor"]);
        let res= 0;
        let count = 0;
        for(const floor of floors) {
            // On récupère le controlEndpoint
            const controlEndpoint = await getControlEndpoint(floor.id.get(),controlEndpointName);
            if (controlEndpoint != false){
                const loaded = await controlEndpoint.element.load();
                let val = loaded.get().currentValue;
                if(val>0){
                    //console.log("floor ",val);
                    res =  res + val;
                    count += 1;
                }
            }
        } // fin boucle sur les floors
        if(count == 0) return 0;
        return res/count;
    }
}
// Rajouter la même fonction sans la division ( juste somme pour consommation eau globale par exemple )





/**
 *
 * Function that updates a control endpoint value 
 * @export
 * @param {*} target - Node to update
 * @param {*} valueToPush - The new value
 * @param {*} dataType - Type of the data ( see InputDataEndpoint data types)
 * @param {*} type - Type ( not really used )
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
        await networkService.updateEndpoint(target,input);
    }
    else{
        console.log(valueToPush + " value to push in node : " + target.name.get() + " -- ABORTED !");
    }
}