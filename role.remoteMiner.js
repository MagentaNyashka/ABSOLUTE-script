const roleRemoteMiner = {
    run(creep) {
        // Assign a target room if the creep doesn't already have one
        if (!creep.memory.targetRoom) {
            if (!Memory.remoteRooms) {
                console.log('No remote rooms available in Memory.');
                return;
            }

            for (const roomName in Memory.remoteRooms) {
                const roomData = Memory.remoteRooms[roomName];
                if (!roomData.assignedCreep || !Game.creeps[roomData.assignedCreep]) {
                    creep.memory.targetRoom = roomName;
                    Memory.remoteRooms[roomName].assignedCreep = creep.name;
                    console.log(`${creep.name} assigned to room ${roomName}`);
                    break;
                }
            }

            if (!creep.memory.targetRoom) {
                console.log(`${creep.name} could not find an unassigned remote room.`);
                return;
            }
        }

        // Travel to the target room
        if (creep.memory.targetRoom && creep.room.name !== creep.memory.targetRoom) {
            creep.moveTo(new RoomPosition(25, 25, creep.memory.targetRoom), {
                visualizePathStyle: { stroke: '#ffaa00' },
                reusePath: 10,
            });
            return;
        }

        // In the target room, mine energy
        if (creep.room.name === creep.memory.targetRoom) {
            const sources = creep.room.find(FIND_SOURCES);
            if (sources.length > 0) {
                // Assign the closest source to mine
                if (!creep.memory.sourceId) {
                    const source = creep.pos.findClosestByPath(sources);
                    if (source) {
                        creep.memory.sourceId = source.id;
                    }
                }

                // Mine energy or wait for a hauler
                const source = Game.getObjectById(creep.memory.sourceId);
                if (creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                    if (source) {
                        if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
                            creep.moveTo(source, { visualizePathStyle: { stroke: '#ffffff' } });
                        }
                    } else {
                        // If source is unavailable, clear memory to reassign
                        delete creep.memory.sourceId;
                    }
                }
            }
        }
    },
};

module.exports = roleRemoteMiner;
