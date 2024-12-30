var roleTransfer = {
    run: function(creep) {
        const roomName = creep.room.name;
        const power_spawn = global.getCachedStructures(roomName, STRUCTURE_POWER_SPAWN);
        // const nuker = Nukers.get(creep.room.name).filter((structure) => structure.store.getFreeCapacity(RESOURCE_GHODIUM) >= creep.store.getFreeCapacity());
        let nuker = global.getCachedStructures(roomName, STRUCTURE_NUKER);
        if(nuker[0]){
            if(!(nuker[0].store.getFreeCapacity(RESOURCE_GHODIUM) >= creep.store.getFreeCapacity())){
                nuker = [];
            }
        }
        const terminal = Game.rooms[roomName].terminal;
        if(creep.memory.transferring && (creep.store[RESOURCE_POWER] <= 0 && creep.store[RESOURCE_GHODIUM] <= 0 && creep.store[RESOURCE_ENERGY] <= 0) && creep.ticksToLive > 50){
            creep.memory.transferring = false;
            delete creep.memory.resource;
            delete creep.memory.target;
        }
        if(!creep.memory.transferring && (creep.store[RESOURCE_POWER] != 0 || creep.store[RESOURCE_GHODIUM] != 0 || creep.store[RESOURCE_ENERGY] != 0)){
            creep.withdraw(terminal, RESOURCE_ENERGY);
            creep.memory.transferring = true;
            delete creep.memory.resource;
            delete creep.memory.target;
        }
        if(creep.memory.transferring){
            if(!creep.memory.target){
                if(creep.store[RESOURCE_GHODIUM] > 0 && nuker.length > 0){
                    creep.memory.target = nuker[0].id;
                    creep.memory.resource = RESOURCE_GHODIUM;
                }
                else{
                    if(creep.store[RESOURCE_POWER] > 0){
                        creep.memory.target = power_spawn[0].id;
                        creep.memory.resource = RESOURCE_POWER;
                    }
                    else{
                        creep.memory.target = power_spawn[0].id;
                        creep.memory.resource = RESOURCE_ENERGY;
                    }
                }
            }
            const targetStructure = Game.getObjectById(creep.memory.target);
            if (targetStructure) {
                new RoomVisual(roomName).circle(targetStructure.pos, {fill: '#ff0000', opacity: 0.5, radius: 0.55});
                const status = creep.transfer(targetStructure, creep.memory.resource);
                if(status === ERR_NOT_IN_RANGE) {
                    creep.moveTo(targetStructure, {visualizePathStyle: {stroke: '#800080'}, reusePath: 10});
                } else if(status === ERR_NOT_ENOUGH_RESOURCES){
                    delete creep.memory.target;
                    delete creep.memory.resource;
                }
            } else {
                delete creep.memory.target;
                delete creep.memory.resource;
            }
        }
        else{
            if(!creep.memory.target){
                if(nuker.length > 0 && nuker.store.getFreeCapacity(RESOURCE_GHODIUM) >= creep.store.getFreeCapacity()){
                    creep.memory.target = terminal.id;
                    creep.memory.resource = RESOURCE_GHODIUM;
                }
                else{
                    if(power_spawn[0].store.getFreeCapacity(RESOURCE_POWER) > 50  && terminal.store[RESOURCE_POWER] >= 50){
                        creep.memory.target = terminal.id;
                        creep.memory.resource = RESOURCE_POWER;
                    }
                    else{
                        creep.memory.target = terminal.id;
                        creep.memory.resource = RESOURCE_ENERGY;
                    }
                }
            }
            const targetStructure = Game.getObjectById(creep.memory.target);
            if (targetStructure) {
                new RoomVisual(roomName).circle(targetStructure.pos, {fill: '#ff0000', opacity: 0.5, radius: 0.55});
                let status;
                if(creep.memory.resource == RESOURCE_POWER){
                    status = creep.withdraw(targetStructure, creep.memory.resource, 50);
                }
                else{
                    status = creep.withdraw(targetStructure, creep.memory.resource);
                }
                if(status === ERR_NOT_IN_RANGE) {
                    creep.moveTo(targetStructure, {visualizePathStyle: {stroke: '#800080'}, reusePath: 10});
                } else if(status === ERR_NOT_ENOUGH_RESOURCES){
                    delete creep.memory.target;
                    delete creep.memory.resource;
                }
            } else {
                delete creep.memory.target;
                delete creep.memory.resource;
            }
        }
    }
};
module.exports = roleTransfer;