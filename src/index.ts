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

import { Process, spinalCore } from "spinal-core-connectorjs_type";
import config from "./config";
import { SpinalGraphService} from "spinal-env-viewer-graph-service";
import { spinalAnalyticService } from "spinal-env-viewer-plugin-analytics-service";
import { InputDataEndpointDataType, InputDataEndpointType}  from "spinal-model-bmsnetwork"
import * as utils from "./utils";
import * as ticket from "./ticketAnalytics";
import * as globalAnalytics from "./globalAnalytics";
import * as gtbAnalytics from "./gtbAnalytics";
import * as prodAnalytics from "./prodAnalytics";
import cron = require('node-cron');


class SpinalMain {
    connect: spinal.FileSystem;
    constructor() { 
        const url = `https://${config.userId}:${config.userPassword}@${config.hubHost}:${config.hubPort}/`;
        this.connect = spinalCore.connect(url)
    }
    
    /**
     * 
     * Initialize connection with the hub and load graph
     * @return {*}
     * @memberof SpinalMain
     */
    // public init() {
    //     return new Promise((resolve, reject) => {
    //         spinalCore.load(this.connect, config.digitalTwinPath, async (graph: any) => {
    //             await SpinalGraphService.setGraph(graph);
    //             resolve(graph)
    //         }, () => {
    //             reject()
    //         })
    //     });
    // }

