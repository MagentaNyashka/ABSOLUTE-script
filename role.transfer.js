var roleTransfer = {
    run: function(creep, Power_Spawns, Nukers, Terminals) {
        const roomName = creep.room.name;
        const power_spawn = Power_Spawns.get(creep.room.name);
        const nuker = Nukers.get(creep.room.name).filter((structure) => structure.store.getFreeCapacity(RESOURCE_GHODIUM) >= creep.store.getFreeCapacity());
        const terminal = Terminals.get(creep.room.name);

        if(creep.memory.transferring && (creep.store[RESOURCE_POWER] <= 0 && creep.store[RESOURCE_GHODIUM] <= 0 && creep.store[RESOURCE_ENERGY] <= 0) && creep.ticksToLive > 50){
            creep.memory.transferring = false;
        }
        if(!creep.memory.transferring && (creep.store[RESOURCE_POWER] != 0 || creep.store[RESOURCE_GHODIUM] != 0 || creep.store[RESOURCE_ENERGY] != 0)){
            creep.withdraw(terminal[0], RESOURCE_ENERGY);
            creep.memory.transferring = true;
        }
        if(creep.memory.transferring){
            if(creep.store[RESOURCE_GHODIUM] > 0){
                if(creep.transfer(nuker[0], RESOURCE_GHODIUM) == ERR_NOT_IN_RANGE){
                    creep.moveTo(nuker[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
            else{
                if(creep.transfer(power_spawn[0], RESOURCE_POWER) == ERR_NOT_IN_RANGE || creep.transfer(power_spawn[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                    creep.moveTo(power_spawn[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            } 
        }
        else{
            if(nuker.length > 0){
                if(creep.withdraw(terminal[0], RESOURCE_GHODIUM) == ERR_NOT_IN_RANGE){
                    creep.moveTo(terminal[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
            else{
                if(power_spawn[0].store.getFreeCapacity(RESOURCE_POWER) >= 10){
                    if(creep.withdraw(terminal[0], RESOURCE_POWER, 10) == ERR_NOT_IN_RANGE){
                        creep.moveTo(terminal[0], {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                }
                else{
                    if(creep.withdraw(terminal[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                        creep.moveTo(terminal[0], {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                }
            }
        }
    }
};
module.exports = roleTransfer;