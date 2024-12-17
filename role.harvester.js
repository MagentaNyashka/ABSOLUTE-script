
var roleHarvester = {
    run: function(creep, Extantions, Spawns) {
        var link = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return(structure.structureType == STRUCTURE_LINK || 
                    structure.structureType == STRUCTURE_CONTAINER
                ) &&
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
            var extantions = Extantions.get(creep.room.name).concat(Spawns.get(creep.room.name)).filter((structure) => {
                    return(structure.structureType == STRUCTURE_EXTENSION ||
                        structure.structureType == STRUCTURE_SPAWN
                    ) &&
                        structure.isActive() && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
        );
            if(extantions.length > 0 && link.length == 0){
                var link_d = creep.pos.findClosestByPath(extantions);
                if(creep.transfer(link_d, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(link_d, {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
            else if(link.length > 0){
                var closest_link = creep.pos.findClosestByPath(link);
                if(creep.transfer(closest_link, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(closest_link, {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
            else if(extantions.length == 0 && link.length == 0){
                towers = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return(structure.structureType == STRUCTURE_TOWER) &&
                            structure.isActive() && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                    }
                });
                if(towers.length > 0){
                    if(creep.transfer(creep.pos.findClosestByPath(towers), RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(creep.pos.findClosestByPath(towers), {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                }
                else{
                    other_objs = creep.room.find(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return(structure.structureType == STRUCTURE_TERMINAL ||
                                structure.structureType == STRUCTURE_POWER_SPAWN) &&
                                structure.isActive() && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                        }
                    });
                }
            }
        }
        else{
            var sources = creep.room.find(FIND_SOURCES);
            if(sources.length > 0){
                source = creep.pos.findClosestByPath(sources);
                if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
        }
    }
};
module.exports = roleHarvester;