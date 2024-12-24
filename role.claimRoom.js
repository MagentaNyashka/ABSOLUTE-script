function findClosestHighwayRoom(roomName) {
    const { x, y } = getRoomCoordinates(roomName);

    // Helper function to compute Manhattan distance
    function manhattanDistance(x1, y1, x2, y2) {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }

    // Generate a list of possible highway rooms
    const highwayRooms = [];

    // Add all potential highway rooms at x:0 and x:30
    highwayRooms.push({ x: 0, y });
    highwayRooms.push({ x: 30, y });

    // Add all potential highway rooms at y:0 and y:30
    highwayRooms.push({ x, y: 0 });
    highwayRooms.push({ x, y: 30 });

    // Find the closest highway room
    let closestRoom = null;
    let minDistance = Infinity;

    for (const highway of highwayRooms) {
        const distance = manhattanDistance(x, y, highway.x, highway.y);
        if (distance < minDistance) {
            minDistance = distance;
            closestRoom = highway;
        }
    }

    // Convert closestRoom coordinates back to room name
    if (closestRoom) {
        return getRoomNameFromCoordinates(closestRoom.x, closestRoom.y);
    }

    return null; // No highway room found (unlikely in valid Screeps map)
}

// Helper to parse room coordinates
function getRoomCoordinates(roomName) {
    const match = roomName.match(/([WE])(\d+)([NS])(\d+)/);
    if (!match) {
        throw new Error(`Invalid room name: ${roomName}`);
    }

    const x = match[1] === 'W' ? -parseInt(match[2], 10) : parseInt(match[2], 10);
    const y = match[3] === 'N' ? parseInt(match[4], 10) : -parseInt(match[4], 10);

    return { x, y };
}

function getRoomNameFromCoordinates(x, y) {
    const xDir = x < 0 ? 'W' : 'E';
    const yDir = y < 0 ? 'S' : 'N';
    return `${xDir}${Math.abs(x)}${yDir}${Math.abs(y)}`;
}

function writeCreepRoleToIntershardMemory(creep) {
    
    var data = JSON.parse(InterShardMemory.getLocal() || "{}");
    if(!data.creepRoles){
        data.creepRoles = {};
    }
    if(!data.creepRoles[creep.name]){
        data.creepRoles[creep.name] = {};
    }
    if(!data.creepRoles[creep.name].role){
        data.creepRoles[creep.name].role = creep.memory.role;
    }
    InterShardMemory.setLocal(JSON.stringify(data));
}

function readCreepRolesFromIntershardMemory(shard) {
    const intershardData = InterShardMemory.getRemote(shard);
    console.log(intershardData);
    if (!intershardData) {
        console.log("No data in Intershard Memory.");
        return {};
    }

    const parsedData = JSON.parse(intershardData);
    return parsedData.creepRoles || {};
}

const roleRemoteClaimer = {
    run(creep) {
        const roomName = creep.room.name;
        if(Game.shard.name === 'shard3'){
            if(!creep.memory.target && !creep.memory.isInHighway){
                creep.memory.closestHighway = findClosestHighwayRoom(roomName);
                if(roomName !== creep.memory.closestHighway){
                    creep.memory.target = creep.memory.closestHighway;
                    creep.memory.isInHighway = false;
                    creep.memory.isInPortalRoom = false;
                }
            }
            if(roomName === creep.memory.closestHighway){
                creep.memory.isInHighway = true;
                creep.memory.isInPortalRoom = false;
                creep.memory.target = 'E0N30';
            }
            if((roomName === creep.memory.target && creep.memory.isInHighway) || creep.memory.isInPortalRoom){
                const portal = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => structure.structureType === STRUCTURE_PORTAL,
                });
                creep.memory.target = portal[0].id;
                creep.memory.isInPortalRoom = true;
            }
            if(!creep.memory.isInPortalRoom || !creep.memory.target){
                creep.moveTo(new RoomPosition(25, 25, creep.memory.target), {
                    visualizePathStyle: { stroke: '#ffaa00' },
                    reusePath: 50,
                });
                return;
            }
            if(creep.memory.isInPortalRoom){
                writeCreepRoleToIntershardMemory(creep);
            }
            creep.moveTo(Game.getObjectById(creep.memory.target), {
                visualizePathStyle: { stroke: '#ffaa00' },
                reusePath: 50,
            });
            return;
        }
        if(Game.shard.name === 'shard2'){
            if(creep.memory.building && creep.store[RESOURCE_ENERGY] == 0) {
                creep.memory.building = false;
            }
            if(!creep.memory.building && creep.store.getFreeCapacity() == 0) {
                creep.memory.building = true;
            }
            if(!creep.memory.target && !creep.memory.isInHighway){
                creep.memory.closestHighway = findClosestHighwayRoom(roomName);
                if(roomName !== creep.memory.closestHighway){
                    creep.memory.target = creep.memory.closestHighway;
                    creep.memory.isInHighway = false;
                    creep.memory.isInTargetRoom= false;
                }
            }
            if(roomName === creep.memory.closestHighway){
                creep.memory.isInHighway = true;
                creep.memory.isInTargetRoom = false;
                creep.memory.target = 'E1N29';
            }
            if((roomName === creep.memory.target && creep.memory.isInHighway) || creep.memory.isInTargetRoom){
                const controller = creep.room.controller;
                creep.memory.target = controller.id;
                creep.memory.isInTargetRoom = true;
            }
            if(!creep.memory.isInTargetRoom || !creep.memory.target){
                creep.moveTo(new RoomPosition(25, 25, creep.memory.target), {
                    visualizePathStyle: { stroke: '#ffaa00' },
                    reusePath: 50,
                });
                return;
            }
            if(creep.memory.isInTargetRoom){
                if(!creep.room.controller.my && creep.claimController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#00ffff'}});
                    return;
                }


                if(creep.memory.building) {
                    const constr_sites = creep.room.find(FIND_CONSTRUCTION_SITES);
                    const controller = creep.room.controller;
                    if(constr_sites.length > 0 && controller.ticksToDowngrade > 5000){
                        const closestTarget = creep.pos.findClosestByRange(constr_sites);
                        if(creep.build(closestTarget) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(closestTarget, {visualizePathStyle: {stroke: '#ffffff'}});
                        }
                        return;
                    }
                    if(creep.upgradeController(controller) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(controller, {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                    
                }
                else {
                    var sources = creep.room.find(FIND_SOURCES);
                    if(creep.harvest(creep.pos.findClosestByPath(sources), RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                        creep.moveTo(creep.pos.findClosestByPath(sources), {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                }
                return;
            }
            creep.moveTo(Game.getObjectById(creep.memory.target), {
                visualizePathStyle: { stroke: '#ffaa00' },
                reusePath: 50,
            });
            return;
        }
    },
};

module.exports = roleRemoteClaimer;
