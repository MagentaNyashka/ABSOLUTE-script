var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader'); 
var roleBuilder = require('role.builder');
var roleMiner = require('role.miner');
var roleCenter = require('role.center');
var roleHarvesterUpgr = require('role.harvester_upgr');
var roleClaimer = require('role.claimer');
var roleBuilderM = require('role.builder_m');
var roleMinerM = require('role.miner_m');
var roleAttackerM = require('role.attacker_m');
var roleHealerM = require('role.healer_m');
var roleTransfer = require('role.transfer');
var roleZavodskoy = require('role.zavodskoy');
const { lastIndexOf } = require('lodash');

var price_old = -100;
var price_old_x = -100;
var price_old_e = -100;

//CACHE
var my_spawns = [];
Spawns = new Map();
Terminals = new Map();
Towers = new Map();
Extantions = new Map();
Power_Spawns = new Map();
Enemies = new Map();
DamagedStructures = new Map();
DamagedWalls = new Map();
Sources = new Map();


Harvesters = new Map();
ReserveHarvesters = new Map();
Upgraders = new Map();
Builders = new Map();
Transfers = new Map();
Centers = new Map();
HarvesterUpgr = new Map();



/*
function CACHE(){
    //spawns
    _.forEach(Game.rooms, function(room){
        var spawn = room.find(FIND_MY_SPAWNS)[0];
        if(spawn != undefined){
            my_spawns.push(spawn);
        }
    });
    _.forEach(my_spawns, function(room_spawn){
        var spawns = room_spawn.room.find(FIND_MY_SPAWNS);
        Spawns.set(room_spawn.room.name, spawns);
        var terminal = room_spawn.room.find(FIND_STRUCTURES, {
            filter: {structureType: STRUCTURE_TERMINAL}
        });
        Terminals.set(room_spawn.room.name, terminal);

        var towers = room_spawn.room.find(FIND_MY_STRUCTURES, {
            filter: {structureType: STRUCTURE_TOWER}
        });
        Towers.set(room_spawn.room.name, towers);
        TowerCACHE(room_spawn);

        var extantions = room_spawn.room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => {
                return(structure.structureType == STRUCTURE_EXTENSION) &&
                structure.isActive();
            }
        });
        Extantions.set(room_spawn.room.name, extantions);

        var power_spawns = room_spawn.room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => {
                return(structure.structureType == STRUCTURE_POWER_SPAWN) &&
                structure.isActive();
            }});
        Power_Spawns.set(room_spawn.room.name, power_spawns);
        
        var sources = room_spawn.room.find(FIND_SOURCES);
        Sources.set(room_spawn.room.name, sources);
    
        var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role === 'harvester' && creep.room.name === room_spawn.room.name);
        var reserve_harvesters = _.filter(Game.creeps, (creep) => creep.memory.role === 'harvester' && creep.room.name == room_spawn.room.name && creep.body[0].type == WORK && creep.body[1].type == CARRY && creep.body[2].type == MOVE);
        var upgraders = _.filter(Game.creeps, (creep) => creep.memory.role === 'upgrader' && creep.room.name === room_spawn.room.name);
        var builders = _.filter(Game.creeps, (creep) => creep.memory.role === 'builder' && creep.room.name === room_spawn.room.name);
        var transfers = _.filter(Game.creeps, (creep) => creep.memory.role === 'transfer' && creep.room.name === room_spawn.room.name);
        var centers = _.filter(Game.creeps, (creep) => creep.memory.role === 'center' && creep.room.name === room_spawn.room.name);
        var harvester_upgr = _.filter(Game.creeps, (creep) => creep.memory.role === 'harvester_upgr' && creep.room.name === room_spawn.room.name);

        Harvesters.set(room_spawn.room.name, harvesters);
        ReserveHarvesters.set(room_spawn.room.name, reserve_harvesters);
        Upgraders.set(room_spawn.room.name, upgraders);
        Builders.set(room_spawn.room.name, builders);
        Transfers.set(room_spawn.room.name, transfers);
        Centers.set(room_spawn.room.name, centers);
        HarvesterUpgr.set(room_spawn.room.name, harvester_upgr);


    });
    }
*/

function trackAverageCPU() {
    const currentUsed = Game.cpu.getUsed();

    if (!Memory.cpuStats) {
        Memory.cpuStats = { total: 0, ticks: 0, average: 0 };
    }

    // Update total CPU used and tick count
    Memory.cpuStats.total += currentUsed;
    Memory.cpuStats.ticks += 1;

    // Calculate average CPU usage
    Memory.cpuStats.average = Memory.cpuStats.total / Memory.cpuStats.ticks;

    // Return the current and average CPU usage for display
    return `${Memory.cpuStats.average.toFixed(2)}`;
}

function CACHE_SPAWN(){
    _.forEach(Game.rooms, function(room){
        var spawn = room.find(FIND_MY_SPAWNS)[0];
        if(spawn != undefined){
            my_spawns.push(spawn);
        }
    });
}

