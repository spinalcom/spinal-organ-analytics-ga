"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateAnalyticsNumberOfPersons = exports.calculateAnalyticsGlobalHeat = exports.VINCI_specificUpdate_CVC_Floors_CP_Analytics = exports.VINCI_specificUpdate_Lighting_Floors_CP_Analytics = exports.VINCI_specificUpdate_Lighting_Building_Analytics = exports.calculateAnalyticsGlobalWater = exports.calculateAnalyticsGlobalWaterToilet = exports.calculateAnalyticsGlobalLighting = exports.calculateAnalyticsGlobalCVC = exports.calculateAnalyticsGlobalEnergy = void 0;
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
        filter = "Comptage Energie Active Total";
        endpointList = await utils.getBmsDevices(elementId);
        bmsEndpoints = await utils.filterBmsEndpoint(endpointList, filter);
        // console.log(bmsEndpoints);
        valueToPush = await utils.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints);
    }
    else if (typeOfElement == "geographicFloor") {
        switch (elementNode.info.name.get()) {
            case "0":
                filter = "Comptage Energie - General - TD ES 001";
                endpointList = await utils.getBmsDevices(elementId);
                bmsEndpoints = await utils.filterBmsEndpoint(endpointList, filter);
                // console.log(bmsEndpoints);
                valueToPush = await utils.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints);
                ;
                break;
            default:
                filter = "Comptage Energie - General";
                endpointList = await utils.getBmsDevices(elementId);
                bmsEndpoints = await utils.filterBmsEndpoint(endpointList, filter);
                // console.log(bmsEndpoints);
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
    if (typeOfElement == "geographicBuilding") {
        valueToPush = await utils.calculateAnalyticsFromChildrenNoAverage(elementId, typeOfElement, "Climatisation");
        console.log("valueToPush for CVC = ", valueToPush);
    }
    else if (typeOfElement == "geographicFloor") {
        let filter = "Comptage Energie - CVC";
        endpointList = await utils.getBmsDevices(elementId);
        let bmsEndpoints = await utils.filterBmsEndpoint(endpointList, filter);
        //console.log(bmsEndpoints);
        valueToPush = await utils.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints);
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
    let valueToPush = undefined;
    if (typeOfElement == "geographicBuilding") {
        // il faut récupérer la conso de chaque étage depuis leur control point respectifs : une fonction spécifique pour Vinci a été créée
        valueToPush = await await utils.calculateAnalyticsFromChildrenNoAverage(elementId, typeOfElement, "Eclairage");
        console.log("TOTAL = ", valueToPush);
    }
    else if (typeOfElement == "geographicFloor") {
        let filter = "Comptage Energie - Eclairage";
        let endpointList = await utils.getBmsDevices(elementId);
        let bmsEndpoints = await utils.filterBmsEndpoint(endpointList, filter);
        // for(let bms of bmsEndpoints){
        //     console.log(bms.name.get());
        // }
        valueToPush = await utils.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints);
    }
    else {
        console.log("ERROR : TYPE = " + typeOfElement + " is not valid");
    }
    return valueToPush;
}
exports.calculateAnalyticsGlobalLighting = calculateAnalyticsGlobalLighting;
/**
 * Calculate the global water consumption of toilets for building and floors.
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @param {string} typeOfElement - Type of the spatial node. Expecting either a building or a floor for this parameter.
 * @return {*}
 */
