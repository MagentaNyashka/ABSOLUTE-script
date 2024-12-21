var roleCenter = {
    run: function(creep, Containers, dLinks, Extantions, Spawns, Towers, Nukers, Terminals, Storages) {
        const roomName = creep.room.name;
        //PRIORITY LIST:
        //EXT/SPAWN -> TOWERS -> NUKER -> STORAGE/TERMINAL
        console.log(global.getCachedStructures(roomName, STRUCTURE_EXTENSION));
        console.log(global.cache[roomName][STRUCTURE_EXTENSION]);
        if(creep.memory.transferring && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.transferring = false;
        }
        if(!creep.memory.transferring && creep.store.getFreeCapacity() == 0) {
            creep.memory.transferring = true;
        }

        if(creep.memory.transferring) {
            const extentions = Extantions.get(roomName).concat(Spawns.get(roomName)).filter(s => s.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
            if(extentions.length > 0){
                const target = creep.pos.findClosestByPath(extentions);
                if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, {visualizePathStyle: {stroke: '#800080'}, reusePath: 10});
                }
            }
            else{
                const towers = Towers.get(roomName).filter(s => s.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
                if(towers.length > 0){
                    const target = towers[0];
                    if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, {visualizePathStyle: {stroke: '#800080'}, reusePath: 10});
                    }
                }
                else{
                    const nukers = Nukers.get(roomName).filter(s => s.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
                    if(nukers.length > 0){
                        const target = nukers[0];
                        if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(target, {visualizePathStyle: {stroke: '#800080'}, reusePath: 10});
                        }
                    }
                    else{
                        const terminals = Terminals.get(roomName).filter(s => s.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
                        if(terminals.length > 0){
                            const target = terminals[0];
                            if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                                creep.moveTo(target, {visualizePathStyle: {stroke: '#800080'}, reusePath: 10});
                            }
                        }
                        else{
                            const storages = Storages.get(roomName).filter(s => s.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
                            if(storages.length > 0){
                                const target = storages[0];
                                if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                                    creep.moveTo(target, {visualizePathStyle: {stroke: '#800080'}, reusePath: 10});
                                }
                            }
                        }
                    }
                }
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
            const sources = Containers.get(roomName).filter(s => s.store[RESOURCE_ENERGY] > 0);
            let target = [];
            if(sources.length > 0){
                target = creep.pos.findClosestByRange(sources);
            }
            else{
                const links = dLinks.get(roomName);
                const closestLink = creep.pos.findClosestByRange(links);
                if(closestLink.store[RESOURCE_ENERGY] > 0){
                    target = creep.pos.findClosestByRange(links);
                }
                else{
                    const storages = Storages.get(roomName).filter(s => s.store[RESOURCE_ENERGY] > 0);
                    if(storages.length > 0){
                        target = storages[0];
                    }
                }
            }
            if(creep.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target, {visualizePathStyle: {stroke: '#800080'}, reusePath: 10});
            }
        }
    }
};

module.exports = roleCenter;