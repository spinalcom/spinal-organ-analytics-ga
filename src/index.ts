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
import { spinalControlPointService } from "spinal-env-viewer-plugin-control-endpoint-service";
import { SpinalContext, SpinalGraph, SpinalNode } from "spinal-model-graph";
import config from "./config";
import { SpinalGraphService } from "spinal-env-viewer-graph-service";
import { spinalAnalyticService } from "spinal-env-viewer-plugin-analytics-service";
import { InputDataEndpointDataType, NetworkService, InputDataEndpoint, InputDataEndpointType}  from "spinal-model-bmsnetwork"
import { SpinalTimeSeries } from "spinal-model-timeseries"



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

    public NetworkService = new NetworkService()

    private async getAnalytics() {
        const contexts = await spinalAnalyticService.getContexts();
        for (const context of contexts) {
            const contextId = context.id.get();
            if(context.type.get() == "AnalyticGroupContext"){
                return SpinalGraphService.findInContext(contextId,contextId,(node: SpinalNode<any>) => {
                    if(node.getType().get() == spinalAnalyticService.nodeType){
                        (<any>SpinalGraphService)._addNode(node)
                        return true;
                    }
                    else return false;
                })
            }
            else return undefined
        }
    }



    public async getNumberTicket(nodeId: string){
        //console.log(node)
        const tickets = await SpinalGraphService.getChildren(nodeId, ["SpinalSystemServiceTicketHasTicket"]);
        //console.log(tickets);
        return tickets.length;
    }

    public async getRoomTicketCount(nodeId:string){
        const equipments = await SpinalGraphService.getChildren(nodeId,["hasBimObject"]);
        let res = await this.getNumberTicket(nodeId);
        for (const equipment of equipments) {
            res += await this.getNumberTicket(equipment.id.get());
        }
        return res;

    }

    public async getFloorTicketCount(nodeId:string){
        const rooms= await SpinalGraphService.getChildren(nodeId,["hasGeographicRoom"]);
        let res = await this.getNumberTicket(nodeId);
        for (const room of rooms) {
            res += await this.getRoomTicketCount(room.id.get());
        }
        return res;
    }

    public async getBuildingTicketCount(nodeId:string){
        const floors= await SpinalGraphService.getChildren(nodeId,["hasGeographicFloor"]);
        let res = await this.getNumberTicket(nodeId);
        for (const floor of floors) {
            res += await this.getFloorTicketCount(floor.id.get());
        }
        return res;
    }

    public async filterBmsEndpoint(endpointList: any, filter: string) {
        let outputBmsEndpoint = [];
        for (const endpoint of endpointList) {
            let bmsEndpoints = await SpinalGraphService.getChildren(endpoint.id.get(), ["hasBmsEndpoint"]);
            for (const bms of bmsEndpoints) {
                if (bms.name.get().includes(filter)) outputBmsEndpoint.push(bms);
                // if(bms.name.get().includes(filter)) outputBmsEndpoint.push(bms.name.get());
            }
        }
        return outputBmsEndpoint;

    }

    public async sumTimeSeriesOfBmsEndpoints(bmsEndpoints: any) {
        const networkService = new NetworkService();
        // console.log(bmsEndpoints);
        let sum = 0;
        for (let bms of bmsEndpoints) {
            // console.log(bms);
            let timeSeriesModel = await SpinalGraphService.getChildren(bms.id.get(), ["hasTimeSeries"]);
            // console.log(timeSeriesModel);
            let timeSeriesNode = SpinalGraphService.getRealNode(timeSeriesModel[0].id.get());
            // console.log(timeSeriesNode);
            let spinalTs = await timeSeriesNode.getElement();
            let currentData = await spinalTs.getCurrent();
            // console.log("current data : " + currentData.value);
            sum += currentData.value;
            // let testValue = await networkService.getData(bms.id.get());
            // console.log(testValue);
        }
        // console.log(sum);
        return sum;
    }

    ///////////////////////////////////////////////////
    //////////////// CONSOMMATION  ANALYTICS //////////
    ///////////////////////////////////////////////////


    public async calculateAnalyticsGlobalEnergy(controlBmsEndpointId: string, elementId: string, typeOfElement: string) {
        let endpointList = [];
        if (typeOfElement == "geographicBuilding") {
            let filter = "Comptage Energie Active Total";
            endpointList = await SpinalGraphService.getChildren(elementId, ["hasEndPoint"]);
            let bmsEndpoints = await this.filterBmsEndpoint(endpointList, filter);
            let sum = await this.sumTimeSeriesOfBmsEndpoints(bmsEndpoints);
            return sum;
        }
        else if (typeOfElement == "geographicFloor") {
            // console.log("ERROR : TYPE = " + typeOfElement + " is not valid");
        }
        else {
            console.log("ERROR : TYPE = " + typeOfElement + " is not valid");
        }
    }

    public async calculateAnalyticsGlobalCVC(controlBmsEndpointId: string, elementId: string, typeOfElement: string) {
        let endpointList = [];
        if (typeOfElement == "geographicBuilding") {
            let filter = "CVC";
            endpointList = await SpinalGraphService.getChildren(elementId, ["hasEndPoint"]);
            let bmsEndpoints = await this.filterBmsEndpoint(endpointList, filter);
            let sum = await this.sumTimeSeriesOfBmsEndpoints(bmsEndpoints);
            return sum;
            // console.log(bmsEndpoints);
        }
        else if (typeOfElement == "geographicFloor") {
            // console.log("ERROR : TYPE = " + typeOfElement + " is not valid");
        }
        else {
            console.log("ERROR : TYPE = " + typeOfElement + " is not valid");
        }
    }


    public async calculateTicket(nodeId : string, nodeType : string, targetNode){
        let count = 0;
        //console.log(targetNode.element.load());
        if(nodeType == "geographicBuilding") {
            count = await this.getBuildingTicketCount(nodeId);
        }
        else if (nodeType == "geographicFloor"){
            count = await this.getFloorTicketCount(nodeId);
        }

        console.log(count);
        const input : InputDataEndpoint = {
            id: "",
            name: "",
            path: "",
            currentValue: count,
            unit: "",
            dataType: InputDataEndpointDataType.Integer,
            type: InputDataEndpointType.Other,
            nodeTypeName: "BmsEndpoint"// should be SpinalBmsEndpoint.nodeTypeName || 'BmsEndpoint'

        };

        await this.NetworkService.updateEndpoint(targetNode,input);
        console.log("ControlEndpoint Nombre de tickets updated");
        
    }
    





    public async getEndpoints(nodeId: string, nameFilter: string) {
        const element_to_endpoint_relation = "hasEndPoint"
        const node = SpinalGraphService.getRealNode(nodeId);
        const EndpointProfils = await SpinalGraphService.getChildren(nodeId, [element_to_endpoint_relation]);
        for (const endpointProfil of EndpointProfils) { // pour chaque profil de control endpoint
            const endpointsModels = await SpinalGraphService.getChildren(endpointProfil.id.get(), ["hasBmsEndpoint"]);
            const endpoints = endpointsModels.map(el => el.get());
            for (const endpoint of endpoints) {
                if (endpoint.name.get() == nameFilter) return endpoint.id.get() // !!!! A CHANGER !!!!!
            }

        }
        return undefined;
    }

    public async getControlEndpoint(nodeId:string, nameFilter:string){
        const NODE_TO_CONTROL_POINTS_RELATION = spinalControlPointService.ROOM_TO_CONTROL_GROUP // "hasControlPoints"
        const CONTROL_POINTS_TO_BMS_ENDPOINT_RELATION = "hasBmsEndpoint";
        let allControlPoints = await SpinalGraphService.getChildren(nodeId, [NODE_TO_CONTROL_POINTS_RELATION]);
        for (let controlPoint of allControlPoints) {
            let allBmsEndpoints = await SpinalGraphService.getChildren(controlPoint.id.get(), [CONTROL_POINTS_TO_BMS_ENDPOINT_RELATION]);
            let test = allBmsEndpoints.filter(elt => elt.name.get() == nameFilter);
            if (test.length != 0) return test[0];
        }
        return false;
    }

    // Update control points with correct values
    public async updateControlEndpoints() {
        const analytics = await this.getAnalytics();
        for (const analytic of analytics) {

            // récupération du nom de l'analytic et du type d'analytic ciblé
            let analyticChildrenType = analytic.childrenType.get();
            let analyticName = analytic.name.get();

            const node = SpinalGraphService.getRealNode(analytic.id.get());
            /*const contextId = this.getNodeContext(analytic.id.get());
            console.log(analytic.childrenType.get());
            const nodesToUpdate = await this.getAnalyticChildren(contextId,analytic.id.get(),analytic.childrenType.get());
            console.log(nodesToUpdate);*/

            const groups = await SpinalGraphService.getChildren(analytic.id.get(), [spinalAnalyticService.ANALYTIC_TO_GROUP_RELATION]);
            for (const group of groups) {
                const elements = await SpinalGraphService.getChildren(group.id.get()); // récupération du gorupe auquel est lié l'analytic
                for (const element of elements) {
                    // récupération des noeuds du bon type
                    const typeOfElement = element.type.get();
                    if (typeOfElement == analyticChildrenType) {
                        // Récupération du controlpoint lié avec le nom de l'analytic
                        let controlBmsEndpoint = await this.getControlEndpoint(element.id.get(), analyticName); // sortie
                        if (controlBmsEndpoint != false) {
                            let analyticsResult = undefined;
                            switch (analyticName) {
                                case "Energie globale":
                                    analyticsResult = await this.calculateAnalyticsGlobalEnergy(controlBmsEndpoint.id.get(), element.id.get(), typeOfElement);
                                    console.log(analyticName + " for " + typeOfElement + " = " + analyticsResult);
                                    break;
                                case "Chauffage":
                                    // console.log(analyticName + " for " + typeOfElement + " = " + analyticsResult);
                                    // console.log("ok");
                                    break;
                                case "Climatisation":
                                    analyticsResult = await this.calculateAnalyticsGlobalCVC(controlBmsEndpoint.id.get(), element.id.get(), typeOfElement);
                                    console.log(analyticName + " for " + typeOfElement + " = " + analyticsResult);
                                    // console.log("ok");
                                    break;
                                case "Eclairage":
                                    // console.log(analyticName + " for " + typeOfElement + " = " + analyticsResult);
                                    // console.log("ok");
                                    break;
                                case "Eau":
                                    // console.log(analyticName + " for " + typeOfElement + " = " + analyticsResult);
                                    // console.log("ok");
                                    break;
                                case "Production d'énergie":
                                    // console.log("ok");
                                    break;
                                case "Ensoleillement":
                                    // console.log("ok");
                                    break;
                                case "Efficacité de production d'énergie solaire":
                                    // console.log("ok");
                                    break;
                                case "Gain en émission de CO2":
                                    // console.log("ok");
                                    break;
                                case "Taux d'autoconsommation énergétique":
                                    // console.log("ok");
                                    break;
                                case "Qualité de l'air":
                                    // console.log("ok");
                                    break;
                                case "Luminosité":
                                    // console.log("ok");
                                    break;
                                case "Temperature moyenne":
                                    // console.log("ok");
                                    break;
                                case "Nombre d'espaces occupés":
                                    // console.log("ok");
                                    break;
                                case "Taux d'occupation":
                                    // console.log("ok");
                                    break;
                                case "Nombre de tickets":
                                    this.calculateTicket(element.id.get(), typeOfElement, controlBmsEndpoint);
                                    // console.log("ok");
                                    break;
                                default:
                                    console.log(analyticName + " : aucun trouvé pour : " + typeOfElement);
                                    // console.log(analyticName);
                                    // console.log(typeOfElement);
                                    break;
                            }
                        }

                        // console.log(controlBmsEndpoint);

                    }



                    // console.log(element);
                }
            }


        }


    }

}

async function Main() {
    // const networkService = new NetworkService();
    const spinalMain = new SpinalMain();
    await spinalMain.init();
    console.log(NetworkService);
    console.log(SpinalTimeSeries);

    ///// TODO ////
    spinalMain.updateControlEndpoints();



}

// Call main function
Main()