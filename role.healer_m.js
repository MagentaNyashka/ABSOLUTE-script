const { at } = require("lodash");

var roleHealerM = {
    run: function(creep) {
        const anotherRoomName = 'E26N40'
        const RoomName = '[room E26N40]'
        if(creep.room == RoomName) {
            var att = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
                filter: function(object) {
                    return object.hits < object.hitsMax;
                }
            });
            if(creep.heal(att) == ERR_NOT_IN_RANGE) {
                creep.moveTo(att, {visualizePathStyle: {stroke: '#ffffff'}});
            }
        }
        else{
            const exitDir = Game.map.findExit(creep.room, anotherRoomName);
            const exit = creep.pos.findClosestByRange(exitDir);
            creep.moveTo(exit);
        }
    }
};
module.exports = roleHealerM;