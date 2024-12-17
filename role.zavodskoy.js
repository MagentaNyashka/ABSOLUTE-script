var roleZavodskoy = {
    run: function(creep) {
        var factory = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (structure) => {
                return(structure.structureType == STRUCTURE_FACTORY);
            }
        });

/*
Late at night
I like to think about the things that I want
And what is life and who is real
Late at night
I like to visualize the girls that I've loved
And all they did to make me smile

On dreary days
I like to think about the joy that I had
As a young and reckless kid
On dreary days
I used to drown it out, a sociopath
'Cause I had nothing left to give

I'm losing, I'm losing, I'm losing my mind
I'm fighting, I'm fighting, I'm fighting for more time
I'm begging, I'm begging, I'm begging, no more rules
'Cause I'm losing, I'm losing, I'm losing my mind

When I drive
I like to think about the feelings I'll have
When I learn that I am dead
When I drive
I love to fantasize 'bout being a ghost
I'll float through death haunting you

I'm losing, I'm losing, I'm losing my mind
I'm fighting, I'm fighting, I'm fighting for more time
I'm begging, I'm begging, I'm begging, no more rules
'Cause I'm losing, I'm losing, I'm losing my mind

I'm losing, I'm losing, I'm losing my mind
I'm fighting, I'm fighting, I'm fighting for more time
I'm begging, I'm begging, I'm begging, no more rules
'Cause I'm losing, I'm losing, I'm losing my mind

I'm losing, I'm losing, I'm losing my mind
I'm losing, I'm losing, I'm losing my mind
*/
        if(creep.room == "[room E27N38]"){
            var factory = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return(
                        structure.structureType == STRUCTURE_FACTORY);
                    }
                });
            if(factory[0].store[RESOURCE_CATALYST] < 1000)
            {
                var resource = RESOURCE_CATALYST;
            }
            if(factory[0].store[RESOURCE_LEMERGIUM] < 1000)
            {
                var resource = RESOURCE_LEMERGIUM;
            }
            if(factory[0].store[RESOURCE_KEANIUM] < 1000)
            {
                var resource = RESOURCE_KEANIUM;
            }
        }
        if(creep.room == "[room E27N39]"){
            var lab_k = Game.getObjectById('62d1cc51db46af21be01b5d5');
            var lab_h = Game.getObjectById('62a7fe22d78d6e0577d2347c');
            var lab_res = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return(structure.structureType == STRUCTURE_LAB) &&
                    structure.store[RESOURCE_KEANIUM_HYDRIDE] >= 200;
                }
            });
            var terminal = Game.getObjectById('6272d43e398ef897c86ef60c');
            if(lab_k.store[RESOURCE_KEANIUM] < 1000 && creep.store[RESOURCE_HYDROGEN] == 0 && terminal.store[RESOURCE_KEANIUM] >= 200 || creep.store[RESOURCE_KEANIUM] != 0){
                var resource = RESOURCE_KEANIUM;
                var destination = lab_k;
                var sources = terminal;
                
            }
            if(lab_h.store[RESOURCE_HYDROGEN] < 1000 && creep.store[RESOURCE_KEANIUM] == 0 && terminal.store[RESOURCE_HYDROGEN] >= 200 || creep.store[RESOURCE_HYDROGEN] != 0){
                var resource = RESOURCE_HYDROGEN;
                var destination = lab_h;
                var sources = terminal;
            }
            if(lab_res != 0 && creep.store[RESOURCE_KEANIUM] == 0 && creep.store[RESOURCE_HYDROGEN] == 0 && terminal.store[RESOURCE_KEANIUM_HYDRIDE] < 1000 || creep.store[RESOURCE_KEANIUM_HYDRIDE] != 0){
                var resource = RESOURCE_KEANIUM_HYDRIDE;
                var destination = terminal;
                var sources = creep.pos.findClosestByPath(lab_res);
            }
        }
        if(creep.room == '[room E26N39]'){
            var lab_h = Game.getObjectById('641cd2a756dfce6112f4237a');
            var lab_o = Game.getObjectById('641d7adc2dcf14655f6b2809');
            if(Game.time % 10 == 0){
            var lab_res = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return(structure.structureType == STRUCTURE_LAB) &&
                    structure.store[RESOURCE_HYDROXIDE] >= 200;
                }
            });
            }
            var terminal = Game.getObjectById('62e282b837a2260784177d33');
            if(lab_o.store[RESOURCE_OXYGEN] < 1000 && creep.store[RESOURCE_HYDROGEN] == 0 && terminal.store[RESOURCE_OXYGEN] >= 200 || creep.store[RESOURCE_OXYGEN] != 0){
                var resource = RESOURCE_OXYGEN;
                var destination = lab_o;
                var sources = terminal;
            }
            if(lab_h.store[RESOURCE_HYDROGEN] < 1000 && creep.store[RESOURCE_OXYGEN] == 0 && terminal.store[RESOURCE_HYDROGEN] >= 200 || creep.store[RESOURCE_HYDROGEN] != 0){
                var resource = RESOURCE_HYDROGEN;
                var destination = lab_h;
                var sources = terminal;
            }
            if(lab_res != 0 && creep.store[RESOURCE_OXYGEN] == 0 && creep.store[RESOURCE_HYDROGEN] == 0 && terminal.store[RESOURCE_HYDROXIDE] < 1000 || creep.store[RESOURCE_HYDROXIDE] != 0){
                var resource = RESOURCE_HYDROXIDE;
                var destination = terminal;
                var sources = creep.pos.findClosestByPath(lab_res);
            }


        }
