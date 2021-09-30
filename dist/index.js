"use strict";
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
        const url = `http://${config_1.default.userId}:${config_1.default.userPassword}@${config_1.default.hubHost}:${config_1.default.hubPort}/`;
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
    getAnalyticChildren(contextId, analyticId, childrenType) {
        return __awaiter(this, void 0, void 0, function* () {
            return spinal_env_viewer_graph_service_1.SpinalGraphService.findInContextByType(contextId, analyticId, childrenType);
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
    getControlEndpoint(nodeId, nameFilter) {
        return __awaiter(this, void 0, void 0, function* () {
            const element_to_controlendpoint_relation = spinal_env_viewer_plugin_control_endpoint_service_1.spinalControlPointService.ROOM_TO_CONTROL_GROUP; // "hasControlPoints"
            const node = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(nodeId);
            const ControlEndpointProfils = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId, [element_to_controlendpoint_relation]);
            for (const endpointProfil of ControlEndpointProfils) { // pour chaque profil de control endpoint
                const controlEndpointsModels = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(endpointProfil.id.get(), ["hasBmsEndpoint"]);
                const controlEndpoints = controlEndpointsModels.map(el => el.get());
                for (const controlEndpoint of controlEndpoints) {
                    if (controlEndpoint.name.get() == nameFilter)
                        return controlEndpoint.id.get();
                }
            }
            return undefined;
        });
    }
    getNodeContext(nodeId) {
        const node = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(nodeId);
        return node.getContextIds()[0];
        //return node.contextIds._attribute_names[0];
    }
    // Update control points with correct values
    updateControlEndpoints() {
        return __awaiter(this, void 0, void 0, function* () {
            const analytics = yield this.getAnalytics();
            for (const analytic of analytics) {
                //console.log(analytic);
                const node = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(analytic.id.get());
                /*const contextId = this.getNodeContext(analytic.id.get());
                console.log(analytic.childrenType.get());
                const nodesToUpdate = await this.getAnalyticChildren(contextId,analytic.id.get(),analytic.childrenType.get());
                console.log(nodesToUpdate);*/
                const groups = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(analytic.id.get(), [spinal_env_viewer_plugin_analytics_service_1.spinalAnalyticService.ANALYTIC_TO_GROUP_RELATION]);
                for (const group of groups) {
                    const elements = yield spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(group.id.get());
                    for (const element of elements) {
                        console.log(element);
                        // Récupérer le controlpoint lié avec le nom de l'analytic
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