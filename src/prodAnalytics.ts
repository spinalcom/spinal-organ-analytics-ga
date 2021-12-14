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
    let allBmsEndpoints = [];
    let valueToPush = undefined;
    let filters = ["Photovoltaique", "Geothermie", "TD Velo"];
    let endpointList = await utils.getBmsDevices(elementId);
    for (let filter of filters){
        let bms = await utils.filterBmsEndpoint(endpointList, filter)
        allBmsEndpoints = allBmsEndpoints.concat(bms);
    }
    //console.log(allBmsEndpoints);
    valueToPush = await utils.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(allBmsEndpoints);
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
    let bms = await utils.filterBmsEndpoint(endpointList, filter);
    console.log(bms);

    valueToPush = await utils.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bms);
    return valueToPush;
}