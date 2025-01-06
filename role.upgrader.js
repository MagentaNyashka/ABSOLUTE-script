// var roleUpgrader = {
//     run: function(creep) {
//         const roomName = creep.room.name;

//         const energyStructures = global.getDestLinks(roomName).concat(global.getCachedStructures(roomName, STRUCTURE_CONTAINER));
//         const storage = Game.rooms[roomName].storage;

//         if(creep.memory.transferring && creep.store[RESOURCE_ENERGY] == 0 && creep.ticksToLive > 50) {
//             creep.memory.transferring = false;
//             delete creep.memory.target;
//         }
//         if(!creep.memory.transferring && creep.store.getFreeCapacity() == 0) {
//             creep.memory.transferring = true;
//             delete creep.memory.target;
//             creep.memory.target = creep.room.controller;
//         }
//         if(creep.memory.transferring && creep.room.controller.ticksToDowngrade <= 199990) {
//             const status = creep.upgradeController(creep.room.controller);
//             new RoomVisual(roomName).circle(creep.room.controller.pos, {fill: '#00ff00', opacity: 0.5, radius: 0.55});
//             if(status === ERR_NOT_IN_RANGE) {
//                 creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#00ffff'}});
//             }
//         }
//         else if(!creep.memory.transferring && creep.store.getFreeCapacity() >= 0) {
//             if(!creep.memory.target){
//                 if(storage && storage.store[RESOURCE_ENERGY] > 1000 && creep.room.controller.level != 8){
//                     creep.memory.target = storage.id;
//                 }
//                 else{
//                     const terminal = Game.rooms[roomName].terminal;
//                     if(terminal && terminal.store[RESOURCE_ENERGY] > 50000 && creep.room.controller.level != 8){
//                         creep.memory.target = terminal.id;
//                     }
//                     else{
//                         if(energyStructures.length != 0){
//                             creep.memory.target = creep.pos.findClosestByPath(energyStructures).id;
//                         }
//                         else{
//                             const sources = global.getSources(roomName);
//                             const target = creep.pos.findClosestByPath(sources);
//                             if(target){
//                                 creep.memory.target = target.id;
//                             }
//                         }
//                     }
//                 }
//             }
//             else{
//                 const targetStructure = Game.getObjectById(creep.memory.target);
//                 if(targetStructure){
//                     new RoomVisual(roomName).circle(targetStructure.pos, {fill: '#ff0000', opacity: 0.5, radius: 0.55});
//                     let status;
//                     if(energyStructures.length != 0){
//                         status = creep.withdraw(targetStructure, RESOURCE_ENERGY)
//                     }
//                     else{
//                         status = creep.harvest(targetStructure);
//                     }
//                     if(status === ERR_NOT_IN_RANGE || status === ERR_NOT_ENOUGH_ENERGY){
//                         creep.moveTo(targetStructure, {visualizePathStyle: {stroke: '#00ffff'}});
//                     }
//                     else{
//                         delete creep.memory.target;
//                     }
//                 }
//                 else{
//                     delete creep.memory.target;
//                 }
//             }
//         }
//     }
// };

// module.exports = roleUpgrader;


var roleUpgrader = {
    run: function(creep) {
        const roomName = creep.room.name;

        const energyStructures = global.getControllerLinks(roomName).concat(global.getControllerContainers(roomName));
        const storage = Game.rooms[roomName].storage;

        if (creep.memory.transferring && creep.store[RESOURCE_ENERGY] == 0 && creep.ticksToLive > 5) {
            creep.memory.transferring = false;
            delete creep.memory.target;
        }
        if (!creep.memory.transferring && creep.store[RESOURCE_ENERGY] > 0) {
            creep.memory.transferring = true;
            delete creep.memory.target;
            creep.memory.target = creep.room.controller.id;
        }
        if (creep.memory.transferring
            //  && creep.room.controller.ticksToDowngrade <= 199990
            ) {
            const status = creep.upgradeController(creep.room.controller);
            new RoomVisual(roomName).circle(creep.room.controller.pos, {fill: 'transparent',stroke: '#00ff00', strokeWidth: 0.03, opacity: 1, radius: 0.55});
            if (status === ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#00ffff' } });
            }
        } else if (!creep.memory.transferring && creep.store.getFreeCapacity() >= 0) {
            if (!creep.memory.target) {
                // if (storage && storage.store[RESOURCE_ENERGY] > 10000 && creep.room.controller.level != 8) {
                //     creep.memory.target = storage.id;
                // } else {
                //     const terminal = Game.rooms[roomName].terminal;
                //     if (terminal && terminal.store[RESOURCE_ENERGY] > 10000 && creep.room.controller.level != 8) {
                //         creep.memory.target = terminal.id;
                //     } else {
                //         if (energyStructures.length != 0) {
                //             creep.memory.target = creep.pos.findClosestByPath(energyStructures).id;
                //         } else {
                //             const sources = global.getSources(roomName);
                //             const target = creep.pos.findClosestByPath(sources);
                //             if (target) {
                //                 creep.memory.target = target.id;
                //             }
                //         }
                //     }
                // }
                if(energyStructures.length != 0){
                    creep.memory.target = creep.pos.findClosestByPath(energyStructures).id;
                }else{
                        const sources = global.getSources(roomName);
                        const target = creep.pos.findClosestByPath(sources);
                        if(target){
                            creep.memory.target = target.id;
                        }
                    }
            }
            const targetStructure = Game.getObjectById(creep.memory.target);
            if (targetStructure) {
                new RoomVisual(roomName).circle(targetStructure.pos, {fill: 'transparent',stroke: '#ff0000', strokeWidth: 0.03, opacity: 1, radius: 0.55});
                let status;
                status = creep.withdraw(targetStructure, RESOURCE_ENERGY);
                if(status === OK){delete creep.memory.target;return;}
                if(status === ERR_INVALID_TARGET){
                    status = creep.harvest(targetStructure);
                    delete creep.memory.target;
                    return;
                }
                if(status === ERR_NOT_IN_RANGE){
                    creep.moveTo(targetStructure, {visualizePathStyle: {stroke: '#00ffff'}});
                    return;
                }
                else{
                    delete creep.memory.target;
                }
                // if (energyStructures.length != 0) {
                //     status = creep.withdraw(targetStructure, RESOURCE_ENERGY);
                // } else {
                //     status = creep.harvest(targetStructure);
                // }
                // if (status === ERR_NOT_IN_RANGE || status === ERR_NOT_ENOUGH_ENERGY) {
                //     creep.moveTo(targetStructure, { visualizePathStyle: { stroke: '#00ffff' } });
                // } else {
                //     delete creep.memory.target;
                // }
            } else {
                delete creep.memory.target;
            }
        }
    }
};

module.exports = roleUpgrader;