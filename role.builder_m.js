var roleBuilderM = {
    run: function(creep) {
        if(creep.memory.building && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.building = false;
        }
        if(!creep.memory.building && creep.store.getFreeCapacity() == 0) {
            creep.memory.building = true;
        }

        if(creep.memory.building) {
            anotherRoomName = 'E2N24';
            RoomName = '[room E2N24]';
            // Хуйня какая-то
            if(creep.room != RoomName) {
                const exitDir = Game.map.findExit(creep.room, anotherRoomName);
                const exit = creep.pos.findClosestByPath(exitDir);
                if(exitDir == 1 && creep.pos.x == 0){
                    creep.move(RIGHT);
                }
                if(exitDir == 1 && creep.pos.x == 49){
                    creep.move(LEFT);
                }
                if(exitDir == 1 && creep.pos.y == 49){
                    creep.move(TOP);
                }
                if(exitDir == 3 && creep.pos.x == 0){
                    creep.move(RIGHT);
                }
                if(exitDir == 3 && creep.pos.y == 0){
                    creep.move(BOTTOM);
                }
                if(exitDir == 3 && creep.pos.y == 49){
                    creep.move(TOP);
                }
                if(exitDir == 5 && creep.pos.x == 0){
                    creep.move(RIGHT);
                }
                if(exitDir == 5 && creep.pos.x == 49){
                    creep.move(LEFT);
                }
                if(exitDir == 5 && creep.pos.y == 0){
                    creep.move(BOTTOM);
                }
                if(exitDir == 7 && creep.pos.x == 49){
                    creep.move(LEFT);
                }
                if(exitDir == 7 && creep.pos.y == 0){
                    creep.move(BOTTOM);
                }
                if(exitDir == 7 && creep.pos.y == 49){
                    creep.move(TOP);
                }
                creep.moveTo(exit, {visualizePathStyle: {stroke: '#800080'}});

            }
            if(creep.room == RoomName){
                if(creep.pos.x == 0){
                    creep.move(RIGHT);
                    creep.move(RIGHT);
                }
                if(creep.pos.x == 49){
                    creep.move(LEFT);
                    creep.move(LEFT);
                }
                if(creep.pos.y == 0){
                    creep.move(BOTTOM);
                    creep.move(BOTTOM);
                }
                if(creep.pos.y == 49){
                    creep.move(TOP);
                    creep.move(TOP);
                }
                else{
                var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
                var closestTarget = creep.pos.findClosestByRange(targets);  
                if(creep.build(closestTarget) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(closestTarget, {visualizePathStyle: {stroke: '#ffffff'}});
                }
                }
            }
        }
        
        else {
            var sources = creep.room.find(FIND_SOURCES);
            if(sources.length > 1){
                if(creep.harvest(sources[1], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(sources[1], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
            else{
                if(creep.harvest(sources[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(sources[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
        }
        

    }
};
module.exports = roleBuilderM;