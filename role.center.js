var roleCenter = {
    run: function(creep) {
        const roomName = creep.room.name;
        // if(creep.memory.target && Game.time % 5 === 0){
        //     if(Game.getObjectById(creep.memory.target).structureType === STRUCTURE_CONTAINER){
        //         delete creep.memory.target;
        //     }
        // }
        //PRIORITY LIST:
        //EXT/SPAWN -> TOWERS -> NUKER -> TERMINAL -> STORAGE
        if(creep.memory.transferring && creep.store[RESOURCE_ENERGY] == 0 && creep.ticksToLive > 5) {
            creep.memory.transferring = false;
            delete creep.memory.target;
        }
        // if(!creep.memory.transferring && creep.store.getFreeCapacity() == 0) {
        if(!creep.memory.transferring && creep.store[RESOURCE_ENERGY] > 0) {
            creep.memory.transferring = true;
            delete creep.memory.target;
        }
        if(creep.memory.transferring) {
            if (!creep.memory.target) {
                const extentions = global.getCachedStructures(roomName, STRUCTURE_EXTENSION).concat(global.getCachedStructures(roomName,STRUCTURE_SPAWN)).filter(s => s.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
                if(extentions.length > 0){
                    const target = creep.pos.findClosestByPath(extentions);
                    if(target){
                        creep.memory.target = target.id;
                    }
                    else{
                        creep.memory.target = creep.pos.findClosestByRange(extentions).id;
                    }
                }
                else{
                    const towers = global.getCachedStructures(roomName, STRUCTURE_TOWER).filter(s => s.store.getFreeCapacity(RESOURCE_ENERGY) > 100);
                    if(towers.length > 0){
                        creep.memory.target = towers[0].id;
                    }
                    else{
                        const cont_containers = global.getControllerContainers(roomName).filter(s => s.store.getFreeCapacity(RESOURCE_ENERGY) > 400);
                        if(cont_containers.length > 0){
                            // cont_containers.sort(function(a, b){return a.store.getFreeCapacity(RESOURCE_ENERGY) - b.store.getFreeCapacity(RESOURCE_ENERGY)});
                            creep.memory.target = cont_containers[0].id;
                        }
                        else{
                            const nukers = global.getCachedStructures(roomName, STRUCTURE_NUKER).filter(s => s.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
                            if(nukers.length > 0){
                                creep.memory.target = nukers[0].id;
                            }else{
                                const terminals = Game.rooms[roomName].terminal;
                                if(terminals && terminals.store[RESOURCE_ENERGY] < 150000){
                                    creep.memory.target = terminals.id;
                                }
                                else{
                                    const storages = Game.rooms[roomName].storage;
                                    if(storages && storages.store[RESOURCE_ENERGY] < 500000){
                                        creep.memory.target = storages.id;
                                    }else{
                                        const bLabs = global.getBoostLabs(roomName).filter(l => l.store[RESOURCE_ENERGY] < l.store.getFreeCapacity(RESOURCE_ENERGY));
                                        if(bLabs.length > 0){
                                            creep.memory.target = bLabs[0].id;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            const targetStructure = Game.getObjectById(creep.memory.target);
            if (targetStructure) {
                new RoomVisual(roomName).circle(targetStructure.pos, {fill: 'transparent',stroke: '#00ff00', strokeWidth: 0.03, opacity: 1, radius: 0.55});
                const status = creep.transfer(targetStructure, RESOURCE_ENERGY);
                // creep.say(targetStructure.store.getFreeCapacity(RESOURCE_ENERGY));
                if(status === OK || targetStructure.store.getFreeCapacity(RESOURCE_ENERGY) === 0){
                    delete creep.memory.target;
                    return;
                }
                if(status === ERR_NOT_IN_RANGE) {
                    creep.moveTo(targetStructure, { visualizePathStyle: { stroke: '#ffffff' } });
                    return;
                } else {
                    delete creep.memory.target;
                }
            } else {
                delete creep.memory.target;
            }          
            /*
Why does everything end up like this
I swear I knew it would end
I’m getting used to it, I know you’d come back and quit
I know you’re with him not me, get away

Why does everyone hate me right now
I swear it’s like I just found out
What did I expect this time I will pretend that I’m fine
Cus I don’t want you hearing about me

I guess you really didn’t think i'd find out
I know you’re using me right now
Say I’m just like him but I’m second best
Yeah, if you had him I know you’d leave me like thе rest

It’s your fake heart, yеah its fake love
Say you wanna come back and make things up to me
But I don’t want that, I don’t want that
Leave me alone i'll be fine

Sick to death of watching the best of me get eaten alive
I still see your heart on your shoulder when you look at my eyes
Why can’t you let me go
I don’t feel it, it’s over

Kiss me on the cheek, close my eyes yeah i'll step away
Biting on my lips, I know if I don’t leave I will decay
Don’t look down look at me
I’m doing alright so just leave
You might also like
BAD DAYS
Rivilin
WHERE IS MY MIND (Mash-Up)
Rivilin
wacced out murals
Kendrick Lamar
Why does everything end up like this
I swear I knew it would end
I’m getting used to it, I know you’d come back and quit
I know you’re with him not me, get away

Why does everyone hate me right now
I swear it’s like I just found out
What did I expect this time I will pretend that I’m fine
Cus I don’t want you hearing about me

Lying on the floor I see you cover your eyes
The sun is just too bright
You talking to him and you get into his car
Leave me here stranded on the road, where did I go wrong no

Don’t recognize the face in front of me
Yeah the mirror doesn’t seem to give images I wanna see
So I shut down and shut out everyone
Learn to be alone but it wasn’t fun

Forgive and forget half-alive here at best
My memories are getting hazy so please just
Understand that I need to take a break
Between us it wasn’t about you and me I knew you always were fake

Kiss me on the cheek, close my eyes yeah i'll step away
Biting on my lips, I know if I don’t leave I will decay
Don’t look down look at me
I’m doing alright so just leave

Why does everything end up like this
I swear I knew it would end
I’m getting used to it, I know you’d come back and quit
I know you’re with him not me, getaway

Why does everyone hate me right now
I swear it’s like I just found out
What did I expect this time I will pretend that I’m fine
Cus I don’t want you hearing about me

Why does everything end up like this
I swear I knew it would end
I’m getting used to it, I know you’d come back and quit
I know you’re with him not me, getaway

Why does everyone hate me right now
I swear it’s like I just found out
What did I expect this time I will pretend that I’m fine
Cus I don’t want you hearing about me
            */
        }
        else {
            if(!creep.memory.target){
                const links = global.getDestLinks(roomName);
                const containers = global.getSourceContainers(roomName);
                const energyStructures = links.concat(containers).filter(s => s.store[RESOURCE_ENERGY] > 0);
                energyStructures.sort((a, b) => b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY]);
                if(energyStructures.length > 0){
                    creep.memory.target = energyStructures[0].id;
                }
                else{
                    const storages = Game.rooms[roomName].storage;
                    if(storages && storages.store[RESOURCE_ENERGY] > 0){
                        creep.memory.target = storages.id;
                    }
                    else{
                        const terminal = Game.rooms[roomName].terminal;
                        if(terminal && terminal.store[RESOURCE_ENERGY] > 0){
                            creep.memory.target = terminal.id;
                        }
                    }
                }
            }
            const targetStructure = Game.getObjectById(creep.memory.target);
            if (targetStructure) {
                new RoomVisual(roomName).circle(targetStructure.pos, {fill: 'transparent',stroke: '#ff0000', strokeWidth: 0.03, opacity: 1, radius: 0.55});
                const status = creep.withdraw(targetStructure, RESOURCE_ENERGY);
                if(status === OK){
                    delete creep.memory.target;
                    return;
                }
                if(status === ERR_NOT_IN_RANGE) {
                    creep.moveTo(targetStructure, { visualizePathStyle: { stroke: '#ffffff' } });
                    return;
                } else {
                    delete creep.memory.target;
                }
            } else {
                delete creep.memory.target;
            }
        }
    }
};

module.exports = roleCenter;