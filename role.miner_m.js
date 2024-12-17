const { min } = require("lodash");

var roleMinerM = {
    run: function(creep) {
        if(creep.memory.transferring && creep.store.getFreeCapacity() >= 300 && creep.ticksToLive > 650){
            creep.memory.transferring = false;
        }
        if(!creep.memory.transferring && creep.store.getFreeCapacity() == 0 || creep.store[RESOURCE_POWER] != 0){
            creep.memory.transferring = true;
        }
        if(creep.memory.transferring){
            var mainRoom = 'E27N39'
            var mainRoomName = '[room E27N39]'
            if(creep.room == mainRoomName){
                var targets = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return(
                            structure.structureType == STRUCTURE_STORAGE) &&
                            structure.store.getFreeCapacity() > 0;
                        }
                });
                var factories = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return(
                            structure.structureType == STRUCTURE_FACTORY) &&
                            structure.store[RESOURCE_MIST] <= 10000;
                        }
                });
                if(factories.length != 0){
                    var factory = creep.pos.findClosestByRange(factories);
                    if(creep.transfer(factory, RESOURCE_MIST) == ERR_NOT_IN_RANGE){
                        creep.moveTo(factory, {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                }
                else{
                    if(creep.transfer(targets, RESOURCE_MIST) == ERR_NOT_IN_RANGE){
                        creep.moveTo(targets, {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                }
            }
            else{
                const exitDir = Game.map.findExit(creep.room, mainRoom);
                const exit = creep.pos.findClosestByRange(exitDir);
                creep.moveTo(exit, {visualizePathStyle: {stroke: '#800080'}});
            }
        }
        else{
            //!!!!!
            const anotherRoomName = 'E26N40'
            const RoomName = '[room E26N40]'
            //!!!!!
            if(creep.room != RoomName) {
                const exitDir = Game.map.findExit(creep.room, anotherRoomName);
                const exit = creep.pos.findClosestByRange(exitDir);
                creep.moveTo(exit);
            }
            else{
                var deposits = creep.room.find(FIND_DEPOSITS);
                var dropped = creep.room.find(FIND_DROPPED_RESOURCES);
                var PB = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return(
                            structure.structureType == STRUCTURE_POWER_BANK);
                        }
                    });
                if(deposits != 0){
                    if(creep.harvest(deposits[0]) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(deposits[0], {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                }
                if(dropped != 0){
                    if(creep.pickup(dropped[0]) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(dropped[0], {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                    if(creep.withdraw(PB[0]) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(PB[0], {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                }
            }
        }
    }
};
module.exports = roleMinerM;