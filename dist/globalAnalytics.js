"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateAnalyticsGlobalHeat = exports.VINCI_specificUpdate_CVC_Floors_CP_Analytics = exports.VINCI_specificUpdate_Lighting_Floors_CP_Analytics = exports.VINCI_specificUpdate_Lighting_Building_Analytics = exports.calculateAnalyticsGlobalWater = exports.calculateAnalyticsGlobalLighting = exports.calculateAnalyticsGlobalCVC = exports.calculateAnalyticsGlobalEnergy = void 0;
const spinal_env_viewer_graph_service_1 = require("spinal-env-viewer-graph-service");
const spinal_model_bmsnetwork_1 = require("spinal-model-bmsnetwork");
const utils = require("./utils");
/**
 * Calculate the global energy for building and floors.
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @param {string} typeOfElement - Type of the spatial node. Expecting either a building or a floor for this parameter.
 * @return {*}
 */
async function calculateAnalyticsGlobalEnergy(elementId, typeOfElement) {
    let endpointList = [];
    let valueToPush = undefined;
    let filter = "";
    let bmsEndpoints = [];
    let elementNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(elementId);
    if (typeOfElement == "geographicBuilding") {
        let filter = "Comptage Energie Active Total";
        endpointList = await utils.getBmsDevices(elementId);
        let bmsEndpoints = await utils.filterBmsEndpoint(endpointList, filter);
        valueToPush = await utils.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints);
    }
    else if (typeOfElement == "geographicFloor") {
        switch (elementNode.info.name.get()) {
            case "0":
                filter = "Comptage Energie - General - TD ES";
                endpointList = await utils.getBmsDevices(elementId);
                bmsEndpoints = await utils.filterBmsEndpoint(endpointList, filter);
                //console.log(bmsEndpoints);
                valueToPush = await utils.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints);
                break;
            default:
                filter = "Comptage Energie - General - TD-B1";
                endpointList = await utils.getBmsDevices(elementId);
                bmsEndpoints = await utils.filterBmsEndpoint(endpointList, filter);
                //console.log(bmsEndpoints);
                valueToPush = await utils.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints);
                break;
        }
    }
    else {
        console.log("ERROR : TYPE = " + typeOfElement + " is not valid");
    }
    return valueToPush;
}
exports.calculateAnalyticsGlobalEnergy = calculateAnalyticsGlobalEnergy;
/**
 * Calculate the global CVC for building and floors.
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @param {string} typeOfElement - Type of the spatial node. Expecting either a building or a floor for this parameter.
 * @return {*}
 */
async function calculateAnalyticsGlobalCVC(elementId, typeOfElement) {
    let endpointList = [];
    let valueToPush = undefined;
    let filter = "";
    let bmsEndpoints = [];
    let elementNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(elementId);
    if (typeOfElement == "geographicBuilding") {
        valueToPush = await utils.calculateAnalyticsFromChildrenNoAverage(elementId, typeOfElement, "Climatisation");
        console.log("valueToPush for CVC = ", valueToPush);
    }
    else if (typeOfElement == "geographicFloor") {
        switch (elementNode.info.name.get()) {
            case "0":
                filter = "Comptage Energie - CVC - TDSG-B1-00";
                endpointList = await utils.getBmsDevices(elementId);
                bmsEndpoints = await utils.filterBmsEndpoint(endpointList, filter);
                //console.log(bmsEndpoints);
                valueToPush = await utils.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints);
                break;
            default:
                filter = "Comptage Energie - CVC - TD-B1";
                endpointList = await utils.getBmsDevices(elementId);
                bmsEndpoints = await utils.filterBmsEndpoint(endpointList, filter);
                //console.log(bmsEndpoints);
                valueToPush = await utils.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints);
                break;
        }
    }
    else {
        console.log("ERROR : TYPE = " + typeOfElement + " is not valid");
    }
    return valueToPush;
}
exports.calculateAnalyticsGlobalCVC = calculateAnalyticsGlobalCVC;
/**
 * Calculate the global lighting for building and floors.
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @param {string} typeOfElement - Type of the spatial node. Expecting either a building or a floor for this parameter.
 * @return {*}
 */
