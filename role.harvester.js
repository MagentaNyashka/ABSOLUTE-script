var roleHarvester = {
    run: function(creep) {
        const roomName = creep.room.name;

        const energyStructures = global.getCachedStructures(roomName, STRUCTURE_LINK).concat(global.getCachedStructures(roomName, STRUCTURE_CONTAINER));

        const sources = global.getSources(roomName)[0];
        if(!sources){
            console.log(roomName);
        }

        if (creep.memory.transferring && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.transferring = false;
            delete creep.memory.target;
        }
        if (!creep.memory.transferring && (creep.store.getFreeCapacity() <= 10 || sources.energy === 0)) {
            creep.memory.transferring = true;
            delete creep.memory.target;
        }

        if (creep.memory.transferring) {
            if (!creep.memory.target) {
                const transferTargets = global.getCachedStructures(roomName, STRUCTURE_EXTENSION)
                    .concat(global.getCachedStructures(roomName, STRUCTURE_SPAWN))
                    .filter(structure => structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
            
                if (transferTargets.length > 0 && energyStructures.length === 0) {
                    creep.memory.target = creep.pos.findClosestByRange(transferTargets).id;
                } else if (energyStructures.length > 0) {
                    creep.memory.target = creep.pos.findClosestByRange(energyStructures).id;
                } else {
                    const towers = global.getCachedStructures(roomName, STRUCTURE_TOWER).filter(
                        structure => structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                    );
                    if (towers.length > 0) {
                        creep.memory.target = creep.pos.findClosestByPath(towers).id;
                    } else {
                        const otherTargets = []
                            .concat(creep.room.terminal ? [creep.room.terminal] : [])
                            .concat(global.getCachedStructures(roomName, STRUCTURE_POWER_SPAWN) || [])
                            .filter(structure => structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
                        if (otherTargets.length > 0) {
                            creep.memory.target = creep.pos.findClosestByPath(otherTargets).id;
                        }
                    }
                }
            }
            const targetStructure = Game.getObjectById(creep.memory.target);
        
            if (targetStructure) {
                new RoomVisual(roomName).circle(targetStructure.pos, {fill: 'transparent',stroke: '#00ff00', strokeWidth: 0.03, opacity: 1, radius: 0.5});
                if (creep.transfer(targetStructure, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(targetStructure, { visualizePathStyle: { stroke: '#ffffff' } });
                } else {
                    delete creep.memory.target;
                }
            } else {
                delete creep.memory.target;
            }    
        }else {
            new RoomVisual(roomName).circle(sources.pos, {fill: '#ffff00', opacity: 0.5, radius: 0.55});
            if (creep.harvest(sources) === ERR_NOT_IN_RANGE) {
                creep.moveTo(sources, { visualizePathStyle: { stroke: '#ffaa00' }, reusePath: 10});
            }
        }
    },
};

module.exports = roleHarvester;