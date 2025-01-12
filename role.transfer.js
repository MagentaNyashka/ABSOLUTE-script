var roleTransfer = {
    run: function(creep) {
        const roomName = creep.room.name;
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
            if(creep.memory.resource === RESOURCE_POWER){
                creep.withdraw(terminal, RESOURCE_ENERGY);
            }
            creep.memory.transferring = true;
            // delete creep.memory.resource;
            delete creep.memory.target;
            delete creep.memory.amount;
        }
        if(creep.memory.transferring){
            if(!creep.memory.target){
                const sLabs = global.getSourceLabs(roomName);
                const terminal = Game.rooms[roomName].terminal;
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
                    case Memory.labProtocol[roomName][0]:
                        if(sLabs.length >= 2){
                        const lab0 = sLabs[0];
                        if(lab0.store[Memory.labProtocol[roomName][0]] < 1000){
                            creep.memory.target = lab0.id;
                        }else{
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
                        }else{
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
                        creep.memory.resource = Memory.labProtocol[roomName][0];
                        break;
                    case Memory.labProtocol[roomName][1]:
                        if(sLabs.length >= 2){
                            const lab1 = sLabs[1];
                            if(lab1.store[Memory.labProtocol[roomName][0]] < 1000){
                                creep.memory.target = lab1.id;
                            }else{
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
                        }else{
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
                        creep.memory.resource = Memory.labProtocol[roomName][1];
                        break;
                    case Memory.labProtocol[roomName][2]:
                        if(terminal && terminal.store.getFreeCapacity() > 1000){
                            creep.memory.target = terminal.id;
                            creep.memory.resource = Memory.labProtocol[roomName][2];
                        }else{
                            const storage = Game.rooms[roomName].storage;
                            if(storage && storage.store.getFreeCapacity() > 1000){
                                creep.memory.target = storage.id;
                                creep.memory.resource = Memory.labProtocol[roomName][2];
                            }
                        }
                        break;
                    default:
                        if(terminal && terminal.store.getFreeCapacity() > 1000){
                            creep.memory.target = terminal.id;
                            // creep.memory.resource = global.getMinerals(roomName)[0].mineralType;
                        }else{
                            const storage = Game.rooms[roomName].storage;
                            if(storage && storage.store.getFreeCapacity() > 1000){
                                creep.memory.target = storage.id;
                                // creep.memory.resource = global.getMinerals(roomName)[0].mineralType;
                            }
                        }
                        break;
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
                const storage = Game.rooms[roomName].storage;
                const mCont = global.getMineralContainers(roomName);
                if(mCont.length > 0 && (mCont[0].store.getUsedCapacity(global.getMinerals(roomName)[0].mineralType) > 500 || mCont[0].store[RESOURCE_ENERGY] > 0)){
                    creep.memory.target = mCont[0].id;
                    if(mCont[0].store[RESOURCE_ENERGY] > 0){
                        creep.memory.resource = RESOURCE_ENERGY;
                        creep.memory.amount = Math.min(creep.store.getFreeCapacity(), mCont[0].store[RESOURCE_ENERGY]);
                    }else{
                        creep.memory.resource = global.getMinerals(roomName)[0].mineralType;
                        creep.memory.amount = Math.min(creep.store.getFreeCapacity(), mCont[0].store[global.getMinerals(roomName)[0].mineralType]);
                    }
                }else{
                    const nuker = global.getCachedStructures(roomName, STRUCTURE_NUKER);
                    if(nuker.length > 0 && nuker[0].store.getFreeCapacity(RESOURCE_GHODIUM) > 0 && terminal.store[RESOURCE_GHODIUM] > 0){
                        creep.memory.target = terminal.id;
                        creep.memory.resource = RESOURCE_GHODIUM;
                        creep.memory.amount = Math.min(creep.store.getFreeCapacity(), terminal.store[RESOURCE_GHODIUM]);
                    }else{
                        const resourceTypes = Memory.labProtocol[roomName];
                        if(resourceTypes.length == 3){
                            const dLabs = global.getDestLabs(roomName).filter(l => (l.store[l.mineralType] || 0) > 1000);
                            if(dLabs.length > 0){
                                dLabs.sort(function(a, b) {
                                    return b.store.getUsedCapacity(b.mineralType) || 0 - a.store.getUsedCapacity(a.mineralType) || 0;
                                });
                                creep.memory.target = dLabs[0].id;
                                creep.memory.resource = dLabs[0].mineralType;
                                creep.memory.amount = Math.min(creep.store.getFreeCapacity(), dLabs[0].store[dLabs[0].mineralType]);
                            }else{
                                const cLabs = global.getSourceLabs(roomName);
                                if(cLabs.length >= 2){
                                    const sLabs = cLabs.filter(l => (l.store[l.mineralType] || 0) < 1000);
                                    sLabs.sort(function(a, b) {
                                        return a.store.getUsedCapacity(a.mineralType) || 0 - b.store.getUsedCapacity(b.mineralType) || 0;
                                    });
                                    for(let i = 0; i < sLabs.length; i++){
                                        let resourceType = sLabs[i].mineralType;
                                        if(!resourceType){
                                            const labIndex = global.getSourceLabs(roomName).findIndex(l => l === sLabs[i]);

                                            if (labIndex !== -1) {
                                                resourceType = resourceTypes[labIndex];
                                            }
                                        }
                                        if(terminal.store[resourceType] > 0 || storage.store[resourceType] > 0){
                                            if(storage.store[resourceType] > 0){
                                                creep.memory.target = storage.id;
                                            }else{
                                                creep.memory.target = terminal.id;
                                            }
                                            creep.memory.resource = resourceType;
                                            creep.memory.amount = Math.min(creep.store.getFreeCapacity(), terminal.store[resourceType]);
                                            break;
                                        }
                                    }
                                }else{
                                    const power_spawn = global.getCachedStructures(roomName, STRUCTURE_POWER_SPAWN);
                                    if(power_spawn.length > 0 && power_spawn[0].store.getFreeCapacity(RESOURCE_POWER) > 0 && terminal.store[RESOURCE_GHODIUM] > 0){
                                        creep.memory.target = terminal.id;
                                        creep.memory.resource = RESOURCE_POWER;
                                        creep.memory.amount = 50;
                                    }
                                }
                            }
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