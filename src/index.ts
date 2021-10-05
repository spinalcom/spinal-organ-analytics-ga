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
import { SpinalGraphService, SpinalNodeRef } from "spinal-env-viewer-graph-service";
import { spinalAnalyticService } from "spinal-env-viewer-plugin-analytics-service";
import { InputDataEndpointDataType, NetworkService, InputDataEndpoint, InputDataEndpointType, SpinalBmsEndpoint}  from "spinal-model-bmsnetwork"
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

    private async getAnalyticsGroup(){
        const context = SpinalGraphService.getContextWithType("AnalyticGroupContext");
        let orderedAnalyticGroups = [];
        if(context.length !=0 ){
            const contextId = context[0].info.id.get();
            let analyticGroups = await SpinalGraphService.findInContext(contextId, contextId, (elt: SpinalNode<any>) => {
                if(elt.info.type.get() == "AnalyticGroup"){
                    (<any>SpinalGraphService)._addNode(elt);
                    return true;
                }
                else return false;
            });
            // classement Piece puis Etage puis Batiment
            let bat = analyticGroups.filter(group => (group.name.get() == "Bâtiment" || group.name.get() == "Batiment" || group.name.get() == "Building"));
            let flr = analyticGroups.filter(group => (group.name.get() == "Etage" || group.name.get() == "Etages"));
            let rom = analyticGroups.filter(group => (group.name.get() == "Pièces" || group.name.get() == "Pièce" || group.name.get() == "Pieces" || group.name.get() == "Piece"));
            orderedAnalyticGroups = rom.concat(flr, bat);
            return orderedAnalyticGroups;
        }
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
            if(currentData != undefined){
                sum += currentData.value;
            }
            // let testValue = await networkService.getData(bms.id.get());
            // console.log(testValue);
        }
        // console.log(sum);
        return sum;
    }

    public async sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints: any) {
        let sum = 0;
        for (let bms of bmsEndpoints) {
            let timeSeriesModel = await SpinalGraphService.getChildren(bms.id.get(), ["hasTimeSeries"]);
            let timeSeriesNode = SpinalGraphService.getRealNode(timeSeriesModel[0].id.get());
            let spinalTs : SpinalTimeSeries = await timeSeriesNode.getElement();
            
            let valueLastHour = undefined
            let value = undefined
            let data = await spinalTs.getDataFromLastHours();
            for await ( const x of data){
                if (!valueLastHour) {
                    valueLastHour = x.value;
                }
                value = x.value;
            }
            //console.log("h-1 value:",valueLastHour, " | current value:",value);
            sum += (value - valueLastHour);
        }
        //console.log(" TOTAL DIFFERENCE : ", sum);
        return sum;
    }



    ////////////////////////////////////////////////////
    ////////////////// TICKETS ANALYTICS ///////////////
    ////////////////////////////////////////////////////

    public async getNumberTicket(nodeId: string,stepIds : Array<String>){
        const tickets = await SpinalGraphService.getChildren(nodeId, ["SpinalSystemServiceTicketHasTicket"]);
        let count = 0;
        if(tickets.length != 0){
            for (const ticket of tickets){
                if (stepIds && stepIds.includes(ticket.stepId.get())){
                    count +=1;
                }
            }
        }
        return count;
    }

    public async ticketsOuvertsFilter(){
        const stepNames = ["Attente de lect.avant Execution","Attente de réalisation","Réalisation partielle"];
        //const stepNames = ["Clôturée","Refusée","Archived"];
        const ctxt = await SpinalGraphService.getContextWithType("SpinalSystemServiceTicket");
        const contextId = ctxt[0].info.id.get();
        const steps = await SpinalGraphService.findInContext(contextId,contextId,(node: SpinalNode<any>) => {
            if(node.getType().get() == "SpinalSystemServiceTicketTypeStep" && stepNames.includes(node.getName().get()) ){
                (<any>SpinalGraphService)._addNode(node)
                return true;
            }
            else return false;
        });
        const stepIds = steps.map(el => el.get().id);
        return stepIds;

    }


    public async getNumberTicketFromControlEndpoint(nodeId : string){
        const node = await this.getControlEndpoint(nodeId,"Nombre de tickets")
    
        if (node != false){
            const bmsEndpoint = await node.element.load();
            return bmsEndpoint.get().currentValue;
        }
        return 0;
        
    }

    public async getRoomTicketCount(nodeId:string,stepIds){
        const equipments = await SpinalGraphService.getChildren(nodeId,["hasBimObject"]);
        let res = await this.getNumberTicket(nodeId,stepIds);
        for (const equipment of equipments) {
            res += await this.getNumberTicket(equipment.id.get(),stepIds);
        }
        return res;

    }

    public async getFloorTicketCount(nodeId:string,stepIds){
        const rooms= await SpinalGraphService.getChildren(nodeId,["hasGeographicRoom"]);
        let res = await this.getNumberTicket(nodeId,stepIds);
        for (const room of rooms) {
            res += await this.getNumberTicket(room.id.get(),stepIds);
        }
        return res;
    }

    public async getBuildingTicketCount(nodeId:string,stepIds){
        const floors= await SpinalGraphService.getChildren(nodeId,["hasGeographicFloor"]);
        let res = await this.getNumberTicket(nodeId,stepIds);
        for (const floor of floors) {
            res += await this.getNumberTicketFromControlEndpoint(floor.id.get());
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

    public async updateTicketControlPoints(nodeId : string, nodeType : string, targetNode,stepIds){
        let count = 0;
        if(nodeType == "geographicBuilding") {
            count = await this.getBuildingTicketCount(nodeId,stepIds);
        }
        else if (nodeType == "geographicFloor"){
            count = await this.getFloorTicketCount(nodeId,stepIds);
        }

        //console.log(count," ", nodeType);
        this.updateControlEndpointWithAnalytic(targetNode,count,InputDataEndpointDataType.Integer,InputDataEndpointType.Other)
        // console.log("ControlEndpoint Nombre de tickets updated");
    }

    



    ///////////////////////////////////////////////////
    //////////////// CONSOMMATION  ANALYTICS //////////
    ///////////////////////////////////////////////////


    public async calculateAnalyticsGlobalEnergy(targetNode:any, elementId: string, typeOfElement: string) {
        let endpointList = [];
        let valueToPush = undefined;
        if (typeOfElement == "geographicBuilding") {
            let filter = "Comptage Energie Active Total";
            endpointList = await SpinalGraphService.getChildren(elementId, ["hasEndPoint"]);
            let bmsEndpoints = await this.filterBmsEndpoint(endpointList, filter);
            valueToPush = await this.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints);
        }
        else if (typeOfElement == "geographicFloor") {
            let filter = "Comptage Energie - General";
            endpointList = await SpinalGraphService.getChildren(elementId, ["hasEndPoint"]);
            let bmsEndpoints = await this.filterBmsEndpoint(endpointList, filter);
            valueToPush = await this.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints);
        }
        else {
            console.log("ERROR : TYPE = " + typeOfElement + " is not valid");
        }

        return valueToPush;
    }

    public async calculateAnalyticsGlobalCVC(targetNode:any, elementId: string, typeOfElement: string) {
        let endpointList = [];
        let valueToPush = undefined;
        if (typeOfElement == "geographicBuilding") {
            let filter = "CVC";
            endpointList = await SpinalGraphService.getChildren(elementId, ["hasEndPoint"]);
            let bmsEndpoints = await this.filterBmsEndpoint(endpointList, filter);
            valueToPush = await this.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints);
            // return sum;
            // console.log(bmsEndpoints);
        }
        else if (typeOfElement == "geographicFloor") {
            let filter = "Comptage Energie - CVC";
            endpointList = await SpinalGraphService.getChildren(elementId, ["hasEndPoint"]);
            let bmsEndpoints = await this.filterBmsEndpoint(endpointList, filter);
            valueToPush = await this.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints);
            // console.log("ERROR : TYPE = " + typeOfElement + " is not valid");
        }
        else {
            console.log("ERROR : TYPE = " + typeOfElement + " is not valid");
        }

        return valueToPush;
    }

    public async calculateAnalyticsGlobalLighting(targetNode:any, elementId: string, typeOfElement: string) {
        let endpointList = [];
        let valueToPush = undefined;
        if (typeOfElement == "geographicBuilding") {
            // il faut récupérer la conso de chaque étage depuis leur control point respectifs : une fonction spécifique pour Vinci a été créée
            valueToPush = await this.VINCI_specificUpdate_Lighting_Building_Analytics("Eclairage");
        }
        else if (typeOfElement == "geographicFloor") {
            let filter = "Comptage Energie - Eclairage";
            endpointList = await SpinalGraphService.getChildren(elementId, ["hasEndPoint"]);
            let bmsEndpoints = await this.filterBmsEndpoint(endpointList, filter);
            valueToPush = await this.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints);
        }
        else {
            console.log("ERROR : TYPE = " + typeOfElement + " is not valid");
        }
        return valueToPush;
    }

    public async calculateAnalyticsGlobalWater(targetNode:any , elementId: string, typeOfElement: string) {
        let endpointList = [];
        let valueToPush = undefined;
        if (typeOfElement == "geographicBuilding") {
            let filter = "Volume EF";
            endpointList = await SpinalGraphService.getChildren(elementId, ["hasEndPoint"]);
            let bmsEndpoints = await this.filterBmsEndpoint(endpointList, filter);
            valueToPush = await this.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints);
        }
        else if (typeOfElement == "geographicFloor") {
            let filter = "Volume EF";
            endpointList = await SpinalGraphService.getChildren(elementId, ["hasEndPoint"]);
            let bmsEndpoints = await this.filterBmsEndpoint(endpointList, filter);
            valueToPush = await this.sumTimeSeriesOfBmsEndpoints(bmsEndpoints);
            let valueToPush2 = await this.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(bmsEndpoints);
            //console.log(valueToPush," / h-1 difference :", valueToPush2);
        }
        else {
            console.log("ERROR : TYPE = " + typeOfElement + " is not valid");
        }

        return valueToPush;
    }

    //////////////////////////////////////////////////////////
    ////////////////// PRODUCTION ENERGIE ANALYTICS //////////
    //////////////////////////////////////////////////////////

    public async calculateAnalyticsEnergyProduction(targetNode:any, elementId: string, typeOfElement: string){
        let allBmsEndpoints = [];
        let valueToPush = undefined;
        let filters = ["Photovoltaique", "Geothermie", "TD Velo"];
        let endpointList = await SpinalGraphService.getChildren(elementId, ["hasEndPoint"]);
        for (let filter of filters){
            let bms = await this.filterBmsEndpoint(endpointList, filter)
            allBmsEndpoints = allBmsEndpoints.concat(bms);
        }
        valueToPush = await this.sumTimeSeriesOfBmsEndpoints(allBmsEndpoints);
        return valueToPush;
    }

    public async calculateAnalyticsSunlightProduction(targetNode:any, elementId: string, typeOfElement: string){
        let valueToPush = undefined;
        let filter = "Photovoltaique";
        let endpointList = await SpinalGraphService.getChildren(elementId, ["hasEndPoint"]);
        let bms = await this.filterBmsEndpoint(endpointList, filter);
        valueToPush = await this.sumTimeSeriesOfBmsEndpoints(bms);
        return valueToPush;
    }



