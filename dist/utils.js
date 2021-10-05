"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 *
 * Function that takes in the node ID of an Endpoint node and return the current value of said Endpoint
 * @export
 * @param {string} endpointId
 * @return {*}  {*}
 */
function getEndpointValue(endpointId) {
}
exports.getEndpointValue = getEndpointValue;
/**
 *
 * Function that takes in the node ID of a ControlEndpoint node and return the current value of said ControlEndpoint
 * @export
 * @param {string} controlEndpointId
 * @return {*}  {*}
 */
function getControlEndpointValue(controlEndpointId) {
}
exports.getControlEndpointValue = getControlEndpointValue;
/**
 *
 *
 * @export
 * @param {string} controlEndpointId
 * @param {*} value
 */
function setControlEndpointValue(controlEndpointId, value) {
}
exports.setControlEndpointValue = setControlEndpointValue;
/*private async getAnalytics() {
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
    }*/ 
//# sourceMappingURL=utils.js.map