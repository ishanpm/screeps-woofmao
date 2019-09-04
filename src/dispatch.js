/*
 * Contains several methods to help creeps find destinations.
 */

module.exports = {
    findEnergySource: function(creep) {
        return creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE, {filter: e => banned.indexOf(e.id) == -1 })
    },
    
    findEnergySink: function(creep) {
        let minConstruct = Math.random() - 0.5;
        let maxDecay = Math.random();
        let maxController = Math.random() * 10000;
        
        let sink = creep.room.find(FIND_STRUCTURES, {filter: e => 
            ((e.my || e instanceof StructureRoad) &&
            (((e instanceof StructureController) && e.ticksToDowngrade < maxController) ||
             (e.energy !== undefined && e.energy < e.energyCapacity) ||
             (e.hits / e.hitsMax < maxDecay)))});
        let construct = creep.room.find(FIND_MY_CONSTRUCTION_SITES, {filter: e => e.progress / e.progressTotal > minConstruct});
        
        sink = sink.concat(construct);
        
        if (sink.length > 0) {
            let i = Math.floor(Math.random()*sink.length);
            
            return sink[i];
        }
        
        return null;
    },
    findEnergyContainer: function(creep) {
        let container = creep.pos.findClosestByRange(FIND_STRUCTURES, {filter: e => (e instanceof StructureContainer) && e.store.energy > 0 })
        let drop = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {filter: e => (e.resourceType == RESOURCE_ENERGY)})
        
        if (container && drop) {
            if (creep.pos.getRangeTo(container.pos) > creep.pos.getRangeTo(drop.pos)) {
                return drop;
            }
        }
        
        return container || drop;
    },
    findVacantContainer: function(creep) {
        let target = creep.pos.findClosestByRange(FIND_STRUCTURES, {filter: e => (e instanceof StructureContainer) && _.sum(e.store) < e.storeCapacity });
        return target;
    }
};