var roleUpgrader = {
    run: function(creep, Sources, Links, Containers, Terminals) {
        const roomName = creep.room.name;

        const energyStructures = Links.get(roomName).concat(Containers.get(roomName));

        if(creep.memory.transferring && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.transferring = false;
        }
        if(!creep.memory.transferring && creep.store.getFreeCapacity() == 0) {
            creep.memory.transferring = true;

        }
        if(creep.memory.transferring && creep.room.controller.ticksToDowngrade <= 199990) {
            BRUH();
            if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#00ffff'}});
            }
            
        }
        else if(!creep.memory.transferring && creep.store.getFreeCapacity() >= 0) {
            if(energyStructures.length != 0){
                const source = creep.pos.findClosestByPath(energyStructures);
                if(creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, {visualizePathStyle: {stroke: '#00ffff'}});
                }
            }
            else{
                var sources = creep.pos.findClosestByPath(Sources.get(creep.room.name));
                if(creep.harvest(sources) == ERR_NOT_IN_RANGE || creep.harvest(sources) == ERR_NOT_ENOUGH_ENERGY) {
                    creep.moveTo(sources, {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
        }
    }
};

module.exports = roleUpgrader;