/*
 * Code for each role.
 */

var dispatch = require("dispatch")
var util = require("util")
var roles = module.exports;

var emergency = false;

module.exports.harvest = {
    getBuild: function(maxEnergy) {
        if (maxEnergy < 550 || emergency) {
            return [MOVE, WORK, WORK, CARRY];
        } else {
            return [MOVE, WORK, WORK, WORK, WORK, CARRY]
        }
    }
};

module.exports.fuel = {
    getBuild: function (maxEnergy) {
        if (maxEnergy < 550 || emergency) {
            return [MOVE, WORK, CARRY, CARRY];
        } else {
            return [MOVE, MOVE, WORK, WORK, CARRY, CARRY]
        }
    }
};