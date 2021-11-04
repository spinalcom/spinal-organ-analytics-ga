
import { SpinalGraphService} from "spinal-env-viewer-graph-service";
import { SpinalNode } from "spinal-model-graph";
import { InputDataEndpointDataType, InputDataEndpointType }  from "spinal-model-bmsnetwork"
import * as utils from "./utils"


/**
 * Calculate the global energy for building and floors.
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @param {string} typeOfElement - Type of the spatial node. Expecting either a building or a floor for this parameter.
 * @return {*} 
 */
export async function calculateAnalyticsGlobalEnergy(elementId: string, typeOfElement: string) {
    let endpointList = [];
    let valueToPush = undefined;
    if (typeOfElement == "geographicBuilding") {
        let filter = "Comptage Energie Active Total";
        endpointList = await SpinalGraphService.getChildren(elementId, ["hasEndPoint"]);
        let bmsEndpoints = await utils.filterBmsEndpoint(endpointList, filter);
        valueToPush = await utils.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints);
    }
    else if (typeOfElement == "geographicFloor") {
        let filter = "Comptage Energie - General";
        endpointList = await SpinalGraphService.getChildren(elementId, ["hasEndPoint"]);
        let bmsEndpoints = await utils.filterBmsEndpoint(endpointList, filter);
        valueToPush = await utils.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints);
    }
    else {
        console.log("ERROR : TYPE = " + typeOfElement + " is not valid");
    }

    return valueToPush;
}

/**
 * Calculate the global CVC for building and floors.
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @param {string} typeOfElement - Type of the spatial node. Expecting either a building or a floor for this parameter.
 * @return {*} 
 */
export async function calculateAnalyticsGlobalCVC(elementId: string, typeOfElement: string) {
    let endpointList = [];
    let valueToPush = undefined;
    if (typeOfElement == "geographicBuilding") {
        let filter = "CVC";
        endpointList = await SpinalGraphService.getChildren(elementId, ["hasEndPoint"]);
        let bmsEndpoints = await utils.filterBmsEndpoint(endpointList, filter);
        valueToPush = await utils.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints);
        // return sum;
        // console.log(bmsEndpoints);
    }
    else if (typeOfElement == "geographicFloor") {
        let filter = "Comptage Energie - CVC";
        endpointList = await SpinalGraphService.getChildren(elementId, ["hasEndPoint"]);
        let bmsEndpoints = await utils.filterBmsEndpoint(endpointList, filter);
        valueToPush = await utils.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints);
        // console.log("ERROR : TYPE = " + typeOfElement + " is not valid");
    }
    else {
        console.log("ERROR : TYPE = " + typeOfElement + " is not valid");
    }

    return valueToPush;
}

/**
 * Calculate the global lighting for building and floors.
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @param {string} typeOfElement - Type of the spatial node. Expecting either a building or a floor for this parameter.
 * @return {*} 
 */
export async function calculateAnalyticsGlobalLighting(elementId: string, typeOfElement: string) {
    let endpointList = [];
    let valueToPush = undefined;
    if (typeOfElement == "geographicBuilding") {
        // il faut récupérer la conso de chaque étage depuis leur control point respectifs : une fonction spécifique pour Vinci a été créée
        valueToPush = await VINCI_specificUpdate_Lighting_Building_Analytics("Eclairage");
    }
    else if (typeOfElement == "geographicFloor") {
        let filter = "Comptage Energie - Eclairage";
        endpointList = await SpinalGraphService.getChildren(elementId, ["hasEndPoint"]);
        let bmsEndpoints = await utils.filterBmsEndpoint(endpointList, filter);
        valueToPush = await utils.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints);
    }
    else {
        console.log("ERROR : TYPE = " + typeOfElement + " is not valid");
    }
    return valueToPush;
}

/**
 * Calculate the global water consumption for building and floors.
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @param {string} typeOfElement - Type of the spatial node. Expecting either a building or a floor for this parameter.
 * @return {*} 
 */
export async function calculateAnalyticsGlobalWater(elementId: string, typeOfElement: string) {
    let endpointList = [];
    let valueToPush = undefined;
    if (typeOfElement == "geographicBuilding") {
        valueToPush = await utils.calculateAnalyticsFromChildren(elementId,typeOfElement,"Eau");
    }
    else if (typeOfElement == "geographicFloor") {
        let filter = "Volume EF";
        endpointList = await SpinalGraphService.getChildren(elementId, ["hasEndPoint"]);
        let bmsEndpoints = await utils.filterBmsEndpoint(endpointList, filter);
        valueToPush = await utils.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints);
        
    }
    else {
        console.log("ERROR : TYPE = " + typeOfElement + " is not valid");
    }

    return valueToPush;
}


/**
 *
 * Specific function to calculate building lighting for VINCI 
 * @export
 * @param {string} [analyticName="Eclairage"]
 * @return {*} 
 */
