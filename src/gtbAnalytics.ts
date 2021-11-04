import { SpinalGraphService} from "spinal-env-viewer-graph-service";
import { SpinalServiceTimeseries } from "spinal-model-timeseries"
import {SPINAL_RELATION_PTR_LST_TYPE } from "spinal-model-graph";
import * as utils from "./utils"

const SpinalServiceTimeserie = new SpinalServiceTimeseries ()
const filterMulticapteur = "MULTICAPTEUR";
const filterTelecommande = "TELECOMMANDE";
const filterMonitorable = "Monitorable";
const OBJECT_TO_BMS_ENDPOINT_RELATION = "hasBmsEndpoint";


/**
 *
 * Function to calculate Occupation rate
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @return {*} 
 */
export async function calculateAnalyticsOccupationRate(elementId: string){
    let analyticResults = [];
    let rate = 0;
    let lastHourDate = new Date();
    lastHourDate.setHours(lastHourDate.getHours() - 1);
    const filterOccupationBmsEndpoint = "Occupation";
    let spatialId = (SpinalGraphService.getContextWithType("geographicContext"))[0].info.id.get();
    let monitorableControlEndpoint = await utils.getControlEndpoint(elementId, filterMonitorable);
    if(monitorableControlEndpoint != false){
        let currentDataMonitorable = (await utils.networkService.getData(monitorableControlEndpoint.id.get())).currentValue.get();
        if(currentDataMonitorable == "Monitorée"){
            let multicapteur = await SpinalGraphService.findInContext(elementId, spatialId, elt => {
                if(elt.info.type.get() == "BIMObject" && elt.info.name.get().includes(filterMulticapteur) && elt.hasRelation(OBJECT_TO_BMS_ENDPOINT_RELATION, SPINAL_RELATION_PTR_LST_TYPE)){
                    (<any>SpinalGraphService)._addNode(elt);
                    return true;
                }
                return false;
            });
            let allBmsEndpoints = await utils.filterBmsEndpoint(multicapteur, filterOccupationBmsEndpoint);
            for(let bms of allBmsEndpoints){
                let spinalTs = await utils.networkService.getTimeseries(bms.id.get());
                let dataFromLastHour = await spinalTs.getFromIntervalTime(lastHourDate);
                for(let i = 0 ; i < dataFromLastHour.length ; i++){
                    analyticResults[i] =  analyticResults[i] | dataFromLastHour[i].value;
                }
            }
        }
        for(let res of analyticResults){
            rate += (res/(analyticResults.length));
        }
    }
    return Math.round(rate*100);
}

/**
 *
 * Function to calculate air quality
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @return {*} 
 */
export async function calculateAnalyticsAirQuality(elementId : string){
    let value = 0;
    const dateInter = SpinalServiceTimeserie.getDateFromLastHours(1);
    const filterCO2BmsEndpoint = "CO2";
    let spatialId = (SpinalGraphService.getContextWithType("geographicContext"))[0].info.id.get();
    let monitorableControlEndpoint = await utils.getControlEndpoint(elementId, filterMonitorable);
    if( monitorableControlEndpoint != false){
        let currentDataMonitorable = (await utils.networkService.getData(monitorableControlEndpoint.id.get())).currentValue.get();
        if( currentDataMonitorable == "Monitorée"){
            let multicapteur = await SpinalGraphService.findInContext(elementId, spatialId, elt => {
                if(elt.info.type.get() == "BIMObject" && elt.info.name.get().includes(filterMulticapteur) && elt.hasRelation(OBJECT_TO_BMS_ENDPOINT_RELATION, SPINAL_RELATION_PTR_LST_TYPE)){
                    (<any>SpinalGraphService)._addNode(elt);
                    return true;
                }
                return false;
            });
            let telecommande = await SpinalGraphService.findInContext(elementId, spatialId, elt => {
                if(elt.info.type.get() == "BIMObject" && elt.info.name.get().includes(filterTelecommande) && elt.hasRelation(OBJECT_TO_BMS_ENDPOINT_RELATION, SPINAL_RELATION_PTR_LST_TYPE)){
                    (<any>SpinalGraphService)._addNode(elt);
                    return true;
                }
                return false;
            });
            let mBmsEndpoints = await utils.filterBmsEndpoint(multicapteur, filterCO2BmsEndpoint);
            let tBmsEndpoints = await utils.filterBmsEndpoint(telecommande, filterCO2BmsEndpoint);
            let allBmsEndpoints = mBmsEndpoints.concat(tBmsEndpoints);

            let length = allBmsEndpoints.length;

            for(let bms of allBmsEndpoints){
                let val = await SpinalServiceTimeserie.getMean(bms.id.get(),dateInter);
                if ( !(val > 0 ) || val > 5000 || val ==0){
                    length--;
                    continue;
                }
                value+= await SpinalServiceTimeserie.getMean(bms.id.get(),dateInter);
            }
            if (length != 0)
                value = value / length;
        }
    }
    return value;
}

/**
 *
 * Function to calculate temperature
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @return {*} 
 */