async function calculateAnalyticsGlobalLighting(elementId, typeOfElement) {
    let endpointList = [];
    let valueToPush = undefined;
    let filter = "";
    let bmsEndpoints = [];
    let elementNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(elementId);
    if (typeOfElement == "geographicBuilding") {
        // il faut récupérer la conso de chaque étage depuis leur control point respectifs : une fonction spécifique pour Vinci a été créée
        valueToPush = await await utils.calculateAnalyticsFromChildrenNoAverage(elementId, typeOfElement, "Eclairage");
    }
    else if (typeOfElement == "geographicFloor") {
        switch (elementNode.info.name.get()) {
            case "0":
                filter = "Comptage Energie - Eclairage - TDSG-B1-00";
                endpointList = await utils.getBmsDevices(elementId);
                bmsEndpoints = await utils.filterBmsEndpoint(endpointList, filter);
                console.log(bmsEndpoints);
                valueToPush = await utils.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints);
                break;
            default:
                filter = "Comptage Energie - Eclairage - TD-B1";
                endpointList = await utils.getBmsDevices(elementId);
                bmsEndpoints = await utils.filterBmsEndpoint(endpointList, filter);
                console.log(bmsEndpoints);
                valueToPush = await utils.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints);
                break;
        }
    }
    else {
        console.log("ERROR : TYPE = " + typeOfElement + " is not valid");
    }
    return valueToPush;
}
exports.calculateAnalyticsGlobalLighting = calculateAnalyticsGlobalLighting;
/**
 * Calculate the global water consumption for building and floors.
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @param {string} typeOfElement - Type of the spatial node. Expecting either a building or a floor for this parameter.
 * @return {*}
 */
async function calculateAnalyticsGlobalWater(elementId, typeOfElement) {
    let endpointList = [];
    let valueToPush = undefined;
    if (typeOfElement == "geographicBuilding") {
        valueToPush = await utils.calculateAnalyticsFromChildrenNoAverage(elementId, typeOfElement, "Eau");
    }
    else if (typeOfElement == "geographicFloor") {
        let filter = "Volume EF";
        endpointList = await utils.getBmsDevices(elementId);
        let bmsEndpoints = await utils.filterBmsEndpoint(endpointList, filter);
        console.log(bmsEndpoints);
        valueToPush = await utils.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints);
    }
    else {
        console.log("ERROR : TYPE = " + typeOfElement + " is not valid");
    }
    return valueToPush;
}
exports.calculateAnalyticsGlobalWater = calculateAnalyticsGlobalWater;
/**
 *
 * Specific function to calculate building lighting for VINCI
 * @export
 * @param {string} [analyticName="Eclairage"]
 * @return {*}
 */
async function VINCI_specificUpdate_Lighting_Building_Analytics(analyticName = "Eclairage") {
    // principe : il faut récupérer la conso de l eclairage de chaque étage depuis leur control point respectifs
    let valueToPush = undefined;
    let allBmsToSum = [];
    const spatialContext = (spinal_env_viewer_graph_service_1.SpinalGraphService.getContextWithType("geographicContext"))[0];
    const spatialId = spatialContext.info.id.get();
    const floors = await spinal_env_viewer_graph_service_1.SpinalGraphService.findInContext(spatialId, spatialId, (elt) => {
        if (elt.info.type.get() == "geographicFloor") {
            spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(elt);
            return true;
        }
        return false;
    });
    for (const flr of floors) {
        let bmsEndpoints = await utils.getControlEndpoint(flr.id.get(), analyticName);
        allBmsToSum = allBmsToSum.concat(bmsEndpoints);
    }
    valueToPush = await utils.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(allBmsToSum);
    return valueToPush;
}
exports.VINCI_specificUpdate_Lighting_Building_Analytics = VINCI_specificUpdate_Lighting_Building_Analytics;
/**
 * Specific function to calculate floor lighting for VINCI
 * @export
 * @param {*} targetNode - The control endpoint node that should get updated
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @param {string} typeOfElement - Type of the spatial node. Expecting floor for this function
 * @param {string} [analyticName="Eclairage"]
 */