export async function VINCI_specificUpdate_Lighting_Building_Analytics(analyticName:string = "Eclairage"){
    // principe : il faut récupérer la conso de l eclairage de chaque étage depuis leur control point respectifs
    let valueToPush = undefined;
    let allBmsToSum = [];
    const spatialContext = (SpinalGraphService.getContextWithType("geographicContext"))[0];
    const spatialId = spatialContext.info.id.get();
    const floors = await SpinalGraphService.findInContext(spatialId, spatialId, (elt:SpinalNode<any>) => {
        if(elt.info.type.get() == "geographicFloor"){
            (<any>SpinalGraphService)._addNode(elt);
            return true;
        }
        return false;
    });
    for(const flr of floors){
        let bmsEndpoints = await utils.getControlEndpoint(flr.id.get(), analyticName);
        allBmsToSum = allBmsToSum.concat(bmsEndpoints);
    }
    valueToPush = await utils.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(allBmsToSum);
    return valueToPush;
}

/**
 * Specific function to calculate floor lighting for VINCI 
 * @export
 * @param {*} targetNode - The control endpoint node that should get updated
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @param {string} typeOfElement - Type of the spatial node. Expecting floor for this function
 * @param {string} [analyticName="Eclairage"]
 */
export async function VINCI_specificUpdate_Lighting_Floors_CP_Analytics(targetNode:any, elementId: string, typeOfElement: string, analyticName:string = "Eclairage"){
    // principe : on calcule l'analytics pour l etage -2, on le divise par 3 et on push dans -2 -1 et 0 (RDC)
    let analyticsResult = (await calculateAnalyticsGlobalLighting(elementId, typeOfElement)) / 3 ;
    // push dans -2
    await utils.updateControlEndpointWithAnalytic(targetNode, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
    // on récupère les bons control point de -1 et 0 et on push dedans
    let spatialContext = (SpinalGraphService.getContextWithType("geographicContext"))[0];
    let spatialId = spatialContext.info.id.get();
    let floors = await SpinalGraphService.findInContext(spatialId, spatialId, (elt:SpinalNode<any>) => {
        if(elt.info.type.get() == "geographicFloor" && (elt.info.name.get() == "-1" || elt.info.name.get() == "0")){
            (<any>SpinalGraphService)._addNode(elt);
            return true;
        }
        return false;
    });
    for(let flr of floors){
        let controlBmsEndpoint = await utils.getControlEndpoint(flr.id.get(), analyticName);
        if(controlBmsEndpoint != false){
            //console.log(analyticsResult);
            await utils.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
        }
        else{
            console.log("Impossible to update control point " + analyticName + " of floor : " + flr.name.get());
        }
    }
}


/**
 * Calculate CVC analytic for floors , specific to VINCI
 * @export
 * @param {*} targetNode - The control endpoint node that should get updated
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @param {string} typeOfElement - Type of the spatial node. Expecting floor for this function
 * @param {string} [analyticName="Climatisation"]
 */
export async function VINCI_specificUpdate_CVC_Floors_CP_Analytics(targetNode:any, elementId: string, typeOfElement: string, analyticName:string = "Climatisation"){
    // principe : on calcule l'analytics pour l etage -2, on le divise par 3 et on push dans -2 -1 et 0 (RDC)
    let analyticsResult = (await calculateAnalyticsGlobalCVC(elementId, typeOfElement)) / 3 ;
    // push dans -2
    await utils.updateControlEndpointWithAnalytic(targetNode, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
    // on récupère les bons control point de -1 et 0 et on push dedans
    let spatialContext = (SpinalGraphService.getContextWithType("geographicContext"))[0];
    let spatialId = spatialContext.info.id.get();
    let floors = await SpinalGraphService.findInContext(spatialId, spatialId, (elt:SpinalNode<any>) => {
        if(elt.info.type.get() == "geographicFloor" && (elt.info.name.get() == "-1" || elt.info.name.get() == "0")){
            (<any>SpinalGraphService)._addNode(elt);
            return true;
        }
        return false;
    });
    for(let flr of floors){
        let controlBmsEndpoint = await utils.getControlEndpoint(flr.id.get(), analyticName);
        if(controlBmsEndpoint != false){
            await utils.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
        }
        else{
            console.log("Impossible to update control point " + analyticName + " of floor : " + flr.name.get());
        }
    }
}


export async function calculateAnalyticsGlobalHeat(elementId: string, typeOfElement: string) {
    let endpointList = [];
    let valueToPush = undefined;
    if (typeOfElement == "geographicBuilding") {
        valueToPush = await utils.calculateAnalyticsFromChildren(elementId,typeOfElement,"Chauffage");
    }
    else if (typeOfElement == "geographicFloor") {
        let filter = "BECS";
        endpointList = await SpinalGraphService.getChildren(elementId, ["hasEndPoint"]);
        let bmsEndpoints = await utils.filterBmsEndpoint(endpointList, filter);
        valueToPush = await utils.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints);
        
    }
    else {
        console.log("ERROR : TYPE = " + typeOfElement + " is not valid");
    }

    return valueToPush;
}