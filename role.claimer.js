function findSafeRoute(originRoom, targetRoom) {
    const route = Game.map.findRoute(originRoom, targetRoom, {
        routeCallback(roomName, fromRoomName) {
            const room = Game.rooms[roomName]; // Get room if visible

            // If the room is visible
            if (room) {
                const controller = room.controller;
                if (controller) {
                    // Avoid rooms with hostile controllers
                    if (
                        (controller.owner && !controller.my) || // Hostile owned
                        (controller.reservation && controller.reservation.username !== 'Purpl3_Br1ck') // Hostile reserved
                    ) {
                        return Infinity;
                    }
                }
            } else {
                // If the room is not visible, assume it may be hostile
                return 5; // Assign a high but finite cost to discourage using unexplored rooms
            }

            // Default cost for neutral or friendly rooms
            return 1;
        }
    });

    if (route === ERR_NO_PATH) {
        console.log(`No safe route found from ${originRoom} to ${targetRoom}`);
        return null;
    }

    return route;
}


const roleClaimer = {
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

            const controller = creep.room.controller;
            if (controller && !controller.my) {
                if (creep.claimController(controller) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(controller, {
                        visualizePathStyle: { stroke: '#00ffff' }
                    });
                }
            }else{
                creep.moveTo(25,25, {
                    visualizePathStyle: { stroke: '#00ffff' }
                });
            }
        }
    },
};

module.exports = roleClaimer;
