var roleTransfer = {
    run: function(creep) {
        var targets = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => {
                return(
                    structure.structureType == STRUCTURE_POWER_SPAWN);
                }
        });
        var nuker = creep.room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => {
                return(structure.structureType == STRUCTURE_NUKER) &&
                structure.isActive() && structure.store[RESOURCE_GHODIUM] < 5000;
            }});

        if(creep.memory.transferring && (creep.store[RESOURCE_POWER] <= 0 && creep.store[RESOURCE_GHODIUM] <= 0) && creep.ticksToLive > 50){
            creep.memory.transferring = false;
        }
        if(!creep.memory.transferring && (creep.store[RESOURCE_POWER] != 0 || creep.store[RESOURCE_GHODIUM] != 0)){
            creep.memory.transferring = true;
        }
        if(creep.memory.transferring){
            if(creep.store[RESOURCE_GHODIUM] > 0){
                if(creep.transfer(nuker[0], RESOURCE_GHODIUM) == ERR_NOT_IN_RANGE){
                    creep.moveTo(nuker[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
            else{
                if(creep.transfer(targets, RESOURCE_POWER) == ERR_NOT_IN_RANGE){
                    creep.moveTo(targets, {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
                /*
                if(creep.transfer(targets, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                    creep.moveTo(targets, {visualizePathStyle: {stroke: '#ffffff'}});
                }
                */
                    
        }
        else{
            var terminal = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return(structure.structureType == STRUCTURE_TERMINAL) &&
                    (structure.store[RESOURCE_POWER] > 0 || structure.store[RESOURCE_GHODIUM]);
                }
            });
            if(nuker.length > 0){
                if(creep.withdraw(terminal[0], RESOURCE_GHODIUM) == ERR_NOT_IN_RANGE){
                    creep.moveTo(terminal[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
            else{
                if(targets.store[RESOURCE_ENERGY] > (50 * 10)){
                    if(creep.withdraw(terminal[0], RESOURCE_POWER, 10) == ERR_NOT_IN_RANGE){
                        creep.moveTo(terminal[0], {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                }
            }
        }
    }
};
module.exports = roleTransfer;