function CACHE(){
    _.forEach(my_spawns, function(room_spawn){
        const objects = room_spawn.room.find(FIND_STRUCTURES);
        const grouped = _.groupBy(objects, s => s.structureType);

        Spawns.set(room_spawn.room.name, grouped[STRUCTURE_SPAWN] || []);
        Terminals.set(room_spawn.room.name, grouped[STRUCTURE_TERMINAL] || []);
        Towers.set(room_spawn.room.name, grouped[STRUCTURE_TOWER] || []);
        Extantions.set(room_spawn.room.name, grouped[STRUCTURE_EXTENSION] || []);
        Power_Spawns.set(room_spawn.room.name, grouped[STRUCTURE_POWER_SPAWN] || []);
        Sources.set(room_spawn.room.name, room_spawn.room.find(FIND_SOURCES) || []);

        /*
        var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role === 'harvester' && creep.room.name === room_spawn.room.name);
        var reserve_harvesters = _.filter(Game.creeps, (creep) => creep.memory.role === 'harvester' && creep.room.name == room_spawn.room.name && creep.body[0].type == WORK && creep.body[1].type == CARRY && creep.body[2].type == MOVE);
        var upgraders = _.filter(Game.creeps, (creep) => creep.memory.role === 'upgrader' && creep.room.name === room_spawn.room.name);
        var builders = _.filter(Game.creeps, (creep) => creep.memory.role === 'builder' && creep.room.name === room_spawn.room.name);
        var transfers = _.filter(Game.creeps, (creep) => creep.memory.role === 'transfer' && creep.room.name === room_spawn.room.name);
        var centers = _.filter(Game.creeps, (creep) => creep.memory.role === 'center' && creep.room.name === room_spawn.room.name);
        var harvester_upgr = _.filter(Game.creeps, (creep) => creep.memory.role === 'harvester_upgr' && creep.room.name === room_spawn.room.name);

        Harvesters.set(room_spawn.room.name, harvesters);
        ReserveHarvesters.set(room_spawn.room.name, reserve_harvesters);
        Upgraders.set(room_spawn.room.name, upgraders);
        Builders.set(room_spawn.room.name, builders);
        Transfers.set(room_spawn.room.name, transfers);
        Centers.set(room_spawn.room.name, centers);
        HarvesterUpgr.set(room_spawn.room.name, harvester_upgr);
        */
    });
}

function CACHE_CREEPS(room_spawn) {
    //const creepsByRoom = room_spawn.room.find(FIND_MY_CREEPS);
    const creepsByRoom = Object.values(Game.creeps).filter(creep => creep.room.name === room_spawn.room.name);

    const byRole = _.groupBy(creepsByRoom, creep => creep.memory.role);

    const harvesters = byRole['harvester'] || [];
    const upgraders = byRole['upgrader'] || [];
    const builders = byRole['builder'] || [];
    const transfers = byRole['transfer'] || [];
    const centers = byRole['center'] || [];
    const harvester_upgr = byRole['harvester_upgr'] || [];

    const reserve_harvesters = harvesters.filter(creep => 
        creep.body.length > 2 &&
        creep.body[0].type === WORK &&
        creep.body[1].type === CARRY &&
        creep.body[2].type === MOVE
    );    

    Harvesters.set(room_spawn.room.name, harvesters);
    ReserveHarvesters.set(room_spawn.room.name, reserve_harvesters);
    Upgraders.set(room_spawn.room.name, upgraders);
    Builders.set(room_spawn.room.name, builders);
    Transfers.set(room_spawn.room.name, transfers);
    Centers.set(room_spawn.room.name, centers);
    HarvesterUpgr.set(room_spawn.room.name, harvester_upgr);
}


function TowerCACHE(room_spawn){
    var hostiles = room_spawn.room.find(FIND_HOSTILE_CREEPS);
    Enemies.set(room_spawn.room.name, hostiles);

    var damagedStructures = room_spawn.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                return (
                    structure.structureType != STRUCTURE_WALL &&
                    structure.structureType != STRUCTURE_RAMPART &&
                    structure.hits < structure.hitsMax);
                }
            });
    var amagedWalls = room_spawn.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                return(structure.hits < structure.hitsMax) &&
                    structure.hits < 1000000;
                }
            });
    DamagedStructures.set(room_spawn.room.name, damagedStructures);
    DamagedWalls.set(room_spawn.room.name, damagedStructures);
}

