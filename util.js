var dispatch = require("dispatch");
var util = module.exports;

module.exports.giveEnergy = function(creep, target) {
    if (!target) return ERR_INVALID_TARGET;
    
    if (target instanceof ConstructionSite) return creep.build(target);
    else if (target.hits < target.hitsMax) return creep.repair(target);
    else if (target instanceof StructureController) return creep.upgradeController(target);
    else if (target instanceof StructureExtension || target instanceof StructureSpawn) return creep.transfer(target, RESOURCE_ENERGY);
    else return ERR_INVALID_TARGET;
}
    
module.exports.harvestOrTransfer = function(creep, target) {
    let status = ERR_INVALID_TARGET;
    if (_.sum(creep.carry) < creep.carryCapacity) status = creep.harvest(target);
    if (status == ERR_INVALID_TARGET) status = util.giveEnergy(creep, target);
    
    return status;
}

module.exports.findTarget = function(creep, source, sink) {
    let carryTotal = _.sum(creep.carry);
    
    let target = null;
    
    if (!creep.memory.target) {
        if (carryTotal > creep.carryCapacity/2) {
            if (sink == "container")
                target = dispatch.findEmptyContainer(creep)
            if (sink == "sink" || target == null)
                target = dispatch.findEnergySink(creep);
        } else {
            if (source == "container")
                target = dispatch.findEnergyContainer(creep)
            if (source == "source" || target == null)
                target = dispatch.findEnergySource(creep);
        }
        
        creep.memory.target = target.id;
        console.log(target);
        
        creep.say(target)
    } else {
        target = Game.getObjectById(creep.memory.target);
    }
    
    if (creep.memory.target) {
        let status = util.harvestOrTransfer(creep, target);
        
        if (status == ERR_NOT_IN_RANGE) {
            creep.moveTo(target, {visualizePathStyle: {}});
        } else if (status != OK) {
            creep.memory.target = null;
        }
    } else {
        creep.moveTo(Game.flags['BreakRoom'])
    }
}