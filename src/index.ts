/*
 * Copyright 2021 SpinalCom - www.spinalcom.com
 * 
 * This file is part of SpinalCore.
 * 
 * Please read all of the following terms and conditions
 * of the Free Software license Agreement ("Agreement")
 * carefully.
 * 
 * This Agreement is a legally binding contract between
 * the Licensee (as defined below) and SpinalCom that
 * sets forth the terms and conditions that govern your
 * use of the Program. By installing and/or using the
 * Program, you agree to abide by all the terms and
 * conditions stated or referenced herein.
 * 
 * If you do not agree to abide by these terms and
 * conditions, do not demonstrate your acceptance and do
 * not install or use the Program.
 * You should have received a copy of the license along
 * with this file. If not, see
 * <http://resources.spinalcom.com/licenses.pdf>.
 */

import { spinalCore } from "spinal-core-connectorjs_type";
import config from "./config";
import { SpinalGraphService} from "spinal-env-viewer-graph-service";
import { spinalAnalyticService } from "spinal-env-viewer-plugin-analytics-service";
import { InputDataEndpointDataType, InputDataEndpointType}  from "spinal-model-bmsnetwork"
import * as utils from "./utils";
import * as ticket from "./ticketAnalytics";
import * as globalAnalytics from "./globalAnalytics";
import * as gtbAnalytics from "./gtbAnalytics";
import * as prodAnalytics from "./prodAnalytics";


class SpinalMain {
    constructor() { }
    
    /**
     * 
     * Initialize connection with the hub and load graph
     * @return {*}
     * @memberof SpinalMain
     */
    public init() {
        const url = `https://${config.userId}:${config.userPassword}@${config.hubHost}:${config.hubPort}/`;
        return new Promise((resolve, reject) => {
            spinalCore.load(spinalCore.connect(url), config.digitalTwinPath, async (graph: any) => {
                await SpinalGraphService.setGraph(graph);
                resolve(graph)
            }, () => {
                reject()
            })
        });
    }


