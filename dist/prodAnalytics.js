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
    let allBmsEndpoints = [];
    let valueToPush = undefined;
    let filters = ["Photovoltaique", "Geothermie", "TD Velo"];
    let endpointList = await utils.getBmsDevices(elementId);
    for (let filter of filters) {
        let bms = await utils.filterBmsEndpoint(endpointList, filter);
        allBmsEndpoints = allBmsEndpoints.concat(bms);
    }
    //console.log(allBmsEndpoints);
    valueToPush = await utils.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(allBmsEndpoints);
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
    let bms = await utils.filterBmsEndpoint(endpointList, filter);
    console.log(bms);
    valueToPush = await utils.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bms);
    return valueToPush;
}
exports.calculateAnalyticsSunlightProduction = calculateAnalyticsSunlightProduction;
//# sourceMappingURL=prodAnalytics.js.map