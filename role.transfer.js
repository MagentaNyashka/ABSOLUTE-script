var roleTransfer = {
    run: function(creep) {
        const roomName = creep.room.name;
        const power_spawn = global.getCachedStructures(roomName, STRUCTURE_POWER_SPAWN);
        const nuker = global.getCachedStructures(roomName, STRUCTURE_NUKER);
        // const nuker = Nukers.get(creep.room.name).filter((structure) => structure.store.getFreeCapacity(RESOURCE_GHODIUM) >= creep.store.getFreeCapacity());
        //PRIORITY LIST:
        //MINERAL -> NUKER -> POWERSPAWN
        const terminal = Game.rooms[roomName].terminal;
        if(creep.memory.transferring && creep.store.getUsedCapacity() === 0 && creep.ticksToLive > 50){
            creep.memory.transferring = false;
            // delete creep.memory.resource;
            delete creep.memory.target;
        }
        if(!creep.memory.transferring && creep.store.getUsedCapacity() != 0){
            creep.withdraw(terminal, RESOURCE_ENERGY);
            creep.memory.transferring = true;
            // delete creep.memory.resource;
            delete creep.memory.target;
            delete creep.memory.amount;
        }
        if(creep.memory.transferring){
            if(!creep.memory.target){
                switch(creep.memory.resource){
                    case RESOURCE_GHODIUM:
                        const nuker = global.getCachedStructures(roomName, STRUCTURE_NUKER);
                        if(nuker.length > 0 && nuker.store.getFreeCapacity(RESOURCE_GHODIUM) > 0){
                            creep.memory.target = nuker[0].id;
                            creep.memory.amount = creep.store[RESOURCE_GHODIUM];
                        }
                        break;
                    case RESOURCE_POWER:
                        const power_spawn = global.getCachedStructures(roomName, STRUCTURE_POWER_SPAWN);
                        if(power_spawn.length > 0 && power_spawn.store.getFreeCapacity(RESOURCE_POWER) > 0){
                            creep.memory.target = power_spawn[0].id;
                            creep.memory.resource = RESOURCE_POWER;
                        }
                        break;
                    default:
                        const terminal = Game.rooms[roomName].terminal;
                        if(terminal && terminal.store.getFreeCapacity() > 1000){
                            creep.memory.target = terminal.id;
                            creep.memory.resource = global.getMinerals(roomName)[0].mineralType;
                        }else{
                            const storage = Game.rooms[roomName].storage;
                            if(storage && storage.store.getFreeCapacity() > 1000){
                                creep.memory.target = storage.id;
                                creep.memory.resource = global.getMinerals(roomName)[0].mineralType;
                            }
                        }
                }
            }
            const targetStructure = Game.getObjectById(creep.memory.target);
            if (targetStructure) {
                new RoomVisual(roomName).circle(targetStructure.pos.x+0.01,targetStructure.pos.y, {fill: 'transparent',stroke: '#ffff00', strokeWidth: 0.03, opacity: 1, radius: 0.15});
                const status = creep.transfer(targetStructure, creep.memory.resource, creep.store[creep.memory.resource]);
                if(status === ERR_NOT_IN_RANGE) {
                    creep.moveTo(targetStructure, {visualizePathStyle: {stroke: '#800080'}, reusePath: 10});
                } else if(status === ERR_NOT_ENOUGH_RESOURCES){
                    delete creep.memory.target;
                    delete creep.memory.resource;
                    delete creep.memory.amount;
                }
            } else {
                delete creep.memory.target;
                delete creep.memory.resource;
                delete creep.memory.amount;
            }
        }
        else{
            if(!creep.memory.target){
                const terminal = Game.rooms[roomName].terminal;
                const mCont = global.getMineralContainers(roomName);
                if(mCont.length > 0 && mCont[0].store.getUsedCapacity() > creep.store.getFreeCapacity()){
                    creep.memory.target = mCont[0].id;
                    creep.memory.resource = global.getMinerals(roomName)[0].mineralType;
                    creep.memory.amount = creep.store.getFreeCapacity();
                }else{
                    const nuker = global.getCachedStructures(roomName, STRUCTURE_NUKER);
                    if(nuker.length > 0 && nuker[0].store.getFreeCapacity(RESOURCE_GHODIUM) > 0 && terminal.store[RESOURCE_GHODIUM] > 0){
                        creep.memory.target = terminal.id;
                        creep.memory.resource = RESOURCE_GHODIUM;
                        creep.memory.amount = creep.store.getFreeCapacity();
                    }else{
                        const power_spawn = global.getCachedStructures(roomName, STRUCTURE_POWER_SPAWN);
                        if(power_spawn.length > 0 && power_spawn[0].store.getFreeCapacity(RESOURCE_POWER) > 0 && terminal.store[RESOURCE_GHODIUM] > 0){
                            creep.memory.target = terminal.id;
                            creep.memory.resource = RESOURCE_POWER;
                            creep.memory.amount = 50;
                        }
                    }
                }
            }
            const targetStructure = Game.getObjectById(creep.memory.target);
            if (targetStructure) {
                new RoomVisual(roomName).circle(targetStructure.pos.x,targetStructure.pos.y, {fill: 'transparent',stroke: '#ffff00', strokeWidth: 0.03, opacity: 1, radius: 0.15});
                const status = creep.withdraw(targetStructure, creep.memory.resource, creep.memory.amount);
                if(status === OK){
                    delete creep.memory.target;
                    return;
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