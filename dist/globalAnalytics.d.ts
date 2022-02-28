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
export declare function calculateAnalyticsGlobalCVC(elementId: string, typeOfElement: string): Promise<any>;
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
 *
 * Specific function to calculate building lighting for VINCI
 * @export
 * @param {string} [analyticName="Eclairage"]
 * @return {*}
 */
export declare function VINCI_specificUpdate_Lighting_Building_Analytics(analyticName?: string): Promise<any>;
/**
 * Specific function to calculate floor lighting for VINCI
 * @export
 * @param {*} targetNode - The control endpoint node that should get updated
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @param {string} typeOfElement - Type of the spatial node. Expecting floor for this function
 * @param {string} [analyticName="Eclairage"]
 */
export declare function VINCI_specificUpdate_Lighting_Floors_CP_Analytics(targetNode: any, elementId: string, typeOfElement: string, analyticName?: string): Promise<void>;
/**
 * Calculate CVC analytic for floors , specific to VINCI
 * @export
 * @param {*} targetNode - The control endpoint node that should get updated
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @param {string} typeOfElement - Type of the spatial node. Expecting floor for this function
 * @param {string} [analyticName="Climatisation"]
 */
export declare function VINCI_specificUpdate_CVC_Floors_CP_Analytics(targetNode: any, elementId: string, typeOfElement: string, analyticName?: string): Promise<void>;
export declare function calculateAnalyticsGlobalHeat(elementId: string, typeOfElement: string): Promise<any>;
export declare function calculateAnalyticsNumberOfPersons(elementId: string, typeOfElement: string): Promise<any>;
