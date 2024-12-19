var roleHarvesterUpgr = {
    run: function(creep) {
        var link = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return(structure.structureType == STRUCTURE_LINK) &&
                    structure.isActive();
            }
        });
        if(creep.memory.transferring && creep.store[RESOURCE_ENERGY] == 0){
            creep.memory.transferring = false;
        }
        if(!creep.memory.transferring && creep.store.getFreeCapacity() <= 10){
            creep.memory.transferring = true;
            if(link.length == 0){
            if(creep.move(TOP) == 0){
                creep.move(TOP);
            }
            else if(creep.move(BOTTOM) == 0){
                creep.move(BOTTOM)
            }
            else if(creep.move(LEFT) == 0){
                creep.move(LEFT)
            }
            else if(creep.move(RIGHT) == 0){
                creep.move(RIGHT)
            }
        }
        }
        if(creep.memory.transferring){
            var extantions = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return(structure.structureType == STRUCTURE_SPAWN ||
                        structure.structureType == STRUCTURE_EXTENSION) &&
                        structure.isActive() && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
            });
            if(extantions.length > 0 && link.length <= 2){
                ex_d = creep.pos.findClosestByPath(extantions);
                if(creep.transfer(ex_d, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(ex_d, {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
            else if(link.length > 2){
                var closest_link = creep.pos.findClosestByPath(link);
                if(creep.transfer(closest_link, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(closest_link, {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
        }
        else{
            var sources = creep.room.find(FIND_SOURCES
                // , {filter: (source) => {return (source.energy > 0);}}
            );
            if(sources.length > 1){
                if(creep.harvest(sources[1]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(sources[1], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
            else{
                if(creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(sources[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
        }
    }
};
module.exports = roleHarvesterUpgr;