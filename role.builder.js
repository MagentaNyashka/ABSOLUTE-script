var roleBuilder = {

    /** @param {Creep} creep **/
    run: function(creep) {
        
        if(creep.memory.building && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.building = false;
        }
        if(!creep.memory.building && creep.store.getFreeCapacity() == 0) {
            creep.memory.building = true;
            if(creep.move(TOP) == 0){
                creep.move(TOP);
            }
            else if(creep.move(BOTTOM) == 0){
                creep.move(BOTTOM)
            }
            else if(creep.move(LEFT) == 0){
                creep.move(LEFT)
            }
            else if(creep.move(RIGHT) == 0){
                creep.move(RIGHT)
            }
        }
        if(creep.memory.building) {
            
            var closestTarget = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
            if(closestTarget == null){
                closestTarget = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
            }
            if(creep.build(closestTarget) == ERR_NOT_IN_RANGE) {
                creep.moveTo(closestTarget, {visualizePathStyle: {stroke: '#ffffff'}});
            }
            
        }
        /*
I don't even care about you
I don't know why
I don't even care about you
I don't know why
I don't even care about you

Depressed again
Morning comes too fast and I'm tired of the routine
Depressed again
Let me sit alone in the tone that you crave
Angry again
No, I don't wanna have a conversation with you
Angry again
Let me sit alone with the ker-ker-ker-kerosene

I don't even care about you
I don't know why
I don't even care about you
I don't know why
I don't even care about you

Depressed again
Evening comes too fast, still tired of the routine
Depressed again
I can do without your false curiosities
Angry again
No, I don't wanna have a conversation with you
Angry again
Let me sit alone with the ker-ker-ker-kerosene

I don't even care about you
I don't know why
I don't even care about you
I don't know why
I don't even care about you
I don't know why
I don't even care about you
I don't know why
I don't even care about you

I don't even care about you
I don't even care about you
I don't even care about you
I don't even care about you

Depressed again
Angry again
Let me sit alone with the ker-ker-ker-kerosene

I don't even care about you
I don't know why
I don't even care about you
I don't know why
I don't even care about you
I don't know why
I don't even care about you
I don't know why
I don't even care about you
*/
        else {
            var terminal = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return(structure.structureType == STRUCTURE_CONTAINER ||
                        structure.structureType == STRUCTURE_LINK ||
                        structure.structureType == STRUCTURE_TERMINAL) &&
                    structure.store[RESOURCE_ENERGY] > 0;
                }
            });
            var sources = creep.room.find(FIND_SOURCES);
            if(creep.withdraw(creep.pos.findClosestByPath(terminal), RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                creep.moveTo(creep.pos.findClosestByPath(terminal), {visualizePathStyle: {stroke: '#ffffff'}});
            }
            if(terminal.length == 0){
                if(creep.harvest(creep.pos.findClosestByPath(sources), RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                    creep.moveTo(creep.pos.findClosestByPath(sources), {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
        }
    }
};

module.exports = roleBuilder;