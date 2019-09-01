var roles = require("roles")

module.exports.loop = function() {
    let creepCount = 0;
    
    for (let name in Memory.creeps) {
        let creep = Game.creeps[name];
        
        if (!creep) {
            delete Memory.creeps[name];
            continue;
        }
        
        let role = roles[creep.memory.role];
        
        if (role.action) {
            role.action(creep);
        }
        
        creepCount++;
    }
    
    if (creepCount < 8) {
        let name = "Fuel"+Game.time
        Game.spawns['Spawn1'].spawnCreep([MOVE, WORK, WORK, CARRY, CARRY], name, {memory: {role: "fuel"}})
    }
}