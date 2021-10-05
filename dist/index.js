"use strict";
/*
 * Copyright 2021 SpinalCom - www.spinalcom.com
 *
 * This file is part of SpinalCore.
 *
 * Please read all of the following terms and conditions
 * of the Free Software license Agreement ("Agreement")
 * carefully.
 *
 * This Agreement is a legally binding contract between
 * the Licensee (as defined below) and SpinalCom that
 * sets forth the terms and conditions that govern your
 * use of the Program. By installing and/or using the
 * Program, you agree to abide by all the terms and
 * conditions stated or referenced herein.
 *
 * If you do not agree to abide by these terms and
 * conditions, do not demonstrate your acceptance and do
 * not install or use the Program.
 * You should have received a copy of the license along
 * with this file. If not, see
 * <http://resources.spinalcom.com/licenses.pdf>.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const spinal_core_connectorjs_type_1 = require("spinal-core-connectorjs_type");
const spinal_env_viewer_plugin_control_endpoint_service_1 = require("spinal-env-viewer-plugin-control-endpoint-service");
const spinal_model_graph_1 = require("spinal-model-graph");
const config_1 = require("./config");
const spinal_env_viewer_graph_service_1 = require("spinal-env-viewer-graph-service");
const spinal_env_viewer_plugin_analytics_service_1 = require("spinal-env-viewer-plugin-analytics-service");
const spinal_model_bmsnetwork_1 = require("spinal-model-bmsnetwork");
class SpinalMain {
    constructor() {
        this.NetworkService = new spinal_model_bmsnetwork_1.NetworkService();
    }
    /**
     *
     * Initialize connection with the hub and load graph
     * @return {*}
     * @memberof SpinalMain
     */
    init() {
        const url = `https://${config_1.default.userId}:${config_1.default.userPassword}@${config_1.default.hubHost}:${config_1.default.hubPort}/`;
        return new Promise((resolve, reject) => {
            spinal_core_connectorjs_type_1.spinalCore.load(spinal_core_connectorjs_type_1.spinalCore.connect(url), config_1.default.digitalTwinPath, async (graph) => {
                await spinal_env_viewer_graph_service_1.SpinalGraphService.setGraph(graph);
                resolve(graph);
            }, () => {
                reject();
            });
        });
    }
    async getAnalytics() {
        const contexts = await spinal_env_viewer_plugin_analytics_service_1.spinalAnalyticService.getContexts();
        for (const context of contexts) {
            const contextId = context.id.get();
            if (context.type.get() == "AnalyticGroupContext") {
                return spinal_env_viewer_graph_service_1.SpinalGraphService.findInContext(contextId, contextId, (node) => {
                    if (node.getType().get() == spinal_env_viewer_plugin_analytics_service_1.spinalAnalyticService.nodeType) {
                        spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(node);
                        return true;
                    }
                    else
                        return false;
                });
            }
            else
                return undefined;
        }
    }
    async getAnalyticsGroup() {
        const context = spinal_env_viewer_graph_service_1.SpinalGraphService.getContextWithType("AnalyticGroupContext");
        let orderedAnalyticGroups = [];
        if (context.length != 0) {
            const contextId = context[0].info.id.get();
            let analyticGroups = await spinal_env_viewer_graph_service_1.SpinalGraphService.findInContext(contextId, contextId, (elt) => {
                if (elt.info.type.get() == "AnalyticGroup") {
                    spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(elt);
                    return true;
                }
                else
                    return false;
            });
            // classement Piece puis Etage puis Batiment
            let bat = analyticGroups.filter(group => (group.name.get() == "Bâtiment" || group.name.get() == "Batiment" || group.name.get() == "Building"));
            let flr = analyticGroups.filter(group => (group.name.get() == "Etage" || group.name.get() == "Etages"));
            let rom = analyticGroups.filter(group => (group.name.get() == "Pièces" || group.name.get() == "Pièce" || group.name.get() == "Pieces" || group.name.get() == "Piece"));
            orderedAnalyticGroups = rom.concat(flr, bat);
            return orderedAnalyticGroups;
        }
    }
    async sumTimeSeriesOfBmsEndpoints(bmsEndpoints) {
        const networkService = new spinal_model_bmsnetwork_1.NetworkService();
        let sum = 0;
        for (let bms of bmsEndpoints) {
            let timeSeriesModel = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(bms.id.get(), ["hasTimeSeries"]);
            if (timeSeriesModel.length != 0) {
                let timeSeriesNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(timeSeriesModel[0].id.get());
                let spinalTs = await timeSeriesNode.getElement();
                let currentData = await spinalTs.getCurrent();
                if (currentData != undefined) {
                    sum += currentData.value;
                }
            }
        }
        return sum;
    }
    async sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints) {
        let sum = 0;
        for (let bms of bmsEndpoints) {
            let timeSeriesModel = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(bms.id.get(), ["hasTimeSeries"]);
            let timeSeriesNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(timeSeriesModel[0].id.get());
            let spinalTs = await timeSeriesNode.getElement();
            let valueLastHour = undefined;
            let value = undefined;
            let data = await spinalTs.getDataFromLastHours();
            for await (const x of data) {
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
    ////////////////////////////////////////////////////
    ////////////////// TICKETS ANALYTICS ///////////////
    ////////////////////////////////////////////////////
    async getNumberTicket(nodeId, stepIds) {
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
    async ticketsOuvertsFilter() {
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
    async getNumberTicketFromControlEndpoint(nodeId) {
        const node = await this.getControlEndpoint(nodeId, "Nombre de tickets");
        if (node != false) {
            const bmsEndpoint = await node.element.load();
            return bmsEndpoint.get().currentValue;
        }
        return 0;
    }
    async getRoomTicketCount(nodeId, stepIds) {
        const equipments = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId, ["hasBimObject"]);
        let res = await this.getNumberTicket(nodeId, stepIds);
        for (const equipment of equipments) {
            res += await this.getNumberTicket(equipment.id.get(), stepIds);
        }
        return res;
    }
    async getFloorTicketCount(nodeId, stepIds) {
        const rooms = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId, ["hasGeographicRoom"]);
        let res = await this.getNumberTicket(nodeId, stepIds);
        for (const room of rooms) {
            res += await this.getNumberTicket(room.id.get(), stepIds);
        }
        return res;
    }
    async getBuildingTicketCount(nodeId, stepIds) {
        const floors = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId, ["hasGeographicFloor"]);
        let res = await this.getNumberTicket(nodeId, stepIds);
        for (const floor of floors) {
            res += await this.getNumberTicketFromControlEndpoint(floor.id.get());
        }
        return res;
    }
    async filterBmsEndpoint(endpointList, filter) {
        let outputBmsEndpoint = [];
        for (const endpoint of endpointList) {
            let bmsEndpoints = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(endpoint.id.get(), ["hasBmsEndpoint"]);
            for (const bms of bmsEndpoints) {
                if (bms.name.get().includes(filter))
                    outputBmsEndpoint.push(bms);
                // if(bms.name.get().includes(filter)) outputBmsEndpoint.push(bms.name.get());
            }
        }
        return outputBmsEndpoint;
    }
    async updateTicketControlPoints(nodeId, nodeType, targetNode, stepIds) {
        let count = 0;
        if (nodeType == "geographicBuilding") {
            count = await this.getBuildingTicketCount(nodeId, stepIds);
        }
        else if (nodeType == "geographicFloor") {
            count = await this.getFloorTicketCount(nodeId, stepIds);
        }
        //console.log(count," ", nodeType);
        this.updateControlEndpointWithAnalytic(targetNode, count, spinal_model_bmsnetwork_1.InputDataEndpointDataType.Integer, spinal_model_bmsnetwork_1.InputDataEndpointType.Other);
        // console.log("ControlEndpoint Nombre de tickets updated");
    }
    ///////////////////////////////////////////////////
    //////////////// CONSOMMATION  ANALYTICS //////////
    ///////////////////////////////////////////////////
    async calculateAnalyticsGlobalEnergy(targetNode, elementId, typeOfElement) {
        let endpointList = [];
        let valueToPush = undefined;
        if (typeOfElement == "geographicBuilding") {
            let filter = "Comptage Energie Active Total";
            endpointList = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(elementId, ["hasEndPoint"]);
            let bmsEndpoints = await this.filterBmsEndpoint(endpointList, filter);
            valueToPush = await this.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints);
        }
        else if (typeOfElement == "geographicFloor") {
            let filter = "Comptage Energie - General";
            endpointList = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(elementId, ["hasEndPoint"]);
            let bmsEndpoints = await this.filterBmsEndpoint(endpointList, filter);
            valueToPush = await this.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints);
        }
        else {
            console.log("ERROR : TYPE = " + typeOfElement + " is not valid");
        }
        return valueToPush;
    }
    async calculateAnalyticsGlobalCVC(targetNode, elementId, typeOfElement) {
        let endpointList = [];
        let valueToPush = undefined;
        if (typeOfElement == "geographicBuilding") {
            let filter = "CVC";
            endpointList = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(elementId, ["hasEndPoint"]);
            let bmsEndpoints = await this.filterBmsEndpoint(endpointList, filter);
            valueToPush = await this.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints);
            // return sum;
            // console.log(bmsEndpoints);
        }
        else if (typeOfElement == "geographicFloor") {
            let filter = "Comptage Energie - CVC";
            endpointList = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(elementId, ["hasEndPoint"]);
            let bmsEndpoints = await this.filterBmsEndpoint(endpointList, filter);
            valueToPush = await this.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints);
            // console.log("ERROR : TYPE = " + typeOfElement + " is not valid");
        }
        else {
            console.log("ERROR : TYPE = " + typeOfElement + " is not valid");
        }
        return valueToPush;
    }
    async calculateAnalyticsGlobalLighting(targetNode, elementId, typeOfElement) {
        let endpointList = [];
        let valueToPush = undefined;
        if (typeOfElement == "geographicBuilding") {
            // il faut récupérer la conso de chaque étage depuis leur control point respectifs : une fonction spécifique pour Vinci a été créée
            valueToPush = await this.VINCI_specificUpdate_Lighting_Building_Analytics("Eclairage");
        }
        else if (typeOfElement == "geographicFloor") {
            let filter = "Comptage Energie - Eclairage";
            endpointList = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(elementId, ["hasEndPoint"]);
            let bmsEndpoints = await this.filterBmsEndpoint(endpointList, filter);
            valueToPush = await this.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints);
        }
        else {
            console.log("ERROR : TYPE = " + typeOfElement + " is not valid");
        }
        return valueToPush;
    }
    async calculateAnalyticsGlobalWater(targetNode, elementId, typeOfElement) {
        let endpointList = [];
        let valueToPush = undefined;
        if (typeOfElement == "geographicBuilding") {
            let filter = "Volume EF";
            endpointList = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(elementId, ["hasEndPoint"]);
            let bmsEndpoints = await this.filterBmsEndpoint(endpointList, filter);
            valueToPush = await this.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints);
        }
        else if (typeOfElement == "geographicFloor") {
            let filter = "Volume EF";
            endpointList = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(elementId, ["hasEndPoint"]);
            let bmsEndpoints = await this.filterBmsEndpoint(endpointList, filter);
            valueToPush = await this.sumTimeSeriesOfBmsEndpoints(bmsEndpoints);
            let valueToPush2 = await this.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints);
            //console.log(valueToPush," / h-1 difference :", valueToPush2);
        }
        else {
            console.log("ERROR : TYPE = " + typeOfElement + " is not valid");
        }
        return valueToPush;
    }
    //////////////////////////////////////////////////////////
    ////////////////// PRODUCTION ENERGIE ANALYTICS //////////
    //////////////////////////////////////////////////////////
    async calculateAnalyticsEnergyProduction(targetNode, elementId, typeOfElement) {
        let allBmsEndpoints = [];
        let valueToPush = undefined;
        let filters = ["Photovoltaique", "Geothermie", "TD Velo"];
        let endpointList = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(elementId, ["hasEndPoint"]);
        for (let filter of filters) {
            let bms = await this.filterBmsEndpoint(endpointList, filter);
            allBmsEndpoints = allBmsEndpoints.concat(bms);
        }
        valueToPush = await this.sumTimeSeriesOfBmsEndpoints(allBmsEndpoints);
        return valueToPush;
    }
    async calculateAnalyticsSunlightProduction(targetNode, elementId, typeOfElement) {
        let valueToPush = undefined;
        let filter = "Photovoltaique";
        let endpointList = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(elementId, ["hasEndPoint"]);
        let bms = await this.filterBmsEndpoint(endpointList, filter);
        valueToPush = await this.sumTimeSeriesOfBmsEndpoints(bms);
        return valueToPush;
    }
    //////////////////////////////////////////////////////////
    /////////////////// COMMISSIONNING ANALYTICS /////////////
    //////////////////////////////////////////////////////////
    async calculateAnalyticsMonitorable(targetNode, elementId, typeOfElement) {
        let filter = "MULTICAPTEUR";
        let bimObjects = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(elementId, ["hasBimObject"]);
        let multicapteurs = bimObjects.filter(elt => elt.name.get().includes(filter));
        if (multicapteurs.length == 0) {
            return "Non monitorable";
            // console.log("pas de MCA");
            // monitorable0++;
        }
        else {
            for (let mca of multicapteurs) {
                let bmsEndpoints = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(mca.id.get(), ["hasBmsEndpoint"]);
                if (bmsEndpoints.length == 0) {
                    return "Monitorable mais non monitorée";
                    // monitorable1++;
                    // console.log("MCA mais pas de endpoint");
                }
                else {
                    return "Monitorée";
                    // monitorable2++;
                    // console.log("MCA et endpoint : monitorable");
                }
            }
        }
    }
    //////////////////////////////////////////////////////////////////
    ///////////////////////// GTB ANALYTICS //////////////////////////
    //////////////////////////////////////////////////////////////////
    async calculateAnalyticsOccupationRate(targetNode, elementId, typeOfElement) {
        const networkService = new spinal_model_bmsnetwork_1.NetworkService();
        let analyticResults = [];
        let rate = 0;
        let lastHourDate = new Date();
        lastHourDate.setHours(lastHourDate.getHours() - 1);
        const OBJECT_TO_BMS_ENDPOINT_RELATION = "hasBmsEndpoint";
        const filterOccupationBmsEndpoint = "Occupation";
        let filterMonitorable = "Monitorable";
        let filterMulticapteur = "MULTICAPTEUR";
        let spatialId = (spinal_env_viewer_graph_service_1.SpinalGraphService.getContextWithType("geographicContext"))[0].info.id.get();
        let monitorableControlEndpoint = await this.getControlEndpoint(elementId, filterMonitorable);
        if (monitorableControlEndpoint != false) {
            let currentDataMonitorable = (await networkService.getData(monitorableControlEndpoint.id.get())).currentValue.get();
            if (currentDataMonitorable == "Monitorée") {
                console.log("monitorée");
                let multicapteur = await spinal_env_viewer_graph_service_1.SpinalGraphService.findInContext(elementId, spatialId, elt => {
                    if (elt.info.type.get() == "BIMObject" && elt.info.name.get().includes(filterMulticapteur) && elt.hasRelation(OBJECT_TO_BMS_ENDPOINT_RELATION, spinal_model_graph_1.SPINAL_RELATION_PTR_LST_TYPE)) {
                        spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(elt);
                        return true;
                    }
                    return false;
                });
                let allBmsEndpoints = await this.filterBmsEndpoint(multicapteur, filterOccupationBmsEndpoint);
                for (let bms of allBmsEndpoints) {
                    let spinalTs = await networkService.getTimeseries(bms.id.get());
                    let dataFromLastHour = await spinalTs.getFromIntervalTime(lastHourDate);
                    for (let i = 0; i < dataFromLastHour.length; i++) {
                        analyticResults[i] = analyticResults[i] | dataFromLastHour[i].value;
                    }
                }
            }
            for (let res of analyticResults) {
                rate += (res / (analyticResults.length));
            }
        }
        return Math.round(rate * 100);
    }
    /////////////////////////////////////////////////////////////////////////
    /////////////////// SPECIFIC FUNCTIONS FOR VINCI ////////////////////////
    /////////////////////////////////////////////////////////////////////////
    async VINCI_specificUpdate_CVC_Floors_CP_Analytics(targetNode, elementId, typeOfElement, analyticName = "Climatisation") {
        // principe : on calcule l'analytics pour l etage -2, on le divise par 3 et on push dans -2 -1 et 0 (RDC)
        let analyticsResult = (await this.calculateAnalyticsGlobalCVC(targetNode, elementId, typeOfElement)) / 3;
        // push dans -2
        await this.updateControlEndpointWithAnalytic(targetNode, analyticsResult, spinal_model_bmsnetwork_1.InputDataEndpointDataType.Real, spinal_model_bmsnetwork_1.InputDataEndpointType.Other);
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
            let controlBmsEndpoint = await this.getControlEndpoint(flr.id.get(), analyticName);
            if (controlBmsEndpoint != false) {
                await this.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, spinal_model_bmsnetwork_1.InputDataEndpointDataType.Real, spinal_model_bmsnetwork_1.InputDataEndpointType.Other);
            }
            else {
                console.log("Impossible to update control point " + analyticName + " of floor : " + flr.name.get());
            }
        }
    }
    async VINCI_specificUpdate_Lighting_Floors_CP_Analytics(targetNode, elementId, typeOfElement, analyticName = "Eclairage") {
        // principe : on calcule l'analytics pour l etage -2, on le divise par 3 et on push dans -2 -1 et 0 (RDC)
        let analyticsResult = (await this.calculateAnalyticsGlobalCVC(targetNode, elementId, typeOfElement)) / 3;
        // push dans -2
        await this.updateControlEndpointWithAnalytic(targetNode, analyticsResult, spinal_model_bmsnetwork_1.InputDataEndpointDataType.Real, spinal_model_bmsnetwork_1.InputDataEndpointType.Other);
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
            let controlBmsEndpoint = await this.getControlEndpoint(flr.id.get(), analyticName);
            if (controlBmsEndpoint != false) {
                await this.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, spinal_model_bmsnetwork_1.InputDataEndpointDataType.Real, spinal_model_bmsnetwork_1.InputDataEndpointType.Other);
            }
            else {
                console.log("Impossible to update control point " + analyticName + " of floor : " + flr.name.get());
            }
        }
    }
    async VINCI_specificUpdate_Lighting_Building_Analytics(analyticName = "Eclairage") {
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
            let bmsEndpoints = await this.getControlEndpoint(flr.id.get(), analyticName);
            allBmsToSum = allBmsToSum.concat(bmsEndpoints);
        }
        valueToPush = await this.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(allBmsToSum);
        return valueToPush;
        // sumTimeSeriesOfBmsEndpoints
    }
    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    async updateControlEndpointWithAnalytic(target, valueToPush, dataType, type) {
        if (valueToPush != undefined) {
            const input = {
                id: "",
                name: "",
                path: "",
                currentValue: valueToPush,
                unit: "",
                dataType: dataType,
                type: type,
                nodeTypeName: "BmsEndpoint" // should be SpinalBmsEndpoint.nodeTypeName || 'BmsEndpoint'
            };
            await this.NetworkService.updateEndpoint(target, input);
        }
        else {
            console.log(valueToPush + " value to push in node : " + target.name.get() + " -- ABORTED !");
        }
    }
    async getEndpoints(nodeId, nameFilter) {
        const element_to_endpoint_relation = "hasEndPoint";
        const node = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(nodeId);
        const EndpointProfils = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId, [element_to_endpoint_relation]);
        for (const endpointProfil of EndpointProfils) { // pour chaque profil de control endpoint
            const endpointsModels = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(endpointProfil.id.get(), ["hasBmsEndpoint"]);
            const endpoints = endpointsModels.map(el => el.get());
            for (const endpoint of endpoints) {
                if (endpoint.name.get() == nameFilter)
                    return endpoint.id.get();
            }
        }
        return undefined;
    }
    async getControlEndpoint(nodeId, nameFilter) {
        const NODE_TO_CONTROL_POINTS_RELATION = spinal_env_viewer_plugin_control_endpoint_service_1.spinalControlPointService.ROOM_TO_CONTROL_GROUP; // "hasControlPoints"
        const CONTROL_POINTS_TO_BMS_ENDPOINT_RELATION = "hasBmsEndpoint";
        let allControlPoints = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId, [NODE_TO_CONTROL_POINTS_RELATION]);
        for (let controlPoint of allControlPoints) {
            // console.log(controlPoint);
            let allBmsEndpoints = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(controlPoint.id.get(), [CONTROL_POINTS_TO_BMS_ENDPOINT_RELATION]);
            let test = allBmsEndpoints.filter(elt => elt.name.get() == nameFilter);
            if (test.length != 0)
                return test[0];
        }
        return false;
    }
    // Update control points with correct values
    async updateControlEndpoints() {
        // const analytics = await this.getAnalytics();
        const analyticGroups = await this.getAnalyticsGroup();
        const ticketStepIds = await this.ticketsOuvertsFilter();
        for (const analyticGroup of analyticGroups) {
            const analytics = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(analyticGroup.id.get(), ["groupHasAnalytic"]);
            for (const analytic of analytics) {
                // récupération du nom de l'analytic et du type d'analytic ciblé
                let analyticChildrenType = analytic.childrenType.get();
                let analyticName = analytic.name.get();
                //if(analyticName == "Monitorable") continue;
                const node = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(analytic.id.get());
                const groups = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(analytic.id.get(), [spinal_env_viewer_plugin_analytics_service_1.spinalAnalyticService.ANALYTIC_TO_GROUP_RELATION]);
                for (const group of groups) {
                    const elements = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(group.id.get()); // récupération du groupe auquel est lié l'analytic
                    for (const element of elements) {
                        // récupération des noeuds du bon type
                        const typeOfElement = element.type.get();
                        if (typeOfElement == analyticChildrenType) {
                            // Récupération du controlpoint lié avec le nom de l'analytic
                            let controlBmsEndpoint = await this.getControlEndpoint(element.id.get(), analyticName); // sortie
                            if (controlBmsEndpoint != false) {
                                let analyticsResult = undefined;
                                switch (analyticName) {
                                    case "Energie globale":
                                        analyticsResult = await this.calculateAnalyticsGlobalEnergy(controlBmsEndpoint, element.id.get(), typeOfElement);
                                        await this.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, spinal_model_bmsnetwork_1.InputDataEndpointDataType.Real, spinal_model_bmsnetwork_1.InputDataEndpointType.Other);
                                        console.log(analyticName + " for " + typeOfElement + " updated ");
                                        break;
                                    case "Chauffage":
                                        console.log(analyticName + " for " + typeOfElement + " updated");
                                        break;
                                    case "Climatisation": // DEV SPECIFIQUE VINCI : LES BOUCLES IF ET ELSE IF pour etage -2 -1 et 0
                                        if (typeOfElement == "geographicFloor" && element.name.get() == "-2") {
                                            console.log(analyticName + " specific function is used for " + typeOfElement + " : " + element.name.get());
                                            await this.VINCI_specificUpdate_CVC_Floors_CP_Analytics(controlBmsEndpoint, element.id.get(), typeOfElement, analyticName);
                                        }
                                        else if (typeOfElement == "geographicFloor" && (element.name.get() == "-1" || element.name.get() == "0")) {
                                            console.log(analyticName + " specific function is used for " + typeOfElement + " : " + element.name.get());
                                        }
                                        else { // DEV NORMAL DANS CE ELSE
                                            analyticsResult = await this.calculateAnalyticsGlobalCVC(controlBmsEndpoint, element.id.get(), typeOfElement);
                                            await this.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, spinal_model_bmsnetwork_1.InputDataEndpointDataType.Real, spinal_model_bmsnetwork_1.InputDataEndpointType.Other);
                                            console.log(analyticName + " for " + typeOfElement + " updated");
                                        }
                                        break;
                                    case "Eclairage": // DEV SPECIFIQUE VINCI : LES BOUCLES IF ET ELSE IF pour etage -2 -1 et 0 + pour Building dans la fonction calculateAnalyticsGlobalLighting
                                        if (typeOfElement == "geographicFloor" && element.name.get() == "-2") {
                                            console.log(analyticName + " specific function is used for " + typeOfElement + " : " + element.name.get());
                                            await this.VINCI_specificUpdate_Lighting_Floors_CP_Analytics(controlBmsEndpoint, element.id.get(), typeOfElement, analyticName);
                                        }
                                        else if (typeOfElement == "geographicFloor" && (element.name.get() == "-1" || element.name.get() == "0")) {
                                            console.log(analyticName + " specific function is used for " + typeOfElement + " : " + element.name.get());
                                        }
                                        else { // DEV NORMAL DANS CE ELSE
                                            analyticsResult = await this.calculateAnalyticsGlobalLighting(controlBmsEndpoint, element.id.get(), typeOfElement);
                                            await this.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, spinal_model_bmsnetwork_1.InputDataEndpointDataType.Real, spinal_model_bmsnetwork_1.InputDataEndpointType.Other);
                                            console.log(analyticName + " for " + typeOfElement + " updated ");
                                        }
                                        break;
                                    case "Eau":
                                        analyticsResult = await this.calculateAnalyticsGlobalWater(controlBmsEndpoint, element.id.get(), typeOfElement);
                                        await this.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, spinal_model_bmsnetwork_1.InputDataEndpointDataType.Real, spinal_model_bmsnetwork_1.InputDataEndpointType.Other);
                                        console.log(analyticName + " for " + typeOfElement + " updated ");
                                        break;
                                    case "Production d'énergie":
                                        analyticsResult = await this.calculateAnalyticsEnergyProduction(controlBmsEndpoint, element.id.get(), typeOfElement);
                                        await this.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, spinal_model_bmsnetwork_1.InputDataEndpointDataType.Real, spinal_model_bmsnetwork_1.InputDataEndpointType.Other);
                                        console.log(analyticName + " for " + typeOfElement + " updated ");
                                        break;
                                    case "Ensoleillement":
                                        analyticsResult = await this.calculateAnalyticsSunlightProduction(controlBmsEndpoint, element.id.get(), typeOfElement);
                                        await this.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, spinal_model_bmsnetwork_1.InputDataEndpointDataType.Real, spinal_model_bmsnetwork_1.InputDataEndpointType.Other);
                                        console.log(analyticName + " for " + typeOfElement + " updated ");
                                        break;
                                    case "Efficacité de production d'énergie solaire":
                                        break;
                                    case "Gain en émission de CO2":
                                        break;
                                    case "Taux d'autoconsommation énergétique":
                                        break;
                                    case "Qualité de l'air":
                                        break;
                                    case "Luminosité":
                                        break;
                                    case "Temperature moyenne":
                                        break;
                                    case "Nombre d'espaces occupés":
                                        break;
                                    case "Taux d'occupation":
                                        analyticsResult = await this.calculateAnalyticsOccupationRate(controlBmsEndpoint, element.id.get(), typeOfElement);
                                        await this.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, spinal_model_bmsnetwork_1.InputDataEndpointDataType.Real, spinal_model_bmsnetwork_1.InputDataEndpointType.Other);
                                        console.log(analyticsResult);
                                        break;
                                    case "Nombre de tickets":
                                        await this.updateTicketControlPoints(element.id.get(), typeOfElement, controlBmsEndpoint, ticketStepIds);
                                        console.log(analyticName + " for " + typeOfElement + " updated ");
                                        break;
                                    case "Monitorable":
                                        analyticsResult = await this.calculateAnalyticsMonitorable(controlBmsEndpoint, element.id.get(), typeOfElement);
                                        await this.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, spinal_model_bmsnetwork_1.InputDataEndpointDataType.Enumerated, spinal_model_bmsnetwork_1.InputDataEndpointType.Other);
                                        console.log(analyticName + " for " + typeOfElement + " updated !!!");
                                        break;
                                    default:
                                        console.log(analyticName + " : aucun trouvé pour : " + typeOfElement);
                                        break;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
async function Main() {
    const spinalMain = new SpinalMain();
    await spinalMain.init();
    //console.log(NetworkService);
    //console.log(SpinalTimeSeries);
    ///// TODO ////
    await spinalMain.updateControlEndpoints();
    console.log("DONE");
}
// Call main function
Main();
//# sourceMappingURL=index.js.map