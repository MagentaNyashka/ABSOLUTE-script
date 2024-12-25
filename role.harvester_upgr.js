// var roleHarvesterUpgr = {
//     run: function(creep) {
//         var link = creep.room.find(FIND_STRUCTURES, {
//             filter: (structure) => {
//                 return(structure.structureType == STRUCTURE_LINK) &&
//                     structure.isActive();
//             }
//         });
//         if(creep.memory.transferring && creep.store[RESOURCE_ENERGY] == 0){
//             creep.memory.transferring = false;
//         }
//         if(!creep.memory.transferring && creep.store.getFreeCapacity() <= 10){
//             creep.memory.transferring = true;
//             if(link.length == 0){
//             if(creep.move(TOP) == 0){
//                 creep.move(TOP);
//             }
//             else if(creep.move(BOTTOM) == 0){
//                 creep.move(BOTTOM)
//             }
//             else if(creep.move(LEFT) == 0){
//                 creep.move(LEFT)
//             }
//             else if(creep.move(RIGHT) == 0){
//                 creep.move(RIGHT)
//             }
//         }
//         }
//         if(creep.memory.transferring){
//             var extantions = creep.room.find(FIND_STRUCTURES, {
//                 filter: (structure) => {
//                     return(structure.structureType == STRUCTURE_SPAWN ||
//                         structure.structureType == STRUCTURE_EXTENSION) &&
//                         structure.isActive() && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
//                 }
//             });
//             if(extantions.length > 0 && link.length <= 2){
//                 ex_d = creep.pos.findClosestByPath(extantions);
//                 if(creep.transfer(ex_d, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
//                     creep.moveTo(ex_d, {visualizePathStyle: {stroke: '#ffffff'}});
//                 }
//             }
//             else if(link.length > 2){
//                 var closest_link = creep.pos.findClosestByPath(link);
//                 if(creep.transfer(closest_link, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
//                     creep.moveTo(closest_link, {visualizePathStyle: {stroke: '#ffffff'}});
//                 }
//             }
//         }
//         else{
//             var sources = creep.room.find(FIND_SOURCES
//                 // , {filter: (source) => {return (source.energy > 0);}}
//             );
//             if(sources.length > 1){
//                 if(creep.harvest(sources[1]) == ERR_NOT_IN_RANGE) {
//                     creep.moveTo(sources[1], {visualizePathStyle: {stroke: '#ffffff'}});
//                 }
//             }
//             else{
//                 if(creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
//                     creep.moveTo(sources[0], {visualizePathStyle: {stroke: '#ffffff'}});
//                 }
//             }
//         }
//     }
// };
// module.exports = roleHarvesterUpgr;

var roleHarvesterUpgr = {
    run: function(creep) {
        const roomName = creep.room.name;

        const energyStructures = global.getCachedStructures(roomName, STRUCTURE_LINK).concat(global.getCachedStructures(roomName, STRUCTURE_CONTAINER));

        const sources = global.getSources(roomName);

        if (creep.memory.transferring && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.transferring = false;
            delete creep.memory.target;
        }
        if (!creep.memory.transferring && (creep.store.getFreeCapacity() <= 10 || sources[0].energy === 0)) {
            creep.memory.transferring = true;
            delete creep.memory.target;
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
                new RoomVisual(roomName).circle(targetStructure.pos, {fill: '#00ff00', opacity: 0.5, radius: 0.55});
                if (creep.transfer(targetStructure, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(targetStructure, { visualizePathStyle: { stroke: '#ffffff' } });
                } else {
                    delete creep.memory.target;
                }
            } else {
                delete creep.memory.target;
            }    
        }else {
            new RoomVisual(roomName).circle(sources[1].pos, {fill: '#ffff00', opacity: 0.5, radius: 0.55});
            if (creep.harvest(sources[1]) === ERR_NOT_IN_RANGE) {
                creep.moveTo(sources[1], { visualizePathStyle: { stroke: '#ffaa00' }, reusePath: 10});
            }
        }
    },
};

module.exports = roleHarvesterUpgr;
