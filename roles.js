/*
 * Code for each role.
 */

var dispatch = require("dispatch")
var util = require("util")
var roles = module.exports;

module.exports.fuel = {
    weight: 1,
    
    build: [MOVE, WORK, CARRY, CARRY],
    
    action: function(creep) {
        util.findTarget(creep, "source", "container");
    }
};

/*
 * Code for each role.
 */

var dispatch = require("dispatch")
var util = require("util")

module.exports.fuel = {
    weight: 1,
    
    build: [MOVE, WORK, CARRY, CARRY],
    
    action: function(creep) {
        util.findTarget(creep, "container", "sink");
    }
};