    public init(succes,error) {
        spinalCore.load(this.connect, config.digitalTwinPath, async (graph: any) => {
            console.log("I'm connected")
            await SpinalGraphService.setGraph(graph);
            succes(graph)
        }, () => {
            error();
        })
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
        let iMon1 = 0; // monitorable
        let iMon2 = 0; // monitorable mais non monitoré
        let iMon3 = 0; // non monitorable

        for(const analyticGroup of analyticGroups){
            const analytics = await SpinalGraphService.getChildren(analyticGroup.id.get(), ["groupHasAnalytic"]);
            for (const analytic of analytics) {
                // récupération du nom de l'analytic et du type d'analytic ciblé
                let analyticChildrenType = analytic.childrenType.get();
                let analyticName = analytic.name.get();
                if(analyticName == "Monitorable") continue;
                if(analyticName == "Nombre de tickets") continue;

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
                                        console.log(analyticName + " for " + element.name.get() + " updated : " + typeOfElement);
                                        break;

                                    // case "Chauffage":
                                    //     analyticsResult =  await globalAnalytics.calculateAnalyticsGlobalHeat(element.id.get(),typeOfElement);
                                    //     analyticsResult = Math.round(analyticsResult*1000)/1000;
                                    //     await utils.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                                    //     console.log(analyticName + " for " + element.name.get() + " updated : " + typeOfElement);
                                    //     break;
                                    // case "Climatisation":
                                    //     analyticsResult = await globalAnalytics.calculateAnalyticsGlobalCVC(element.id.get(), typeOfElement);
                                    //     analyticsResult = Math.round(analyticsResult*1000)/1000;
                                    //     await utils.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                                    //     console.log(analyticName + " for " + element.name.get() + " updated : " + typeOfElement);
                                    //     break;
                                        
                                    case "Eclairage":
                                        analyticsResult = await globalAnalytics.calculateAnalyticsGlobalLighting(element.id.get(), typeOfElement);
                                        analyticsResult = Math.round(analyticsResult*1000)/1000;
                                        await utils.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                                        console.log(analyticName + " for " + element.name.get() + " updated : " + typeOfElement);
                                        break;

                                    case "Eau sanitaire":
                                        analyticsResult = await globalAnalytics.calculateAnalyticsGlobalWaterToilet(element.id.get(), typeOfElement);
                                        analyticsResult = (Math.round(analyticsResult*1000)/1000)*1000;  //Transformer le m3 en Litres
                                        await utils.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                                        console.log(analyticName + " for " + element.name.get() + " updated : " + typeOfElement);
                                        break;
                                    
                                    case "Eau globale":
                                        analyticsResult = await globalAnalytics.calculateAnalyticsGlobalWater(element.id.get(), typeOfElement);
                                        analyticsResult = (Math.round(analyticsResult*1000)/1000)*1000;  //Transformer le m3 en Litres
                                        await utils.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                                        console.log(analyticName + " for " + element.name.get() + " updated : " + typeOfElement);
                                        break;

                                    case "Nombre de personnes":
                                        analyticsResult = await globalAnalytics.calculateAnalyticsNumberOfPersons(element.id.get(), typeOfElement);
                                        analyticsResult = (Math.round(analyticsResult));
                                        await utils.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                                        console.log(analyticName + " for " + element.name.get() + " updated : " + typeOfElement);
                                        break;

                                    case "Production d'énergie":
                                        analyticsResult =  await prodAnalytics.calculateAnalyticsEnergyProduction( element.id.get());
                                        analyticsResult = Math.round(analyticsResult*1000)/1000;
                                        await utils.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                                        console.log(analyticName + " for " + element.name.get() + " updated : " + typeOfElement);
                                        break;

                                    case "Ensoleillement":
                                        analyticsResult =  await prodAnalytics.calculateAnalyticsSunlightProduction(element.id.get());
                                        analyticsResult = Math.round(analyticsResult*1000)/1000;
                                        await utils.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                                        console.log(analyticName + " for " + element.name.get() + " updated : " + typeOfElement);
                                        break;
                                    // case "Efficacité de production d'énergie solaire":
                                    //     break;
                                    // case "Gain en émission de CO2":
                                    //     break;
                                    // case "Taux d'autoconsommation énergétique":
                                    //     break;
                                    // case "Qualité de l'air":
                                    //     if(typeOfElement == "geographicRoom"){
                                    //         analyticsResult = await gtbAnalytics.calculateAnalyticsAirQuality(element.id.get());
                                    //         analyticsResult = Math.round(analyticsResult*100)/100;
                                    //         await utils.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                                    //         console.log(analyticName + " for " + element.name.get() + " updated : " + typeOfElement);
                                    //     }
                                    //     else {
                                    //         analyticsResult = await utils.calculateAnalyticsFromChildren(element.id.get(), typeOfElement,"Qualité de l'air");
                                    //         analyticsResult = Math.round(analyticsResult*100)/100;
                                    //         await utils.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                                    //         console.log(analyticName + " for " + element.name.get() + " updated : " + typeOfElement);
                                    //     }
                                    //     break;
                                    // case "Luminosité":
                                    //     if(typeOfElement == "geographicRoom"){
                                    //         analyticsResult = await gtbAnalytics.calculateAnalyticsLuminosity(element.id.get());
                                    //         analyticsResult = Math.round(analyticsResult*100)/100;
                                    //         await utils.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                                    //         console.log(analyticName + " for " + element.name.get() + " updated : " + typeOfElement);
                                    //     }
                                    //     else {
                                    //         analyticsResult = await utils.calculateAnalyticsFromChildren(element.id.get(), typeOfElement,"Luminosité");
                                    //         analyticsResult = Math.round(analyticsResult*100)/100;
                                    //         await utils.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                                    //         console.log(analyticName + " for " + element.name.get() + " updated : " + typeOfElement);
                                    //     }
                                    //     break;
                                    // case "Temperature moyenne":
                                    //     if(typeOfElement == "geographicRoom"){
                                    //         analyticsResult = await gtbAnalytics.calculateAnalyticsTemperature(element.id.get());
                                    //         analyticsResult = Math.round(analyticsResult*100)/100;
                                    //         await utils.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                                    //         console.log(analyticName + " for " + element.name.get() + " updated : " + typeOfElement);
                                    //     }
                                    //     else {
                                    //         analyticsResult = await utils.calculateAnalyticsFromChildren(element.id.get(), typeOfElement,"Temperature moyenne");
                                    //         analyticsResult = Math.round(analyticsResult*100)/100;
                                    //         await utils.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                                    //         console.log(analyticName + " for " + element.name.get() + " updated : " + typeOfElement);
                                    //     }
                                    //     break;
                                    // case "Nombre d'espaces occupés":
                                    //     break;
                                    // case "Taux d'occupation":
                                    //     if(typeOfElement == "geographicRoom"){
                                    //         analyticsResult = await gtbAnalytics.calculateAnalyticsOccupationRate(element.id.get());
                                    //         // await utils.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                                    //         console.log(analyticName + " for " + element.name.get() + " updated : " + typeOfElement);
                                    //     }
                                    //     else {
                                    //         analyticsResult = await utils.calculateAnalyticsFromChildren(element.id.get(), typeOfElement,"Taux d'occupation");
                                    //         // await utils.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                                    //         console.log(analyticName + " for " + element.name.get() + " updated : " + typeOfElement);
                                    //     }
                                            
                                    //     break;

                                    case "Nombre de tickets":
                                        await ticket.updateTicketControlPoints(element.id.get(), typeOfElement, controlBmsEndpoint,ticketStepIds);
                                        console.log(analyticName + " for " + element.name.get() + " updated : " + typeOfElement);
                                        break;

                                    case "Monitorable":
                                        analyticsResult = await gtbAnalytics.calculateAnalyticsMonitorable(element.id.get());
                                        await utils.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Enumerated, InputDataEndpointType.Other);                                      
                                        console.log(analyticName + " for " + typeOfElement + " updated !!!");
                                        if(analyticsResult == "Monitorée") iMon1++;
                                        else if(analyticsResult == "Monitorable mais non monitorée") iMon2++;
                                        else if(analyticsResult == "Non monitorable") iMon3++;
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

        console.log("Pieces Monitorées = " + iMon1);
        console.log("Pieces Non monitorables = " + iMon3);
        console.log("Pieces Monitorables mais non monitorées = " + iMon2); 

        console.log("DONE");
    }
}

async function Main() {   
    // start every 1h+10min
    cron.schedule('10 * * * *', async (): Promise<void> => {
        console.log('Organ Start');
        const spinalMain = new SpinalMain();
        
        spinalMain.init(x=>{
            spinalMain.updateControlEndpoints();
        }, y => { 
            setTimeout(() => {
                console.log('STOP');
                process.exit(0);

            }, 5000);});    
    });
    
    
    // const spinalMain = new SpinalMain();
    // await spinalMain.init();
    // ///// TODO ////
    // spinalMain.updateControlEndpoints();
    // // setInterval(() => {
    // //     spinalMain.updateControlEndpoints();
    // // },config.interval)

}

// Call main function
Main()
