var roleClaimer = {
    run: function(creep) {
        anotherRoomName = 'E2N24';
        RoomName = '[room E2N24]'
        console.log(creep.room);
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
            console.log(exitDir);
        }
        if(creep.room == RoomName){
            if(creep.pos.x == 0){
                creep.move(RIGHT);
            }
            if(creep.pos.x == 49){
                creep.move(LEFT);
            }
            if(creep.pos.y == 0){
                creep.move(BOTTOM);
            }
            if(creep.pos.y == 49){
                creep.move(TOP);
            }
            if(creep.room.controller) {
                if(creep.claimController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#00ffff'}});
                }
                if(creep.claimController(creep.room.controller) != ERR_NOT_IN_RANGE){
                    Game.rooms[creep.room.name].createConstructionSite(creep.pos.x, creep.pos.y, STRUCTURE_SPAWN, 'Spawn_' + RoomName);
                    creep.suicide();
                }
            }
        }

    }
};
module.exports = roleClaimer;