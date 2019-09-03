/*
 * Code for each role.
 */

var dispatch = require("dispatch")
var util = require("util")
var roles = module.exports;

module.exports.harvest = {
    weight: 0.5,
    max: 2,
    
    build: [MOVE, WORK, WORK, CARRY],
    //build: [MOVE, WORK, WORK, WORK, WORK, CARRY],
    
    action: function(creep) {
        let target = util.findTarget(creep, "source", "container");
        util.moveToTarget(creep, target);
    }
};

module.exports.fuel = {
    weight: 1,
    
    build: [MOVE, WORK, CARRY, CARRY],
    //build: [MOVE, MOVE, WORK, WORK, CARRY, CARRY],
    
    action: function(creep) {
        let target = util.findTarget(creep, "container", "sink");
        util.moveToTarget(creep, target);
    }
};