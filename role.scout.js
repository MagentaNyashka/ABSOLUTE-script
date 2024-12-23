const roleScout = {
    run(creep) {
        // Track the creep's position to detect if it is stuck
        if (!creep.memory.lastPos) {
            creep.memory.lastPos = { x: creep.pos.x, y: creep.pos.y, stuckTicks: 0 };
        } else {
            const lastPos = creep.memory.lastPos;
            if (lastPos.x === creep.pos.x && lastPos.y === creep.pos.y) {
                lastPos.stuckTicks++;
            } else {
                lastPos.x = creep.pos.x;
                lastPos.y = creep.pos.y;
                lastPos.stuckTicks = 0;
            }

            // If stuck for more than 2 ticks, recalculate path
            if (lastPos.stuckTicks > 2) {
                console.log(`${creep.name} is stuck! Recalculating path.`);
                creep.memory.targetRoom = null; // Reset target to pick a new room
                lastPos.stuckTicks = 0;
                return;
            }
        }

        // If the creep doesn't have a target room, assign one
        if (!creep.memory.targetRoom) {
            const exits = Game.map.describeExits(creep.room.name); // Get exits of the current room
            for (const direction in exits) {
                const roomName = exits[direction];

                // Skip rooms already in Memory.remoteRooms or Memory.enemyRooms
                if (
                    (Memory.remoteRooms && Memory.remoteRooms[roomName]) ||
                    (Memory.enemyRooms && Memory.enemyRooms.includes(roomName))
                ) {
                    continue;
                }

                // Assign the first valid room
                creep.memory.targetRoom = roomName;
                break;
            }

            // If no valid room found, log and return
            if (!creep.memory.targetRoom) {
                console.log(`${creep.name} has no valid target room to scout.`);
                return;
            }
        }

        // Move to the target room
        if (creep.memory.targetRoom && creep.room.name !== creep.memory.targetRoom) {
            creep.moveTo(new RoomPosition(25, 25, creep.memory.targetRoom), {
                visualizePathStyle: { stroke: '#ffaa00' },
                reusePath: 10,
                maxRooms: 1, // Avoid multi-room paths causing unnecessary detours
            });
            return;
        }

        // Once in the target room, scan it
        if (creep.memory.targetRoom && creep.room.name === creep.memory.targetRoom) {
            if (creep.pos.x === 0 || creep.pos.x === 49 || creep.pos.y === 0 || creep.pos.y === 49) {
                creep.moveTo(25, 25);
                return;
            }

            const room = creep.room;

            // Check for hostile controllers or presence of enemy creeps
            const isEnemyRoom =
                (room.controller && room.controller.owner && room.controller.owner.username !== creep.owner.username) ||
                room.find(FIND_HOSTILE_CREEPS).length > 0;
            if (isEnemyRoom) {
                // Add room to enemyRooms
                if (!Memory.enemyRooms) {
                    Memory.enemyRooms = [];
                }
                if (!Memory.enemyRooms.includes(room.name)) {
                    Memory.enemyRooms.push(room.name);
                    console.log(`Room ${room.name} marked as enemy territory.`);
                }

                delete creep.memory.targetRoom; // Skip this room and move on
                return;
            }

            // Count sources
            const sources = room.find(FIND_SOURCES);
            console.log(`Room ${room.name} has ${sources.length} sources.`);

            // Add to Memory.remoteRooms
            if (!Memory.remoteRooms) {
                Memory.remoteRooms = {};
            }
            if (!Memory.remoteRooms[room.name]) {
                Memory.remoteRooms[room.name] = {
                    sources: sources.length,
                    lastScouted: Game.time,
                };
            }

            // Clear target and move on
            delete creep.memory.targetRoom;
        }
    },
};

module.exports = roleScout;
