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



/**
 *
 * Function to calculate auto-consumption
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @return {*} 
 */
 export async function calculateAnalyticsAutoConsumption(elementId: string){
    let valueToPush = undefined;
    
    let energyG = await utils.getValueFromControlEndpoint(elementId,"Energie globale");
    let energyP = await utils.getValueFromControlEndpoint(elementId,"Production d'énergie");

    if(energyG ==0 || energyG== undefined || isNaN(energyG)){
        valueToPush = NaN;
    }
     else {
        valueToPush = (energyP/energyG)*100;        
    }   
    console.log("Taux d'autoconsommation = ",valueToPush);

    return valueToPush;
}


/**
 *
 * Function to calculate co2 gain 
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @return {*} 
 */
 export async function calculateAnalyticsCO2Gain(elementId: string){
    let valueToPush = undefined;
    let coef = 0.075;

    let carbonBuilding = (await utils.getValueFromControlEndpoint(elementId,"Energie globale"))*coef;
    let carbonProd = (await utils.getValueFromControlEndpoint(elementId,"Production d'énergie"))*coef;

    if(carbonBuilding ==0 || carbonBuilding== undefined || isNaN(carbonBuilding)){
        valueToPush = NaN;
    }
     else {
        valueToPush = (carbonProd/(carbonBuilding+carbonProd))*100;        
    }   
    console.log("Gain en émission de CO2 = ",valueToPush);

    return valueToPush;
}