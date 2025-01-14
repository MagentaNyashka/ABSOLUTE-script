var roleMaintainer = {
    run: function(creep) {
        const roomName = creep.room.name;
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
                    // const roads = global.getCachedStructures(roomName, STRUCTURE_ROAD).concat(global.getCachedStructures(roomName, STRUCTURE_CONTAINER)).filter(s => s.hits < s.hitsMax);
                    const damagedStructures = global.getAllStuctures(roomName).filter(s => s.hits < s.hitsMax);
                    if(damagedStructures.length > 0) {
                        creep.memory.target = damagedStructures.sort((a, b) => (a.hits/a.hitsMax) - (b.hits/b.hitsMax))[0].id;
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
                                creep.memory.target = creep.pos.findClosestByRange(containers).id;
                            }else{
                                const source_containers = global.getSourceContainers(roomName).filter(s => s.store[RESOURCE_ENERGY] > 0);
                                if(source_containers.length > 0) {
                                    creep.memory.target = creep.pos.findClosestByRange(source_containers).id;
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