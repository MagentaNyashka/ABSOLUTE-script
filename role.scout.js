const roleScout = {
    run(creep) {
        const ownedRooms = Object.values(Game.rooms).filter(
            (room) => room.controller && room.controller.my
        );

        if (!creep.memory.targetRoom) {
            const exits = Game.map.describeExits(creep.room.name);
            for (const direction in exits) {
                const roomName = exits[direction];

                if (
                    (Memory.remoteRooms && Memory.remoteRooms[roomName]) ||
                    (Memory.enemyRooms && Memory.enemyRooms.includes(roomName))
                ) {
                    continue;
                }

                const isNearbyOwnedRoom = ownedRooms.some(
                    (ownedRoom) =>
                        Game.map.getRoomLinearDistance(ownedRoom.name, roomName) < 2
                );

                if (isNearbyOwnedRoom) {
                    creep.memory.targetRoom = roomName;
                    break;
                }
            }

            if (!creep.memory.targetRoom) {
                return;
            }
        }

        if (creep.memory.targetRoom && creep.room.name !== creep.memory.targetRoom) {
            creep.moveTo(new RoomPosition(25, 25, creep.memory.targetRoom), {
                visualizePathStyle: { stroke: '#ffaa00' },
                reusePath: 10,
                maxRooms: 1,
            });
            return;
        }

        if (creep.memory.targetRoom && creep.room.name === creep.memory.targetRoom) {
            if (creep.pos.x === 0 || creep.pos.x === 49 || creep.pos.y === 0 || creep.pos.y === 49) {
                creep.moveTo(25, 25);
                return;
            }

            const room = creep.room;

            if(room.controller.my){
                delete creep.memory.targetRoom;
                return;
            }
            const isEnemyRoom =
                (room.controller && room.controller.owner && room.controller.owner.username !== creep.owner.username) ||
                room.find(FIND_HOSTILE_CREEPS).length > 0;

            if (isEnemyRoom) {
                if (!Memory.enemyRooms) {
                    Memory.enemyRooms = [];
                }
                if (!Memory.enemyRooms.includes(room.name)) {
                    Memory.enemyRooms.push(room.name);
                    console.log(`Room ${room.name} marked as enemy territory.`);
                }

                delete creep.memory.targetRoom;
                return;
            }

            const sources = room.find(FIND_SOURCES);
            console.log(`Room ${room.name} has ${sources.length} sources.`);

            if (!Memory.remoteRooms) {
                Memory.remoteRooms = {};
            }
            if (!Memory.remoteRooms[room.name]) {
                Memory.remoteRooms[room.name] = {
                    sources: sources.length,
                    lastScouted: Game.time,
                };
            }

            delete creep.memory.targetRoom;
        }
    },
};

module.exports = roleScout;