async function calculateAnalyticsGlobalWaterToilet(elementId, typeOfElement) {
    let endpointList = [];
    let valueToPush = undefined;
    let bmsEndpoints = [];
    let elementNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(elementId);
    if (typeOfElement == "geographicBuilding") {
        // sommer les valeurs des control point des étages qui sont en "L" et diviser sur 1000 pour revenir à "m3" (car la transformation en L se fait dans index.js)
        valueToPush = (await utils.calculateAnalyticsFromChildrenNoAverage(elementId, typeOfElement, "Eau sanitaire")) / 1000;
        console.log("TOTAL = ", valueToPush);
    }
    else if (typeOfElement == "geographicFloor") {
        let filter = "Volume EF";
        let removeItems = [];
        let bmsEndpointNotFiltred = [];
        switch (elementNode.info.name.get()) {
            case "2":
                removeItems = ["BAT_B1 Volume EF N02 Pied de Colonne Sanitaire 1 Batterie Basse",
                    "BAT_B1 Volume EF N02 Pied de Colonne Sanitaire 1 Batterie Haute",
                    "BAT_B1 Volume EF N02 Pied de Colonne Sanitaire 2 Batterie Basse",
                    "BAT_B1 Volume EF N02 Pied de Colonne Sanitaire 2 Batterie Haute"];
                endpointList = await utils.getBmsDevices(elementId);
                bmsEndpointNotFiltred = await utils.filterBmsEndpoint(endpointList, filter);
                bmsEndpoints = utils.removeFromlist(bmsEndpointNotFiltred, removeItems);
                break;
            default:
                endpointList = await utils.getBmsDevices(elementId);
                bmsEndpoints = await utils.filterBmsEndpoint(endpointList, filter);
                break;
        }
        // console.log(bmsEndpoints);
        valueToPush = await utils.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints);
    }
    else {
        console.log("ERROR : TYPE = " + typeOfElement + " is not valid");
    }
    return valueToPush;
}
exports.calculateAnalyticsGlobalWaterToilet = calculateAnalyticsGlobalWaterToilet;
/**
 * Calculate the global water consumption for building.
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @param {string} typeOfElement - Type of the spatial node. Expecting either a building or a floor for this parameter.
 * @return {*}
 */
async function calculateAnalyticsGlobalWater(elementId, typeOfElement) {
    let bmsEndpoints = [];
    let valueToPush = undefined;
    if (typeOfElement == "geographicBuilding") {
        // let spatialContext = (SpinalGraphService.getContextWithType("geographicContext"))[0];
        // let spatialId = spatialContext.info.id.get();
        // let floor = await SpinalGraphService.findInContext(spatialId, spatialId, (elt:SpinalNode<any>) => {
        //     if(elt.info.type.get() == "geographicFloor" && (elt.info.name.get() == "-1")){
        //         (<any>SpinalGraphService)._addNode(elt);
        //         return true;
        //     }
        //     return false;
        // });
        let filter = "Volume EF";
        //let removeItems = ["BAT_A Volume EF S01 Vestiaires Hommes / Femmes", "BAT_A Volume EF S01 SURPRESSEUR"];
        let endpointList = await utils.getBmsDevices(elementId);
        let bmsEndpointNotFiltred = await utils.filterBmsEndpoint(endpointList, filter);
        //let bmsEndpointsFiltred = utils.removeFromlist(bmsEndpointNotFiltred,removeItems);
        //bmsEndpoints =bmsEndpoints.concat(bmsEndpointsFiltred);
        //console.log(bmsEndpointNotFiltred);
        valueToPush = await utils.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpointNotFiltred);
        //console.log("TOTAL = ", valueToPush);
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
        let bmsEndpoints = await utils.filterBmsEndpoint(endpointList, filter);
        // console.log(bmsEndpoints);
        valueToPush = await utils.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints);
    }
    else {
        console.log("ERROR : TYPE = " + typeOfElement + " is not valid");
    }
    return valueToPush;
}
exports.calculateAnalyticsGlobalHeat = calculateAnalyticsGlobalHeat;
async function calculateAnalyticsNumberOfPersons(elementId, typeOfElement) {
    let valueToPush = undefined;
    let attribute = undefined;
    let elementNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(elementId);
    attribute = await utils.getAttributeForWaterConsumption();
    if (typeOfElement == "geographicBuilding") {
        valueToPush = (await utils.calculateAnalyticsFromChildrenNoAverage(elementId, typeOfElement, "Nombre de personnes"));
        console.log("TOTAL = ", valueToPush);
    }
    else if (typeOfElement == "geographicFloor") {
        // On récupère le controlEndpoint
        const controlEndpoint = await utils.getControlEndpoint(elementId, "Eau sanitaire");
        if (controlEndpoint != false) {
            const loaded = await controlEndpoint.element.load();
            let val = loaded.get().currentValue;
            if (!isNaN(val) && attribute !== undefined) {
                valueToPush = val / attribute; //une personne consomme en moyenne 4l/heure
            }
            console.log("Number of persons = " + valueToPush + " in " + elementNode.info.name.get());
        }
    }
    else {
        console.log("ERROR : TYPE = " + typeOfElement + " is not valid");
    }
    return valueToPush;
}
exports.calculateAnalyticsNumberOfPersons = calculateAnalyticsNumberOfPersons;
//# sourceMappingURL=globalAnalytics.js.map