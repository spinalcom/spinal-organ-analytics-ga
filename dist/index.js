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
const config_1 = require("./config");
const spinal_env_viewer_graph_service_1 = require("spinal-env-viewer-graph-service");
const spinal_env_viewer_plugin_analytics_service_1 = require("spinal-env-viewer-plugin-analytics-service");
const spinal_model_bmsnetwork_1 = require("spinal-model-bmsnetwork");
const spinal_model_timeseries_1 = require("spinal-model-timeseries");
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
    async sumTimeSeriesOfBmsEndpoints(bmsEndpoints) {
        const networkService = new spinal_model_bmsnetwork_1.NetworkService();
        // console.log(bmsEndpoints);
        let sum = 0;
        for (let bms of bmsEndpoints) {
            // console.log(bms);
            let timeSeriesModel = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(bms.id.get(), ["hasTimeSeries"]);
            // console.log(timeSeriesModel);
            let timeSeriesNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(timeSeriesModel[0].id.get());
            // console.log(timeSeriesNode);
            let spinalTs = await timeSeriesNode.getElement();
            let currentData = await spinalTs.getCurrent();
            // console.log("current data : " + currentData.value);
            sum += currentData.value;
            // let testValue = await networkService.getData(bms.id.get());
            // console.log(testValue);
        }
        // console.log(sum);
        return sum;
    }
    ////////////////////////////////////////////////////
    ////////////////// TICKETS ANALYTICS ///////////////
    ////////////////////////////////////////////////////
    async getNumberTicket(nodeId) {
        //console.log(node)
        const tickets = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId, ["SpinalSystemServiceTicketHasTicket"]);
        //console.log(tickets);
        return tickets.length;
    }
    async getRoomTicketCount(nodeId) {
        const equipments = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId, ["hasBimObject"]);
        let res = await this.getNumberTicket(nodeId);
        for (const equipment of equipments) {
            res += await this.getNumberTicket(equipment.id.get());
        }
        return res;
    }
    async getFloorTicketCount(nodeId) {
        const rooms = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId, ["hasGeographicRoom"]);
        let res = await this.getNumberTicket(nodeId);
        for (const room of rooms) {
            res += await this.getRoomTicketCount(room.id.get());
        }
        return res;
    }
    async getBuildingTicketCount(nodeId) {
        const floors = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId, ["hasGeographicFloor"]);
        let res = await this.getNumberTicket(nodeId);
        for (const floor of floors) {
            res += await this.getFloorTicketCount(floor.id.get());
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
    async calculateTicket(nodeId, nodeType, targetNode) {
        let count = 0;
        if (nodeType == "geographicBuilding") {
            count = await this.getBuildingTicketCount(nodeId);
        }
        else if (nodeType == "geographicFloor") {
            count = await this.getFloorTicketCount(nodeId);
        }
        const input = {
            id: "",
            name: "",
            path: "",
            currentValue: count,
            unit: "",
            dataType: spinal_model_bmsnetwork_1.InputDataEndpointDataType.Integer,
            type: spinal_model_bmsnetwork_1.InputDataEndpointType.Other,
            nodeTypeName: "BmsEndpoint" // should be SpinalBmsEndpoint.nodeTypeName || 'BmsEndpoint'
        };
        await this.NetworkService.updateEndpoint(targetNode, input);
        // console.log("ControlEndpoint Nombre de tickets updated");
    }
    ///////////////////////////////////////////////////
    //////////////// CONSOMMATION  ANALYTICS //////////
    ///////////////////////////////////////////////////
    async calculateAnalyticsGlobalEnergy(targetNode, elementId, typeOfElement) {
        let endpointList = [];
        let valueToPush = 0;
        if (typeOfElement == "geographicBuilding") {
            let filter = "Comptage Energie Active Total";
            endpointList = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(elementId, ["hasEndPoint"]);
            let bmsEndpoints = await this.filterBmsEndpoint(endpointList, filter);
            valueToPush = await this.sumTimeSeriesOfBmsEndpoints(bmsEndpoints);
        }
        else if (typeOfElement == "geographicFloor") {
            let filter = "Comptage Energie - General";
            endpointList = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(elementId, ["hasEndPoint"]);
            let bmsEndpoints = await this.filterBmsEndpoint(endpointList, filter);
            valueToPush = await this.sumTimeSeriesOfBmsEndpoints(bmsEndpoints);
        }
        else {
            console.log("ERROR : TYPE = " + typeOfElement + " is not valid");
        }
        const input = {
            id: "",
            name: "",
            path: "",
            currentValue: valueToPush,
            unit: "",
            dataType: spinal_model_bmsnetwork_1.InputDataEndpointDataType.Real,
            type: spinal_model_bmsnetwork_1.InputDataEndpointType.Other,
            nodeTypeName: "BmsEndpoint" // should be SpinalBmsEndpoint.nodeTypeName || 'BmsEndpoint'
        };
        await this.NetworkService.updateEndpoint(targetNode, input);
    }
    async calculateAnalyticsGlobalCVC(targetNode, elementId, typeOfElement) {
        let endpointList = [];
        let valueToPush = 0;
        if (typeOfElement == "geographicBuilding") {
            let filter = "CVC";
            endpointList = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(elementId, ["hasEndPoint"]);
            let bmsEndpoints = await this.filterBmsEndpoint(endpointList, filter);
            valueToPush = await this.sumTimeSeriesOfBmsEndpoints(bmsEndpoints);
            // return sum;
            // console.log(bmsEndpoints);
        }
        else if (typeOfElement == "geographicFloor") {
            let filter = "Comptage Energie - CVC";
            endpointList = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(elementId, ["hasEndPoint"]);
            let bmsEndpoints = await this.filterBmsEndpoint(endpointList, filter);
            valueToPush = await this.sumTimeSeriesOfBmsEndpoints(bmsEndpoints);
            // console.log("ERROR : TYPE = " + typeOfElement + " is not valid");
        }
        else {
            console.log("ERROR : TYPE = " + typeOfElement + " is not valid");
        }
        const input = {
            id: "",
            name: "",
            path: "",
            currentValue: valueToPush,
            unit: "",
            dataType: spinal_model_bmsnetwork_1.InputDataEndpointDataType.Real,
            type: spinal_model_bmsnetwork_1.InputDataEndpointType.Other,
            nodeTypeName: "BmsEndpoint" // should be SpinalBmsEndpoint.nodeTypeName || 'BmsEndpoint'
        };
        await this.NetworkService.updateEndpoint(targetNode, input);
    }
    async calculateAnalyticsGlobalLighting(targetNode, elementId, typeOfElement) {
        let endpointList = [];
        let valueToPush = 0;
        if (typeOfElement == "geographicBuilding") {
        }
        else if (typeOfElement == "geographicFloor") {
            let filter = "Comptage Energie - Eclairage";
            endpointList = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(elementId, ["hasEndPoint"]);
            let bmsEndpoints = await this.filterBmsEndpoint(endpointList, filter);
            valueToPush = await this.sumTimeSeriesOfBmsEndpoints(bmsEndpoints);
            // console.log("ERROR : TYPE = " + typeOfElement + " is not valid");
        }
        else {
            console.log("ERROR : TYPE = " + typeOfElement + " is not valid");
        }
        const input = {
            id: "",
            name: "",
            path: "",
            currentValue: valueToPush,
            unit: "",
            dataType: spinal_model_bmsnetwork_1.InputDataEndpointDataType.Real,
            type: spinal_model_bmsnetwork_1.InputDataEndpointType.Other,
            nodeTypeName: "BmsEndpoint" // should be SpinalBmsEndpoint.nodeTypeName || 'BmsEndpoint'
        };
        await this.NetworkService.updateEndpoint(targetNode, input);
    }
    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    async getEndpoints(nodeId, nameFilter) {
        const element_to_endpoint_relation = "hasEndPoint";
        const node = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(nodeId);
        const EndpointProfils = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId, [element_to_endpoint_relation]);
        for (const endpointProfil of EndpointProfils) { // pour chaque profil de control endpoint
            const endpointsModels = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(endpointProfil.id.get(), ["hasBmsEndpoint"]);
            const endpoints = endpointsModels.map(el => el.get());
            for (const endpoint of endpoints) {
                if (endpoint.name.get() == nameFilter)
                    return endpoint.id.get(); // !!!! A CHANGER !!!!!
            }
        }
        return undefined;
    }
    async getControlEndpoint(nodeId, nameFilter) {
        const NODE_TO_CONTROL_POINTS_RELATION = spinal_env_viewer_plugin_control_endpoint_service_1.spinalControlPointService.ROOM_TO_CONTROL_GROUP; // "hasControlPoints"
        const CONTROL_POINTS_TO_BMS_ENDPOINT_RELATION = "hasBmsEndpoint";
        let allControlPoints = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId, [NODE_TO_CONTROL_POINTS_RELATION]);
        for (let controlPoint of allControlPoints) {
            let allBmsEndpoints = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(controlPoint.id.get(), [CONTROL_POINTS_TO_BMS_ENDPOINT_RELATION]);
            let test = allBmsEndpoints.filter(elt => elt.name.get() == nameFilter);
            if (test.length != 0)
                return test[0];
        }
        return false;
    }
    // Update control points with correct values
    async updateControlEndpoints() {
        const analytics = await this.getAnalytics();
        for (const analytic of analytics) {
            // récupération du nom de l'analytic et du type d'analytic ciblé
            let analyticChildrenType = analytic.childrenType.get();
            let analyticName = analytic.name.get();
            const node = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(analytic.id.get());
            /*const contextId = this.getNodeContext(analytic.id.get());
            console.log(analytic.childrenType.get());
            const nodesToUpdate = await this.getAnalyticChildren(contextId,analytic.id.get(),analytic.childrenType.get());
            console.log(nodesToUpdate);*/
            const groups = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(analytic.id.get(), [spinal_env_viewer_plugin_analytics_service_1.spinalAnalyticService.ANALYTIC_TO_GROUP_RELATION]);
            for (const group of groups) {
                const elements = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(group.id.get()); // récupération du gorupe auquel est lié l'analytic
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
                                    await this.calculateAnalyticsGlobalEnergy(controlBmsEndpoint, element.id.get(), typeOfElement);
                                    console.log(analyticName + " for " + typeOfElement + " updated !!!");
                                    break;
                                case "Chauffage":
                                    // console.log(analyticName + " for " + typeOfElement + " updated !!!");
                                    break;
                                case "Climatisation":
                                    await this.calculateAnalyticsGlobalCVC(controlBmsEndpoint, element.id.get(), typeOfElement);
                                    console.log(analyticName + " for " + typeOfElement + " updated !!!");
                                    break;
                                case "Eclairage":
                                    await this.calculateAnalyticsGlobalLighting(controlBmsEndpoint, element.id.get(), typeOfElement);
                                    console.log(analyticName + " for " + typeOfElement + " updated !!!");
                                    break;
                                case "Eau":
                                    // console.log(analyticName + " for " + typeOfElement + " updated !!!");
                                    break;
                                case "Production d'énergie":
                                    break;
                                case "Ensoleillement":
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
                                    break;
                                case "Nombre de tickets":
                                    await this.calculateTicket(element.id.get(), typeOfElement, controlBmsEndpoint);
                                    console.log(analyticName + " for " + typeOfElement + " updated !!!");
                                    break;
                                default:
                                    console.log(analyticName + " : aucun trouvé pour : " + typeOfElement);
                                    // console.log(analyticName);
                                    // console.log(typeOfElement);
                                    break;
                            }
                        }
                        // console.log(controlBmsEndpoint);
                    }
                    // console.log(element);
                }
            }
        }
    }
}
async function Main() {
    // const networkService = new NetworkService();
    const spinalMain = new SpinalMain();
    await spinalMain.init();
    console.log(spinal_model_bmsnetwork_1.NetworkService);
    console.log(spinal_model_timeseries_1.SpinalTimeSeries);
    ///// TODO ////
    await spinalMain.updateControlEndpoints();
    console.log("DONE");
}
// Call main function
Main();
//# sourceMappingURL=index.js.map