function render_room(room_spawn, maxHarvesters, maxUpgraders, maxBuilders, maxHarvestersUpgr, maxTransferers, maxCenters){
    new RoomVisual(room_spawn.room.name)
            //.text('Time ' + Game.time, 36, 0.2, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})#F5DEB3
            //.text('Cpu ' + Game.cpu.getUsed().toFixed(2), 36, 0.8, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
            //.text('Cpu.Limit ' + Game.cpu.limit, 36, 1.4, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
            //.text('Bucket ' + Game.cpu.bucket + '/10000(' + (10000 - Game.cpu.bucket) + ')', 36, 2, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
            .text('Sources ' + room_spawn.room.find(FIND_SOURCES).length, 36, 3.2, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
            .text('Extentions ' + Extantions.get(room_spawn.room.name).length, 36, 3.8, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
            //.text('Creeps: ', 36, 3.2, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
            .text('Harvesters ' + Harvesters.get(room_spawn.room.name).length + '(' + ReserveHarvesters.get(room_spawn.room.name).length + ')' + '/' + maxHarvesters + '+' + HarvesterUpgr.get(room_spawn.room.name).length + "/" + maxHarvestersUpgr, 36, 4.4, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
            .text('Upgraders ' + Upgraders.get(room_spawn.room.name).length + '/' + maxUpgraders, 36, 5, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
            .text('Centers ' + Centers.get(room_spawn.room.name).length + '/' + maxCenters, 36, 5.6, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
            .text('Builders ' + Builders.get(room_spawn.room.name).length + '/' + maxBuilders, 36, 6.2, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
            .text('Transferers ' + Transfers.get(room_spawn.room.name).length + '/' + maxTransferers, 36, 6.8, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
            //.text('Creeps: ', 36, 2.6, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
            // .text('Creeps: ', 36, 2.6, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
            // .text('Creeps: ', 36, 2.6, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
            // .text('Creeps: ', 36, 2.6, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
            // .text('Creeps: ', 36, 2.6, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
            // .text('Creeps: ', 36, 2.6, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
            // .text('Creeps: ', 36, 2.6, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
            ;
}

function render(){
    const roomCount = Object.values(Game.rooms).filter(room => room.controller && room.controller.my).length;
    const limit = Game.cpu.limit;
    const avgCpu = trackAverageCPU();
    new RoomVisual()
    //.rect(50, -1, -15, 10, {fill:'#000000',opacity: 0.7,stroke: '#ffffff'})
    .text('Time ' + Game.time, 36, 0.2, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
    .text('Cpu ' + Game.cpu.getUsed().toFixed(2), 36, 0.8, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
    .text('Cpu/Room ' + (Game.cpu.getUsed()/roomCount).toFixed(2), 41.4, 0.8, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
    .text('Cpu.Avg ' + avgCpu + "(" + (avgCpu/limit*100).toFixed(2) + "%)", 36, 1.4, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
    .text('Cpu.Avg/Room ' + (avgCpu/roomCount).toFixed(2) + "(" + (avgCpu/limit*100).toFixed(2) + "%)", 41.4, 1.4, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
    .text('Cpu.Limit ' + limit, 36, 2, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
    .text('Bucket ' + Game.cpu.bucket + '/10000(' + (10000 - Game.cpu.bucket) + ')', 36, 2.6, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
    ;
}

CACHE_SPAWN();
CACHE();
// var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role === 'harvester' && creep.room.name === room_spawn.room.name);
//         var reserve_harvesters = _.filter(Game.creeps, (creep) => creep.memory.role === 'harvester' && creep.room.name == room_spawn.room.name && creep.body[0].type == WORK && creep.body[1].type == CARRY && creep.body[2].type == MOVE);
//         var upgraders = _.filter(Game.creeps, (creep) => creep.memory.role === 'upgrader' && creep.room.name === room_spawn.room.name);
//         var builders = _.filter(Game.creeps, (creep) => creep.memory.role === 'builder' && creep.room.name === room_spawn.room.name);
//         var transfers = _.filter(Game.creeps, (creep) => creep.memory.role === 'transfer' && creep.room.name === room_spawn.room.name);
//         var centers = _.filter(Game.creeps, (creep) => creep.memory.role === 'center' && creep.room.name === room_spawn.room.name);
//         var harvester_upgr = _.filter(Game.creeps, (creep) => creep.memory.role === 'harvester_upgr' && creep.room.name === room_spawn.room.name);

//         Harvesters.set(room_spawn.room.name, harvesters);
//         ReserveHarvesters.set(room_spawn.room.name, reserve_harvesters);
//         Upgraders.set(room_spawn.room.name, upgraders);
//         Builders.set(room_spawn.room.name, builders);
//         Transfers.set(room_spawn.room.name, transfers);
//         Centers.set(room_spawn.room.name, centers);
//         HarvesterUpgr.set(room_spawn.room.name, harvester_upgr);

module.exports.loop = function() {
    //Game.cpu.generatePixel();
    
    
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
        }
    }
    

    //var my_spawns = ['Spawn1', 'Spawn3'];
    /*
    _.forEach(Game.spawns, function(spawn){
        console.log("Spawns: ", spawn);
    });*/



    //var my_spawns = [];
    //_.forEach(Game.rooms, function(room){my_spawns.push(room.find(FIND_MY_SPAWNS)[0]);});
    // var my_terminals = [];

    // try{
        if(Game.time % 1000 == 0){
            CACHE_SPAWN();
        }
    _.forEach(my_spawns, function(room_spawn){
        CACHE();
        TowerCACHE(room_spawn);
        /*
        if(Game.time % 10 == 0){
            CACHE_CREEPS(room_spawn);
        }
        */
        //terminals
        // var terminal = room_spawn.room.find(FIND_STRUCTURES, {
            // filter: {structureType: STRUCTURE_TERMINAL}
        // });
        // my_terminals.push(terminal);
        // console.log(Terminals.get(room_spawn.room.name));
        // console.log(Towers.get(room_spawn.room.name));







        //towers
        try{
        
        _.forEach(Towers.get(room_spawn.room.name), function(tower){
            if(DamagedStructures.get(room_spawn.room.name).length > 0){
            var closestDamagedStructure = tower.pos.findClosestByRange(DamagedStructures.get(room_spawn.room.name));
            var closestDamagedWall = tower.pos.findClosestByRange(DamagedWalls.get(room_spawn.room.name));
            if(closestDamagedStructure || closestDamagedWall) {
                if(tower.store[RESOURCE_ENERGY] > 0){
                    tower.repair(closestDamagedStructure);
                    if(!closestDamagedStructure && tower.store[RESOURCE_ENERGY] > 200){
                        tower.repair(closestDamagedWall);
                    }
                }
            }
        }
        if(Enemies.get(room_spawn.room.name).length > 0) {
        var closestHostile = tower.pos.findClosestByRange(Enemies.get(room_spawn.room.name));
            tower.attack(closestHostile);
        }
        });
        } catch(e){
            console.log("Tower error");
            console.log(e);
            TowerCACHE(room_spawn);
        }

        //extantions
        {
        
        }
        
        //pizdec
        {
        var sources = room_spawn.room.find(FIND_SOURCES);
        var constr_sites = room_spawn.room.find(FIND_CONSTRUCTION_SITES);
        var links = room_spawn.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return(structure.structureType == STRUCTURE_LINK) &&
                    structure.isActive();
            }
        });
        var source_links = [];
        var destination_links = [];

        //БЛЯТЬ КАК ЭТУ ХУЙНЮ ОПТИМИЗИРОВАТЬ Я ЕБАЛ Я ЖЕ ТУТ УМРУ НАХУЙ ЧТО ЭТО ЗА ПИЗДЕЦ
        //Я ГОТОВ ПРИЗНАТЬ ЧТО БОГ СУЩЕСТВУЕТ, ТОЛЬКО ДАЙТЕ МНЕ ОПТИМИЗАЦИЮ
        _.forEach(links, function(link) {
            var closest_source = link.pos.findClosestByRange(sources);
            if (link.pos.getRangeTo(closest_source) < 3) {
                source_links.push(link);
            } else {
                destination_links.push(link);
            }
        });
        }
        //console.log(links);
        // console.log("S" + source_links);
        // console.log("D" + destination_links);

        _.forEach(source_links, function(link){
            if(destination_links.length > 0){
                _.forEach(destination_links, function(d_link){
                    if(d_link.store.getFreeCapacity(RESOURCE_ENERGY) > 100){
                        link.transferEnergy(d_link);
                    }
                });
            }
        });

        //console.log(source_links);
        //console.log(destination_links);

        //power_spawn
        var power_spawn = room_spawn.room.find(FIND_MY_STRUCTURES, {filter: (structure) => {return(structure.structureType == STRUCTURE_POWER_SPAWN) && structure.isActive() && structure.store[RESOURCE_POWER] > 0 && structure.store[RESOURCE_ENERGY] >= 50;}});
        if(power_spawn.length > 0){
            power_spawn[0].processPower();
        }

        //АРИЭЛЬ ЁПТА
        {
        var room_level = "L0";
        var Harvester_BP = [WORK,CARRY,MOVE];
        var maxHarvesters = 1;
        var Ugrader_BP = [WORK,CARRY,MOVE];
        var maxUpgraders = 1;
        var Builder_BP = [WORK,CARRY,CARRY,MOVE];
        var maxBuilders = 1;
        var maxCenters = 0;
        var CenterBP = [WORK,WORK,CARRY,MOVE];
        var maxHarvestersUpgr = 1;
        var HarvesterUpgr_BP = [WORK,WORK,CARRY,MOVE];
        var maxTransferers = 0;
        var Trasnferer_BP = [CARRY,CARRY,MOVE,MOVE];
        var maxZavodskoy = 0;
        var Zavodskoy_BP = [CARRY,CARRY,MOVE,MOVE];
        var maxMiners = 0;
        var Miner_BP = [WORK,WORK,CARRY,MOVE];
        var maxClaimers = 0;
        var Claimer_BP = [CLAIM, MOVE];
        var maxBuildersM = 0;
        var Builder_M_BP = [WORK,CARRY,MOVE];
        }

        if(Extantions.get(room_spawn.room.name).length < 5){
            var room_level = "L1";
            var Harvester_BP = [WORK,WORK,CARRY,MOVE];
            var maxHarvesters = 3;
            var Ugrader_BP = [WORK,WORK,CARRY,MOVE];
            var maxUpgraders = 3;
            var Builder_BP = [WORK,CARRY,CARRY,MOVE];
            var maxBuilders = 3;
            var maxCenters = 0;
            var CenterBP = [CARRY,MOVE,CARRY,MOVE,CARRY,MOVE];
            var maxHarvestersUpgr = 3;
            var HarvesterUpgr_BP = [WORK,WORK,CARRY,MOVE];
            var maxTransferers = 0;
            var Trasnferer_BP = [CARRY,CARRY,MOVE,MOVE];
            // var maxZavodskoy = 0;
            // var Zavodskoy_BP = [CARRY,CARRY,MOVE,MOVE];
            // var maxMiners = 0;
            // var Miner_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE];
            var maxClaimers = 0;
            var Claimer_BP = [CLAIM, MOVE];
            var maxBuildersM = 0;
            var Builder_M_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
        }
        if(Extantions.get(room_spawn.room.name).length < 10 && Extantions.get(room_spawn.room.name).length >= 5){
            var room_level = "L2";
            var Harvester_BP = [WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE];
            var maxHarvesters = 1;
            var Ugrader_BP = [WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE];
            var maxUpgraders = 1;
            var maxBuilders = 2;
            var Builder_BP = [WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE];
            var maxCenters = 0;
            var CenterBP = [CARRY, MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE];
            var maxHarvestersUpgr = 1;
            var HarvesterUpgr_BP = [WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE];
            var maxTransferers = 0;
            var Trasnferer_BP = [CARRY,CARRY,MOVE,MOVE];
            // var maxZavodskoy = 0;
            // var Zavodskoy_BP = [CARRY,CARRY,MOVE,MOVE];
            // var maxMiners = 0;
            // var Miner_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE];
            var maxClaimers = 0;
            var Claimer_BP = [CLAIM, MOVE];
            var maxBuildersM = 0;
            var Builder_M_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
        }
        if(Extantions.get(room_spawn.room.name).length < 20 && Extantions.get(room_spawn.room.name).length >= 10){
            var room_level = "L3";
            var Harvester_BP = [WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE];
            var maxHarvesters = 2;
            var Ugrader_BP = [WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE];
            var maxUpgraders = 2;
            var Builder_BP = [WORK,WORK,CARRY,CARRY,MOVE,MOVE];
            var maxBuilders = 1;
            var maxCenters = 0;
            var CenterBP = [CARRY, MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE];
            var maxHarvestersUpgr = 1;
            var HarvesterUpgr_BP = [WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE];
            var maxTransferers = 0;
            var Trasnferer_BP = [CARRY,CARRY,MOVE,MOVE];
            // var maxZavodskoy = 0;
            // var Zavodskoy_BP = [CARRY,CARRY,MOVE,MOVE];
            // var maxMiners = 0;
            // var Miner_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE];
            var maxClaimers = 0;
            var Claimer_BP = [CLAIM, MOVE];
            var maxBuildersM = 0;
            var Builder_M_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
        }
        if(Extantions.get(room_spawn.room.name).length < 30 && Extantions.get(room_spawn.room.name).length >= 20){
            var room_level = "L4";
            var Harvester_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE];
            var maxHarvesters = 2;
            var Ugrader_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE];
            var maxUpgraders = 2;
            var Builder_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE];
            var maxBuilders = 1;
            var maxCenters = 1;
            var CenterBP = [CARRY, MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE];
            var maxHarvestersUpgr = 2;
            var HarvesterUpgr_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE,MOVE,MOVE];
            var maxTransferers = 0;
            var Trasnferer_BP = [CARRY,CARRY,MOVE,MOVE];
            var maxZavodskoy = 0;
            var Zavodskoy_BP = [CARRY,CARRY,MOVE,MOVE];
            var maxMiners = 0;
            var Miner_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE];
            var maxClaimers = 0;
            var Claimer_BP = [CLAIM, MOVE];
            var maxBuildersM = 0;
            var Builder_M_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
        }
        if(Extantions.get(room_spawn.room.name).length < 40 && Extantions.get(room_spawn.room.name).length >= 30){
            var room_level = "L5";
            var Harvester_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
            var maxHarvesters = 2;
            var Ugrader_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
            var maxUpgraders = 2;
            var Builder_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
            var maxBuilders = 1;
            var maxCenters = 1;
            var CenterBP = [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
            var maxHarvestersUpgr = 2;
            var HarvesterUpgr_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE,MOVE,MOVE];
            var maxTransferers = 0;
            var Trasnferer_BP = [CARRY,CARRY,MOVE,MOVE];
            // var maxZavodskoy = 0;
            // var Zavodskoy_BP = [CARRY,CARRY,MOVE,MOVE];
            // var maxMiners = 0;
            // var Miner_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE];
            var maxClaimers = 0;
            var Claimer_BP = [CLAIM, MOVE];
            var maxBuildersM = 0;
            var Builder_M_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
        }
        if(Extantions.get(room_spawn.room.name).length < 50 && Extantions.get(room_spawn.room.name).length >= 40){
            var room_level = "L6";
            var Harvester_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
            var maxHarvesters = 1;
            var Ugrader_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
            var maxUpgraders = 1;
            var Builder_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE];
            var maxBuilders = 1;
            var maxCenters = 1;
            var CenterBP = [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
            var maxHarvestersUpgr = 1;
            var HarvesterUpgr_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE,MOVE,MOVE];
            var maxTransferers = 0;
            var Trasnferer_BP = [CARRY,CARRY,MOVE,MOVE];
            // var maxZavodskoy = 0;
            // var Zavodskoy_BP = [CARRY,CARRY,MOVE,MOVE];
            // var maxMiners = 0;
            // var Miner_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE];
            var maxClaimers = 0;
            var Claimer_BP = [CLAIM, MOVE];
            var maxBuildersM = 0;
            var Builder_M_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
        }
        if(Extantions.get(room_spawn.room.name).length < 60 && Extantions.get(room_spawn.room.name).length >= 50 ){
            var room_level = "L7";
            var Harvester_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE];
            var maxHarvesters = 1;
            var Ugrader_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE];
            var maxUpgraders = 1;
            var Builder_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE];
            var maxBuilders = 1;
            var maxCenters = 1;
            var CenterBP = [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
            var maxHarvestersUpgr = 1;
            var HarvesterUpgr_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE,MOVE,MOVE];
            var maxTransferers = 0;
            var Trasnferer_BP = [CARRY,CARRY,MOVE,MOVE];
            // var maxZavodskoy = 0;
            // var Zavodskoy_BP = [CARRY,CARRY,MOVE,MOVE];
            // var maxMiners = 0;
            // var Miner_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE];
            var maxClaimers = 0;
            var Claimer_BP = [CLAIM, MOVE];
            var maxBuildersM = 0;
            var Builder_M_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
        }
        if(Extantions.get(room_spawn.room.name).length >= 60 ){
            var room_level = "L8";
            var Harvester_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,MOVE];
            var maxHarvesters = 1;
            var Ugrader_BP = [WORK,CARRY,MOVE];
            var maxUpgraders = 1;
            var Builder_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE];
            var maxBuilders = 5;
            var maxCenters = 1;
            var CenterBP = [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
            var maxHarvestersUpgr = 1;
            var HarvesterUpgr_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,MOVE];
            var maxTransferers = 1;
            var Trasnferer_BP = [CARRY,CARRY,MOVE,MOVE];
            // var maxZavodskoy = 1;
            // var Zavodskoy_BP = [CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE];
            var maxClaimers = 0;
            var Claimer_BP = [CLAIM, MOVE];
            var maxBuildersM = 2;
            var Builder_M_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
            // var maxMiners = 0;
            // var Miner_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE];
        }
        //spawn
        //console.log(Extantions.get(room_spawn.room.name).length + "\t" + room_spawn.room + "\t" + room_level);
        try{
        render_room(room_spawn, maxHarvesters, maxUpgraders, maxBuilders, maxHarvestersUpgr, maxTransferers, maxCenters);
        }catch(e){
            console.log("визуалки опять наебнулись");
            console.log(e);
        }
        

       //if(Game.time % 10 == 0){
            var testIfCanSpawn = room_spawn.spawnCreep(Harvester_BP, 'dry',
            { dryRun: true });
            var testIfCanSpawnC = room_spawn.spawnCreep(CenterBP, 'dry',
            { dryRun: true });
            // _.forEach(Ugrader_BP, function(body){console.log(body);});
            // console.log(room_spawn.spawnCreep(Ugrader_BP, 'dry', { dryRun: true }));
            
        if(room_spawn.spawnCreep() != 0){
            var spawn_list = Spawns.get(room_spawn.room.name);
        }
        else{
            var spawn_list = room_spawn;
        }
        //}
        //else{
            //var spawn_list = room_spawn;
        //}

        //if(Game.time % 5 == 0){
        CACHE_CREEPS(room_spawn);
        // }

        _.forEach(spawn_list, function(room_spawn){
            var testIfCanSpawn = room_spawn.spawnCreep(Harvester_BP, 'dry',
                { dryRun: true });
            var testIfCanSpawnC = room_spawn.spawnCreep(CenterBP, 'dry',
                { dryRun: true });
            // var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role === 'harvester' && creep.room.name === room_spawn.room.name);
            // var reserve_harvesters = _.filter(Game.creeps, (creep) => creep.memory.role === 'harvester' && creep.room.name == room_spawn.room.name && creep.body[0].type == WORK && creep.body[1].type == CARRY && creep.body[2].type == MOVE);
            // var upgraders = _.filter(Game.creeps, (creep) => creep.memory.role === 'upgrader' && creep.room.name === room_spawn.room.name);
            // var builders = _.filter(Game.creeps, (creep) => creep.memory.role === 'builder' && creep.room.name === room_spawn.room.name);
            // var transfers = _.filter(Game.creeps, (creep) => creep.memory.role === 'transfer' && creep.room.name === room_spawn.room.name);
            // var centers = _.filter(Game.creeps, (creep) => creep.memory.role === 'center' && creep.room.name === room_spawn.room.name);
            // var harvester_upgr = _.filter(Game.creeps, (creep) => creep.memory.role === 'harvester_upgr' && creep.room.name === room_spawn.room.name);

            // Harvesters.set(room_spawn.room.name, harvesters);
            // ReserveHarvesters.set(room_spawn.room.name, reserve_harvesters);
            // Upgraders.set(room_spawn.room.name, upgraders);
            // Builders.set(room_spawn.room.name, builders);
            // Transfers.set(room_spawn.room.name, transfers);
            // Centers.set(room_spawn.room.name, centers);
            // HarvesterUpgr.set(room_spawn.room.name, harvester_upgr);
            // console.log("H_T: " + testIfCanSpawn);
            var harvesters = Harvesters.get(room_spawn.room.name);
            var reserve_harvesters = ReserveHarvesters.get(room_spawn.room.name);
            var upgraders = Upgraders.get(room_spawn.room.name);
            var builders = Builders.get(room_spawn.room.name);
            var transfers = Transfers.get(room_spawn.room.name);
            var centers = Centers.get(room_spawn.room.name);
            var harvester_upgr = HarvesterUpgr.get(room_spawn.room.name);
        if((harvesters.length - reserve_harvesters.length) < maxHarvesters && testIfCanSpawn == 0){
            var newHarvesterName = 'H_2.0_' + Game.time + "_" + room_spawn.room + "_" + room_level;
            room_spawn.spawnCreep(Harvester_BP, newHarvesterName,
                {memory: {role: 'harvester'}});
        }
        if(upgraders.length < maxUpgraders && harvesters.length >= maxHarvesters && testIfCanSpawn == 0){
            var newUpgraderName = 'U_2.0_' + Game.time + "_" + room_spawn.room + "_" + room_level;
            room_spawn.spawnCreep(Ugrader_BP, newUpgraderName,
                {memory: {role: 'upgrader'}});
        }
        if(builders.length < maxBuilders && harvesters.length == maxHarvesters && constr_sites.length > 0 && upgraders.length == maxUpgraders && testIfCanSpawn == 0 && reserve_harvesters.length == 0){
            var newBuilderName = 'B_2.0_' + Game.time + "_" + room_spawn.room + "_" + room_level;
            room_spawn.spawnCreep(Builder_BP, newBuilderName,
                {memory: {role: 'builder'}});
        }
        if(transfers.length < maxTransferers && harvesters.length == maxHarvesters &&


            room_spawn.room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => {
                return(structure.structureType == STRUCTURE_POWER_SPAWN || structure.structureType == STRUCTURE_NUKER) &&
                structure.isActive() && (structure.store.getFreeCapacity(RESOURCE_POWER) > 0 || structure.store.getFreeCapacity(RESOURCE_GHODIUM) > 0);
            }}).length > 0 && upgraders.length == maxUpgraders && testIfCanSpawn == 0 && reserve_harvesters.length == 0){
            var newTransferName = 'T_2.0_' + Game.time + "_" + room_spawn.room + "_" + room_level;
            room_spawn.spawnCreep(Trasnferer_BP, newTransferName,
                {memory: {role: 'transfer'}});
        }
        if(centers.length < maxCenters && links.length >= 1 && testIfCanSpawnC == 0 && testIfCanSpawn == 0){
            var newCenterName = 'C_2.0_' + Game.time + "_" + room_spawn.room + "_" + room_level;
            room_spawn.spawnCreep(CenterBP, newCenterName,
                {memory: {role: 'center'}});
        }
        if(harvester_upgr.length < maxHarvestersUpgr && harvesters.length == maxHarvesters && sources.length >= 2 && testIfCanSpawn == 0 && upgraders.length == maxUpgraders) {
            var newHarvesterUpgrName = 'HU_2.0_' + Game.time + "_" + room_spawn.room + "_" + room_level;
            room_spawn.spawnCreep(HarvesterUpgr_BP, newHarvesterUpgrName,
                {memory: {role: 'harvester_upgr'}});
        }
        if(harvesters.length < 1 && testIfCanSpawn != 0){
            var newHarvesterName = 'H_2.0_' + Game.time + "_" + room_spawn.room + "_" + room_level;
            room_spawn.spawnCreep([WORK,CARRY,MOVE], newHarvesterName,
                {memory: {role: 'harvester'}});
        }
        if(centers.length < 1 && centers.length < maxCenters && testIfCanSpawn == -6){
            var newCenterName = 'C_2.0_' + Game.time + "_" + room_spawn.room + "_" + room_level;
            room_spawn.spawnCreep([CARRY,MOVE,CARRY,MOVE,CARRY,MOVE], newCenterName,
                {memory: {role: 'center'}});
        }
        
        var claimers = _.filter(Game.creeps, (creep) => creep.memory.role === 'claimer');
        if(claimers.length < maxClaimers && harvesters.length == maxHarvesters && testIfCanSpawn == 0 && reserve_harvesters.length == 0){
            var newClaimerName = 'C_2.0_' + Game.time + "_" + room_spawn.room + "_" + room_level;
            room_spawn.spawnCreep(Claimer_BP, newClaimerName,
                {memory: {role: 'claimer'}});
        }
        var builders_m = _.filter(Game.creeps, (creep) => creep.memory.role === 'builder_m');
        if(builders_m.length < maxBuildersM && harvesters.length == maxHarvesters && testIfCanSpawn == 0 && reserve_harvesters.length == 0){
            var newBuilderMName = 'BM_2.0_' + Game.time + "_" + room_spawn.room + "_" + room_level;
            room_spawn.spawnCreep(Builder_M_BP, newBuilderMName,
                {memory: {role: 'builder_m'}});
        }
        //console.log(room_spawn + "\t" + harvesters.length + "/" + maxHarvesters + "/" + reserve_harvesters.length + "\n\t" + upgraders.length + "/" + maxUpgraders);
       });


    //terminals
    if(Game.time % 10 == 1){
    _.forEach(Terminals.get(room_spawn.room.name), function(terminal){
        /*
            if(Game.time % 10 == 1){
                if(terminal[0].store[RESOURCE_ENERGY] <= 50000 && Game.market.credits > 9000000) {
                    var orders = Game.market.getAllOrders(order => order.resourceType == RESOURCE_ENERGY &&
                                                          order.type == ORDER_SELL &&
                                                          Game.market.calcTransactionCost(10000, terminal[0].room.name, order.roomName) < 200000
                                                        );
                    if(orders.length != 0){
                        orders.sort(function(a,b){return a.price - b.price;});
                        price_old_e = orders[0].price;
                        if(orders[0].amount < 10000){
                            var result = Game.market.deal(orders[0].id, orders[0].amount, terminal[0].room.name);
                        }
                        else{
                            var result = Game.market.deal(orders[0].id, 10000, terminal[0].room.name);
                        }
                    }
                }
    
            */
                if(Game.resources[PIXEL] >= 0) {
                    var orders = Game.market.getAllOrders(order => order.resourceType == PIXEL &&
                                                          order.type == ORDER_BUY);
                                                          orders.sort(function(a,b){return b.price - a.price;});
                    if(orders.length != 0){
                            if(orders[0].amount > Game.resources[PIXEL]){
                                var result = Game.market.deal(orders[0].id, Game.resources[PIXEL]);
                                //console.log(result);
                            }
                            else{
                                var result = Game.market.deal(orders[0].id, orders[0].amount);
                                //console.log(result);
                            }
                    }
                }
                if(Power_Spawns.get(terminal.room.name).length > 0){
                        if(terminal.store[RESOURCE_POWER] <= 1000) {
                            var orders = Game.market.getAllOrders(order => order.resourceType == RESOURCE_POWER &&
                                                                  order.type == ORDER_SELL &&
                                                                  Game.market.calcTransactionCost(terminal.store[RESOURCE_POWER], terminal.room.name, order.roomName) < 200000
                                                                );
                                                                orders.sort(function(a,b){return a.price - b.price;});
                            if(orders.length != 0){
                                        var result = Game.market.deal(orders[0].id, orders[0].amount, terminal.room.name);
                                        //console.log(result);
                            }
                        }
                    }
                    else{
                        



                        
                        if(terminal.store[RESOURCE_ENERGY] >= 50000) {
                            var orders = Game.market.getAllOrders(order => order.resourceType == RESOURCE_ENERGY &&
                                                                  order.type == ORDER_BUY &&
                                                                  Game.market.calcTransactionCost(terminal.store[RESOURCE_ENERGY], terminal.room.name, order.roomName) < 200000
                                                                );
                            if(orders.length != 0){
                                orders.sort(function(a,b){return b.price - a.price;});
                                if(orders[0].price > price_old_e){
                                    if(orders[0].amount > terminal.store[RESOURCE_ENERGY]){
                                        var result = Game.market.deal(orders[0].id, terminal.store[RESOURCE_ENERGY], terminal.room.name);
                                        //console.log(result);
                                    }
                                    else{
                                        var result = Game.market.deal(orders[0].id, orders[0].amount, terminal.room.name);
                                        //console.log(result);
                                    }
                                }
                            }
                        }
                    }
    
                    if(terminal.room.find(FIND_MY_STRUCTURES, {
                        filter: (structure) => {
                            return(structure.structureType == STRUCTURE_NUKER) &&
                            structure.isActive() && structure.store[RESOURCE_GHODIUM] < 5000;
                        }}).length > 0){
                            if(terminal.store[RESOURCE_GHODIUM] <= 1000) {
                                var orders = Game.market.getAllOrders(order => order.resourceType == RESOURCE_GHODIUM &&
                                                                      order.type == ORDER_SELL &&
                                                                      Game.market.calcTransactionCost(terminal.store[RESOURCE_GHODIUM], terminal.room.name, order.roomName) < 200000
                                                                    );
                                if(orders.length != 0){
                                            var result = Game.market.deal(orders[0].id, orders[0].amount, terminal.room.name);
                                }
                            }
                        }
    
            });  }  
            
            });

    // } catch(e){
        // console.log("ERROR");
        // console.log(e);
        // CACHE();
    // }
    
    


    
    
    
    
    
    /*
    if(Game.time % 10 == 1){
        /*
        if(Game.rooms['E1N25'].terminal.store[RESOURCE_ENERGY] <= 50000 && Game.market.credits > 9000000) {
            var orders = Game.market.getAllOrders(order => order.resourceType == RESOURCE_ENERGY &&
                                                  order.type == ORDER_SELL &&
                                                  Game.market.calcTransactionCost(10000, 'E1N25', order.roomName) < 200000);
            if(orders.length != 0){
                orders.sort(function(a,b){return a.price - b.price;});
                price_old_e = orders[0].price;
                if(orders[0].amount < 10000){
                    var result = Game.market.deal(orders[0].id, orders[0].amount, 'E1N25');
                }
                else{
                    var result = Game.market.deal(orders[0].id, 10000, 'E1N25');
                }
            }
        }


        
        if(Game.rooms['E1N25'].terminal.store[RESOURCE_ENERGY] >= 50000) {
            var orders = Game.market.getAllOrders(order => order.resourceType == RESOURCE_ENERGY &&
                                                  order.type == ORDER_BUY &&
                                                  Game.market.calcTransactionCost(Game.rooms['E1N25'].terminal.store[RESOURCE_ENERGY], 'E1N25', order.roomName) < 200000);
            if(orders.length != 0){
                orders.sort(function(a,b){return b.price - a.price;});
                if(orders[0].price > price_old_e){
                    if(orders[0].amount > Game.rooms['E1N25'].terminal.store[RESOURCE_ENERGY]){
                        var result = Game.market.deal(orders[0].id, Game.rooms['E1N25'].terminal.store[RESOURCE_ENERGY], 'E1N25');
                    }
                    else{
                        var result = Game.market.deal(orders[0].id, orders[0].amount, 'E1N25');
                    }
                }
            }
        }
        

        // if(Game.rooms['E27N39'].terminal.store[RESOURCE_ENERGY] > 50000 && Game.rooms['E27N38'].terminal.store[RESOURCE_ENERGY] < 200000 && Game.rooms['E27N38'].terminal.store.getFreeCapacity() > 50000){
        //     Game.rooms['E27N39'].terminal.send(RESOURCE_ENERGY, 50000, 'E27N38');
        // }
    }
    */
    
    
    // _.forEach(Terminals.get(room_spawn.room.name), function(terminal){
    // /*
        // if(Game.time % 10 == 1){
            // if(terminal[0].store[RESOURCE_ENERGY] <= 50000 && Game.market.credits > 9000000) {
                // var orders = Game.market.getAllOrders(order => order.resourceType == RESOURCE_ENERGY &&
                                                    //   order.type == ORDER_SELL &&
                                                    //   Game.market.calcTransactionCost(10000, terminal[0].room.name, order.roomName) < 200000
                                                    // );
                // if(orders.length != 0){
                    // orders.sort(function(a,b){return a.price - b.price;});
                    // price_old_e = orders[0].price;
                    // if(orders[0].amount < 10000){
                        // var result = Game.market.deal(orders[0].id, orders[0].amount, terminal[0].room.name);
                    // }
                    // else{
                        // var result = Game.market.deal(orders[0].id, 10000, terminal[0].room.name);
                    // }
                // }
            // }
