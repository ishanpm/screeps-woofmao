var util = require("util")
var dispatch = require("dispatch")

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
        this.pos = mem.pos ? new RoomPosition(mem.pos.x, mem.pos.y, mem.pos.roomName) : null;
        
        this.requests = {harvest: this.count - this.creeps.length}
    }
    
    store(mem) {
        super.store(mem);
        mem.count = this.count;
        mem.target = this.target ? this.target.id : null;
        mem.pos = this.pos ? this.pos : (this.target ? this.target.pos : null)
    }
    
    assignCreep(creep) {
        super.assignCreep(creep);
        
        this.requests = {harvest: this.count - this.creeps.length};
    }
    
    tick() {
        super.tick();
        
        if (!this.target && this.pos) {
            try {
                this.target = this.pos.lookFor(LOOK_SOURCES)[0];
            } catch (e) {
                // Can't view room
            }
        }
        
        if (!this.pos && this.target) {
            this.pos = this.target.pos;
        }
        
        for (let creep of this.creeps) {
            //TODO refactor all this into tasks
            
            if (creep.pos.getRangeTo(this.pos) > 1) {
                let status = creep.moveTo(this.pos, {visualizePathStyle:{}})
            } else {
                creep.harvest(this.target);
                
                if (creep.carry.energy == creep.carryCapacity) {
                    let target = creep.pos.findClosestByRange(FIND_STRUCTURES, {filter: e => (e instanceof StructureContainer) && _.sum(e.store) < e.storeCapacity && creep.pos.getRangeTo(e) <= 2})
                    if (target) {
                        if (creep.pos.getRangeTo(target) > 1)
                            creep.moveTo(target);
                        if (target.hits < target.hitsMax) {
                            creep.repair(target);
                        } else {
                            creep.transfer(target, RESOURCE_ENERGY);
                        }
                    } else {
                        let target = null;//creep.pos.findClosestByRange(FIND_MY_CONSTRUCTION_SITES, {filter: e => (e.structureType == STRUCTURE_CONTAINER) && creep.pos.getRangeTo(e) <= 2})
                        
                        if (target) {
                            if (creep.pos.getRangeTo(target) > 1)
                                creep.moveTo(target);
                            creep.build(target);
                        } else {
                            let target = creep.pos.findClosestByRange(FIND_MY_CONSTRUCTION_SITES, {filter: e => (e.structureType == STRUCTURE_CONTAINER) && creep.pos.getRangeTo(e) <= 2})
                            
                            creep.drop(RESOURCE_ENERGY);
                        }
                    }
                }
            }
        }
    }
}

class CarryJob extends Job {
    constructor(mem) {
        super(mem, "carry");
        mem = this.mem;
        
        this.count = mem.count !== undefined ? mem.count : 3;
        this.pos = mem.pos ? new RoomPosition(mem.pos.x, mem.pos.y, mem.pos.roomName) : null;
        
        this.requests = {fuel: this.count - this.creeps.length}
    }
    
    store(mem) {
        super.store(mem);
        mem.count = this.count;
        mem.pos = this.pos ? this.pos : (this.target ? this.target.pos : null)
    }
    
    assignCreep(creep) {
        super.assignCreep(creep);
        
        this.requests = {fuel: this.count - this.creeps.length};
    }
    
    tick() {
        super.tick();
        
        for (let creep of this.creeps) {
            if (this.pos && creep.memory.withdraw && creep.pos.getRangeTo(this.pos) > 2) {
                creep.moveTo(this.pos);
            } else {
                let dest = util.findTarget(creep, 'container', 'sink')
                util.moveToTarget(creep, dest);
                if (!dest || _.sum(dest.carry) > dest.carryCapacity) {
                    creep.drop(RESOURCE_ENERGY);
                    creep.memory.target = null;
                    creep.memory.withdraw = true;
                }
            }
        }
    }
}

class MoveJob extends Job {
    constructor(mem) {
        super(mem, "move");
        mem = this.mem;
        
        this.count = mem.count !== undefined ? mem.count : 1;
        this.src = mem.src ? new RoomPosition(mem.src.x, mem.src.y, mem.src.roomName) : null;
        this.dest = mem.dest ? new RoomPosition(mem.dest.x, mem.dest.y, mem.dest.roomName) : null;
        
        this.requests = {fuel: this.count - this.creeps.length}
    }
    
    store(mem) {
        super.store(mem);
        mem.count = this.count;
        mem.src = this.src ? this.src : null
        mem.dest = this.dest ? this.dest : null;
    }
    
    assignCreep(creep) {
        super.assignCreep(creep);
        
        this.requests = {fuel: this.count - this.creeps.length};
    }
    
    tick() {
        super.tick();
        
        for (let creep of this.creeps) {
            if (creep.memory.withdraw && creep.pos.getRangeTo(this.src) > 1) {
                creep.say('to source')
                creep.moveTo(this.src);
            } else if (!creep.memory.withdraw && creep.pos.getRangeTo(this.dest) > 1) {
                creep.say('to dest')
                creep.moveTo(this.dest);
            } else {
                let dest = null;
                
                if (creep.memory.withdraw) {
                    dest = dispatch.findEnergyContainer(creep)
                    if (creep.pos.getRangeTo(dest) > 1) dest = null;
                } else {
                    dest = creep.pos.findClosestByRange(FIND_STRUCTURES, {filter: e => (e instanceof StructureContainer) && e.pos.getRangeTo(creep) <= 1})
                }
                
                util.moveToTarget(creep, dest);
                creep.say(creep.memory.withdraw)
                
                if (!creep.memory.withdraw && (!dest || _.sum(dest.store) >= dest.storeCapacity)) {
                    creep.drop(RESOURCE_ENERGY);
                    creep.target = null;
                    creep.memory.withdraw = true;
                } else if (creep.carry.energy > 0) {
                    creep.memory.withdraw = false;
                }
                
                if (creep.carry.energy == 0)
                    creep.memory.withdraw = true;
            }
        }
    }
}

class UpgradeJob extends Job {
    constructor(mem) {
        super(mem, "upgrade");
        mem = this.mem;
        
        this.count = mem.count !== undefined ? mem.count : 2;
        
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
            let target = util.findTarget(creep, "container", "controller");
            util.moveToTarget(creep, target);
        }
    }
}

var types = {harvest: HarvestJob, carry: CarryJob, upgrade: UpgradeJob, move: MoveJob}

function createJob(type, mem) {
    mem = mem || {};
    
    var job = new types[type](mem);
    job.store(mem);
    Memory.jobs.active[job.name] = mem;
    
    return job;
}

global.createJob = createJob;

module.exports = {createJob, types};