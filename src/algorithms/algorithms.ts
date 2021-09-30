import { ControlEndpointDataType, ControlEndpointType, spinalControlPointService } from "spinal-env-viewer-plugin-control-endpoint-service";
import  "../utils";
import { getControlEndpointValue, getEndpointValue, setControlEndpointValue } from "../utils";


// TODO : 
// 1- Alg copy value
// 2- Alg average
// 3- XOR
// 4- XAND
// 5- OR etc ..
// Sum ( for example for tickets)

// WHEN Time series are ready, add : 
// 6- integral based algorithm



function cpy (endpointId : string, controlEndpointId: string){
    setControlEndpointValue(controlEndpointId,getEndpointValue(endpointId));
}

function avg (endpointIds : Array<string>): number{
    let sum : number = 0;
    for(const endpointId of endpointIds){
        sum+= getEndpointValue(endpointId) ;
    }
    return sum/endpointIds.length;
}



function or (endpointIds : Array<string> ):boolean{
    let res : boolean = false;
    for(const endpointId of endpointIds){
        res= getEndpointValue(endpointId);
        if (res) return res;
    }
    return res;

}

function xor (endpointIds : Array<string> ):boolean{
    let res : boolean = false;
    for(const endpointId of endpointIds){
        if(res && getEndpointValue(endpointId)) return false;
        if (!res) res = getEndpointValue(endpointId);
    }
    return res;
}

