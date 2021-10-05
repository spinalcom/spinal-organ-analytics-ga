"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../utils");
const utils_1 = require("../utils");
// TODO : 
// 1- Alg copy value
// 2- Alg average
// 3- XOR
// 4- XAND
// 5- OR etc ..
// Sum ( for example for tickets)
// WHEN Time series are ready, add : 
// 6- integral based algorithm
function cpy(endpointId, controlEndpointId) {
    utils_1.setControlEndpointValue(controlEndpointId, utils_1.getEndpointValue(endpointId));
}
function avg(endpointIds) {
    let sum = 0;
    for (const endpointId of endpointIds) {
        sum += utils_1.getEndpointValue(endpointId);
    }
    return sum / endpointIds.length;
}
function or(endpointIds) {
    let res = false;
    for (const endpointId of endpointIds) {
        res = utils_1.getEndpointValue(endpointId);
        if (res)
            return res;
    }
    return res;
}
function xor(endpointIds) {
    let res = false;
    for (const endpointId of endpointIds) {
        if (res && utils_1.getEndpointValue(endpointId))
            return false;
        if (!res)
            res = utils_1.getEndpointValue(endpointId);
    }
    return res;
}
//# sourceMappingURL=algorithms.js.map