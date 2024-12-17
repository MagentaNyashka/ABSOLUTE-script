var roleAttackerM = {
    run: function(creep) {
        const anotherRoomName = 'E26N40'
        const RoomName = '[room E26N40]'
        if(creep.room != RoomName) {
            const exitDir = Game.map.findExit(creep.room, anotherRoomName);
            const exit = creep.pos.findClosestByRange(exitDir);
            creep.moveTo(exit);
        }
        else{
            var PB = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return(
                        structure.structureType == STRUCTURE_POWER_BANK);
                    }
                });
            if(creep.hits >= 4600){
                if(creep.attack(PB[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(PB[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
        }
    }
};
module.exports = roleAttackerM;