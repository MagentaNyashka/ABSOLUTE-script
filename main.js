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
const profiler = require('screeps-profiler');
const utf15 = require('utf15');

const map_codec = new utf15.Codec({ depth: 6, array: 1 });

const STRUCTURE_TYPES = [
    STRUCTURE_SPAWN,
    STRUCTURE_EXTENSION,
    STRUCTURE_ROAD,
    STRUCTURE_WALL,
    STRUCTURE_RAMPART,
    STRUCTURE_KEEPER_LAIR,
    STRUCTURE_PORTAL,
    STRUCTURE_CONTROLLER,
    STRUCTURE_LINK,
    STRUCTURE_STORAGE,
    STRUCTURE_TOWER,
    STRUCTURE_OBSERVER,
    STRUCTURE_POWER_BANK,
    STRUCTURE_POWER_SPAWN,
    STRUCTURE_EXTRACTOR,
    STRUCTURE_LAB,
    STRUCTURE_TERMINAL,
    STRUCTURE_CONTAINER,
    STRUCTURE_NUKER,
    STRUCTURE_FACTORY,
    STRUCTURE_INVADER_CORE,
];


var price_old = -100;
var price_old_x = -100;
var price_old_e = -100;

if(!Memory.cache){
    Memory.cache = {};
}
if(!global.cache){
    global.cache = {};
}

//"CACHE"
var my_spawns = [];
Spawns = new Map();
Terminals = new Map();
Towers = new Map();
Extantions = new Map();
Power_Spawns = new Map();
Sources = new Map();
Containers = new Map();
Links = new Map();
dLinks = new Map();
sLinks = new Map();
Nukers = new Map();
Storages = new Map();

ConstructionSites = new Map();

Enemies = new Map();
DamagedStructures = new Map();
DamagedWalls = new Map();

Harvesters = new Map();
ReserveHarvesters = new Map();
Upgraders = new Map();
Builders = new Map();
Transfers = new Map();
Centers = new Map();
HarvesterUpgr = new Map();


function trackAverageCPU() {
    const currentUsed = Game.cpu.getUsed();

    if (!Memory.cpuStats) {
        Memory.cpuStats = { total: 0, ticks: 0, average: 0 };
    }

    Memory.cpuStats.total += currentUsed;
    Memory.cpuStats.ticks += 1;

    Memory.cpuStats.average = Memory.cpuStats.total / Memory.cpuStats.ticks;

    return `${Memory.cpuStats.average.toFixed(2)}`;
}

function CACHE_SPAWN() {
    my_spawns = [];
    _.forEach(Game.rooms, function(room) {
        let spawn = room.find(FIND_MY_SPAWNS)[0];
        if (spawn) {
            my_spawns.push(spawn);
        }
    });
}
function CACHE() {
    _.forEach(my_spawns, function(room_spawn) {
        const activeStructures = room_spawn.room.find(FIND_STRUCTURES, {
            filter: structure => structure.isActive(),
        });

        const grouped = _.groupBy(activeStructures, s => s.structureType);

        Spawns.set(room_spawn.room.name, grouped[STRUCTURE_SPAWN] || []);
        Terminals.set(room_spawn.room.name, grouped[STRUCTURE_TERMINAL] || []);
        Towers.set(room_spawn.room.name, grouped[STRUCTURE_TOWER] || []);
        Extantions.set(room_spawn.room.name, grouped[STRUCTURE_EXTENSION] || []);
        Power_Spawns.set(room_spawn.room.name, grouped[STRUCTURE_POWER_SPAWN] || []);
        Links.set(room_spawn.room.name, grouped[STRUCTURE_LINK] || []);
        Containers.set(room_spawn.room.name, grouped[STRUCTURE_CONTAINER] || []);
        Nukers.set(room_spawn.room.name, grouped[STRUCTURE_NUKER] || []);
        Storages.set(room_spawn.room.name, grouped[STRUCTURE_STORAGE] || []);

        Sources.set(room_spawn.room.name, room_spawn.room.find(FIND_SOURCES) || []);
        ConstructionSites.set(room_spawn.room.name, room_spawn.room.find(FIND_CONSTRUCTION_SITES) || []);
    });
}
function CACHE_CREEPS(room_spawn) {
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
    var damagedWalls = room_spawn.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                return(structure.hits < structure.hitsMax) &&
                    structure.hits < 1000000;
                }
            });
    DamagedStructures.set(room_spawn.room.name, damagedStructures);
    DamagedWalls.set(room_spawn.room.name, damagedStructures);
}
function CACHE_LINKS(room_spawn){
        var sources = Sources.get(room_spawn.room.name);
        var links = Links.get(room_spawn.room.name);
        var source_links = [];
        var destination_links = [];

        _.forEach(links, function(link) {
            var closest_source = link.pos.findClosestByRange(sources);
            if (link.pos.getRangeTo(closest_source) < 3) {
                source_links.push(link);
            } else {
                destination_links.push(link);
            }
        });
        dLinks.set(room_spawn.room.name, destination_links);
        sLinks.set(room_spawn.room.name, source_links);

}


