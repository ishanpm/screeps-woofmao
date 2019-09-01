/*
 * Contains several methods to help creeps find destinations.
 */

module.exports = {
    findEnergySource: function(creep) {
        let banned = ['bb955e22caa4bf7eb38f38d8']
        
        return creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE, {filter: e => banned.indexOf(e.id) == -1 })
    },
    
    findEnergySink: function(creep) {
        let minConstruct = Math.random() - 0.25;
        let maxDecay = Math.random();
        
        let sink = creep.room.find(FIND_STRUCTURES, {filter: e => ((e.my || e instanceof StructureRoad) && (e instanceof StructureController || (e.energy !== undefined && e.energy < e.energyCapacity) || (e.hits / e.hitsMax < maxDecay)))});
        let construct = creep.room.find(FIND_MY_CONSTRUCTION_SITES, {filter: e => e.progress / e.progressTotal > minConstruct});
        
        sink = sink.concat(construct);
        
        if (sink.length > 0) {
            let i = Math.floor(Math.random()*sink.length);
            
            return sink[i];
        }
        
        return null;
    },
    findEnergyContainer: function(creep) {
        return null;
    },
    findEmptyContainer: function(creep) {
        return null;
    }
};