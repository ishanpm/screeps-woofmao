var dispatch = require("dispatch");
var util = module.exports;

module.exports.giveEnergy = function(creep, target) {
    if (!target) return ERR_INVALID_TARGET;
    
    if (target instanceof ConstructionSite) return creep.build(target);
    else if (target.hits < target.hitsMax) return creep.repair(target);
    else if (target instanceof StructureController) return creep.upgradeController(target);
    else return creep.transfer(target, RESOURCE_ENERGY);
}
    
module.exports.takeEnergy = function(creep, target) {
    let status = ERR_INVALID_TARGET;
    if (_.sum(creep.carry) >= creep.carryCapacity) return status;
    status = creep.harvest(target);
    if (status == ERR_INVALID_TARGET) status = creep.withdraw(target, RESOURCE_ENERGY);
    if (status == ERR_INVALID_TARGET) status = creep.pickup(target);
    
    return status;
}

module.exports.findTarget = function(creep, source, sink) {
    let carryTotal = _.sum(creep.carry);
    
    let target = null
    
    if (creep.memory.target) {
        target = Game.getObjectById(creep.memory.target);
    }
    
    if (!target) {
        let maxTries = 5;
        while (!target && maxTries > 0) {
            if (carryTotal > creep.carryCapacity/2) {
                creep.memory.withdraw = false;
                if (sink == "container")
                    target = dispatch.findVacantContainer(creep)
                if (sink == "controller")
                    target = creep.room.controller;
                if (sink == "sink")
                    target = dispatch.findEnergySink(creep);
            } else {
                creep.memory.withdraw = true;
                if (source == "container")
                    target = dispatch.findEnergyContainer(creep)
                if (source == "source")
                    target = dispatch.findEnergySource(creep);
            }
            maxTries--;
        }
        
        if (!target && !creep.memory.withdraw) {
            if (sink == "container") {
                creep.drop(RESOURCE_ENERGY);
            } else {
                target = creep.room.controller;
            }
            
        }
        
        if (target) {
            creep.memory.target = target.id;
            //creep.say(target)
        } else {
            creep.memory.target = null;
        }
    }
    
    return target;
}

module.exports.moveToTarget = function(creep, target) {
    //if (creep.room !== target.room) {
    //    target = creep.room.findExitTo()
    //}
    
    if (target) {
        target.room.visual.circle(target.pos, {radius:0.6, fill: 'transparent', stroke: 'rgba(50,200,50,150)', lineStyle: 'dotted'})
        
        let status;
        if (creep.memory.withdraw) {
            status = util.takeEnergy(creep, target);
        } else {
            status = util.giveEnergy(creep, target);
        }
        
        if (status == ERR_NOT_IN_RANGE) {
            creep.moveTo(target, {visualizePathStyle: {}});
        } else if (status != OK) {
            //console.log(`${creep.name} can't move to ${target} - ${status}`)
            creep.memory.target = null;
        }
    } else {
        creep.moveTo(Game.flags['BreakRoom'])
    }
}

module.exports.randomChoice = function(list) {
    let i = Math.floor(Math.random() * list.length);
    return list[i];
}