var roleHarvester = {
    run: function(creep, Extantions, Spawns, Sources, Links, Containers, Towers, Terminals, Power_Spawns) {
        const roomName = creep.room.name;

        const energyStructures = Links.get(roomName).concat(Containers.get(roomName));

        const sources = Sources.get(roomName);

        if (creep.memory.transferring && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.transferring = false;
        }
        if (!creep.memory.transferring && (creep.store.getFreeCapacity() <= 10 || sources[0].energy === 0)) {
            creep.memory.transferring = true;
        }

        if (creep.memory.transferring) {
            const transferTargets = Extantions.get(roomName)
                .concat(Spawns.get(roomName))
                .filter(structure => structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);

            if (transferTargets.length > 0 && energyStructures.length === 0) {
                const target = creep.pos.findClosestByPath(transferTargets);
                if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                }
            } else if (energyStructures.length > 0) {
                const closestEnergyStructure = creep.pos.findClosestByPath(energyStructures);
                if (creep.transfer(closestEnergyStructure, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(closestEnergyStructure, { visualizePathStyle: { stroke: '#ffffff' } });
                }
            } else {
                const towers = Towers.get(roomName).filter(
                    structure => structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                );
                if (towers.length > 0) {
                    const closestTower = creep.pos.findClosestByPath(towers);
                    if (creep.transfer(closestTower, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(closestTower, { visualizePathStyle: { stroke: '#ffffff' } });
                    }
                } else {
                    const otherTargets = Terminals.get(roomName)
                        .concat(Power_Spawns.get(roomName))
                        .filter(structure => structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
                    if (otherTargets.length > 0) {
                        const fallbackTarget = creep.pos.findClosestByPath(otherTargets);
                        if (creep.transfer(fallbackTarget, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                            creep.moveTo(fallbackTarget, { visualizePathStyle: { stroke: '#ffffff' } });
                        }
                    }
                }
            }
        } else {
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
