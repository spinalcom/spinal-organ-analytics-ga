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
import { SpinalContext, SpinalGraph, SpinalNode, SPINAL_RELATION_LST_PTR_TYPE, SPINAL_RELATION_PTR_LST_TYPE } from "spinal-model-graph";
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
        let sum = 0;
        for (let bms of bmsEndpoints) {
            let timeSeriesModel = await SpinalGraphService.getChildren(bms.id.get(), ["hasTimeSeries"]);
            if(timeSeriesModel.length !=0){
                let timeSeriesNode = SpinalGraphService.getRealNode(timeSeriesModel[0].id.get());
                let spinalTs = await timeSeriesNode.getElement();
                let currentData = await spinalTs.getCurrent();
                if(currentData != undefined){
                    sum += currentData.value;
                }
            }
            
        }
        return sum;
    }


    ////////////////////////////////////////////////////
    ////////////////// TICKETS ANALYTICS ///////////////
    ////////////////////////////////////////////////////

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

    public async calculateTicket(nodeId : string, nodeType : string, targetNode){
        let count = 0;
        if(nodeType == "geographicBuilding") {
            count = await this.getBuildingTicketCount(nodeId);
        }
        else if (nodeType == "geographicFloor"){
            count = await this.getFloorTicketCount(nodeId);
        }
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
            valueToPush = await this.sumTimeSeriesOfBmsEndpoints(bmsEndpoints);
        }
        else if (typeOfElement == "geographicFloor") {
            let filter = "Comptage Energie - General";
            endpointList = await SpinalGraphService.getChildren(elementId, ["hasEndPoint"]);
            let bmsEndpoints = await this.filterBmsEndpoint(endpointList, filter);
            valueToPush = await this.sumTimeSeriesOfBmsEndpoints(bmsEndpoints);
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
            valueToPush = await this.sumTimeSeriesOfBmsEndpoints(bmsEndpoints);
            // return sum;
            // console.log(bmsEndpoints);
        }
        else if (typeOfElement == "geographicFloor") {
            let filter = "Comptage Energie - CVC";
            endpointList = await SpinalGraphService.getChildren(elementId, ["hasEndPoint"]);
            let bmsEndpoints = await this.filterBmsEndpoint(endpointList, filter);
            valueToPush = await this.sumTimeSeriesOfBmsEndpoints(bmsEndpoints);
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
            valueToPush = await this.sumTimeSeriesOfBmsEndpoints(bmsEndpoints);
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


    //////////////////////////////////////////////////////////
    /////////////////// COMMISSIONNING ANALYTICS /////////////
    //////////////////////////////////////////////////////////

    public async calculateAnalyticsMonitorable(targetNode:any, elementId: string, typeOfElement: string){
        let filter = "MULTICAPTEUR";
        let bimObjects = await SpinalGraphService.getChildren(elementId, ["hasBimObject"]);
        let multicapteurs = bimObjects.filter(elt => elt.name.get().includes(filter));
        if(multicapteurs.length ==0){
            return "Non monitorable";
            // console.log("pas de MCA");
            // monitorable0++;
        }
        else{
            for(let mca of multicapteurs){
                let bmsEndpoints = await SpinalGraphService.getChildren(mca.id.get(), ["hasBmsEndpoint"]);
                if(bmsEndpoints.length == 0){
                    return "Monitorable mais non monitorée";
                    // monitorable1++;
                    // console.log("MCA mais pas de endpoint");
                }
                else{
                    return "Monitorée";
                    // monitorable2++;
                    // console.log("MCA et endpoint : monitorable");
                }
            }
        }
    }

    //////////////////////////////////////////////////////////////////
    ///////////////////////// GTB ANALYTICS //////////////////////////
    //////////////////////////////////////////////////////////////////

    public async calculateAnalyticsOccupationRate(targetNode:any, elementId: string, typeOfElement: string){
        const networkService = new NetworkService();
        let analyticResults = [];
        let rate = 0;

        let lastHourDate = new Date();
        lastHourDate.setHours(lastHourDate.getHours() - 1);

        const OBJECT_TO_BMS_ENDPOINT_RELATION = "hasBmsEndpoint";
        const filterOccupationBmsEndpoint = "Occupation";
        let filterMonitorable = "Monitorable";
        let filterMulticapteur = "MULTICAPTEUR";
        let spatialId = (SpinalGraphService.getContextWithType("geographicContext"))[0].info.id.get();
        let monitorableControlEndpoint = await this.getControlEndpoint(elementId, filterMonitorable);
        if(monitorableControlEndpoint != false){
            let currentDataMonitorable = (await networkService.getData(monitorableControlEndpoint.id.get())).currentValue.get();
            if(currentDataMonitorable == "Monitorée"){
                console.log("monitorée");
                let multicapteur = await SpinalGraphService.findInContext(elementId, spatialId, elt => {
                    if(elt.info.type.get() == "BIMObject" && elt.info.name.get().includes(filterMulticapteur) && elt.hasRelation(OBJECT_TO_BMS_ENDPOINT_RELATION, SPINAL_RELATION_PTR_LST_TYPE)){
                        (<any>SpinalGraphService)._addNode(elt);
                        return true;
                    }
                    return false;
                });
                let allBmsEndpoints = await this.filterBmsEndpoint(multicapteur, filterOccupationBmsEndpoint);
                for(let bms of allBmsEndpoints){
                    let spinalTs = await networkService.getTimeseries(bms.id.get());
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
        valueToPush = await this.sumTimeSeriesOfBmsEndpoints(allBmsToSum);
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
            // console.log(controlPoint);
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
        
        for(const analyticGroup of analyticGroups){
            const analytics = await SpinalGraphService.getChildren(analyticGroup.id.get(), ["groupHasAnalytic"]);
            for (const analytic of analytics) {

                // récupération du nom de l'analytic et du type d'analytic ciblé
                let analyticChildrenType = analytic.childrenType.get();
                let analyticName = analytic.name.get();
    
                const node = SpinalGraphService.getRealNode(analytic.id.get());
    
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
                                        analyticsResult =  await this.calculateAnalyticsGlobalEnergy(controlBmsEndpoint, element.id.get(), typeOfElement);
                                        await this.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                                        console.log(analyticName + " for " + typeOfElement + " updated !!!");
                                        break;
                                    case "Chauffage":
                                        // console.log(analyticName + " for " + typeOfElement + " updated !!!");
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
                                            console.log(analyticName + " for " + typeOfElement + " updated !!!");
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
                                            console.log(analyticName + " for " + typeOfElement + " updated !!!");
                                        }
                                        break;
                                    case "Eau":
                                        // console.log(analyticName + " for " + typeOfElement + " updated !!!");
                                        break;
                                    case "Production d'énergie":
                                        analyticsResult =  await this.calculateAnalyticsEnergyProduction(controlBmsEndpoint, element.id.get(), typeOfElement);
                                        await this.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                                        console.log(analyticName + " for " + typeOfElement + " updated !!!");
                                        break;
                                    case "Ensoleillement":
                                        analyticsResult =  await this.calculateAnalyticsSunlightProduction(controlBmsEndpoint, element.id.get(), typeOfElement);
                                        await this.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                                        console.log(analyticName + " for " + typeOfElement + " updated !!!");
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
                                        analyticsResult = await this.calculateAnalyticsOccupationRate(controlBmsEndpoint, element.id.get(), typeOfElement);
                                        await this.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                                        console.log(analyticsResult);
                                        break;
                                    case "Nombre de tickets":
                                        await this.calculateTicket(element.id.get(), typeOfElement, controlBmsEndpoint);
                                        console.log(analyticName + " for " + typeOfElement + " updated !!!");
                                        break;
                                    case "Monitorable":
                                        analyticsResult = await this.calculateAnalyticsMonitorable(controlBmsEndpoint, element.id.get(), typeOfElement);
                                        await this.updateControlEndpointWithAnalytic(controlBmsEndpoint, analyticsResult, InputDataEndpointDataType.Enumerated, InputDataEndpointType.Other);
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
    }
}

async function Main() {
    const spinalMain = new SpinalMain();
    await spinalMain.init();
    console.log(NetworkService);
    console.log(SpinalTimeSeries);

    ///// TODO ////
    await spinalMain.updateControlEndpoints();
    console.log("DONE");



}

// Call main function
Main()