"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateAnalyticsSunlightProduction = exports.calculateAnalyticsEnergyProduction = void 0;
const utils = require("./utils");
/**
 *
 * Function to calculate Energy production
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @return {*}
 */
async function calculateAnalyticsEnergyProduction(elementId) {
    let valueToPush = undefined;
    let filter = "Production Total";
    let endpointList = await utils.getBmsDevices(elementId);
    let BmsEndpoints = await utils.filterBmsEndpoint(endpointList, filter);
    // console.log(BmsEndpoints);
    valueToPush = await utils.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(BmsEndpoints);
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
    let filter = "Ensoleillement";
    let endpointList = await utils.getBmsDevices(elementId);
    let allBmsEndpoints = await utils.filterBmsEndpoint(endpointList, filter);
    // console.log(allBmsEndpoints);
    valueToPush = await utils.TimeSeriesOfBmsEndpointsMeanFromLastHour(allBmsEndpoints);
    return valueToPush;
}
exports.calculateAnalyticsSunlightProduction = calculateAnalyticsSunlightProduction;
//# sourceMappingURL=prodAnalytics.js.map