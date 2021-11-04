/**
 *
 * Function to calculate Occupation rate
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @return {*}
 */
export declare function calculateAnalyticsOccupationRate(elementId: string): Promise<number>;
/**
 *
 * Function to calculate air quality
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @return {*}
 */
export declare function calculateAnalyticsAirQuality(elementId: string): Promise<number>;
/**
 *
 * Function to calculate temperature
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @return {*}
 */
export declare function calculateAnalyticsTemperature(elementId: string): Promise<number>;
/**
 *
 * Function to calculate luminosity
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @return {*}
 */
export declare function calculateAnalyticsLuminosity(elementId: string): Promise<number>;
/**
 *
 * Function to calculate monitoring on rooms
 * @export
 * @param {string} elementId - Id of the node linked to the analytic ( and the control endpoint )
 * @return {*}
 */
export declare function calculateAnalyticsMonitorable(elementId: string): Promise<"Monitorée" | "Non monitorable" | "Monitorable mais non monitorée">;
