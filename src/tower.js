module.exports.tick = function(tower) {
    var target = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    tower.attack(target);
    
    target = tower.pos.findClosestByRange(FIND_MY_CREEPS, {filter: e => e.hits < e.hitsMax});
    tower.heal(target);
}