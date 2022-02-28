import { SpinalGraphService} from "spinal-env-viewer-graph-service";
import * as utils from "./utils"


/**
 *
 * Function to calculate Energy production
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @return {*} 
 */
export async function calculateAnalyticsEnergyProduction(elementId: string){
    let valueToPush = undefined;
    let filter = "Production Total";
   
    let endpointList = await utils.getBmsDevices(elementId);
    let BmsEndpoints = await utils.filterBmsEndpoint(endpointList, filter);
    // console.log(BmsEndpoints);
    valueToPush = await utils.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(BmsEndpoints);
    return valueToPush;
}

/**
 *
 * Function to calculate Sunlight energy production
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @return {*} 
 */
export async function calculateAnalyticsSunlightProduction(elementId: string){
    let valueToPush = undefined;
    let filter = "Ensoleillement";
    
    let endpointList = await utils.getBmsDevices(elementId);
    let allBmsEndpoints = await utils.filterBmsEndpoint(endpointList, filter);
    // console.log(allBmsEndpoints);
    valueToPush = await utils.TimeSeriesOfBmsEndpointsMeanFromLastHour(allBmsEndpoints)
    return valueToPush;
}