async function VINCI_specificUpdate_Lighting_Floors_CP_Analytics(targetNode, elementId, typeOfElement, analyticName = "Eclairage") {
    // principe : on calcule l'analytics pour l etage -2, on le divise par 3 et on push dans -2 -1 et 0 (RDC)
    let analyticsResult = (await calculateAnalyticsGlobalLighting(elementId, typeOfElement)) / 3;
    analyticsResult = Math.round(analyticsResult * 1000) / 1000;
    // push dans -2
    await utils.updateControlEndpointWithAnalytic(targetNode, analyticsResult, spinal_model_bmsnetwork_1.InputDataEndpointDataType.Real, spinal_model_bmsnetwork_1.InputDataEndpointType.Other);
    // on récupère les bons control point de -1 et 0 et on push dedans
    let spatialContext = (spinal_env_viewer_graph_service_1.SpinalGraphService.getContextWithType("geographicContext"))[0];
    let spatialId = spatialContext.info.id.get();
    let floors = await spinal_env_viewer_graph_service_1.SpinalGraphService.findInContext(spatialId, spatialId, (elt) => {
        if (elt.info.type.get() == "geographicFloor" && (elt.info.name.get() == "-1" || elt.info.name.get() == "0")) {
            spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(elt);
            return true;
        }
        return false;
    });
    for (let flr of floors) {
        let controlBmsEndpoint = await utils.getControlEndpoint(flr.id.get(), analyticName);
        if (controlBmsEndpoint != false) {
            //console.log(analyticsResult);
            await utils.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, spinal_model_bmsnetwork_1.InputDataEndpointDataType.Real, spinal_model_bmsnetwork_1.InputDataEndpointType.Other);
        }
        else {
            console.log("Impossible to update control point " + analyticName + " of floor : " + flr.name.get());
        }
    }
}
exports.VINCI_specificUpdate_Lighting_Floors_CP_Analytics = VINCI_specificUpdate_Lighting_Floors_CP_Analytics;
/**
 * Calculate CVC analytic for floors , specific to VINCI
 * @export
 * @param {*} targetNode - The control endpoint node that should get updated
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @param {string} typeOfElement - Type of the spatial node. Expecting floor for this function
 * @param {string} [analyticName="Climatisation"]
 */
async function VINCI_specificUpdate_CVC_Floors_CP_Analytics(targetNode, elementId, typeOfElement, analyticName = "Climatisation") {
    // principe : on calcule l'analytics pour l etage -2, on le divise par 3 et on push dans -2 -1 et 0 (RDC)
    let analyticsResult = (await calculateAnalyticsGlobalCVC(elementId, typeOfElement)) / 3;
    analyticsResult = Math.round(analyticsResult * 1000) / 1000;
    // push dans -2
    await utils.updateControlEndpointWithAnalytic(targetNode, analyticsResult, spinal_model_bmsnetwork_1.InputDataEndpointDataType.Real, spinal_model_bmsnetwork_1.InputDataEndpointType.Other);
    // on récupère les bons control point de -1 et 0 et on push dedans
    let spatialContext = (spinal_env_viewer_graph_service_1.SpinalGraphService.getContextWithType("geographicContext"))[0];
    let spatialId = spatialContext.info.id.get();
    let floors = await spinal_env_viewer_graph_service_1.SpinalGraphService.findInContext(spatialId, spatialId, (elt) => {
        if (elt.info.type.get() == "geographicFloor" && (elt.info.name.get() == "-1" || elt.info.name.get() == "0")) {
            spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(elt);
            return true;
        }
        return false;
    });
    for (let flr of floors) {
        let controlBmsEndpoint = await utils.getControlEndpoint(flr.id.get(), analyticName);
        if (controlBmsEndpoint != false) {
            await utils.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, spinal_model_bmsnetwork_1.InputDataEndpointDataType.Real, spinal_model_bmsnetwork_1.InputDataEndpointType.Other);
        }
        else {
            console.log("Impossible to update control point " + analyticName + " of floor : " + flr.name.get());
        }
    }
}
exports.VINCI_specificUpdate_CVC_Floors_CP_Analytics = VINCI_specificUpdate_CVC_Floors_CP_Analytics;
async function calculateAnalyticsGlobalHeat(elementId, typeOfElement) {
    let endpointList = [];
    let valueToPush = undefined;
    if (typeOfElement == "geographicBuilding") {
        valueToPush = await utils.calculateAnalyticsFromChildrenNoAverage(elementId, typeOfElement, "Chauffage");
    }
    else if (typeOfElement == "geographicFloor") {
        let filter = "BECS";
        endpointList = await utils.getBmsDevices(elementId);
        //endpointList = await SpinalGraphService.getChildren(elementId, ["hasEndPoint"]);
        let bmsEndpoints = await utils.filterBmsEndpoint(endpointList, filter);
        console.log(bmsEndpoints);
        valueToPush = await utils.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints);
    }
    else {
        console.log("ERROR : TYPE = " + typeOfElement + " is not valid");
    }
    return valueToPush;
}
exports.calculateAnalyticsGlobalHeat = calculateAnalyticsGlobalHeat;
//# sourceMappingURL=globalAnalytics.js.map