// 
        // */
            // if(Game.resources[PIXEL] >= 0) {
                // var orders = Game.market.getAllOrders(order => order.resourceType == PIXEL &&
                                                    //   order.type == ORDER_BUY);
                // if(orders.length != 0){
                        // if(orders[0].amount > Game.resources[PIXEL]){
                            // var result = Game.market.deal(orders[0].id, Game.resources[PIXEL]);
                            // console.log(result);
                        // }
                        // else{
                            // var result = Game.market.deal(orders[0].id, orders[0].amount);
                            // console.log(result);
                        // }
                // }
            // }
            // if(terminal[0].room.find(FIND_MY_STRUCTURES, {
                // filter: (structure) => {
                    // return(structure.structureType == STRUCTURE_POWER_SPAWN) &&
                    // structure.isActive();
                // }}).length > 0){
                    // if(terminal[0].store[RESOURCE_POWER] <= 1000) {
                        // var orders = Game.market.getAllOrders(order => order.resourceType == RESOURCE_POWER &&
                                                            //   order.type == ORDER_SELL &&
                                                            //   Game.market.calcTransactionCost(terminal[0].store[RESOURCE_POWER], terminal[0].room.name, order.roomName) < 200000
                                                            // );
                        // if(orders.length != 0){
                                    // var result = Game.market.deal(orders[0].id, orders[0].amount, terminal[0].room.name);
                                    // console.log(result);
                        // }
                    // }
                // }
                // else{
                    // if(terminal[0].store[RESOURCE_ENERGY] >= 50000) {
                        // var orders = Game.market.getAllOrders(order => order.resourceType == RESOURCE_ENERGY &&
                                                            //   order.type == ORDER_BUY &&
                                                            //   Game.market.calcTransactionCost(terminal[0].store[RESOURCE_ENERGY], terminal[0].room.name, order.roomName) < 200000
                                                            // );
                        // if(orders.length != 0){
                            // orders.sort(function(a,b){return b.price - a.price;});
                            // if(orders[0].price > price_old_e){
                                // if(orders[0].amount > terminal[0].store[RESOURCE_ENERGY]){
                                    // var result = Game.market.deal(orders[0].id, terminal[0].store[RESOURCE_ENERGY], terminal[0].room.name);
                                    // console.log(result);
                                // }
                                // else{
                                    // var result = Game.market.deal(orders[0].id, orders[0].amount, terminal[0].room.name);
                                    // console.log(result);
                                // }
                            // }
                        // }
                    // }
                // }