function render_room(room_spawn, maxHarvesters, maxUpgraders, maxBuilders, maxHarvestersUpgr, maxTransferers, maxCenters){
    new RoomVisual(room_spawn.room.name)
            .text('Sources ' + room_spawn.room.find(FIND_SOURCES).length, 36, 3.2, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
            .text('Extentions ' + Extantions.get(room_spawn.room.name).length, 36, 3.8, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
            .text('Harvesters ' + Harvesters.get(room_spawn.room.name).length + '(' + ReserveHarvesters.get(room_spawn.room.name).length + ')' + '/' + maxHarvesters + '+' + HarvesterUpgr.get(room_spawn.room.name).length + "/" + maxHarvestersUpgr, 36, 4.4, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
            .text('Upgraders ' + Upgraders.get(room_spawn.room.name).length + '/' + maxUpgraders, 36, 5, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
            .text('Centers ' + Centers.get(room_spawn.room.name).length + '/' + maxCenters, 36, 5.6, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
            .text('Builders ' + Builders.get(room_spawn.room.name).length + '/' + maxBuilders, 36, 6.2, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
            .text('Transferers ' + Transfers.get(room_spawn.room.name).length + '/' + maxTransferers, 36, 6.8, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
            ;
}
function render(){
    const roomCount = Object.values(Game.rooms).filter(room => room.controller && room.controller.my).length;
    const limit = Game.cpu.limit;
    const avgCpu = trackAverageCPU();
    new RoomVisual()
    .text('Time ' + Game.time, 36, 0.2, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
    .text('Cpu ' + Game.cpu.getUsed().toFixed(2), 36, 0.8, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
    .text('Cpu/Room ' + (Game.cpu.getUsed()/roomCount).toFixed(2), 41.4, 0.8, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
    .text('Cpu.Avg ' + avgCpu + "(" + (avgCpu/limit*100).toFixed(2) + "%)", 36, 1.4, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
    .text('Cpu.Avg/Room ' + (avgCpu/roomCount).toFixed(2) + "(" + (avgCpu/limit*100).toFixed(2) + "%)", 41.4, 1.4, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
    .text('Cpu.Limit ' + limit, 36, 2, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
    .text('Bucket ' + Game.cpu.bucket + '/10000(' + (10000 - Game.cpu.bucket) + ')', 36, 2.6, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
    ;
}

function roomPlanCacher(roomName){
    if (Game.time % 5 === 0) {
        if (!this.roomPlan) {
            this.roomPlan = {};
        }
        if (!this.roomPlan[roomName]) {
            this.roomPlan[roomName] = {};
        }

        const structures = Game.rooms[roomName].find(FIND_STRUCTURES, {
            filter: (structure) => structure.isActive(),
        });
        const grouped = _.groupBy(structures, (s) => s.structureType);

        _.forEach(STRUCTURE_TYPES, function (structureType) {
            let positions = [];
            _.forEach(grouped[structureType], function (structure) {
                const valuesX = structure.pos.x;
                const valuesY = structure.pos.y;
                positions.push(valuesX);
                positions.push(valuesY);
            });
            Memory.cache.roomPlan[roomName][structureType] = map_codec.encode(positions);
        });
    }
}


global.getCachedStructures = function (roomName, structureType) {
    if (!Memory.cache || !Memory.cache.roomPlan || !Memory.cache.roomPlan[roomName]) {
        console.log(`No cached data available for room: ${roomName}`);
        return [];
    }

    const encodedPositions = Memory.cache.roomPlan[roomName][structureType];
    if (!encodedPositions) {
        console.log(`No cached data for structure type: ${structureType} in room: ${roomName}`);
        return [];
    }

    try {
        return map_codec.decode(encodedPositions);
    } catch (error) {
        console.log(`Error decoding positions for ${structureType}:`, error);
        return [];
    }
};


CACHE_SPAWN();
CACHE();

profiler.enable();
module.exports.loop = function() {
    // const map = new utf15.Codec({depth: 6, array: 1});
    // const encoded = map.encode(arr);
    // const decoded = map.decode(encoded);
    // console.log(encoded);
    // console.log(decoded);
    profiler.wrap(function() {
    Game.cpu.generatePixel();
    
    
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
        }
    }
    
        if(Game.time % 1 == 0){
            CACHE_SPAWN();
        }
    _.forEach(my_spawns, function(room_spawn){
        CACHE();
        TowerCACHE(room_spawn);

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

        //links
        //roomPlanCacher(room_spawn.room.name);

        CACHE_LINKS(room_spawn);
        const source_links = sLinks.get(room_spawn.room.name);
        const destination_links = dLinks.get(room_spawn.room.name).sort(function(a,b){return b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY];});

        _.forEach(source_links, function(link){
            if(destination_links.length > 0){
                _.forEach(destination_links, function(d_link){
                    if(d_link.store.getFreeCapacity(RESOURCE_ENERGY) > 100){
                        link.transferEnergy(d_link);
                    }
                });
            }
        });

        //power_spawn
        var power_spawn = room_spawn.room.find(FIND_MY_STRUCTURES, {filter: (structure) => {return(structure.structureType == STRUCTURE_POWER_SPAWN) && structure.isActive() && structure.store[RESOURCE_POWER] > 0 && structure.store[RESOURCE_ENERGY] >= 50;}});
        if(power_spawn.length > 0){
            power_spawn[0].processPower();
        }

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
            var Harvester_BP = [WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE];
            var maxHarvesters = 1;
            var Ugrader_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
            var maxUpgraders = 2;
            var Builder_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
            var maxBuilders = 1;
            var maxCenters = 1;
            var CenterBP = [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
            var maxHarvestersUpgr = 2;
            var HarvesterUpgr_BP = [WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE]
            var maxTransferers = 0;
            var Trasnferer_BP = [CARRY,CARRY,MOVE,MOVE];
            var maxClaimers = 0;
            var Claimer_BP = [CLAIM, MOVE];
            var maxBuildersM = 0;
            var Builder_M_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
        }
        if(Extantions.get(room_spawn.room.name).length < 50 && Extantions.get(room_spawn.room.name).length >= 40){
            var room_level = "L6";
            var Harvester_BP = [WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE]
            var maxHarvesters = 1;
            var Ugrader_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
            var maxUpgraders = 1;
            var Builder_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE];
            var maxBuilders = 1;
            var maxCenters = 1;
            var CenterBP = [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
            var maxHarvestersUpgr = 1;
            var HarvesterUpgr_BP = [WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE]
            var maxTransferers = 0;
            var Trasnferer_BP = [CARRY,CARRY,MOVE,MOVE];
            var maxClaimers = 0;
            var Claimer_BP = [CLAIM, MOVE];
            var maxBuildersM = 0;
            var Builder_M_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
        }
        if(Extantions.get(room_spawn.room.name).length < 60 && Extantions.get(room_spawn.room.name).length >= 50 ){
            var room_level = "L7";
            var Harvester_BP = [WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE]
            var maxHarvesters = 1;
            var Ugrader_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE];
            var maxUpgraders = 1;
            var Builder_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE];
            var maxBuilders = 1;
            var maxCenters = 1;
            var CenterBP = [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
            var maxHarvestersUpgr = 1;
            var HarvesterUpgr_BP = [WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE]
            var maxTransferers = 0;
            var Trasnferer_BP = [CARRY,CARRY,MOVE,MOVE];
            var maxClaimers = 0;
            var Claimer_BP = [CLAIM, MOVE];
            var maxBuildersM = 0;
            var Builder_M_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
        }
        if(Extantions.get(room_spawn.room.name).length >= 60 ){
            var room_level = "L8";
            var Harvester_BP = [WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE]
            var maxHarvesters = 1;
            var Ugrader_BP = [WORK,CARRY,MOVE];
            var maxUpgraders = 1;
            var Builder_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE];
            var maxBuilders = 5;
            var maxCenters = 1;
            var CenterBP = [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
            var maxHarvestersUpgr = 1;
            var HarvesterUpgr_BP = [WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE]
            var maxTransferers = 1;
            var Trasnferer_BP = [CARRY,CARRY,MOVE,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE];
            var maxClaimers = 0;
            var Claimer_BP = [CLAIM, MOVE];
            var maxBuildersM = 0;
            var Builder_M_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
        }
        try{
            render_room(room_spawn, maxHarvesters, maxUpgraders, maxBuilders, maxHarvestersUpgr, maxTransferers, maxCenters);
        }catch(e){
            console.log("визуалки опять наебнулись");
            console.log(e);
        }
            
        if(room_spawn.spawnCreep() != 0){
            var spawn_list = Spawns.get(room_spawn.room.name);
        }
        else{
            var spawn_list = room_spawn;
        }
        CACHE_CREEPS(room_spawn);

        _.forEach(spawn_list, function(room_spawn){
            var testIfCanSpawn = room_spawn.spawnCreep(Harvester_BP, 'dry',{ dryRun: true });
            var testIfCanSpawnC = room_spawn.spawnCreep(CenterBP, 'dry',{ dryRun: true });

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
            if(builders.length < maxBuilders && harvesters.length == maxHarvesters && ConstructionSites.get(room_spawn.room.name).length > 0 && upgraders.length == maxUpgraders && testIfCanSpawn == 0 && reserve_harvesters.length == 0){
                var newBuilderName = 'B_2.0_' + Game.time + "_" + room_spawn.room + "_" + room_level;
                room_spawn.spawnCreep(Builder_BP, newBuilderName,
                    {memory: {role: 'builder'}});
            }
            if(transfers.length < maxTransferers && harvesters.length == maxHarvesters && Power_Spawns.get(room_spawn.room.name).length > 0 && upgraders.length == maxUpgraders && testIfCanSpawn == 0 && reserve_harvesters.length == 0){
                var newTransferName = 'T_2.0_' + Game.time + "_" + room_spawn.room + "_" + room_level;
                room_spawn.spawnCreep(Trasnferer_BP, newTransferName,
                    {memory: {role: 'transfer'}});
            }
            if(centers.length < maxCenters && Links.get(room_spawn.room.name).length >= 1 && testIfCanSpawnC == 0 && testIfCanSpawn == 0){
                var newCenterName = 'C_2.0_' + Game.time + "_" + room_spawn.room + "_" + room_level;
                room_spawn.spawnCreep(CenterBP, newCenterName,
                    {memory: {role: 'center'}});
            }
            if(harvester_upgr.length < maxHarvestersUpgr && harvesters.length == maxHarvesters && Sources.get(room_spawn.room.name).length >= 2 && testIfCanSpawn == 0 && upgraders.length == maxUpgraders) {
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
       });


    //terminals
    if(Game.time % 10 == 1){
    _.forEach(Terminals.get(room_spawn.room.name), function(terminal){
                if(Game.resources[PIXEL] >= 0) {
                    var orders = Game.market.getAllOrders(order => order.resourceType == PIXEL &&
                                                          order.type == ORDER_BUY);
                                                          orders.sort(function(a,b){return b.price - a.price;});
                    if(orders.length != 0){
                            if(orders[0].amount > Game.resources[PIXEL]){
                                var result = Game.market.deal(orders[0].id, Game.resources[PIXEL]);
                            }
                            else{
                                var result = Game.market.deal(orders[0].id, orders[0].amount);
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
                            }
                        }
                    }
                    else{
                        if(terminal.store[RESOURCE_ENERGY] >= 10000) {
                            const targetRoom = Power_Spawns.keys().next().value;
                            if(Terminals.get(targetRoom)[0].store.getFreeCapacity(RESOURCE_ENERGY) > terminal.store[RESOURCE_ENERGY]){
                                terminal.send(RESOURCE_ENERGY, (terminal.store[RESOURCE_ENERGY]*0.75), targetRoom);
                            }
                            else{
                                terminal.send(RESOURCE_ENERGY, Terminals.get(targetRoom)[0].store.getFreeCapacity(RESOURCE_ENERGY), targetRoom);
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

    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        if(creep.memory.role == 'harvester') {
            roleHarvester.run(creep, Extantions, Spawns, Sources, Links, Containers, Towers, Terminals, Power_Spawns);
        }
        if(creep.memory.role == 'upgrader') {
            roleUpgrader.run(creep, Sources, Links, Containers, Terminals);
        }
        if(creep.memory.role == 'builder') {
            roleBuilder.run(creep);
        }
        if(creep.memory.role == 'miner') {
            roleMiner.run(creep);
        }
        if(creep.memory.role == 'center') {
            roleCenter.run(creep, Containers, dLinks, Extantions, Spawns, Towers, Nukers, Terminals, Storages);
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
            roleTransfer.run(creep, Power_Spawns, Nukers, Terminals);
        }
        if(creep.memory.role == 'zavodskoy') {
            roleZavodskoy.run(creep);
        }
    }
render();
});
}
    
