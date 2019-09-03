var util = require("util")

if (!Memory.jobs) {
    Memory.jobs = {count:0, active:{}};
}

class Job {
    constructor(mem, type) {
        mem = mem || {};
        this.mem = mem;
        this.type = type;
        // Requests for creeps
        this.requests = {};
        this.finished = mem.finished;
        this.creeps = mem.creeps ? mem.creeps.map(e => Game.creeps[e]) : []
        
        if (mem.name) {
            this.name = mem.name;
        } else {
            this.name = type + Memory.jobs.count;
            Memory.jobs.count = Memory.jobs.count+1;
        }
    }
    
    store(mem) {
        mem.name = this.name;
        mem.type = this.type;
        mem.requests = this.requests;
        mem.finished = this.finished;
        mem.creeps = this.creeps.map(e => e.name);
        
    }
    
    
    // Called when a new creep is assigned to this job
    assignCreep(creep) {
        this.creeps.push(creep);
        creep.memory.job = this.name;
    }
    
    // Called every tick
    tick() {
        this.creeps = this.creeps.filter(e => e)
    }
    
    // Called when the job is finished; release all creeps
    destroy() {
        for (let c of this.creeps) {
            delete c.job;
        }
    }
}

class HarvestJob extends Job {
    constructor(mem) {
        super(mem, "harvest");
        mem = this.mem;
        
        this.count = mem.count !== undefined ? mem.count : 1;
        this.target = mem.target ? Game.getObjectById(mem.target) : null;
        
        this.requests = {harvest: this.count - this.creeps.length}
    }
    
    store(mem) {
        super.store(mem);
        mem.count = this.count;
        mem.target = this.target ? this.target.id : null;
    }
    
    assignCreep(creep) {
        super.assignCreep(creep);
        
        this.requests = {harvest: this.count - this.creeps.length};
    }
    
    tick() {
        super.tick();
        
        for (let creep of this.creeps) {
            //TODO refactor all this into tasks
            
            if (!Game.getObjectById(creep.memory.target))
                creep.memory.target = null;
            
            if (!creep.memory.target) {
                let carryTotal = _.sum(creep.carry);
                let target = null;
                
                if (carryTotal > creep.carryCapacity/2) {
                    creep.memory.withdraw = false;
                    target = creep.pos.findClosestByRange(FIND_STRUCTURES, {filter: e => (e instanceof StructureContainer) && _.sum(e.store) < e.storeCapacity && creep.pos.getRangeTo(e) <= 1})
                } else {
                    creep.memory.withdraw = true;
                    target = this.target;
                }
                
                if (target)
                    creep.memory.target = target.id;
            }
            
            if (creep.memory.target) {
                util.moveToTarget(creep, Game.getObjectById(creep.memory.target));
            } else {
                creep.drop(RESOURCE_ENERGY);
            }
        }
    }
}

class CarryJob extends Job {
    constructor(mem) {
        super(mem, "carry");
        mem = this.mem;
        
        this.count = mem.count !== undefined ? mem.count : 5;
        
        this.requests = {fuel: this.count - this.creeps.length}
    }
    
    store(mem) {
        super.store(mem);
        mem.count = this.count;
    }
    
    assignCreep(creep) {
        super.assignCreep(creep);
        
        this.requests = {fuel: this.count - this.creeps.length};
    }
    
    tick() {
        super.tick();
        
        for (let creep of this.creeps) {
            let target = util.findTarget(creep, "container", "sink");
            util.moveToTarget(creep, target);
        }
    }
}

var types = {harvest: HarvestJob, carry: CarryJob}

function createJob(type, mem) {
    mem = mem || {};
    
    var job = new types[type](mem);
    job.store(mem);
    Memory.jobs.active[job.name] = mem;
    
    return job;
}

global.createJob = createJob;

module.exports = {createJob, types};