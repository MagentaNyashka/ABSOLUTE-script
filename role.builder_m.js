function findSafeRoute(originRoom, targetRoom) {
    const route = Game.map.findRoute(originRoom, targetRoom, {
        routeCallback(roomName, fromRoomName) {
            const room = Game.rooms[roomName];

            if (room) {
                const controller = room.controller;
                if (controller) {
                    if (
                        (controller.owner && !controller.my) ||
                        (controller.reservation && controller.reservation.username !== 'Purpl3_Br1ck')
                    ) {
                        return Infinity;
                    }
                }
            } else {
                return 5;
            }

            return 1;
        }
    });

    if (route === ERR_NO_PATH) {
        console.log(`No safe route found from ${originRoom} to ${targetRoom}`);
        return null;
    }

    return route;
}


const roleBuilderM = {
    run(creep) {
        const roomName = creep.room.name;
        const targetRoom = creep.memory.targetRoom || Memory.claimableRooms[0];

        if (roomName !== targetRoom) {


            if (!creep.memory.route || creep.memory.route[0].room === roomName) {
                const route = findSafeRoute(roomName, targetRoom);
                if (!route) {
                    return;
                }
                creep.memory.route = route;
            }

            const nextStep = creep.memory.route[0];
            if (nextStep && nextStep.room !== roomName) {
                const status = creep.moveTo(new RoomPosition(25, 25, nextStep.room), {
                    visualizePathStyle: { stroke: '#00ffff' },
                    reusePath: 50,
                });
                return;
            }
        } else {
            creep.memory.route = null;

            // if(creep.room.controller && creep.room.controller.level >= 2){
            //     delete Memory.claimableRooms[0];
            // }
            const spawns = creep.room.find(FIND_MY_SPAWNS);
            if(spawns.length > 0){
                const index = Memory.claimableRooms.indexOf(creep.room.name);
                creep.say(index);
                if (index > -1) {
                    Memory.claimableRooms.splice(index, 1);
                }
            }
            // creep.say(creep.room.controller.level);

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
                    new RoomVisual(roomName).circle(target.pos, {fill: 'transparent',stroke: '#00ff00', strokeWidth: 0.03, opacity: 1, radius: 0.55});
                    const status = creep.build(target);
                    if(status === OK){return;}
                    if (status === ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                        return;
                    } else {
                        delete creep.memory.target;
                    }
                } else {
                    delete creep.memory.target;
                }
            } else {
                if (!creep.memory.target) {
                    const storage = Game.rooms[roomName].storage;
                    if(storage && storage.store[RESOURCE_ENERGY] > 0){
                        creep.memory.target = storage.id;
                    }else{
                        const terminal = Game.rooms[roomName].terminal;
                        if(terminal && terminal.store[RESOURCE_ENERGY] > 0){
                            creep.memory.target = terminal.id;
                        }else{
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
                    }
                }
    
                const targetStructure = Game.getObjectById(creep.memory.target);
                if (targetStructure) {
                    new RoomVisual(roomName).circle(targetStructure.pos, {fill: 'transparent',stroke: '#ffff00', strokeWidth: 0.03, opacity: 1, radius: 0.55});
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
    },
};

module.exports = roleBuilderM;