/*
import { SpinalGraphService} from "spinal-env-viewer-graph-service";



export async function getAnalyticsGroup() {
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
} */ 
//# sourceMappingURL=utils.js.map