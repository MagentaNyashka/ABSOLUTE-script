var roleMiner = {
    run: function(creep) {
        const roomName = creep.room.name;
        if(creep.ticksToLive > 5){
            if(!creep.memory.target){
                const mineral = creep.room.find(FIND_MINERALS)[0];
                if(mineral){
                    creep.memory.target = mineral.id;
                }
            }
            const mCont = global.getMineralContainers(roomName);
            const targetObject = Game.getObjectById(creep.memory.target);
            let status;
            if(mCont[0].store.getFreeCapacity() > 100){
                status = creep.harvest(targetObject);
                if(status === OK){
                    return;
                }
                if(status === ERR_NOT_IN_RANGE || creep.pos !== mCont[0].pos){
                    creep.moveTo(mCont[0]);
                    return;
                }
            return;
            }
        }else{
            creep.move(TOP);
            return;
        }
    }
};
module.exports = roleMiner;