export async function calculateAnalyticsTemperature(elementId : string){
    let value = 0;
    const dateInter = SpinalServiceTimeserie.getDateFromLastHours(1);
    const filterTempBmsEndpoint = "Temp";
    let spatialId = (SpinalGraphService.getContextWithType("geographicContext"))[0].info.id.get();
    let monitorableControlEndpoint = await utils.getControlEndpoint(elementId, filterMonitorable);
    if(monitorableControlEndpoint != false){
        let currentDataMonitorable = (await utils.networkService.getData(monitorableControlEndpoint.id.get())).currentValue.get();
        if(currentDataMonitorable == "Monitorée"){
            let multicapteur = await SpinalGraphService.findInContext(elementId, spatialId, elt => {
                if(elt.info.type.get() == "BIMObject" && elt.info.name.get().includes(filterMulticapteur) && elt.hasRelation(OBJECT_TO_BMS_ENDPOINT_RELATION, SPINAL_RELATION_PTR_LST_TYPE)){
                    (<any>SpinalGraphService)._addNode(elt);
                    return true;
                }
                return false;
            });
            let telecommande = await SpinalGraphService.findInContext(elementId, spatialId, elt => {
                if(elt.info.type.get() == "BIMObject" && elt.info.name.get().includes(filterTelecommande) && elt.hasRelation(OBJECT_TO_BMS_ENDPOINT_RELATION, SPINAL_RELATION_PTR_LST_TYPE)){
                    (<any>SpinalGraphService)._addNode(elt);
                    return true;
                }
                return false;
            });
            let mBmsEndpoints = await utils.filterBmsEndpoint(multicapteur, filterTempBmsEndpoint);
            let tBmsEndpoints = await utils.filterBmsEndpoint(telecommande, filterTempBmsEndpoint);
            let allBmsEndpoints = mBmsEndpoints.concat(tBmsEndpoints);
            let length = allBmsEndpoints.length;

            for(let bms of allBmsEndpoints){
                const valMin = await SpinalServiceTimeserie.getMin(bms.id.get(),dateInter);
                
                let tmp = await SpinalServiceTimeserie.getMean(bms.id.get(),dateInter);
                if (valMin < -20 || tmp == -1){
                    length--;
                    continue;
                }
                value+= tmp;
            }
            if (length != 0)
            value = value / length;
        }
    }
    return value;
}

/**
 *
 * Function to calculate luminosity
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @return {*} 
 */
export async function calculateAnalyticsLuminosity(elementId : string){
    
    let value = 0;
    const dateInter = SpinalServiceTimeserie.getDateFromLastHours(1);
    const filterLumBmsEndpoint = "Lum";
    let spatialId = (SpinalGraphService.getContextWithType("geographicContext"))[0].info.id.get();
    let monitorableControlEndpoint = await utils.getControlEndpoint(elementId, filterMonitorable);
    if(monitorableControlEndpoint != false){
        let currentDataMonitorable = (await utils.networkService.getData(monitorableControlEndpoint.id.get())).currentValue.get();
        if(currentDataMonitorable == "Monitorée"){
            let multicapteur = await SpinalGraphService.findInContext(elementId, spatialId, elt => {
                if(elt.info.type.get() == "BIMObject" && elt.info.name.get().includes(filterMulticapteur) && elt.hasRelation(OBJECT_TO_BMS_ENDPOINT_RELATION, SPINAL_RELATION_PTR_LST_TYPE)){
                    (<any>SpinalGraphService)._addNode(elt);
                    return true;
                }
                return false;
            });
            let telecommande = await SpinalGraphService.findInContext(elementId, spatialId, elt => {
                if(elt.info.type.get() == "BIMObject" && elt.info.name.get().includes(filterTelecommande) && elt.hasRelation(OBJECT_TO_BMS_ENDPOINT_RELATION, SPINAL_RELATION_PTR_LST_TYPE)){
                    (<any>SpinalGraphService)._addNode(elt);
                    return true;
                }
                return false;
            });
            let mBmsEndpoints = await utils.filterBmsEndpoint(multicapteur, filterLumBmsEndpoint);
            let tBmsEndpoints = await utils.filterBmsEndpoint(telecommande, filterLumBmsEndpoint);
            let allBmsEndpoints = mBmsEndpoints.concat(tBmsEndpoints);

            let length = allBmsEndpoints.length;

            for(let bms of allBmsEndpoints){
                let tmp = await SpinalServiceTimeserie.getMean(bms.id.get(),dateInter);
                if(tmp == 0){
                    length--;
                    continue;
                }
                value+= tmp
            }
            if (length != 0)
            value = value / length;
        }
    }
    return value;
}

/**
 *
 * Function to calculate monitoring on rooms
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @return {*} 
 */
export async function calculateAnalyticsMonitorable(elementId: string){
    let bimObjects = await SpinalGraphService.getChildren(elementId, ["hasBimObject"]);
    let multicapteurs = bimObjects.filter(elt => elt.name.get().includes(filterMulticapteur));
    let telecommandes = bimObjects.filter(elt => elt.name.get().includes(filterTelecommande));

    let monitors = multicapteurs.concat(telecommandes)
    //console.log(multicapteurs," :)")
    //console.log(telecommandes," :(")

    //console.log(monitors, " fusion")
    if(monitors.length==0 ) {
        return "Non monitorable";
        // console.log("pas de MCA");
        // monitorable0++;
    }
    else{
        for(let m of monitors){
            let bmsEndpoints = await SpinalGraphService.getChildren(m.id.get(), ["hasBmsEndpoint"]);
            if(bmsEndpoints.length > 0){
                return "Monitorée";
            }
        }
        return "Monitorable mais non monitorée";
    }
    
}