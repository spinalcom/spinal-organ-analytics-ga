/**
 *
 * Function to calculate Energy production
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @return {*}
 */
export declare function calculateAnalyticsEnergyProduction(elementId: string): Promise<any>;
/**
 *
 * Function to calculate Sunlight energy production
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @return {*}
 */
export declare function calculateAnalyticsSunlightProduction(elementId: string): Promise<any>;
/**
 *
 * Function to calculate auto-consumption
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @return {*}
 */
export declare function calculateAnalyticsAutoConsumption(elementId: string): Promise<any>;
/**
 *
 * Function to calculate co2 gain
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @return {*}
 */
export declare function calculateAnalyticsCO2Gain(elementId: string): Promise<any>;
