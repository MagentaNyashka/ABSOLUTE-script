var roleMaintainer = {
    run: function(creep) {
        const roomName = creep.room.name;
        const roads = global.getCachedStructures(roomName, STRUCTURE_ROAD).filter(s => s.hits < s.hitsMax);
            if(creep.memory.working && creep.store[RESOURCE_ENERGY] == 0) {
                creep.memory.working = false;
                delete creep.memory.target;
            }
            if(!creep.memory.working && creep.store.getFreeCapacity() == 0) {
                creep.memory.working = true;
                delete creep.memory.target;
            }

            if(creep.memory.working) {
                if(!creep.memory.target) {
                    if(roads.length > 0) {
                        creep.memory.target = roads.sort((a, b) => a.hits - b.hits)[0].id;
                    }
                }
                const target = Game.getObjectById(creep.memory.target);
                if(target) {
                    if(target.hits < target.hitsMax) {
                        let status = creep.repair(target);
                        if(status == ERR_NOT_IN_RANGE) {
                            creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
                        }
                        return;
                    }
                    delete creep.memory.target;
                } else {
                    delete creep.memory.target;
                }
            }
            else {
                if(!creep.memory.target) {
                    const terminal = Game.rooms[roomName].terminal;
                    if(terminal && terminal.store[RESOURCE_ENERGY] > 10000) {
                        creep.memory.target = terminal.id;
                    }else{
                        const storage = Game.rooms[roomName].storage;
                        if(storage && storage.store[RESOURCE_ENERGY] > 5000) {
                            creep.memory.target = storage.id;
                        }else{
                            const containers = global.getDestContainers(roomName).concat(global.getDestLinks(roomName)).filter(s => s.store[RESOURCE_ENERGY] > 0);
                            if(containers.length > 0) {
                                creep.memory.target = containers[0].id;
                            }else{
                                const source_containers = global.getSourceContainers(roomName).filter(s => s.store[RESOURCE_ENERGY] > 0);
                                if(source_containers.length > 0) {
                                    creep.memory.target = source_containers[0].id;
                                }
                            }
                        }
                    }
                }

                var target = Game.getObjectById(creep.memory.target);
                if(target) {
                    if(creep.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, {visualizePathStyle: {stroke: '#ffaa00'}});
                    }
                } else {
                    creep.memory.target = null;
                }
            }
    }
};

module.exports = roleMaintainer;