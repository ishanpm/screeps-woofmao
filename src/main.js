var roles = global.roles = require("roles")
var jobs = global.jobs = require("jobs")
var util = global.util = require("util")
var tower = global.util = require("tower")

// TODO Automatically add jobs for resource collection and distribution
// createJob('harvest', {target: 'id'})
// createJob('carry')

module.exports.loop = function() {
    let creepCount = 0;
    
    for (let name in roles) {
        roles[name].count = 0;
    }
    
    var creepRequests = [];
    var jobList = [];
    
    // Initialize jobs  
    for (let name in Memory.jobs.active) {
        let mem = Memory.jobs.active[name];
        let job = new jobs.types[mem.type](mem);
        
        if (job.finished) {
            delete Memory.jobs.active[name];
        } else {
            jobList.push(job);
            
            for (let type in job.requests) {
                for (let i=0; i<job.requests[type]; i++) {
                    creepRequests.push([job, type]);
                }
            }
        }
    }
    
    // Assign creeps to jobs
    for (let name in Memory.creeps) {
        let creep = Game.creeps[name];
        
        if (!creep) {
            delete Memory.creeps[name];
            continue;
        }
        
        if (!Memory.jobs.active[creep.memory.job]) {
            delete creep.memory.job;
        }
        
        if (!creep.memory.job) {
            let index = creepRequests.findIndex(e => e[1] == creep.memory.role)
            
            if (index > -1) {
                console.log(`Assigning ${creep.name} to ${creepRequests[index][0].name}`)
                creepRequests[index][0].assignCreep(creep);
                creepRequests.splice(index, 1);
            }
        }
    }
    
    // Create new creeps if necessary
    if (creepRequests.length > 0) {
        let type = util.randomChoice(creepRequests)[1];
        
        let name = type+Game.time;
        let maxEnergy = Game.spawns['Spawn1'].room.energyCapacityAvailable;
        
        let status = Game.spawns['Spawn1'].spawnCreep(roles[type].getBuild(maxEnergy), name, {memory: {role: type}})
        
        if (status == OK)
            console.log("Creating "+name);
    }
    
    // Run jobs
    for (let job of jobList) {
        let mem = Memory.jobs.active[job.name];
        
        if (!mem) {
            mem = {};
            Memory.jobs.active[job.name] = mem;
        }
        
        try {
            job.tick();
        } catch (e) {console.log(`Error in ${job.name} tick: ${e}`)}
        
        try {
            job.store(mem);
        } catch (e) {console.log(`Error in ${job.name} store: ${e}`)}
    }
    
    // Run towers
    for (let id in Game.structures) {
        let structure = Game.structures[id];
        
        if (structure instanceof StructureTower) {
            tower.tick(structure);
        }
    }
    
    /*
    if (creepCount < 8) {
        let chosenRole = null;
        let minNeed = Infinity;
        
        for (let name in roles) {
            let role = roles[name];
            let need = (role.count+1) / role.weight;
            if ((role.max === undefined || role.count < role.max) && need < minNeed) {
                chosenRole = name;
                minNeed = need;
            }
        }
        
        let name = chosenRole+Game.time
        
        let status = Game.spawns['Spawn1'].spawnCreep(roles[chosenRole].build, name, {memory: {role: chosenRole}})
        
        if (status == OK)
            console.log("Creating  "+name);
    }
    */
}