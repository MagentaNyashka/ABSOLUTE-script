var roleHarvester = {
    run: function(creep) {
        const roomName = creep.room.name;

        // const energyStructures = Links.get(roomName).concat(Containers.get(roomName));
        const energyStructures = global.getCachedStructures(roomName, STRUCTURE_LINK);//.concat(global.getCachedStructures(roomName, STRUCTURE_CONTAINER));

        const sources = global.getSources(roomName);

        if (creep.memory.transferring && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.transferring = false;
        }
        if (!creep.memory.transferring && (creep.store.getFreeCapacity() <= 10 || sources[0].energy === 0)) {
            creep.memory.transferring = true;
        }

        if (creep.memory.transferring) {
            if (!creep.memory.target) {
                const transferTargets = global.getCachedStructures(roomName, STRUCTURE_EXTENSION)
                    .concat(global.getCachedStructures(roomName, STRUCTURE_SPAWN))
                    .filter(structure => structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
            
                if (transferTargets.length > 0 && energyStructures.length === 0) {
                    creep.memory.target = creep.pos.findClosestByPath(transferTargets).id;
                } else if (energyStructures.length > 0) {
                    creep.memory.target = creep.pos.findClosestByPath(energyStructures).id;
                } else {
                    const towers = global.getCachedStructures(roomName, STRUCTURE_TOWER).filter(
                        structure => structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                    );
                    if (towers.length > 0) {
                        creep.memory.target = creep.pos.findClosestByPath(towers).id;
                    } else {
                        const otherTargets = creep.room.terminal
                            .concat(global.getCachedStructures(roomName, STRUCTURE_POWER_SPAWN))
                            .filter(structure => structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
                        if (otherTargets.length > 0) {
                            creep.memory.target = creep.pos.findClosestByPath(otherTargets).id;
                        }
                    }
                }
            } else {
                const targetStructure = Game.getObjectById(creep.memory.target);
            
                if (targetStructure) {
                    if (creep.transfer(targetStructure, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(targetStructure, { visualizePathStyle: { stroke: '#ffffff' } });
                    } else {
                        delete creep.memory.target;
                    }
                } else {
                    delete creep.memory.target;
                }
            }            
        }else {
                /*
                const source = creep.pos.findClosestByPath(sources, {
                    filter: s => s.energy > 0,
                });
                if (source && creep.harvest(source) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
                */
                if (creep.harvest(sources[0]) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(sources[0], { visualizePathStyle: { stroke: '#ffaa00' }, reusePath: 10});
                }
            }
        },
};

module.exports = roleHarvester;
