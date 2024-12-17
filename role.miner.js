var roleMiner = {
    run: function(creep) {
        if(creep.memory.transferring && creep.store.getUsedCapacity() == 0){
            creep.memory.transferring = false;
        }
        if(!creep.memory.transferring && creep.store.getFreeCapacity() == 0){
            creep.memory.transferring = true;
        }
        if(creep.memory.transferring){
            if(Game.time % 10 == 0){
                var terminal = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (
                            structure.structureType == STRUCTURE_TERMINAL);
                    }
                });
            }
                if(creep.transfer(terminal[0], RESOURCE_OXYGEN) == ERR_NOT_IN_RANGE || creep.transfer(terminal[0], RESOURCE_HYDROGEN) == ERR_NOT_IN_RANGE || creep.transfer(terminal[0], RESOURCE_KEANIUM) == ERR_NOT_IN_RANGE || creep.transfer(terminal[0], RESOURCE_LEMERGIUM) == ERR_NOT_IN_RANGE || creep.transfer(terminal[0], RESOURCE_KEANIUM) == ERR_NOT_IN_RANGE || creep.transfer(terminal[0], RESOURCE_UTRIUM) == ERR_NOT_IN_RANGE || creep.transfer(terminal[0], RESOURCE_ZYNTHIUM) == ERR_NOT_IN_RANGE || creep.transfer(terminal[0], RESOURCE_CATALYST) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(terminal[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
        }
        else{
            if(Game.time % 10 == 0){
            var sources = creep.room.find(FIND_MINERALS);
            }
            if(sources.length != 0){
                if(creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(sources[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
        }
    }
};
module.exports = roleMiner;