/*
        if(creep.room == '[room E26N38]'){
            var lab_k = Game.getObjectById('6422e159602ae525ea17ebe7');
            var lab_h1 = Game.getObjectById('642147dbb7b7fe7c18515eff');
            var lab_h2 = Game.getObjectById('641fad7475638362b64c582a');
            var lab_o = Game.getObjectById('641ce70713a8900987014b7e');
            var lab_x = Game.getObjectById('631765532c2e6a6720723bc5');
            var lab_res = Game.getObjectById('64181a463bc2246d6eb6d1de');
            var terminal = Game.getObjectById('6308109817f637321871100b');

            if(lab_k.store[RESOURCE_KEANIUM] < 2000 && creep.store[RESOURCE_HYDROGEN] == 0 && creep.store[RESOURCE_OXYGEN] == 0 && creep.store[RESOURCE_CATALYST] == 0 && terminal.store[RESOURCE_KEANIUM] >= 200 || creep.store[RESOURCE_KEANIUM] != 0){
                var resource = RESOURCE_KEANIUM;
                var destination = lab_k;
                var sources = terminal;
            }
            if(lab_o.store[RESOURCE_OXYGEN] < 2000 && creep.store[RESOURCE_HYDROGEN] == 0 && creep.store[RESOURCE_KEANIUM] == 0 && creep.store[RESOURCE_CATALYST] == 0 && terminal.store[RESOURCE_OXYGEN] >= 200 || creep.store[RESOURCE_OXYGEN] != 0){
                var resource = RESOURCE_OXYGEN;
                var destination = lab_o;
                var sources = terminal;
            }
            if(lab_h1.store[RESOURCE_HYDROGEN] < 2000 && creep.store[RESOURCE_KEANIUM] == 0 && creep.store[RESOURCE_OXYGEN] == 0 && creep.store[RESOURCE_CATALYST] == 0 && terminal.store[RESOURCE_HYDROGEN] >= 200 || creep.store[RESOURCE_HYDROGEN] != 0){
                var resource = RESOURCE_HYDROGEN;
                var destination = lab_h1;
                var sources = terminal;
            }
            if(lab_h2.store[RESOURCE_HYDROGEN] < 2000 && creep.store[RESOURCE_KEANIUM] == 0 && creep.store[RESOURCE_OXYGEN] == 0 && creep.store[RESOURCE_CATALYST] == 0 && terminal.store[RESOURCE_HYDROGEN] >= 200){
                var resource = RESOURCE_HYDROGEN;
                var destination = lab_h2;
                var sources = terminal;
            }
            if(lab_x.store[RESOURCE_CATALYST] < 2000 && creep.store[RESOURCE_KEANIUM] == 0 && creep.store[RESOURCE_OXYGEN] == 0 && creep.store[RESOURCE_HYDROGEN] == 0 && terminal.store[RESOURCE_CATALYST] >= 200 || creep.store[RESOURCE_CATALYST] != 0){
                var resource = RESOURCE_CATALYST;
                var destination = lab_x;
                var sources = terminal;
            }
            if(lab_res.store[RESOURCE_CATALYZED_KEANIUM_ACID] >= 200 && creep.store[RESOURCE_KEANIUM] == 0 && creep.store[RESOURCE_CATALYST] == 0 && creep.store[RESOURCE_OXYGEN] == 0 && creep.store[RESOURCE_HYDROGEN] == 0 || creep.store[RESOURCE_CATALYZED_KEANIUM_ACID] != 0){
                var resource = RESOURCE_CATALYZED_KEANIUM_ACID;
                var destination = terminal;
                var sources = lab_res;
            }


        }
*/
        if(creep.room == "[room E27N38]"){
            var lab_kh = Game.getObjectById('645d78b46ce943161f1b39f6');
            var lab_oh = Game.getObjectById('645f8328f942da500b4ed129');
            var lab_res = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return(structure.structureType == STRUCTURE_LAB) &&
                    structure.store[RESOURCE_KEANIUM_ACID] >= 200;
                }
            });
            var terminal = Game.getObjectById('630c3351fa0c7faa05724b05');
            if(lab_kh.store[RESOURCE_KEANIUM_HYDRIDE] < 1000 && creep.store[RESOURCE_HYDROXIDE] == 0 && terminal.store[RESOURCE_KEANIUM_HYDRIDE] >= 200 || creep.store[RESOURCE_KEANIUM_HYDRIDE] != 0){
                var resource = RESOURCE_KEANIUM_HYDRIDE;
                var destination = lab_kh;
                var sources = terminal;
                
            }
            if(lab_oh.store[RESOURCE_HYDROXIDE] < 1000 && creep.store[RESOURCE_KEANIUM_HYDRIDE] == 0 && terminal.store[RESOURCE_HYDROXIDE] >= 200 || creep.store[RESOURCE_HYDROXIDE] != 0){
                var resource = RESOURCE_HYDROXIDE;
                var destination = lab_oh;
                var sources = terminal;
            }
            if(lab_res != 0 && creep.store[RESOURCE_KEANIUM_HYDRIDE] == 0 && creep.store[RESOURCE_HYDROXIDE] == 0 && terminal.store[RESOURCE_KEANIUM_ACID] < 1000 || creep.store[RESOURCE_KEANIUM_ACID] != 0){
                var resource = RESOURCE_KEANIUM_ACID;
                var destination = terminal;
                var sources = creep.pos.findClosestByPath(lab_res);
            }

        }   
        if(creep.room == "[room E26N38]"){
            var lab_ka = Game.getObjectById('641b91e6b453ddb3b960179e');
            var lab_x = Game.getObjectById('641e377449935619e1658b08');
            var lab_res = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return(structure.structureType == STRUCTURE_LAB) &&
                    structure.store[RESOURCE_CATALYZED_KEANIUM_ACID] >= 200;
                }
            });
            var terminal = Game.getObjectById('6308109817f637321871100b');
            if(lab_ka.store[RESOURCE_KEANIUM_ACID] < 1000 && creep.store[RESOURCE_CATALYST] == 0 && terminal.store[RESOURCE_KEANIUM_ACID] >= 200 || creep.store[RESOURCE_KEANIUM_ACID] != 0){
                var resource = RESOURCE_KEANIUM_ACID;
                var destination = lab_ka;
                var sources = terminal;
                
            }
            if(lab_x.store[RESOURCE_CATALYST] < 1000 && creep.store[RESOURCE_KEANIUM_ACID] == 0 && terminal.store[RESOURCE_CATALYST] >= 200 || creep.store[RESOURCE_CATALYST] != 0){
                var resource = RESOURCE_CATALYST;
                var destination = lab_x;
                var sources = terminal;
            }
            if(lab_res != 0 && creep.store[RESOURCE_KEANIUM_ACID] == 0 && creep.store[RESOURCE_CATALYST] == 0 && terminal.store[RESOURCE_CATALYZED_KEANIUM_ACID] < 10000 || creep.store[RESOURCE_CATALYZED_KEANIUM_ACID] != 0){
                var resource = RESOURCE_CATALYZED_KEANIUM_ACID;
                var destination = terminal;
                var sources = creep.pos.findClosestByPath(lab_res);
            }
        }
        if(creep.memory.transferring && creep.store[resource] == 0) {
            creep.memory.transferring = false;
        }
        if(!creep.memory.transferring && creep.store[resource] != 0) {
            creep.memory.transferring = true;
        }
        if(creep.memory.transferring){
            if(creep.transfer(destination, resource) == ERR_NOT_IN_RANGE) {
                creep.moveTo(destination, {visualizePathStyle: {stroke: '#46ff33'}});
            }
        }
        else{
                if(creep.withdraw(sources, resource) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(sources, {visualizePathStyle: {stroke: '#46ff33'}});
                }
        }
    }
};
module.exports = roleZavodskoy;