/////////////////////////////////////////////////////////////////////////
/////////////////// SPECIFIC FUNCTIONS FOR VINCI ////////////////////////
/////////////////////////////////////////////////////////////////////////

    public async VINCI_specificUpdate_CVC_Floors_CP_Analytics(targetNode:any, elementId: string, typeOfElement: string, analyticName:string = "Climatisation"){
        // principe : on calcule l'analytics pour l etage -2, on le divise par 3 et on push dans -2 -1 et 0 (RDC)
        let analyticsResult = (await this.calculateAnalyticsGlobalCVC(targetNode, elementId, typeOfElement)) / 3 ;
        // push dans -2
        await this.updateControlEndpointWithAnalytic(targetNode, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
        // on récupère les bons control point de -1 et 0 et on push dedans
        let spatialContext = (SpinalGraphService.getContextWithType("geographicContext"))[0];
        let spatialId = spatialContext.info.id.get();
        let floors = await SpinalGraphService.findInContext(spatialId, spatialId, (elt:SpinalNode<any>) => {
            if(elt.info.type.get() == "geographicFloor" && (elt.info.name.get() == "-1" || elt.info.name.get() == "0")){
                (<any>SpinalGraphService)._addNode(elt);
                return true;
            }
            return false;
        });
        for(let flr of floors){
            let controlBmsEndpoint = await this.getControlEndpoint(flr.id.get(), analyticName);
            if(controlBmsEndpoint != false){
                await this.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
            }
            else{
                console.log("Impossible to update control point " + analyticName + " of floor : " + flr.name.get());
            }
        }
    }

    public async VINCI_specificUpdate_Lighting_Floors_CP_Analytics(targetNode:any, elementId: string, typeOfElement: string, analyticName:string = "Eclairage"){
        // principe : on calcule l'analytics pour l etage -2, on le divise par 3 et on push dans -2 -1 et 0 (RDC)
        let analyticsResult = (await this.calculateAnalyticsGlobalCVC(targetNode, elementId, typeOfElement)) / 3 ;
        // push dans -2
        await this.updateControlEndpointWithAnalytic(targetNode, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
        // on récupère les bons control point de -1 et 0 et on push dedans
        let spatialContext = (SpinalGraphService.getContextWithType("geographicContext"))[0];
        let spatialId = spatialContext.info.id.get();
        let floors = await SpinalGraphService.findInContext(spatialId, spatialId, (elt:SpinalNode<any>) => {
            if(elt.info.type.get() == "geographicFloor" && (elt.info.name.get() == "-1" || elt.info.name.get() == "0")){
                (<any>SpinalGraphService)._addNode(elt);
                return true;
            }
            return false;
        });
        for(let flr of floors){
            let controlBmsEndpoint = await this.getControlEndpoint(flr.id.get(), analyticName);
            if(controlBmsEndpoint != false){
                await this.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
            }
            else{
                console.log("Impossible to update control point " + analyticName + " of floor : " + flr.name.get());
            }
        }
    }

    public async VINCI_specificUpdate_Lighting_Building_Analytics(analyticName:string = "Eclairage"){
        // principe : il faut récupérer la conso de l eclairage de chaque étage depuis leur control point respectifs
        let valueToPush = undefined;
        let allBmsToSum = [];
        const spatialContext = (SpinalGraphService.getContextWithType("geographicContext"))[0];
        const spatialId = spatialContext.info.id.get();
        const floors = await SpinalGraphService.findInContext(spatialId, spatialId, (elt:SpinalNode<any>) => {
            if(elt.info.type.get() == "geographicFloor"){
                (<any>SpinalGraphService)._addNode(elt);
                return true;
            }
            return false;
        });
        for(const flr of floors){
            let bmsEndpoints = await this.getControlEndpoint(flr.id.get(), analyticName);
            allBmsToSum = allBmsToSum.concat(bmsEndpoints);
        }
        valueToPush = await this.sumTimeSeriesOfBmsEndpointsDifferenceFromLastHour(allBmsToSum);
        return valueToPush;


        // sumTimeSeriesOfBmsEndpoints
    }

    
//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////


    public async updateControlEndpointWithAnalytic(target:any, valueToPush:any, dataType:any, type:any){

        if(valueToPush != undefined){
            const input : InputDataEndpoint = {
                id: "",
                name: "",
                path: "",
                currentValue: valueToPush,
                unit: "",
                dataType: dataType,
                type: type,
                nodeTypeName: "BmsEndpoint"// should be SpinalBmsEndpoint.nodeTypeName || 'BmsEndpoint'
            };
            await this.NetworkService.updateEndpoint(target,input);
        }
        else{
            console.log(valueToPush + " value to push in node : " + target.name.get() + " -- ABORTED !");
        }
    }

    public async getEndpoints(nodeId: string, nameFilter: string) {
        const element_to_endpoint_relation = "hasEndPoint";
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
        // const analytics = await this.getAnalytics();
        const analyticGroups = await this.getAnalyticsGroup();
        const ticketStepIds = await this.ticketsOuvertsFilter();

        for(const analyticGroup of analyticGroups){
            const analytics = await SpinalGraphService.getChildren(analyticGroup.id.get(), ["groupHasAnalytic"]);
            for (const analytic of analytics) {

                // récupération du nom de l'analytic et du type d'analytic ciblé
                let analyticChildrenType = analytic.childrenType.get();
                let analyticName = analytic.name.get();
                //if(analyticName == "Monitorable") continue;
                const node = SpinalGraphService.getRealNode(analytic.id.get());
    
                const groups = await SpinalGraphService.getChildren(analytic.id.get(), [spinalAnalyticService.ANALYTIC_TO_GROUP_RELATION]);
                for (const group of groups) {
                    const elements = await SpinalGraphService.getChildren(group.id.get()); // récupération du groupe auquel est lié l'analytic
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
                                        analyticsResult =  await this.calculateAnalyticsGlobalEnergy(controlBmsEndpoint, element.id.get(), typeOfElement);
                                        await this.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                                        console.log(analyticName + " for " + typeOfElement + " updated ");
                                        break;
                                    case "Chauffage":
                                        console.log(analyticName + " for " + typeOfElement + " updated");
                                        break;
                                    case "Climatisation": // DEV SPECIFIQUE VINCI : LES BOUCLES IF ET ELSE IF pour etage -2 -1 et 0
                                        if(typeOfElement == "geographicFloor" && element.name.get() == "-2"){
                                            console.log(analyticName + " specific function is used for " + typeOfElement + " : " + element.name.get());
                                            await this.VINCI_specificUpdate_CVC_Floors_CP_Analytics(controlBmsEndpoint, element.id.get(), typeOfElement, analyticName);
    
                                        }
                                        else if(typeOfElement == "geographicFloor" && (element.name.get() == "-1" || element.name.get() == "0")){
                                            console.log(analyticName + " specific function is used for " + typeOfElement + " : " + element.name.get());
                                        }
                                        else{ // DEV NORMAL DANS CE ELSE
                                            analyticsResult = await this.calculateAnalyticsGlobalCVC(controlBmsEndpoint, element.id.get(), typeOfElement);
                                            await this.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                                            console.log(analyticName + " for " + typeOfElement + " updated");
                                        }
                                        break;
                                    case "Eclairage": // DEV SPECIFIQUE VINCI : LES BOUCLES IF ET ELSE IF pour etage -2 -1 et 0 + pour Building dans la fonction calculateAnalyticsGlobalLighting
                                        if(typeOfElement == "geographicFloor" && element.name.get() == "-2"){
                                            console.log(analyticName + " specific function is used for " + typeOfElement + " : " + element.name.get());
                                            await this.VINCI_specificUpdate_Lighting_Floors_CP_Analytics(controlBmsEndpoint, element.id.get(), typeOfElement, analyticName);

                                        }
                                        else if(typeOfElement == "geographicFloor" && (element.name.get() == "-1" || element.name.get() == "0")){
                                            console.log(analyticName + " specific function is used for " + typeOfElement + " : " + element.name.get());
                                        }
                                        else{ // DEV NORMAL DANS CE ELSE
                                            analyticsResult = await this.calculateAnalyticsGlobalLighting(controlBmsEndpoint, element.id.get(), typeOfElement);
                                            await this.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                                            console.log(analyticName + " for " + typeOfElement + " updated ");
                                        }
                                        break;
                                    case "Eau":
                                        analyticsResult = await this.calculateAnalyticsGlobalWater(controlBmsEndpoint, element.id.get(), typeOfElement);
                                        await this.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                                        console.log(analyticName + " for " + typeOfElement + " updated ");
                                        break;
                                    case "Production d'énergie":
                                        analyticsResult =  await this.calculateAnalyticsEnergyProduction(controlBmsEndpoint, element.id.get(), typeOfElement);
                                        await this.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                                        console.log(analyticName + " for " + typeOfElement + " updated ");
                                        break;
                                    case "Ensoleillement":
                                        analyticsResult =  await this.calculateAnalyticsSunlightProduction(controlBmsEndpoint, element.id.get(), typeOfElement);
                                        await this.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                                        console.log(analyticName + " for " + typeOfElement + " updated ");
                                        break;
                                    case "Efficacité de production d'énergie solaire":
                                        break;
                                    case "Gain en émission de CO2":
                                        break;
                                    case "Taux d'autoconsommation énergétique":
                                        break;
                                    case "Qualité de l'air":
                                        break;
                                    case "Luminosité":
                                        break;
                                    case "Temperature moyenne":
                                        break;
                                    case "Nombre d'espaces occupés":
                                        break;
                                    case "Taux d'occupation":
                                        break;
                                    case "Nombre de tickets":
                                        await this.updateTicketControlPoints(element.id.get(), typeOfElement, controlBmsEndpoint,ticketStepIds);
                                        console.log(analyticName + " for " + typeOfElement + " updated ");
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
    }
}

async function Main() {
    const spinalMain = new SpinalMain();
    await spinalMain.init();
    //console.log(NetworkService);
    //console.log(SpinalTimeSeries);

    ///// TODO ////
    await spinalMain.updateControlEndpoints();
    console.log("DONE");



}

// Call main function
Main()