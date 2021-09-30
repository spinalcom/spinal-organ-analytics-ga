import { spinalCore } from "spinal-core-connectorjs_type";
import { spinalControlPointService } from "spinal-env-viewer-plugin-control-endpoint-service";
import { SpinalContext, SpinalGraph, SpinalNode } from "spinal-model-graph";
import config from "./config";
import { SpinalGraphService } from "spinal-env-viewer-graph-service";
import { spinalAnalyticService } from "spinal-env-viewer-plugin-analytics-service";



 









class SpinalMain {
    constructor() { }

    /**
     * 
     * Initialize connection with the hub and load graph
     * @return {*}
     * @memberof SpinalMain
     */
    public init() {
        const url = `http://${config.userId}:${config.userPassword}@${config.hubHost}:${config.hubPort}/`;
        return new Promise((resolve, reject) => {
            spinalCore.load(spinalCore.connect(url), config.digitalTwinPath, async (graph: any) => {
                await SpinalGraphService.setGraph(graph);
                resolve(graph)
            }, () => {
                reject()
            })
        });
    }



    private async getAnalytics(){
        const contexts = await spinalAnalyticService.getContexts();
        for(const context of contexts){
            const contextId = context.id.get();

            //console.log(contextId);
            return SpinalGraphService.findInContext(contextId,contextId,(node: SpinalNode<any>) => {
                if(node.getType().get() == spinalAnalyticService.nodeType){
                    (<any>SpinalGraphService)._addNode(node)
                    return true;
                }
                else return false;
            })

        }
    }

    private async getAnalyticChildren(contextId:string,analyticId:string,childrenType:string){
        return SpinalGraphService.findInContextByType(contextId,analyticId,childrenType);
    }



    public async getEndpoints(nodeId:string, nameFilter:string){
        const element_to_endpoint_relation = "hasEndPoint"
        const node = SpinalGraphService.getRealNode(nodeId);
        const EndpointProfils = await SpinalGraphService.getChildren(nodeId,[element_to_endpoint_relation]);
        for(const endpointProfil of EndpointProfils){ // pour chaque profil de control endpoint
            const endpointsModels = await SpinalGraphService.getChildren(endpointProfil.id.get(),["hasBmsEndpoint"]);
            const endpoints = endpointsModels.map(el => el.get());
            for(const endpoint of endpoints){
                if (endpoint.name.get() == nameFilter) return endpoint.id.get() // !!!! A CHANGER !!!!!
            }

        }
        return undefined;
    }

    public async getControlEndpoint(nodeId: string, nameFilter:string)  {
        const element_to_controlendpoint_relation = spinalControlPointService.ROOM_TO_CONTROL_GROUP // "hasControlPoints"
        const node = SpinalGraphService.getRealNode(nodeId);
        const ControlEndpointProfils = await SpinalGraphService.getChildren(nodeId,[element_to_controlendpoint_relation]);
        for(const endpointProfil of ControlEndpointProfils){ // pour chaque profil de control endpoint
            const controlEndpointsModels = await SpinalGraphService.getChildren(endpointProfil.id.get(),["hasBmsEndpoint"]);
            const controlEndpoints = controlEndpointsModels.map(el => el.get());
            for(const controlEndpoint of controlEndpoints){
                if (controlEndpoint.name.get() == nameFilter) return controlEndpoint.id.get()
            }

        }
        return undefined;

    }

    private getNodeContext(nodeId:string) : string{
        const node = SpinalGraphService.getRealNode(nodeId);
        return node.getContextIds()[0];
        //return node.contextIds._attribute_names[0];
    }

    // Update control points with correct values
    public async updateControlEndpoints(){
        const analytics = await this.getAnalytics();
        for (const analytic of analytics){
            //console.log(analytic);
            const node = SpinalGraphService.getRealNode(analytic.id.get());
            /*const contextId = this.getNodeContext(analytic.id.get());
            console.log(analytic.childrenType.get());
            const nodesToUpdate = await this.getAnalyticChildren(contextId,analytic.id.get(),analytic.childrenType.get());
            console.log(nodesToUpdate);*/

            const groups = await SpinalGraphService.getChildren(analytic.id.get(),[spinalAnalyticService.ANALYTIC_TO_GROUP_RELATION]);
            for (const group of groups){
                const elements = await SpinalGraphService.getChildren(group.id.get())
                for (const element of elements){
                    console.log(element);
                    // Récupérer le controlpoint lié avec le nom de l'analytic
                }
            }

            
        }
        

    }

}

async function Main(){
    const spinalMain = new SpinalMain();
    await spinalMain.init();
    
    ///// TODO ////
    spinalMain.updateControlEndpoints();
    


}

// Call main function
Main()