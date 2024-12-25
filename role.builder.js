var roleBuilder = {

    run: function(creep) {
        const roomName = creep.room.name;

        if (creep.memory.building && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.building = false;
            delete creep.memory.target;
        }
        if (!creep.memory.building && creep.store.getFreeCapacity() === 0) {
            creep.memory.building = true;
            delete creep.memory.target;
        }

        if (creep.memory.building) {
            if (!creep.memory.target) {
                const closestTarget = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES) || creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
                if (closestTarget) {
                    creep.memory.target = closestTarget.id;
                }
            }

            const target = Game.getObjectById(creep.memory.target);
            if (target) {
                new RoomVisual(roomName).circle(target.pos, { fill: '#ffffff', opacity: 0.5, radius: 0.55 });
                if (creep.build(target) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                } else {
                    delete creep.memory.target;
                }
            } else {
                delete creep.memory.target;
            }
        } else {
            if (!creep.memory.target) {
                const energyStructures = global.getCachedStructures(roomName, STRUCTURE_CONTAINER)
                    .concat(global.getDestLinks(roomName) || [])
                    .concat(creep.room.terminal || [])
                    .filter(structure => structure.store[RESOURCE_ENERGY] > 0);
                if (energyStructures.length > 0) {
                    creep.memory.target = creep.pos.findClosestByPath(energyStructures).id;
                } else {
                    const sources = global.getSources(roomName);
                    const target = creep.pos.findClosestByPath(sources);
                    if (target) {
                        creep.memory.target = target.id;
                    }
                }
            }

            const targetStructure = Game.getObjectById(creep.memory.target);
            if (targetStructure) {
                new RoomVisual(roomName).circle(targetStructure.pos, { fill: '#ffff00', opacity: 0.5, radius: 0.55 });
                let status;
                if (targetStructure.structureType) {
                    status = creep.withdraw(targetStructure, RESOURCE_ENERGY);
                } else {
                    status = creep.harvest(targetStructure);
                }
                if (status === ERR_NOT_IN_RANGE) {
                    creep.moveTo(targetStructure, { visualizePathStyle: { stroke: '#ffffff' } });
                } else {
                    delete creep.memory.target;
                }
            } else {
                delete creep.memory.target;
            }
        }
    }
};

module.exports = roleBuilder;