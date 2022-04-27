"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateAnalyticsCO2Gain = exports.calculateAnalyticsAutoConsumption = exports.calculateAnalyticsSunlightProduction = exports.calculateAnalyticsEnergyProduction = void 0;
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
/**
 *
 * Function to calculate auto-consumption
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @return {*}
 */
async function calculateAnalyticsAutoConsumption(elementId) {
    let valueToPush = undefined;
    let energyG = await utils.getValueFromControlEndpoint(elementId, "Energie globale");
    let energyP = await utils.getValueFromControlEndpoint(elementId, "Production d'énergie");
    if (energyG == 0 || energyG == undefined || isNaN(energyG)) {
        valueToPush = NaN;
    }
    else {
        valueToPush = (energyP / energyG) * 100;
    }
    console.log("Taux d'autoconsommation = ", valueToPush);
    return valueToPush;
}
exports.calculateAnalyticsAutoConsumption = calculateAnalyticsAutoConsumption;
/**
 *
 * Function to calculate co2 gain
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @return {*}
 */
async function calculateAnalyticsCO2Gain(elementId) {
    let valueToPush = undefined;
    let coef = 0.075;
    let carbonBuilding = (await utils.getValueFromControlEndpoint(elementId, "Energie globale")) * coef;
    let carbonProd = (await utils.getValueFromControlEndpoint(elementId, "Production d'énergie")) * coef;
    if (carbonBuilding == 0 || carbonBuilding == undefined || isNaN(carbonBuilding)) {
        valueToPush = NaN;
    }
    else {
        valueToPush = (carbonProd / (carbonBuilding + carbonProd)) * 100;
    }
    console.log("Gain en émission de CO2 = ", valueToPush);
    return valueToPush;
}
exports.calculateAnalyticsCO2Gain = calculateAnalyticsCO2Gain;
//# sourceMappingURL=prodAnalytics.js.map