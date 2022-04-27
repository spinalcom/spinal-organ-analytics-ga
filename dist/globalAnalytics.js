"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateAnalyticsNumberOfPersons = exports.calculateAnalyticsGlobalHeat = exports.calculateAnalyticsGlobalWater = exports.calculateAnalyticsGlobalWaterToilet = exports.calculateAnalyticsGlobalLighting = exports.calculateAnalyticsGlobalAirConditioning = exports.calculateAnalyticsGlobalEnergy = void 0;
const spinal_env_viewer_graph_service_1 = require("spinal-env-viewer-graph-service");
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
async function calculateAnalyticsGlobalAirConditioning(elementId, typeOfElement) {
    let endpointList = [];
    let valueToPush = undefined;
    let bmsEndpoints = [];
    let elementNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(elementId);
    let elementName = elementNode.info.name.get();
    if (typeOfElement == "geographicBuilding") {
        let filter = "BAT_B1 Energie Frigo S01 BAT B1 - Cpt DISTRIBUTION EG ALIM SECONDAIRE";
        endpointList = await utils.getBmsDevices(elementId);
        bmsEndpoints = await utils.filterBmsEndpoint(endpointList, filter);
        // console.log(bmsEndpoints);
        valueToPush = await utils.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints);
    }
    else if (typeOfElement == "geographicFloor") {
        let filter = "Energie Frigo";
        if (elementName !== "23") {
            endpointList = await utils.getBmsDevices(elementId);
            let bmsEndpoints = await utils.filterBmsEndpoint(endpointList, filter);
            // console.log(bmsEndpoints);
            valueToPush = await utils.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints);
        }
        else {
            valueToPush = NaN;
        }
    }
    else {
        console.log("ERROR : TYPE = " + typeOfElement + " is not valid");
    }
    return valueToPush;
}
exports.calculateAnalyticsGlobalAirConditioning = calculateAnalyticsGlobalAirConditioning;
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
 * Calculate the global heat for floors and building.
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @param {string} typeOfElement - Type of the spatial node. Expecting either a building or a floor for this parameter.
 * @return {*}
 */
async function calculateAnalyticsGlobalHeat(elementId, typeOfElement) {
    let endpointList = [];
    let valueToPush = undefined;
    let bmsEndpoints = [];
    let elementNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(elementId);
    let elementName = elementNode.info.name.get();
    if (typeOfElement == "geographicBuilding") {
        let filter = "BAT_B1 Energie Calo S01 BAT B1 - Cpt DISTRIBUTION EC ALIM SECONDAIRE";
        endpointList = await utils.getBmsDevices(elementId);
        bmsEndpoints = await utils.filterBmsEndpoint(endpointList, filter);
        // console.log(bmsEndpoints);
        valueToPush = await utils.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints);
    }
    else if (typeOfElement == "geographicFloor") {
        let filter = "Energie Calo";
        if (!(elementName == "0" || elementName == "23")) {
            endpointList = await utils.getBmsDevices(elementId);
            let bmsEndpoints = await utils.filterBmsEndpoint(endpointList, filter);
            // console.log(bmsEndpoints);
            valueToPush = await utils.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints);
        }
        else {
            valueToPush = NaN;
        }
    }
    else {
        console.log("ERROR : TYPE = " + typeOfElement + " is not valid");
    }
    return valueToPush;
}
exports.calculateAnalyticsGlobalHeat = calculateAnalyticsGlobalHeat;
/**
 * Calculate the number of persons for floors and building.
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @param {string} typeOfElement - Type of the spatial node. Expecting either a building or a floor for this parameter.
 * @return {*}
 */
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