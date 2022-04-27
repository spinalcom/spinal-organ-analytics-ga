/**
 * Calculate the global energy for building and floors.
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @param {string} typeOfElement - Type of the spatial node. Expecting either a building or a floor for this parameter.
 * @return {*}
 */
export declare function calculateAnalyticsGlobalEnergy(elementId: string, typeOfElement: string): Promise<any>;
/**
 * Calculate the global CVC for building and floors.
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @param {string} typeOfElement - Type of the spatial node. Expecting either a building or a floor for this parameter.
 * @return {*}
 */
export declare function calculateAnalyticsGlobalAirConditioning(elementId: string, typeOfElement: string): Promise<any>;
/**
 * Calculate the global lighting for building and floors.
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @param {string} typeOfElement - Type of the spatial node. Expecting either a building or a floor for this parameter.
 * @return {*}
 */
export declare function calculateAnalyticsGlobalLighting(elementId: string, typeOfElement: string): Promise<any>;
/**
 * Calculate the global water consumption of toilets for building and floors.
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @param {string} typeOfElement - Type of the spatial node. Expecting either a building or a floor for this parameter.
 * @return {*}
 */
export declare function calculateAnalyticsGlobalWaterToilet(elementId: string, typeOfElement: string): Promise<any>;
/**
 * Calculate the global water consumption for building.
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @param {string} typeOfElement - Type of the spatial node. Expecting either a building or a floor for this parameter.
 * @return {*}
 */
export declare function calculateAnalyticsGlobalWater(elementId: string, typeOfElement: string): Promise<any>;
/**
 * Calculate the global heat for floors and building.
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @param {string} typeOfElement - Type of the spatial node. Expecting either a building or a floor for this parameter.
 * @return {*}
 */
export declare function calculateAnalyticsGlobalHeat(elementId: string, typeOfElement: string): Promise<any>;
/**
 * Calculate the number of persons for floors and building.
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @param {string} typeOfElement - Type of the spatial node. Expecting either a building or a floor for this parameter.
 * @return {*}
 */
export declare function calculateAnalyticsNumberOfPersons(elementId: string, typeOfElement: string): Promise<any>;
