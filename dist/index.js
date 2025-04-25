"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const spinal_core_connectorjs_type_1 = require("spinal-core-connectorjs_type");
const config_1 = require("./config");
const spinal_env_viewer_graph_service_1 = require("spinal-env-viewer-graph-service");
const spinal_model_bmsnetwork_1 = require("spinal-model-bmsnetwork");
const utils = require("./utils");
class SpinalMain {
    constructor() {
        const url = `http://${config_1.default.userId}:${config_1.default.userPassword}@${config_1.default.hubHost}:${config_1.default.hubPort}/`;
        this.connect = spinal_core_connectorjs_type_1.spinalCore.connect(url);
    }
    /**
     *
     * Initialize connection with the hub and load graph
     * @return {*}
     * @memberof SpinalMain
     */
    init() {
        return new Promise((resolve, reject) => {
            spinal_core_connectorjs_type_1.spinalCore.load(this.connect, config_1.default.digitalTwinPath, async (graph) => {
                await spinal_env_viewer_graph_service_1.SpinalGraphService.setGraph(graph);
                resolve(graph);
            }, () => {
                reject();
            });
        });
    }
    /**
     * Function to update controle enpoints in rooms with bmsdevices that have bmsendpoints contained in the bmsendpoints filter lists (co2 and temperature)
     * @memberof SpinalMain
     */
    async updateControlEndpoints() {
        const Tempfilter = config_1.default.TempEndpoints;
        const Co2filter = config_1.default.Co2Endpoints;
        const Rooms = await utils.getRooms();
        if (Rooms.length !== 0) {
            for (const room of Rooms) {
                const bmsdevices = await utils.getBmsDevicesList(room.id.get());
                let TempList = [];
                let CO2List = [];
                if (bmsdevices.length !== 0) {
                    console.log(`Filter process for the room: ${room.name.get()} \n`);
                    for (const device of bmsdevices) {
                        const endpointList = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(device.id.get(), ["hasBmsEndpoint"]);
                        if (endpointList.length !== 0) {
                            console.log(`EndPoints found for device : ${device.name.get()} \n`);
                            const TempEndpoint = utils.filterBmsEndpointList(endpointList, Tempfilter);
                            const CO2Endpoint = utils.filterBmsEndpointList(endpointList, Co2filter);
                            TempList = TempList.concat(TempEndpoint);
                            CO2List = CO2List.concat(CO2Endpoint);
                        }
                        else {
                            console.log(`No endpoint found for bmsDevice: ${device.name.get()} ==> room: ${room.name.get()}`);
                        }
                    }
                }
                else {
                    console.log(`No bmsDevice found in the room: ${room.name.get()}`);
                }
                const tempNames = TempList.map(temp => temp.name.get());
                const CO2Names = CO2List.map(CO2 => CO2.name.get());
                console.log(`Temp bmsEndpoints found:\n`, tempNames);
                console.log(`Co2 bmsEndpoints found:\n`, CO2Names);
                const TempAnalytic = await utils.CalculateAnalytic(TempList);
                const moyenneTemp = TempAnalytic.average;
                const MinTemp = TempAnalytic.minimum;
                const MaxTemp = TempAnalytic.maximum;
                const Co2Analytic = await utils.CalculateAnalytic(CO2List);
                const moyenneCo2 = Co2Analytic.average;
                const MinCo2 = Co2Analytic.minimum;
                const MaxCo2 = Co2Analytic.maximum;
                console.log("moyenne Temp", moyenneTemp);
                console.log("moyenne CO2", moyenneCo2);
                let TempControlEndPoint = await utils.getControlEndpoint(room.id.get(), "Température");
                let MinTempControlEndPoint = await utils.getControlEndpoint(room.id.get(), "Min température");
                let MaxTempControlEndPoint = await utils.getControlEndpoint(room.id.get(), "Max température");
                if (TempControlEndPoint != false) {
                    await utils.updateControlEndpointWithAnalytic(TempControlEndPoint, moyenneTemp, spinal_model_bmsnetwork_1.InputDataEndpointDataType.Real, spinal_model_bmsnetwork_1.InputDataEndpointType.Other);
                    await utils.updateControlEndpointWithAnalytic(MinTempControlEndPoint, MinTemp, spinal_model_bmsnetwork_1.InputDataEndpointDataType.Real, spinal_model_bmsnetwork_1.InputDataEndpointType.Other);
                    await utils.updateControlEndpointWithAnalytic(MaxTempControlEndPoint, MaxTemp, spinal_model_bmsnetwork_1.InputDataEndpointDataType.Real, spinal_model_bmsnetwork_1.InputDataEndpointType.Other);
                    console.log("Temperature updated for " + room.name.get());
                }
                else {
                    console.log(" NO temperature controlEndPoint Found");
                }
                let CO2ControlEndPoint = await utils.getControlEndpoint(room.id.get(), "Concentration CO2");
                let MinCO2ControlEndPoint = await utils.getControlEndpoint(room.id.get(), "Min CO2");
                let MaxCO2ControlEndPoint = await utils.getControlEndpoint(room.id.get(), "Max CO2");
                if (CO2ControlEndPoint != false) {
                    await utils.updateControlEndpointWithAnalytic(CO2ControlEndPoint, moyenneCo2, spinal_model_bmsnetwork_1.InputDataEndpointDataType.Real, spinal_model_bmsnetwork_1.InputDataEndpointType.Other);
                    await utils.updateControlEndpointWithAnalytic(MinCO2ControlEndPoint, MinCo2, spinal_model_bmsnetwork_1.InputDataEndpointDataType.Real, spinal_model_bmsnetwork_1.InputDataEndpointType.Other);
                    await utils.updateControlEndpointWithAnalytic(MaxCO2ControlEndPoint, MaxCo2, spinal_model_bmsnetwork_1.InputDataEndpointDataType.Real, spinal_model_bmsnetwork_1.InputDataEndpointType.Other);
                    console.log(" CO2 concentration updated for " + room.name.get());
                }
                else {
                    console.log("No CO2 controlEndPoint Found");
                }
            }
        }
        else {
            console.log("No Room Found In Context");
        }
        console.log("DONE");
    }
}
async function job() {
    try {
        const spinalMain = new SpinalMain();
        await spinalMain.init();
        await spinalMain.updateControlEndpoints();
        setTimeout(() => {
            console.log('STOP OK');
            process.exit(0);
        }, 1000 * 60 * 5); // (5min)
    }
    catch (error) {
        console.error(error);
        setTimeout(() => {
            console.log('STOP ERROR');
            process.exit(0);
        }, 5000);
    }
}
async function Main() {
    console.log('Organ Start');
    /*cron.schedule('10 * * * *', async (): Promise<void> => {
      console.log('Analytic job Start');
      await job();
    });*/
    // FOR DEBUG
    await job();
}
// Call main function
Main();
//# sourceMappingURL=index.js.map