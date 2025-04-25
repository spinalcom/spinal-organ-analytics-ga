"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFromlist = exports.updateControlEndpointWithAnalytic = exports.CalculateAnalytic = exports.filterBmsEndpointList = exports.getBmsDevicesList = exports.getControlEndpoint = exports.getRooms = exports.networkService = void 0;
const spinal_env_viewer_graph_service_1 = require("spinal-env-viewer-graph-service");
const spinal_env_viewer_plugin_control_endpoint_service_1 = require("spinal-env-viewer-plugin-control-endpoint-service");
const spinal_model_bmsnetwork_1 = require("spinal-model-bmsnetwork");
exports.networkService = new spinal_model_bmsnetwork_1.NetworkService();
/**
 *
 * Function that returns rooms from the georaphic context
 * @export
 * @return {*}
 */
async function getRooms() {
    const context = spinal_env_viewer_graph_service_1.SpinalGraphService.getContextWithType("geographicContext");
    if (context.length !== 0) {
        const contextId = context[0].info.id.get();
        const rooms = await spinal_env_viewer_graph_service_1.SpinalGraphService.findInContext(contextId, contextId, (node) => {
            if (node.info.type.get() === "geographicRoom") {
                spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(node);
                return true;
            }
            return false;
        });
        return rooms;
    }
    else {
        return [];
    }
}
exports.getRooms = getRooms;
/**
 *
 * Function that return the control endpoint that matches the nameFilter given in parameter
 * @export
 * @param {string} nodeId - Id of the object node ( building, room , floor, equipment)
 * @param {string} nameFilter - Name of the control endpoint we want to capture
 * @return {*}
 */
async function getControlEndpoint(nodeId, nameFilter) {
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
exports.getControlEndpoint = getControlEndpoint;
/**
 *
 * Function that returns a list of all bms devices in a specific room
 * @export
 * @param {string} nodeId - Id of the room
 * @return {*}
 */
async function getBmsDevicesList(nodeId) {
    const result = [];
    const BimObjectList = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(nodeId, ["hasBimObject"]); // gets the Bim Objects
    for (const BimObject of BimObjectList) {
        const bmsdevice = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(BimObject.id.get(), ["hasBmsDevice"]); // gets the bls devices
        if (bmsdevice) {
            result.push(...bmsdevice);
        }
    }
    return result;
}
exports.getBmsDevicesList = getBmsDevicesList;
/**
 *
 * Function that filters a list of endpoints and returns the bmsEndpoints  whose name are in the filter list
 * @export
 * @param {*} bmsendpointList - List of bmsendpoints models
 * @param {string} filters  Liste of endpoints names
 * @return {*}
 */
function filterBmsEndpointList(bmsendpointList, filters) {
    let outputBmsEndpoint = [];
    for (const bmsendpoint of bmsendpointList) {
        if (filters.some(filter => filters.includes(bmsendpoint.name.get()))) {
            console.log(`Matching bmsendpoint: ${bmsendpoint.name.get()}, Filters: ${filters.join(", ")}\n`);
            outputBmsEndpoint.push(bmsendpoint);
        }
    }
    return outputBmsEndpoint;
}
exports.filterBmsEndpointList = filterBmsEndpointList;
/**
 * Function that calculates the average from a list of endpoints values
 * @param EndpointsList
 * @returns
 */
async function CalculateAnalytic(EndpointsList) {
    let values = [];
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
        }
        else {
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
exports.CalculateAnalytic = CalculateAnalytic;
/**
 * Function that updates the current value of a controlenPoint with the average calculated in CalculateAnalytic
 * @param target
 * @param valueToPush
 * @param dataType
 * @param type
 */
async function updateControlEndpointWithAnalytic(target, valueToPush, dataType, type) {
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
        const time = new Date().setMinutes(0, 0, 0); //Register in TimeSeries at hh:00:00
        await exports.networkService.updateEndpoint(target, input, time);
    }
    else {
        console.log(valueToPush + " value to push in node : " + target.name.get() + " -- ABORTED !");
    }
}
exports.updateControlEndpointWithAnalytic = updateControlEndpointWithAnalytic;
/**
 *
 * @param endpointList
 * @param target
 * @returns
 */
function removeFromlist(endpointList, target) {
    return endpointList.filter(x => {
        return !target.includes(x.name.get());
    });
}
exports.removeFromlist = removeFromlist;
//# sourceMappingURL=utils.js.map