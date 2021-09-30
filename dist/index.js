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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const spinal_core_connectorjs_type_1 = require("spinal-core-connectorjs_type");
const spinal_env_viewer_plugin_control_endpoint_service_1 = require("spinal-env-viewer-plugin-control-endpoint-service");
const config_1 = require("./config");
const spinal_env_viewer_graph_service_1 = require("spinal-env-viewer-graph-service");
const spinal_env_viewer_plugin_analytics_service_1 = require("spinal-env-viewer-plugin-analytics-service");
class SpinalMain {
    constructor() { }
    /**
     *
     * Initialize connection with the hub and load graph
     * @return {*}
     * @memberof SpinalMain
     */
    init() {
        const url = `https://${config_1.default.userId}:${config_1.default.userPassword}@${config_1.default.hubHost}:${config_1.default.hubPort}/`;
        return new Promise((resolve, reject) => {
            spinal_core_connectorjs_type_1.spinalCore.load(spinal_core_connectorjs_type_1.spinalCore.connect(url), config_1.default.digitalTwinPath, (graph) => __awaiter(this, void 0, void 0, function* () {
                yield spinal_env_viewer_graph_service_1.SpinalGraphService.setGraph(graph);
                resolve(graph);
            }), () => {
                reject();
            });
        });
    }
    getAnalytics() {
        return __awaiter(this, void 0, void 0, function* () {
            const contexts = yield spinal_env_viewer_plugin_analytics_service_1.spinalAnalyticService.getContexts();
            for (const context of contexts) {
                const contextId = context.id.get();
                //console.log(contextId);
                return spinal_env_viewer_graph_service_1.SpinalGraphService.findInContext(contextId, contextId, (node) => {
                    if (node.getType().get() == spinal_env_viewer_plugin_analytics_service_1.spinalAnalyticService.nodeType) {
                        spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(node);
                        return true;
                    }
                    else
                        return false;
                });
            }
        });
    }
    getNumberTicket(nodeId) {
        return __awaiter(this, void 0, void 0, function* () {
            const node = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(nodeId);
            //console.log(node)
            const tickets = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId, ["SpinalSystemServiceTicketHasTicket"]);
            //console.log(tickets);
            return tickets.length;
        });
    }
    getRoomTicketCount(nodeId) {
        return __awaiter(this, void 0, void 0, function* () {
            const node = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(nodeId);
            const equipments = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId, ["hasBimObject"]);
            let res = yield this.getNumberTicket(nodeId);
            for (const equipment of equipments) {
                res += yield this.getNumberTicket(equipment.id.get());
            }
            return res;
        });
    }
    getFloorTicketCount(nodeId) {
        return __awaiter(this, void 0, void 0, function* () {
            const node = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(nodeId);
            const rooms = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId, ["hasGeographicRoom"]);
            let res = yield this.getNumberTicket(nodeId);
            for (const room of rooms) {
                res += yield this.getRoomTicketCount(room.id.get());
            }
            return res;
        });
    }
    getBuildingTicketCount(nodeId) {
        return __awaiter(this, void 0, void 0, function* () {
            const node = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(nodeId);
            const floors = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId, ["hasGeographicFloor"]);
            let res = yield this.getNumberTicket(nodeId);
            for (const floor of floors) {
                res += yield this.getFloorTicketCount(floor.id.get());
            }
            return res;
        });
    }
    getEndpoints(nodeId, nameFilter) {
        return __awaiter(this, void 0, void 0, function* () {
            const element_to_endpoint_relation = "hasEndPoint";
            const node = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(nodeId);
            const EndpointProfils = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId, [element_to_endpoint_relation]);
            for (const endpointProfil of EndpointProfils) { // pour chaque profil de control endpoint
                const endpointsModels = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(endpointProfil.id.get(), ["hasBmsEndpoint"]);
                const endpoints = endpointsModels.map(el => el.get());
                for (const endpoint of endpoints) {
                    if (endpoint.name.get() == nameFilter)
                        return endpoint.id.get(); // !!!! A CHANGER !!!!!
                }
            }
            return undefined;
        });
    }
    // public async getControlEndpoint(nodeId: string, nameFilter:string)  {
    //     const element_to_controlendpoint_relation = spinalControlPointService.ROOM_TO_CONTROL_GROUP // "hasControlPoints"
    //     const node = SpinalGraphService.getRealNode(nodeId);
    //     const ControlEndpointProfils = await SpinalGraphService.getChildren(nodeId,[element_to_controlendpoint_relation]);
    //     for(const endpointProfil of ControlEndpointProfils){ // pour chaque profil de control endpoint
    //         const controlEndpointsModels = await SpinalGraphService.getChildren(endpointProfil.id.get(),["hasBmsEndpoint"]);
    //         const controlEndpoints = controlEndpointsModels.map(el => el.get());
    //         for(const controlEndpoint of controlEndpoints){
    //             if (controlEndpoint.name.get() == nameFilter) return controlEndpoint;
    //         }
    //     }
    //     return undefined;
    // }
    getControlEndpoint(nodeId, nameFilter) {
        return __awaiter(this, void 0, void 0, function* () {
            const NODE_TO_CONTROL_POINTS_RELATION = spinal_env_viewer_plugin_control_endpoint_service_1.spinalControlPointService.ROOM_TO_CONTROL_GROUP; // "hasControlPoints"
            const CONTROL_POINTS_TO_BMS_ENDPOINT_RELATION = "hasBmsEndpoint";
            let allControlPoints = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId, [NODE_TO_CONTROL_POINTS_RELATION]);
            for (let controlPoint of allControlPoints) {
                let allBmsEndpoints = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(controlPoint.id.get(), [CONTROL_POINTS_TO_BMS_ENDPOINT_RELATION]);
                let test = allBmsEndpoints.filter(elt => elt.name.get() == nameFilter);
                if (test.length != 0)
                    return test[0];
            }
            return false;
        });
    }
    // Update control points with correct values
    updateControlEndpoints() {
        return __awaiter(this, void 0, void 0, function* () {
            const analytics = yield this.getAnalytics();
            for (const analytic of analytics) {
                // récupération du nom de l'analytic et du type d'analytic ciblé
                let analyticChildrenType = analytic.childrenType.get();
                let analyticName = analytic.name.get();
                const node = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(analytic.id.get());
                /*const contextId = this.getNodeContext(analytic.id.get());
                console.log(analytic.childrenType.get());
                const nodesToUpdate = await this.getAnalyticChildren(contextId,analytic.id.get(),analytic.childrenType.get());
                console.log(nodesToUpdate);*/
                const groups = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(analytic.id.get(), [spinal_env_viewer_plugin_analytics_service_1.spinalAnalyticService.ANALYTIC_TO_GROUP_RELATION]);
                for (const group of groups) {
                    const elements = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(group.id.get()); // récupération du gorupe auquel est lié l'analytic
                    for (const element of elements) {
                        // récupération des noeuds du bon type
                        const typeOfElement = element.type.get();
                        if (typeOfElement == analyticChildrenType) {
                            // Récupération du controlpoint lié avec le nom de l'analytic
                            let controlBmsEndpoint = yield this.getControlEndpoint(element.id.get(), analyticName); // sortie
                            if (controlBmsEndpoint != false) {
                                switch (analyticName) {
                                    case "Energie globale":
                                        console.log("ok");
                                        break;
                                    case "Chauffage":
                                        console.log("ok");
                                        break;
                                    case "Climatisation":
                                        console.log("ok");
                                        break;
                                    case "Eclairage":
                                        console.log("ok");
                                        break;
                                    case "Eau":
                                        console.log("ok");
                                        break;
                                    case "Production d'énergie":
                                        console.log("ok");
                                        break;
                                    case "Ensoleillement":
                                        console.log("ok");
                                        break;
                                    case "Efficacité de production d'énergie solaire":
                                        console.log("ok");
                                        break;
                                    case "Gain en émission de CO2":
                                        console.log("ok");
                                        break;
                                    case "Taux d'autoconsommation énergétique":
                                        console.log("ok");
                                        break;
                                    case "Qualité de l'air":
                                        console.log("ok");
                                        break;
                                    case "Luminosité":
                                        console.log("ok");
                                        break;
                                    case "Temperature moyenne":
                                        console.log("ok");
                                        break;
                                    case "Nombre d'espaces occupés":
                                        console.log("ok");
                                        break;
                                    case "Taux d'occupation":
                                        console.log("ok");
                                        break;
                                    case "Nombre de tickets":
                                        console.log("ok");
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
        });
    }
}
function Main() {
    return __awaiter(this, void 0, void 0, function* () {
        const spinalMain = new SpinalMain();
        yield spinalMain.init();
        ///// TODO ////
        spinalMain.updateControlEndpoints();
    });
}
// Call main function
Main();
//# sourceMappingURL=index.js.map