"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const spinal_env_viewer_graph_service_1 = require("spinal-env-viewer-graph-service");
const utils = require("./utils");
/**
 *
 * Function to calculate Energy production
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @return {*}
 */
async function calculateAnalyticsEnergyProduction(elementId) {
    let allBmsEndpoints = [];
    let valueToPush = undefined;
    let filters = ["Photovoltaique", "Geothermie", "TD Velo"];
    let endpointList = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(elementId, ["hasEndPoint"]);
    for (let filter of filters) {
        let bms = await utils.filterBmsEndpoint(endpointList, filter);
        allBmsEndpoints = allBmsEndpoints.concat(bms);
    }
    valueToPush = await utils.sumTimeSeriesOfBmsEndpoints(allBmsEndpoints);
    return valueToPush;
}
exports.calculateAnalyticsEnergyProduction = calculateAnalyticsEnergyProduction;
/**
 *
 * Function to calculate Sunlight energy production
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @return {*}
 */
async function calculateAnalyticsSunlightProduction(elementId) {
    let valueToPush = undefined;
    let filter = "Photovoltaique";
    let endpointList = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(elementId, ["hasEndPoint"]);
    let bms = await utils.filterBmsEndpoint(endpointList, filter);
    valueToPush = await utils.sumTimeSeriesOfBmsEndpoints(bms);
    return valueToPush;
}
exports.calculateAnalyticsSunlightProduction = calculateAnalyticsSunlightProduction;
//# sourceMappingURL=prodAnalytics.js.map