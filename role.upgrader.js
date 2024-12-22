var roleUpgrader = {
    run: function(creep) {
        const roomName = creep.room.name;

        const energyStructures = global.getDestLinks(roomName).concat(global.getCachedStructures(roomName, STRUCTURE_CONTAINER));
        const storage = Game.rooms[roomName].storage;

        if(creep.memory.transferring && creep.store[RESOURCE_ENERGY] == 0 && creep.ticksToLive > 50) {
            creep.memory.transferring = false;
            delete creep.memory.target;
        }
        if(!creep.memory.transferring && creep.store.getFreeCapacity() == 0) {
            creep.memory.transferring = true;
            delete creep.memory.target;
            creep.memory.target = creep.room.controller;
        }
        if(creep.memory.transferring && creep.room.controller.ticksToDowngrade <= 199990) {
            const status = creep.upgradeController(creep.room.controller);
            new RoomVisual(roomName).circle(creep.room.controller.pos, {fill: '#00ff00', opacity: 0.5, radius: 0.55});
            if(status === ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#00ffff'}});
            }
        }
        else if(!creep.memory.transferring && creep.store.getFreeCapacity() >= 0) {
            if(!creep.memory.target){
                if(storage && storage.store[RESOURCE_ENERGY] > 100000){
                    creep.memory.target = storage.id;
                }
                else{
                    const terminal = Game.rooms[roomName].terminal;
                    if(terminal && terminal.store[RESOURCE_ENERGY] > 50000){
                        creep.memory.target = terminal.id;
                    }
                    else{
                        if(energyStructures.length != 0){
                            creep.memory.target = creep.pos.findClosestByPath(energyStructures).id;
                        }
                        else{
                            creep.memory.target = creep.pos.findClosestByPath(global.getSources(roomName)).id;
                        }
                    }
                }
            }
            else{
                const targetStructure = Game.getObjectById(creep.memory.target);
                if(targetStructure){
                    new RoomVisual(roomName).circle(targetStructure.pos, {fill: '#ff0000', opacity: 0.5, radius: 0.55});
                    let status;
                    if(energyStructures.length != 0){
                        status = creep.withdraw(targetStructure, RESOURCE_ENERGY)
                    }
                    else{
                        status = creep.harvest(targetStructure);
                    }
                    if(status === ERR_NOT_IN_RANGE || status === ERR_NOT_ENOUGH_ENERGY){
                        creep.moveTo(targetStructure, {visualizePathStyle: {stroke: '#00ffff'}});
                    }
                    else{
                        delete creep.memory.target;
                    }
                }
                else{
                    delete creep.memory.target;
                }
            }
        }
    }
};

module.exports = roleUpgrader;