// 
                // if(terminal[0].room.find(FIND_MY_STRUCTURES, {
                    // filter: (structure) => {
                        // return(structure.structureType == STRUCTURE_NUKER) &&
                        // structure.isActive() && structure.store[RESOURCE_GHODIUM] < 5000;
                    // }}).length > 0){
                        // if(terminal[0].store[RESOURCE_GHODIUM] <= 1000) {
                            // var orders = Game.market.getAllOrders(order => order.resourceType == RESOURCE_GHODIUM &&
                                                                //   order.type == ORDER_SELL &&
                                                                //   Game.market.calcTransactionCost(terminal[0].store[RESOURCE_GHODIUM], terminal[0].room.name, order.roomName) < 200000
                                                                // );
                            // if(orders.length != 0){
                                        // var result = Game.market.deal(orders[0].id, orders[0].amount, terminal[0].room.name);
                            // }
                        // }
                    // }
// 
        // });

    /*
    if(Game.time % 10000 == 0){
        console.log('NOTIFICATION HAS BEEN SENT');
        Game.notify("Your curent balance is: " + Game.market.credits);
    }
    */
   try{
    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        if(creep.memory.role == 'harvester') {
            roleHarvester.run(creep, Extantions, Spawns);
        }
        if(creep.memory.role == 'upgrader') {
            roleUpgrader.run(creep);
        }
        if(creep.memory.role == 'builder') {
            roleBuilder.run(creep);
        }
        if(creep.memory.role == 'miner') {
            roleMiner.run(creep);
        }
        if(creep.memory.role == 'center') {
            roleCenter.run(creep);
        }
        if(creep.memory.role == 'harvester_upgr') {
            roleHarvesterUpgr.run(creep);
        }
        if(creep.memory.role == 'claimer') {
            roleClaimer.run(creep);
        }
        if(creep.memory.role == 'builder_m') {
            roleBuilderM.run(creep);
        }
        if(creep.memory.role == 'transfer') {
            roleTransfer.run(creep);
        }
        if(creep.memory.role == 'zavodskoy') {
            roleZavodskoy.run(creep);
        }
    }
    // console.log(price_old_e);
    // console.log(Game.cpu.bucket);
    // console.log('Time: ' +  Game.time);
    // console.log('OK!');
}catch(e){
    CACHE();
    console.log(e);
}
render();
}
    