    /**
     * Function to update all control endpoints that have an analytic named exactly after them and linked to the same objects (building, floor, room).
     * @memberof SpinalMain
     */
    public async updateControlEndpoints() {
        // const analytics = await this.getAnalytics();
        const analyticGroups = await utils.getAnalyticsGroup();
        const ticketStepIds = await ticket.ticketsOuvertsFilter();
        console.log("Ticket Filter Set !");

        for(const analyticGroup of analyticGroups){
            const analytics = await SpinalGraphService.getChildren(analyticGroup.id.get(), ["groupHasAnalytic"]);
            for (const analytic of analytics) {
                // récupération du nom de l'analytic et du type d'analytic ciblé
                let analyticChildrenType = analytic.childrenType.get();
                let analyticName = analytic.name.get();
                //if(analyticName == "Monitorable") continue;
                const groups = await SpinalGraphService.getChildren(analytic.id.get(), [spinalAnalyticService.ANALYTIC_TO_GROUP_RELATION]);
                for (const group of groups) {
                    const elements = await SpinalGraphService.getChildren(group.id.get()); // récupération du groupe auquel est lié l'analytic
                    for (const element of elements) {
                        // récupération des noeuds du bon type
                        const typeOfElement = element.type.get();
                        if (typeOfElement == analyticChildrenType) {
                            // Récupération du controlpoint lié avec le nom de l'analytic
                            let controlBmsEndpoint = await utils.getControlEndpoint(element.id.get(), analyticName); // sortie
                            if (controlBmsEndpoint != false) {
                                let analyticsResult = undefined;
                                switch (analyticName) {
                                    case "Energie globale":
                                        analyticsResult =  await globalAnalytics.calculateAnalyticsGlobalEnergy(element.id.get(), typeOfElement);
                                        analyticsResult = Math.round(analyticsResult*1000)/1000;
                                        await utils.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                                        console.log(analyticName + " for " + typeOfElement + " updated ");
                                        break;
                                    case "Chauffage":
                                        analyticsResult =  await globalAnalytics.calculateAnalyticsGlobalHeat(element.id.get(),typeOfElement);
                                        analyticsResult = Math.round(analyticsResult*1000)/1000;
                                        await utils.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                                        console.log(analyticsResult);
                                        console.log(analyticName + " for " + typeOfElement + " updated");
                                        break;
                                    case "Climatisation": // DEV SPECIFIQUE VINCI : LES BOUCLES IF ET ELSE IF pour etage -2 -1 et 0
                                        if(typeOfElement == "geographicFloor" && element.name.get() == "-2"){
                                            console.log(analyticName + " specific function is used for " + typeOfElement + " : " + element.name.get());
                                            await globalAnalytics.VINCI_specificUpdate_CVC_Floors_CP_Analytics(controlBmsEndpoint, element.id.get(), typeOfElement, analyticName);
                                        }
                                        else if(typeOfElement == "geographicFloor" && (element.name.get() == "-1" || element.name.get() == "0")){
                                            console.log(analyticName + " specific function is used for " + typeOfElement + " : " + element.name.get());
                                        }
                                        else{ // DEV NORMAL DANS CE ELSE
                                            analyticsResult = await globalAnalytics.calculateAnalyticsGlobalCVC(element.id.get(), typeOfElement);
                                            analyticsResult = Math.round(analyticsResult*1000)/1000;
                                            await utils.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                                            console.log(analyticName + " for " + typeOfElement + " updated");
                                        }
                                        break;
                                    case "Eclairage": // DEV SPECIFIQUE VINCI : LES BOUCLES IF ET ELSE IF pour etage -2 -1 et 0 + pour Building dans la fonction calculateAnalyticsGlobalLighting
                                        if(typeOfElement == "geographicFloor" && element.name.get() == "-2"){
                                            console.log(analyticName + " specific function is used for " + typeOfElement + " : " + element.name.get());
                                            await globalAnalytics.VINCI_specificUpdate_Lighting_Floors_CP_Analytics(controlBmsEndpoint, element.id.get(), typeOfElement, analyticName);

                                        }
                                        else if(typeOfElement == "geographicFloor" && (element.name.get() == "-1" || element.name.get() == "0")){
                                            console.log(analyticName + " specific function is used for " + typeOfElement + " : " + element.name.get());
                                        }
                                        else{ // DEV NORMAL DANS CE ELSE
                                            analyticsResult = await globalAnalytics.calculateAnalyticsGlobalLighting(element.id.get(), typeOfElement);
                                            analyticsResult = Math.round(analyticsResult*1000)/1000;
                                            await utils.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                                            console.log(analyticName + " for " + typeOfElement + " updated ");
                                        }
                                        break;
                                    case "Eau":
                                        analyticsResult = await globalAnalytics.calculateAnalyticsGlobalWater(element.id.get(), typeOfElement);
                                        analyticsResult = Math.round(analyticsResult*1000)/1000;
                                        await utils.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                                        console.log(analyticName + " for " + typeOfElement + " updated ");
                                        break;
                                    case "Production d'énergie":
                                        analyticsResult =  await prodAnalytics.calculateAnalyticsEnergyProduction( element.id.get());
                                        analyticsResult = Math.round(analyticsResult*1000)/1000;
                                        await utils.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                                        console.log(analyticName + " for " + typeOfElement + " updated ");
                                        break;
                                    case "Ensoleillement":
                                        analyticsResult =  await prodAnalytics.calculateAnalyticsSunlightProduction(element.id.get());
                                        analyticsResult = Math.round(analyticsResult*1000)/1000;
                                        await utils.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                                        console.log(analyticName + " for " + typeOfElement + " updated ");
                                        break;
                                    case "Efficacité de production d'énergie solaire":
                                        break;
                                    case "Gain en émission de CO2":
                                        break;
                                    case "Taux d'autoconsommation énergétique":
                                        break;
                                    case "Qualité de l'air":
                                        if(typeOfElement == "geographicRoom"){
                                            analyticsResult = await gtbAnalytics.calculateAnalyticsAirQuality(element.id.get());
                                            analyticsResult = Math.round(analyticsResult*100)/100;
                                            await utils.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                                            console.log(analyticName + " for " + typeOfElement + " updated ");
                                        }
                                        else {
                                            analyticsResult = await utils.calculateAnalyticsFromChildren(element.id.get(), typeOfElement,"Qualité de l'air");
                                            analyticsResult = Math.round(analyticsResult*100)/100;
                                            await utils.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                                            console.log(analyticName + " for " + typeOfElement + " updated ");
                                        }
                                        break;
                                    case "Luminosité":
                                        if(typeOfElement == "geographicRoom"){
                                            analyticsResult = await gtbAnalytics.calculateAnalyticsLuminosity(element.id.get());
                                            analyticsResult = Math.round(analyticsResult*100)/100;
                                            await utils.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                                            console.log(analyticName + " for " + typeOfElement + " updated ");
                                        }
                                        else {
                                            analyticsResult = await utils.calculateAnalyticsFromChildren(element.id.get(), typeOfElement,"Luminosité");
                                            analyticsResult = Math.round(analyticsResult*100)/100;
                                            await utils.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                                            console.log(analyticName + " for " + typeOfElement + " updated ");
                                        }
                                        break;
                                    case "Temperature moyenne":
                                        if(typeOfElement == "geographicRoom"){
                                            analyticsResult = await gtbAnalytics.calculateAnalyticsTemperature(element.id.get());
                                            analyticsResult = Math.round(analyticsResult*100)/100;
                                            await utils.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                                            console.log(analyticName + " for " + typeOfElement + " updated ");
                                        }
                                        else {
                                            analyticsResult = await utils.calculateAnalyticsFromChildren(element.id.get(), typeOfElement,"Temperature moyenne");
                                            analyticsResult = Math.round(analyticsResult*100)/100;
                                            await utils.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                                            console.log(analyticName + " for " + typeOfElement + " updated ");
                                        }
                                        break;
                                    case "Nombre d'espaces occupés":
                                        break;
                                    case "Taux d'occupation":
                                        if(typeOfElement == "geographicRoom"){
                                            analyticsResult = await gtbAnalytics.calculateAnalyticsOccupationRate(element.id.get());
                                            await utils.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                                            console.log(analyticName + " for " + typeOfElement + " updated ");
                                        }
                                        else {
                                            analyticsResult = await utils.calculateAnalyticsFromChildren(element.id.get(), typeOfElement,"Taux d'occupation");
                                            await utils.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                                            console.log(analyticName + " for " + typeOfElement + " updated ");
                                        }
                                            
                                        break;
                                    case "Nombre de tickets":
                                        await ticket.updateTicketControlPoints(element.id.get(), typeOfElement, controlBmsEndpoint,ticketStepIds);
                                        console.log(analyticName + " for " + typeOfElement + " updated ");
                                        break;
                                    case "Monitorable":
                                        analyticsResult = await gtbAnalytics.calculateAnalyticsMonitorable(element.id.get());
                                        await utils.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Enumerated, InputDataEndpointType.Other);                                      
                                        console.log(analyticName + " for " + typeOfElement + " updated !!!");
                                        break;
                                    default:
                                        console.log(analyticName + " : aucun trouvé pour : " + typeOfElement);
                                        break;
                                }
                            }
                        }
                    }
                }
    
    
            }
        }
        console.log("DONE");
    }
}

async function Main() {
    const spinalMain = new SpinalMain();
    await spinalMain.init();
    ///// TODO ////
    spinalMain.updateControlEndpoints();
    /*setInterval(() => {
        spinalMain.updateControlEndpoints();
    },config.interval)*/



}

// Call main function
Main()