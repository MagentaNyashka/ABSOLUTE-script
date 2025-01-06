//ну это пиздец нахуй я ебал
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
var roleMaintainer = require('role.maintainer');
const { lastIndexOf } = require('lodash');
const profiler = require('screeps-profiler');
const utf15 = require('utf15');
const roleScout = require('role.scout');
const roleRemoteMiner = require('role.remoteMiner');
const roleClaimRoom = require('./role.claimRoom');
const roleRemoteClaimer = require('./role.claimRoom');

const map_codec = new utf15.Codec({ depth: 6, array: 1 });
function base62Encode(input) {
    const base62Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let num = 0;

    for (let i = 0; i < input.length; i++) {
        num = (num * 31 + input.charCodeAt(i)) % Number.MAX_SAFE_INTEGER;
    }

    let encoded = "";
    while (num > 0) {
        encoded = base62Chars[num % 62] + encoded;
        num = Math.floor(num / 62);
    }

    return encoded || "0";
}


function dark_mode(){
    if(darkMode){
        new RoomVisual().rect(-1, -1, 51, 51, {fill: base_color});
    }
}

const darkMode = true;

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

function totalRemoteSources(){
    let totalSources = 0;
    _.forEach(Memory.remoteRooms, function(remoteRoom){
        totalSources += remoteRoom.sources;
    });
    return totalSources;
}

const SLINK = "sourceLinks";
const DLINK = "destinationLinks";
const CLINK = "controllerLinks";
const SCONT = "sourceContainers";
const DCONT = "destinationContainers";
const CCONT = "controllerContainers";
const MCONT = "mineralContainers";
const SLAB = "sourceLab";
const DLAB = "destinationLab";

var price_old = -100;
var price_old_x = -100;
var price_old_e = -100;


//Visuals
const base_color = '#000000';
const text_color = '#00FFFF';
const energy_color = '#dec15a';
const stroke_color = '#000000';

if(!Memory.cache){
    Memory.cache = {};
}
if(!global.cache){
    global.cache = {};
}
if(!Memory.ClaimingRooms){
    Memory.ClaimingRooms = [];
}

//"CACHE"
var my_spawns = [];
dLinks = new Map();
sLinks = new Map();

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
Miners = new Map();
Maintainers = new Map();

function hashCode(str) {
    let hash = 0;
    for (let i = 0, len = str.length; i < len; i++) {
        let chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}
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
function getControllerProgressBar(controller, length = 20) {
    if (!controller) return "No Controller";

    let progress = controller.progress || 0;
    if(controller.level == 8){
        progress = 1;
    }
    const progressTotal = controller.progressTotal || 1;
    const progressPercentage = Math.min(progress / progressTotal, 1);
    if(!global.progressPercentage){
        global.progressPercentage = {};
    }
    if(!global.progressPercentage[controller.room.name]){
        global.progressPercentage[controller.room.name] = {};
    }
    global.progressPercentage[controller.room.name] = progressPercentage;

    const filledLength = Math.round(progressPercentage * length);
    const emptyLength = length - filledLength;

    const filledBar = "█".repeat(filledLength);
    const emptyBar = "-".repeat(emptyLength);

    return `[${filledBar}${emptyBar}] ${(progressPercentage * 100).toFixed(2)}% \t ${progress}/${progressTotal}`;
}
function clearConsole(lines = 50) {
    for (let i = 0; i < lines; i++) {
        console.log(" ");
    }
}

function CACHE_SPAWN() {
    if(Game.time % 500){
        my_spawns = [];
        _.forEach(Game.rooms, function(room) {
            let spawn = room.find(FIND_MY_SPAWNS)[0];
            if (spawn) {
                my_spawns.push(spawn);
            }
        });
    }
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
    const miners = byRole['miner'] || [];
    const maintainers = byRole['maintainer'] || [];

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
    Miners.set(room_spawn.room.name, miners);
    Maintainers.set(room_spawn.room.name, maintainers);
}
function TowerCACHE(room_spawn){
    var hostiles = room_spawn.room.find(FIND_HOSTILE_CREEPS).filter(c => c.owner.username != 'Blattlaus');
    Enemies.set(room_spawn.room.name, hostiles);

    var damagedStructures = room_spawn.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                return (
                    structure.structureType != STRUCTURE_WALL &&
                    structure.structureType != STRUCTURE_RAMPART &&
                    structure.structureType != STRUCTURE_ROAD &&
                    structure.hits < structure.hitsMax * 0.8);
                }
            });
    var damagedWalls = room_spawn.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                return(structure.hits < structure.hitsMax) &&
                    structure.hits < 1000000;
                }
            });
    DamagedStructures.set(room_spawn.room.name, damagedStructures);
    DamagedWalls.set(room_spawn.room.name, damagedWalls);
}

function getColorByPercentage(percentage) {
    const p = Math.min(1, Math.max(0, percentage));

    const start = { r: 139, g: 0, b: 0 };
    const end = { r: 0, g: 255, b: 0 };

    const r = Math.round((1 - p) * start.r + p * end.r);
    const g = Math.round((1 - p) * start.g + p * end.g);
    const b = Math.round((1 - p) * start.b + p * end.b);

    const toHex = value => value.toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}


function render_room(room_spawn, maxHarvesters, maxUpgraders, maxBuilders, maxHarvestersUpgr, maxTransferers, maxCenters, maxMiners){
    const roomName = room_spawn.room.name;
    new RoomVisual(roomName).rect(35.7, 3.5, 6, 5.4, {fill: base_color, opacity: 0.5, stroke: stroke_color, strokeWidth: 0.1})
            .text('Sources ' + global.getSources(roomName).length, 36, 4.2, {align: 'left', color: text_color, stroke: stroke_color, strokeWidth:0.05, font: 0.5})
            .text('Extentions ' + global.getCachedStructures(roomName, STRUCTURE_EXTENSION).length, 36, 4.8, {align: 'left', color: text_color,stroke: stroke_color, strokeWidth:0.05, font: 0.5})
            .text('Harvesters ' + Harvesters.get(room_spawn.room.name).length + '(' + ReserveHarvesters.get(room_spawn.room.name).length + ')' + '/' + maxHarvesters + '+' + HarvesterUpgr.get(room_spawn.room.name).length + "/" + maxHarvestersUpgr, 36, 5.4, {align: 'left', color: text_color,stroke: stroke_color, strokeWidth:0.05, font: 0.5})
            .text('Upgraders ' + Upgraders.get(room_spawn.room.name).length + '/' + maxUpgraders, 36, 6, {align: 'left', color: text_color,stroke: stroke_color, strokeWidth:0.05, font: 0.5})
            .text('Centers ' + Centers.get(room_spawn.room.name).length + '/' + maxCenters, 36, 6.6, {align: 'left', color: text_color,stroke: stroke_color, strokeWidth:0.05, font: 0.5})
            .text('Builders ' + Builders.get(room_spawn.room.name).length + '/' + maxBuilders, 36, 7.2, {align: 'left', color: text_color,stroke: stroke_color, strokeWidth:0.05, font: 0.5})
            .text('Transferers ' + Transfers.get(room_spawn.room.name).length + '/' + maxTransferers, 36, 7.8, {align: 'left', color: text_color,stroke: stroke_color, strokeWidth:0.05, font: 0.5})
            .text('Miners ' + Miners.get(room_spawn.room.name).length + '/' + maxMiners, 36, 8.4, {align: 'left', color: text_color,stroke: stroke_color, strokeWidth:0.05, font: 0.5})
            ;
    const sources = global.getSources(room_spawn.room.name);
    for(let i = 0; i < sources.length; i++){
        new RoomVisual(room_spawn.room.name).text(sources[i].energy + "/" + sources[i].energyCapacity, sources[i].pos.x+0.6, sources[i].pos.y+0.15, {align: 'left', color: energy_color, stroke: stroke_color, strokeWidth: 0.1, font: 0.5})
        .text(sources[i].ticksToRegeneration || 300, sources[i].pos.x-0.6, sources[i].pos.y+0.15, {align: 'right', color: energy_color, stroke: stroke_color, strokeWidth: 0.1, font: 0.5})
        ;
    }
    const percentage = room_spawn.room.controller.progress/room_spawn.room.controller.progressTotal*100;
    new RoomVisual(roomName).text(room_spawn.room.controller.progress + "/" + room_spawn.room.controller.progressTotal, room_spawn.room.controller.pos.x+0.7, room_spawn.room.controller.pos.y+0.15, {align: 'left', color:'#ffffff', stroke: stroke_color, strokeWidth: 0.1, font: 0.5})
    .text(percentage.toFixed(2) + "%", room_spawn.room.controller.pos.x+0.7, room_spawn.room.controller.pos.y+0.75, {align: 'left', color:'#ffffff', stroke: stroke_color, strokeWidth: 0.1, font: 0.5})
    ;
    new RoomVisual(roomName).text('Energy ' + room_spawn.room.energyAvailable + "/" + room_spawn.room.energyCapacityAvailable, room_spawn.pos, {align: 'center', color: energy_color,stroke: stroke_color, strokeWidth:0.05, font: 0.5});
    const controller = room_spawn.room.controller;
    const energyDelta = deltaEnergy(roomName);
    new RoomVisual(roomName).rect(42.3, 3.5, 6.4, 5.4, {fill: base_color, opacity: 0.5, stroke: stroke_color, strokeWidth: 0.1})
    .text(controller.progress + '/' + controller.progressTotal + '(' + percentage.toFixed(2) + ')', 42.6, 4.2, {align: 'left', color: text_color, stroke: stroke_color, strokeWidth:0.05, font: 0.5})
    .text(energyDelta.delta, 42.6, 4.8, {align: 'left', color: text_color, stroke: stroke_color, strokeWidth:0.05, font: 0.5})
    .text(energyDelta.totalRoomEnergy, 45.6, 4.8, {align: 'left', color: text_color, stroke: stroke_color, strokeWidth:0.05, font: 0.5})

    const sLabs = global.getSourceLabs(roomName);
    const dLabs = global.getDestLabs(roomName);
    _.forEach(sLabs, function(sLab){
        new RoomVisual(roomName).text("S", sLab.pos.x-0.01, sLab.pos.y+0.17, {align: 'center', color: text_color, stroke: stroke_color, strokeWidth:0.05, font: 0.7});
    })
    _.forEach(dLabs, function(dLab){
        new RoomVisual(roomName).text("D", dLab.pos.x-0.01, dLab.pos.y+0.17, {align: 'center', color: text_color, stroke: stroke_color, strokeWidth:0.05, font: 0.7});
    })

    const damagedStructures = global.getCachedStructures(roomName, STRUCTURE_ROAD);
    _.forEach(damagedStructures, function(road){
        const percentage = road.hits/road.hitsMax;
        new RoomVisual(roomName).circle(road.pos, {fill: getColorByPercentage(percentage)})
        .text(percentage, road.pos, {align: 'left', color: text_color, stroke: stroke_color, strokeWidth:0.05, font: 0.2});
    })

    const containers = global.getCachedStructures(roomName, STRUCTURE_CONTAINER);
    _.forEach(containers, function(container){
        new RoomVisual(roomName)
        .text((container.store.getUsedCapacity()/container.store.getCapacity() * 100).toFixed(2) + "%", container.pos.x+0.7, container.pos.y+0.75, {align: 'left', color: text_color, stroke: stroke_color, strokeWidth:0.05, font: 0.5})
    });

    const constructionSites = global.getConstructionSites(roomName);
    _.forEach(constructionSites, function(constr_site){
        new RoomVisual(roomName)
        .text((constr_site.progress/constr_site.progressTotal*100).toFixed(2) + "%", constr_site.pos.x-0.01, constr_site.pos.y+0.17, {align: 'center', color: text_color, stroke: stroke_color, strokeWidth:0.05, font: 0.5})
    });
    console.log(`${roomName} ${getControllerProgressBar(room_spawn.room.controller)} \t${room_spawn.room.energyAvailable}/${room_spawn.room.energyCapacityAvailable}`);
}
function render(){
    const roomCount = Object.values(Game.rooms).filter(room => room.controller && room.controller.my).length;
    const limit = Game.cpu.limit;
    const avgCpu = trackAverageCPU();
    new RoomVisual().rect(35.7, -0.5, 13, 3.5, {fill: base_color, opacity: 0.5, stroke: stroke_color, strokeWidth: 0.1})
    .text('Time ' + Game.time, 36, 0.2, {align: 'left', color: text_color,stroke: stroke_color, strokeWidth:0.05, font: 0.5})
    .text('Cpu ' + Game.cpu.getUsed().toFixed(2), 36, 0.8, {align: 'left', color: text_color,stroke: stroke_color, strokeWidth:0.05, font: 0.5})
    .text('Cpu/Room ' + (Game.cpu.getUsed()/roomCount).toFixed(2), 41.4, 0.8, {align: 'left', color: text_color,stroke: stroke_color, strokeWidth:0.05, font: 0.5})
    .text(Game.shard.name, 41.4, 0.2, {align: 'left', color: text_color,stroke: stroke_color, strokeWidth:0.05, font: 0.5})
    .text('Cpu.Avg ' + avgCpu + "(" + (avgCpu/limit*100).toFixed(2) + "%)", 36, 1.4, {align: 'left', color: text_color,stroke: stroke_color, strokeWidth:0.05, font: 0.5})
    .text('Cpu.Avg/Room ' + (avgCpu/roomCount).toFixed(2) + "(" + (avgCpu/limit*100).toFixed(2) + "%)", 41.4, 1.4, {align: 'left', color: text_color,stroke: stroke_color, strokeWidth:0.05, font: 0.5})
    .text('Cpu.Limit ' + limit, 36, 2, {align: 'left', color: text_color,stroke: stroke_color, strokeWidth:0.05, font: 0.5})
    .text('Bucket ' + Game.cpu.bucket + '/10000(' + (10000 - Game.cpu.bucket) + ')', 36, 2.6, {align: 'left', color: text_color,stroke: stroke_color, strokeWidth:0.05, font: 0.5})
    ;
}


function roomPlanCacher(roomName){
    if (Game.time % 500 === 0) {
        // Game.notify(`roomPlanCacher inprogress for room ${Game.shard.name}:[${roomName}]`);
        if(!Memory.cache){
            Memory.cache = {};
        }
        if (!Memory.cache.roomPlan) {
            Memory.cache.roomPlan = {};
        }
        if (!Memory.cache.roomPlan[roomName]) {
            Memory.cache.roomPlan[roomName] = {};
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
        return [];
    }
    if (!global.cache) {
        global.cache = {};
    }
    if (!global.cache[roomName]) {
        global.cache[roomName] = {};
    }
    if (!global.cache[roomName][structureType]) {
        const encodedData = Memory.cache.roomPlan[roomName][structureType];
        if (!encodedData || encodedData === "0") {
            return [];
        }

        const coordinates = map_codec.decode(encodedData);

        let coordinatePairs = [];
        for (let i = 0; i < coordinates.length; i += 2) {
            if (coordinates[i + 1] !== undefined) {
                coordinatePairs.push({ x: coordinates[i], y: coordinates[i + 1] });
            }
        }

        let structures = [];
        for (let i = 0; i < coordinatePairs.length; i++) {
            const lookAtResult = Game.rooms[roomName].lookAt(coordinatePairs[i].x, coordinatePairs[i].y);

            const structure = lookAtResult.find(
                (s) => s.type === LOOK_STRUCTURES && s.structure.structureType === structureType
            );
            if (structure) {
                structures.push(structure.structure);
            }
        }
        global.cache[roomName][structureType] = structures;
    }

    return global.cache[roomName][structureType];
};

global.getSources = function(roomName){
    if(!global.cache){
        global.cache = {};
    }
    if(!global.cache[roomName]){
        global.cache[roomName] = {};
    }
    if(!global.cache[roomName].sources){
        // console.log(`source caching in progress for [${roomName}]...`);
        const sources = Game.rooms[roomName].find(FIND_SOURCES);
        global.cache[roomName].sources = sources;
    }
    return global.cache[roomName].sources;
};

global.getConstructionSites = function(roomName){
    if(!global.cache){
        global.cache = {};
    }
    if(!global.cache[roomName]){
        global.cache[roomName] = {};
    }
    if(!global.cache[roomName].constructionSites){
        // console.log(`constr_site caching in progress for [${roomName}]...`);
        const constructionSites = Game.rooms[roomName].find(FIND_CONSTRUCTION_SITES);
        global.cache[roomName].constructionSites = constructionSites;
    }
    return global.cache[roomName].constructionSites;
}

function roomLinksCacher(roomName){
    if(Game.time % 500 === 0){
        if (!this.roomPlan) {
            this.roomPlan = {};
        }
        if (!this.roomPlan[roomName]) {
            this.roomPlan[roomName] = {};
        }
        const sources = global.getSources(roomName);
        const links = global.getCachedStructures(roomName, STRUCTURE_LINK);
        let source_links = [];
        let destination_links = [];
        let controller_links = [];

        source_links = links.filter(container => {return sources.some(source => container.pos.inRangeTo(source.pos, 3));});
        controller_links = links.filter(container => {return container.pos.inRangeTo(Game.rooms[roomName].controller, 3);});
        destination_links = links.filter(container => {return !sources.some(source => container.pos.inRangeTo(source.pos, 3)) && !container.pos.inRangeTo(Game.rooms[roomName].controller, 3);});
        let sPositions = [];
        let dPositions = [];
        let cPositions = [];
        _.forEach(source_links, function (sLink) {
            const valuesX = sLink.pos.x;
            const valuesY = sLink.pos.y;
            sPositions.push(valuesX);
            sPositions.push(valuesY);
        });
        _.forEach(destination_links, function (dLink) {
            const valuesX = dLink.pos.x;
            const valuesY = dLink.pos.y;
            dPositions.push(valuesX);
            dPositions.push(valuesY);
        });
        _.forEach(controller_links, function (cLink) {
            const valuesX = cLink.pos.x;
            const valuesY = cLink.pos.y;
            cPositions.push(valuesX);
            cPositions.push(valuesY);
        });

        Memory.cache.roomPlan[roomName][SLINK] = map_codec.encode(sPositions);
        Memory.cache.roomPlan[roomName][DLINK] = map_codec.encode(dPositions);
        Memory.cache.roomPlan[roomName][CLINK] = map_codec.encode(cPositions);
    }
}

function roomContainerCacher(roomName){
    if(Game.time % 500 === 0){
        if (!this.roomPlan) {
            this.roomPlan = {};
        }
        if (!this.roomPlan[roomName]) {
            this.roomPlan[roomName] = {};
        }
        const sources = global.getSources(roomName);
        const containers = global.getCachedStructures(roomName, STRUCTURE_CONTAINER);
        const minerals = global.getCachedStructures(roomName, STRUCTURE_EXTRACTOR);
        let source_conts = [];
        let dest_conts = [];
        let controller_conts = [];
        let mineral_const = [];

        source_conts = containers.filter(container => {return sources.some(source => container.pos.inRangeTo(source.pos, 3));});
        controller_conts = containers.filter(container => {return container.pos.inRangeTo(Game.rooms[roomName].controller, 3);});
        dest_conts = containers.filter(container => {return !sources.some(source => container.pos.inRangeTo(source.pos, 3)) && !container.pos.inRangeTo(Game.rooms[roomName].controller, 3) && !minerals.some(mineral => container.pos.inRangeTo(mineral.pos, 3));});
        mineral_const = containers.filter(container => {return minerals.some(mineral => container.pos.inRangeTo(mineral.pos, 3));});

        let SCPositions = [];
        let DCPositions = [];
        let CCPositions = [];
        let MCPositions = [];
        _.forEach(source_conts, function (sCont) {
            const valuesX = sCont.pos.x;
            const valuesY = sCont.pos.y;
            SCPositions.push(valuesX);
            SCPositions.push(valuesY);
        });
        _.forEach(dest_conts, function (dCont) {
            const valuesX = dCont.pos.x;
            const valuesY = dCont.pos.y;
            DCPositions.push(valuesX);
            DCPositions.push(valuesY);
        });
        _.forEach(controller_conts, function (cCont) {
            const valuesX = cCont.pos.x;
            const valuesY = cCont.pos.y;
            CCPositions.push(valuesX);
            CCPositions.push(valuesY);
        });
        _.forEach(mineral_const, function (mCont) {
            const valuesX = mCont.pos.x;
            const valuesY = mCont.pos.y;
            MCPositions.push(valuesX);
            MCPositions.push(valuesY);
        });

        Memory.cache.roomPlan[roomName][SCONT] = map_codec.encode(SCPositions);
        Memory.cache.roomPlan[roomName][DCONT] = map_codec.encode(DCPositions);
        Memory.cache.roomPlan[roomName][CCONT] = map_codec.encode(CCPositions);
        Memory.cache.roomPlan[roomName][MCONT] = map_codec.encode(MCPositions);
    }
}

function labsCacher(roomName){
    if(Game.time % 500 === 0){
        if (!this.roomPlan) {
            this.roomPlan = {};
        }
        if (!this.roomPlan[roomName]) {
            this.roomPlan[roomName] = {};
        }
        const labs = global.getCachedStructures(roomName, STRUCTURE_LAB);
        let source_labs = [];
        let destination_labs = [];

        _.forEach(labs, function(lab){
            const lab1 = lab.room.lookForAt(LOOK_STRUCTURES, lab.pos.x+1, lab.pos.y+1).filter(s => s.structureType === STRUCTURE_LAB);
            const lab2 = lab.room.lookForAt(LOOK_STRUCTURES, lab.pos.x-1, lab.pos.y+1).filter(s => s.structureType === STRUCTURE_LAB);
            const lab3 = lab.room.lookForAt(LOOK_STRUCTURES, lab.pos.x-1, lab.pos.y-1).filter(s => s.structureType === STRUCTURE_LAB);
            const lab4 = lab.room.lookForAt(LOOK_STRUCTURES, lab.pos.x+1, lab.pos.y-1).filter(s => s.structureType === STRUCTURE_LAB);
            if((lab1.length > 0 && lab3.length > 0) || (lab2.length > 0 && lab4.length > 0)){
                source_labs.push(lab);
            }
        });
        destination_labs = labs.filter(s => !source_labs.includes(s));
        let sPositions = [];
        let dPositions = [];

        _.forEach(source_labs, function (sLab) {
            const valuesX = sLab.pos.x;
            const valuesY = sLab.pos.y;
            sPositions.push(valuesX);
            sPositions.push(valuesY);
        });
        _.forEach(destination_labs, function (dLab) {
            const valuesX = dLab.pos.x;
            const valuesY = dLab.pos.y;
            dPositions.push(valuesX);
            dPositions.push(valuesY);
        });

        Memory.cache.roomPlan[roomName][SLAB] = map_codec.encode(sPositions);
        Memory.cache.roomPlan[roomName][DLAB] = map_codec.encode(dPositions);
    }
}

global.getSourceLabs = function(roomName){
    if(!global.cache){
        global.cache = {};
    }
    if(!global.cache[roomName]){
        global.cache[roomName] = {};
    }
    if(!global.cache[roomName][SLAB]){
        if(!Memory.cache){
            return;
        }
        if(!Memory.cache.roomPlan){
            return;
        }
        if(!Memory.cache.roomPlan[roomName]){
            return;
        }
        const encodedData = Memory.cache.roomPlan[roomName][SLAB];
        if (!encodedData || encodedData === "0") {
            return [];
        }

        const coordinates = map_codec.decode(encodedData);

        let coordinatePairs = [];
        for (let i = 0; i < coordinates.length; i += 2) {
            if (coordinates[i + 1] !== undefined) {
                coordinatePairs.push({ x: coordinates[i], y: coordinates[i + 1] });
            }
        }

        let structures = [];
        for (let i = 0; i < coordinatePairs.length; i++) {
            const lookAtResult = Game.rooms[roomName].lookAt(coordinatePairs[i].x, coordinatePairs[i].y);

            const structure = lookAtResult.find(
                (s) => s.type === LOOK_STRUCTURES && s.structure.structureType === STRUCTURE_LAB
            );
            if (structure) {
                structures.push(structure.structure);
            }
        }

        global.cache[roomName][SLAB] = structures;
    }

    return global.cache[roomName][SLAB];
};

global.getDestLabs = function(roomName){
    if(!global.cache){
        global.cache = {};
    }
    if(!global.cache[roomName]){
        global.cache[roomName] = {};
    }
    if(!global.cache[roomName][DLAB]){
        if(!Memory.cache){
            return;
        }
        if(!Memory.cache.roomPlan){
            return;
        }
        if(!Memory.cache.roomPlan[roomName]){
            return;
        }
        const encodedData = Memory.cache.roomPlan[roomName][DLAB];
        if (!encodedData || encodedData === "0") {
            return [];
        }

        const coordinates = map_codec.decode(encodedData);

        let coordinatePairs = [];
        for (let i = 0; i < coordinates.length; i += 2) {
            if (coordinates[i + 1] !== undefined) {
                coordinatePairs.push({ x: coordinates[i], y: coordinates[i + 1] });
            }
        }

        let structures = [];
        for (let i = 0; i < coordinatePairs.length; i++) {
            const lookAtResult = Game.rooms[roomName].lookAt(coordinatePairs[i].x, coordinatePairs[i].y);

            const structure = lookAtResult.find(
                (s) => s.type === LOOK_STRUCTURES && s.structure.structureType === STRUCTURE_LAB
            );
            if (structure) {
                structures.push(structure.structure);
            }
        }

        global.cache[roomName][DLAB] = structures;
    }

    return global.cache[roomName][DLAB];
};

global.getControllerContainers = function(roomName){
    if(!global.cache){
        global.cache = {};
    }
    if(!global.cache[roomName]){
        global.cache[roomName] = {};
    }
    if(!global.cache[roomName][CCONT]){
        if(!Memory.cache){
            return;
        }
        if(!Memory.cache.roomPlan){
            return;
        }
        if(!Memory.cache.roomPlan[roomName]){
            return;
        }
        const encodedData = Memory.cache.roomPlan[roomName][CCONT];
        if (!encodedData || encodedData === "0") {
            return [];
        }

        const coordinates = map_codec.decode(encodedData);

        let coordinatePairs = [];
        for (let i = 0; i < coordinates.length; i += 2) {
            if (coordinates[i + 1] !== undefined) {
                coordinatePairs.push({ x: coordinates[i], y: coordinates[i + 1] });
            }
        }

        let structures = [];
        for (let i = 0; i < coordinatePairs.length; i++) {
            const lookAtResult = Game.rooms[roomName].lookAt(coordinatePairs[i].x, coordinatePairs[i].y);

            const structure = lookAtResult.find(
                (s) => s.type === LOOK_STRUCTURES && s.structure.structureType === STRUCTURE_CONTAINER
            );
            if (structure) {
                structures.push(structure.structure);
            }
        }

        global.cache[roomName][CCONT] = structures;
    }

    return global.cache[roomName][CCONT];
};

global.getSourceContainers = function(roomName){
    if(!global.cache){
        global.cache = {};
    }
    if(!global.cache[roomName]){
        global.cache[roomName] = {};
    }
    if(!global.cache[roomName][SCONT]){
        if(!Memory.cache){
            return;
        }
        if(!Memory.cache.roomPlan){
            return;
        }
        if(!Memory.cache.roomPlan[roomName]){
            return;
        }
        const encodedData = Memory.cache.roomPlan[roomName][SCONT];
        if (!encodedData || encodedData === "0") {
            return [];
        }

        const coordinates = map_codec.decode(encodedData);

        let coordinatePairs = [];
        for (let i = 0; i < coordinates.length; i += 2) {
            if (coordinates[i + 1] !== undefined) {
                coordinatePairs.push({ x: coordinates[i], y: coordinates[i + 1] });
            }
        }

        let structures = [];
        for (let i = 0; i < coordinatePairs.length; i++) {
            const lookAtResult = Game.rooms[roomName].lookAt(coordinatePairs[i].x, coordinatePairs[i].y);

            const structure = lookAtResult.find(
                (s) => s.type === LOOK_STRUCTURES && s.structure.structureType === STRUCTURE_CONTAINER
            );
            if (structure) {
                structures.push(structure.structure);
            }
        }

        global.cache[roomName][SCONT] = structures;
    }

    return global.cache[roomName][SCONT];
};

global.getMineralContainers = function(roomName){
    if(!global.cache){
        global.cache = {};
    }
    if(!global.cache[roomName]){
        global.cache[roomName] = {};
    }
    if(!global.cache[roomName][MCONT]){
        if(!Memory.cache){
            return;
        }
        if(!Memory.cache.roomPlan){
            return;
        }
        if(!Memory.cache.roomPlan[roomName]){
            return;
        }
        const encodedData = Memory.cache.roomPlan[roomName][MCONT];
        if (!encodedData || encodedData === "0") {
            return [];
        }

        const coordinates = map_codec.decode(encodedData);

        let coordinatePairs = [];
        for (let i = 0; i < coordinates.length; i += 2) {
            if (coordinates[i + 1] !== undefined) {
                coordinatePairs.push({ x: coordinates[i], y: coordinates[i + 1] });
            }
        }

        let structures = [];
        for (let i = 0; i < coordinatePairs.length; i++) {
            const lookAtResult = Game.rooms[roomName].lookAt(coordinatePairs[i].x, coordinatePairs[i].y);

            const structure = lookAtResult.find(
                (s) => s.type === LOOK_STRUCTURES && s.structure.structureType === STRUCTURE_CONTAINER
            );
            if (structure) {
                structures.push(structure.structure);
            }
        }

        global.cache[roomName][MCONT] = structures;
    }

    return global.cache[roomName][MCONT];
};

global.getDestContainers = function(roomName){
    if(!global.cache){
        global.cache = {};
    }
    if(!global.cache[roomName]){
        global.cache[roomName] = {};
    }
    if(!global.cache[roomName][DCONT]){
        if(!Memory.cache){
            return;
        }
        if(!Memory.cache.roomPlan){
            return;
        }
        if(!Memory.cache.roomPlan[roomName]){
            return;
        }
        const encodedData = Memory.cache.roomPlan[roomName][DCONT];
        if (!encodedData || encodedData === "0") {
            return [];
        }

        const coordinates = map_codec.decode(encodedData);

        let coordinatePairs = [];
        for (let i = 0; i < coordinates.length; i += 2) {
            if (coordinates[i + 1] !== undefined) {
                coordinatePairs.push({ x: coordinates[i], y: coordinates[i + 1] });
            }
        }

        let structures = [];
        for (let i = 0; i < coordinatePairs.length; i++) {
            const lookAtResult = Game.rooms[roomName].lookAt(coordinatePairs[i].x, coordinatePairs[i].y);

            const structure = lookAtResult.find(
                (s) => s.type === LOOK_STRUCTURES && s.structure.structureType === STRUCTURE_CONTAINER
            );
            if (structure) {
                structures.push(structure.structure);
            }
        }

        global.cache[roomName][DCONT] = structures;
    }

    return global.cache[roomName][DCONT];
};

global.getDestLinks = function(roomName){
    if(!global.cache){
        global.cache = {};
    }
    if(!global.cache[roomName]){
        global.cache[roomName] = {};
    }
    if(!global.cache[roomName][DLINK]){
        if(!Memory.cache){
            return;
        }
        if(!Memory.cache.roomPlan){
            return;
        }
        if(!Memory.cache.roomPlan[roomName]){
            return;
        }
        const encodedData = Memory.cache.roomPlan[roomName][DLINK];
        if (!encodedData || encodedData === "0") {
            return [];
        }

        const coordinates = map_codec.decode(encodedData);

        let coordinatePairs = [];
        for (let i = 0; i < coordinates.length; i += 2) {
            if (coordinates[i + 1] !== undefined) {
                coordinatePairs.push({ x: coordinates[i], y: coordinates[i + 1] });
            }
        }

        let structures = [];
        for (let i = 0; i < coordinatePairs.length; i++) {
            const lookAtResult = Game.rooms[roomName].lookAt(coordinatePairs[i].x, coordinatePairs[i].y);

            const structure = lookAtResult.find(
                (s) => s.type === LOOK_STRUCTURES && s.structure.structureType === STRUCTURE_LINK
            );
            if (structure) {
                structures.push(structure.structure);
            }
        }

        global.cache[roomName][DLINK] = structures;
    }

    return global.cache[roomName][DLINK];
};

global.getSourceLinks = function(roomName){
    if(!global.cache){
        global.cache = {};
    }
    if(!global.cache[roomName]){
        global.cache[roomName] = {};
    }
    if(!global.cache[roomName][SLINK]){
        if(!Memory.cache){
            return;
        }
        if(!Memory.cache.roomPlan){
            return;
        }
        if(!Memory.cache.roomPlan[roomName]){
            return;
        }
        const encodedData = Memory.cache.roomPlan[roomName][SLINK];
        if (!encodedData || encodedData === "0") {
            return [];
        }

        const coordinates = map_codec.decode(encodedData);

        let coordinatePairs = [];
        for (let i = 0; i < coordinates.length; i += 2) {
            if (coordinates[i + 1] !== undefined) {
                coordinatePairs.push({ x: coordinates[i], y: coordinates[i + 1] });
            }
        }

        let structures = [];
        for (let i = 0; i < coordinatePairs.length; i++) {
            const lookAtResult = Game.rooms[roomName].lookAt(coordinatePairs[i].x, coordinatePairs[i].y);

            const structure = lookAtResult.find(
                (s) => s.type === LOOK_STRUCTURES && s.structure.structureType === STRUCTURE_LINK
            );
            if (structure) {
                structures.push(structure.structure);
            }
        }

        global.cache[roomName][SLINK] = structures;
    }

    return global.cache[roomName][SLINK];
};

global.getControllerLinks = function(roomName){
    if(!global.cache){
        global.cache = {};
    }
    if(!global.cache[roomName]){
        global.cache[roomName] = {};
    }
    if(!global.cache[roomName][CLINK]){
        if(!Memory.cache){
            return;
        }
        if(!Memory.cache.roomPlan){
            return;
        }
        if(!Memory.cache.roomPlan[roomName]){
            return;
        }
        const encodedData = Memory.cache.roomPlan[roomName][CLINK];
        if (!encodedData || encodedData === "0") {
            return [];
        }
        
        const coordinates = map_codec.decode(encodedData);

        let coordinatePairs = [];
        for (let i = 0; i < coordinates.length; i += 2) {
            if (coordinates[i + 1] !== undefined) {
                coordinatePairs.push({ x: coordinates[i], y: coordinates[i + 1] });
            }
        }

        let structures = [];
        for (let i = 0; i < coordinatePairs.length; i++) {
            const lookAtResult = Game.rooms[roomName].lookAt(coordinatePairs[i].x, coordinatePairs[i].y);

            const structure = lookAtResult.find(
                (s) => s.type === LOOK_STRUCTURES && s.structure.structureType === STRUCTURE_LINK
            );
            if (structure) {
                structures.push(structure.structure);
            }
        }
        
        global.cache[roomName][CLINK] = structures;
    }

    return global.cache[roomName][CLINK];
};

global.getMinerals = function(roomName){
    if(!global.cache){
        global.cache = {};
    }
    if(!global.cache[roomName]){
        global.cache[roomName] = {};
    }
    if(!global.cache[roomName].minerals){
        const minerals = Game.rooms[roomName].find(FIND_MINERALS);
        if(minerals){
            global.cache[roomName].minerals = minerals;
        }
    }
    return global.cache[roomName].minerals;
}

// global.getSourceContainers = function(roomName){
//     if(!global.cache){
//         global.cache = {};
//     }
//     if(!global.cache[roomName]){
//         global.cache[roomName] = {};
//     }
//     if(!global.cache[roomName].sContainers){
//         if(!Memory.cache){
//             return;
//         }
//         if(!Memory.cache.roomPlan){
//             return;
//         }
//         if(!Memory.cache.roomPlan[roomName]){
//             return;
//         }
//         const sources = global.getSources(roomName);
//         const containers = global.getCachedStructures(roomName, STRUCTURE_CONTAINER).filter(container => {
//             return sources.some(source => container.pos.inRangeTo(source.pos, 3));
//         });

//         global.cache[roomName][SCONT] = containers;
//     }

//     return global.cache[roomName][SCONT];
// };

// global.getDestContainers = function(roomName){
//     if(!global.cache){
//         global.cache = {};
//     }
//     if(!global.cache[roomName]){
//         global.cache[roomName] = {};
//     }
//     if(!global.cache[roomName].sContainers){
//         if(!Memory.cache){
//             return;
//         }
//         if(!Memory.cache.roomPlan){
//             return;
//         }
//         if(!Memory.cache.roomPlan[roomName]){
//             return;
//         }
//         const sources = global.getSources(roomName);
//         const containers = global.getCachedStructures(roomName, STRUCTURE_CONTAINER).filter(container => {
//             return !sources.some(source => container.pos.inRangeTo(source.pos, 3)) && !container.pos.inRangeTo(!Game.rooms[roomName].controller, 3);
//         });

//         global.cache[roomName][DCONT] = containers;
//     }

//     return global.cache[roomName][DCONT];
// };

function findClosestHighwayRoom(roomName) {
    const { x, y } = getRoomCoordinates(roomName);

    function manhattanDistance(x1, y1, x2, y2) {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }

    const highwayRooms = [];

    highwayRooms.push({ x: 0, y });
    highwayRooms.push({ x: 30, y });

    highwayRooms.push({ x, y: 0 });
    highwayRooms.push({ x, y: 30 });

    let closestRoom = null;
    let minDistance = Infinity;

    for (const highway of highwayRooms) {
        const distance = manhattanDistance(x, y, highway.x, highway.y);
        if (distance < minDistance) {
            minDistance = distance;
            closestRoom = highway;
        }
    }

    if (closestRoom) {
        return getRoomNameFromCoordinates(closestRoom.x, closestRoom.y);
    }

    return null;
}

function getRoomCoordinates(roomName) {
    const match = roomName.match(/([WE])(\d+)([NS])(\d+)/);
    if (!match) {
        throw new Error(`Invalid room name: ${roomName}`);
    }

    const x = match[1] === 'W' ? -parseInt(match[2], 10) : parseInt(match[2], 10);
    const y = match[3] === 'N' ? parseInt(match[4], 10) : -parseInt(match[4], 10);

    return { x, y };
}

function getRoomNameFromCoordinates(x, y) {
    const xDir = x < 0 ? 'W' : 'E';
    const yDir = y < 0 ? 'S' : 'N';
    return `${xDir}${Math.abs(x)}${yDir}${Math.abs(y)}`;
}

function adjustCenterBP(roomName){
    if(!Memory.cache){
        return;
    }
    if(!Memory.cache.sourcePath){
        return;
    }
    if(!Memory.cache.sourcePath[roomName]){
        return;
    }
    const room = Game.rooms[roomName];
    let maxCenters = 1;
    let isAvailable = false;
    let sourcePath = Memory.cache.sourcePath[roomName];
    let BP = [];
    let pathLength = sourcePath.length;
    if(sourcePath.length != 0){
        const sources = global.getSources(roomName);
        if(sources.length > 2){
            pathLength *= 2;
        }
        while(!isAvailable){
            const CARRY_count = Math.ceil(pathLength / 2.5 / maxCenters);
            let MOVE_count = Math.ceil(CARRY_count / 2);
            if(sourcePath.length !== sourcePath.cost){
                MOVE_count = CARRY_count;
            }
            
            BP = [];
            for(let i = 0; i < MOVE_count; i++){
                BP.push(MOVE);
            }
            for(let i = 0; i < CARRY_count; i++){
                BP.push(CARRY);
            }
            // console.log(roomName,BP);
            let cost = BP.length * 50;
            if(cost > room.energyCapacityAvailable || BP.length > 50){
                maxCenters++;
            }
            else{
                isAvailable = true;
            }
        }
    }
    else{
        maxCenters = 1;
        BP = [MOVE, CARRY, CARRY];
    }
    return {
        maxCenters: maxCenters,
        CenterBP: BP
    };
}

function adjustUpgraderBP(roomName){
    let maxUpgraders = 1;
    let isAvailable = false;
    let BP = [CARRY,MOVE];
    const sources = global.getSources(roomName);
    let energyPerTick = 7.5;
    // let work_Count;
    if(sources.length == 2){
        energyPerTick = 15;
    }
    while(!isAvailable){
        BP = [CARRY,MOVE];
        for(let i = 0; i < energyPerTick; i++){
            BP.push(WORK);
            // work_Count++;
        }
        // for(let i = 0; i < energyPerTick; i++){
        //     BP.push(MOVE);
        // }
        // console.log(work_Count);
        // for(let j = 0; j < work_Count; j++){
        //     BP.push(MOVE);
        // }
        // console.log(roomName,BP);
        let cost = 0;
        _.forEach(BP, function(part){
            switch(part){
                case MOVE:
                    cost += 50;
                    break;
                case CARRY:
                    cost += 50;
                    break;
                case WORK:
                    cost += 100;
                    break;
        }});
        if(BP.length > 50 || cost > Game.rooms[roomName].energyCapacityAvailable){
            maxUpgraders++;
        }
        else{
            isAvailable = true;
        }
    }
    return {
        maxUpgraders: maxUpgraders,
        UpgraderBP: BP
    };
}

function adjustMinerBP(roomName){
    let maxMiners = 0;
    let BP = [MOVE];
    const mineral = global.getMinerals(roomName)
    if(mineral[0].mineralAmount > 0 && global.getMineralContainers(roomName)[0].store.getFreeCapacity() > 100){
        maxMiners = 1;
        let maxBP = 49;
        let isAvailable = false;
        const minerals = global.getCachedStructures(roomName, STRUCTURE_EXTRACTOR);
        while(!isAvailable){
            BP = [MOVE];
            for(let i = 0; i < maxBP; i++){
                BP.push(WORK);
            }
            let cost = 0;
            _.forEach(BP, function(part){
                switch(part){
                    case MOVE:
                        cost += 50;
                        break;
                    case WORK:
                        cost += 100;
                        break;
            }});
            if(BP.length > 50 || cost > Game.rooms[roomName].energyCapacityAvailable){
                maxBP--;
            }
            else{
                isAvailable = true;
            }
        }
    }
    return {
        maxMiners: maxMiners,
        MinerBP: BP
    };
}

CACHE_SPAWN();


function adjustMaxUpgradersByEnergy(maxUpgraders, roomName) {
    const storage = Game.rooms[roomName].storage;
    const terminal = Game.rooms[roomName].terminal;
    let totalEnergy = 0;
    if (storage) {
        totalEnergy += storage.store[RESOURCE_ENERGY] || 0;
    }
    if (terminal) {
        totalEnergy += terminal.store[RESOURCE_ENERGY] || 0;
    }
    const additionalUpgraders = Math.floor(totalEnergy / 25000);
    maxUpgraders = (maxUpgraders || 0) + additionalUpgraders;
    if(maxUpgraders < 1){
        maxUpgraders = 1;
    }
    return maxUpgraders;
}

function getRoomPriorityByControllerCompletion() {
    const rooms = Object.values(Game.rooms).filter(room => room.controller && room.controller.my);
    const roomCompletion = rooms.map(room => {
        const controller = room.controller;
        const progress = controller.progress || 0;
        const progressTotal = controller.progressTotal || 1;
        const completionPercentage = (progress / progressTotal) * 100;
        return { roomName: room.name, completionPercentage };
    });

    roomCompletion.sort((a, b) => b.completionPercentage - a.completionPercentage);

    return roomCompletion.map(room => room.roomName);
}
function getRoomPriorityBySourceCount(){
    const rooms = Object.values(Game.rooms).filter(room => room.controller && room.controller.my);
    const roomSources = rooms.map(room => {
        const sources = global.getSources(room.name);
        return { roomName: room.name, sourceCount: sources.length };
    });

    roomSources.sort((a, b) => a.sourceCount - b.sourceCount);

    return roomSources.map(room => room.roomName);
}

function readCreepRolesFromIntershardMemory(shard) {
    const intershardData = InterShardMemory.getRemote(shard);
    if (!intershardData) {
        console.log("No data in Intershard Memory.");
        return {};
    }

    const parsedData = JSON.parse(intershardData);
    return parsedData.creepRoles || {};
}

function getBaseLevel(activeExtensions) {
    const levelExtensions = [0, 5, 10, 20, 30, 40, 50, 60];
    
    for (let level = 8; level > 0; level--) {
        if (activeExtensions >= levelExtensions[level - 1]) {
            return level;
        }
    }
    return 0;
}

function findSafeRoute(originRoom, targetRoom) {
    const route = Game.map.findRoute(originRoom, targetRoom, {
        routeCallback(roomName, fromRoomName) {
            const room = Game.rooms[roomName];
            if (room) {
                const controller = room.controller;
                if (controller && controller.owner && !controller.my) {
                    // Avoid rooms with hostile controllers
                    return Infinity;
                }
            }
            // Default cost for rooms without hostile controllers
            return 1;
        }
    });

    if (route === ERR_NO_PATH) {
        console.log(`No safe route found from ${originRoom} to ${targetRoom}`);
        return null;
    }

    return route;
}

function getObjectSizeInBytes(obj) {
    const jsonString = JSON.stringify(obj);
    return Buffer.byteLength(jsonString, 'utf8');
}

global.getFreeSources = function(roomName, sourceId) {
    if (!global.sources) {
        global.sources = {};
    }
    if (!global.sources[roomName]) {
        global.sources[roomName] = {};
    }
    if (!global.sources[roomName][sourceId]) {
        global.sources[roomName][sourceId] = {};
    }
    if (!global.sources[roomName][sourceId].freePositions) {
        if (!Memory.cache) {
            return;
        }
        if (!Memory.cache.roomPlan) {
            return;
        }
        if (!Memory.cache.roomPlan[roomName]) {
            return;
        }
        const sources = global.getSources(roomName);
        const terrain = Game.map.getRoomTerrain(roomName);
        const freeSections = sources.map(source => {
            const freePositions = [];
            
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
        
                    const x = source.pos.x + dx;
                    const y = source.pos.y + dy;
        
                    if (terrain.get(x, y) !== TERRAIN_MASK_WALL) {
                        freePositions.push(new RoomPosition(x, y, roomName));
                    }
                }
            }
        
            return {
                sourceId: source.id,
                freePositions: freePositions
            };
        });

        freeSections.forEach(section => {
            global.sources[roomName][section.sourceId] = {
                freePositions: section.freePositions
            };
        });
    }

    return global.sources[roomName][sourceId].freePositions;
};

function calculateSourcePathLength(roomName, room_spawn) {
    if (Game.time % 500 === 0) {
        if (!Memory.cache) {
            return;
        }
        if (!Memory.cache.sourcePath) {
            Memory.cache.sourcePath = {};
        }
        if (!Memory.cache.sourcePath[roomName]) {
            Memory.cache.sourcePath[roomName] = {};
        }
        if (!Memory.cache.sourcePath[roomName].length) {
            Memory.cache.sourcePath[roomName].length = 0;
        }
        if (!Memory.cache.sourcePath[roomName].cost) {
            Memory.cache.sourcePath[roomName].cost = 0;
        }
        const sLinks = global.getSourceLinks(roomName);
        const dLinks = global.getDestLinks(roomName);
        const cLinks = global.getControllerLinks(roomName);
        const sources = global.getSources(roomName);
        // const links = global.getCachedStructures(roomName, STRUCTURE_LINK);
        if(sLinks && sLinks.length === sources.length && dLinks && dLinks.length > 0 && cLinks && cLinks.length > 0){
            Memory.cache.sourcePath[roomName].length = 0;
            Memory.cache.sourcePath[roomName].cost = 0;
            return;
        }
        // if (sLinks.length === sources.length) {
        //     Memory.cache.sourcePath[roomName].length = 0;
        //     Memory.cache.sourcePath[roomName].cost = 0;
        //     return;
        // }
        if (sources.length > 1) {
            const path = PathFinder.search(sources[0].pos, { pos: sources[1].pos, range: 1 }, { ignoreCreeps: true });
            Memory.cache.sourcePath[roomName].length = path.path.length;
            Memory.cache.sourcePath[roomName].cost = path.cost;
            return;
        }
        const destination_container = global.getDestContainers(roomName);
        const spawn = room_spawn;
        const controller = room_spawn.room.controller;
        let paths = [];
        let costs = [];
        _.forEach(sources, function(source) {
            let path;
            if (destination_container.length > 0) {
                path = PathFinder.search(source.pos, { pos: destination_container[0].pos, range: 1 }, { ignoreCreeps: true });
            } else {
                path = PathFinder.search(source.pos, { pos: spawn.pos, range: 1 }, { ignoreCreeps: true });
            }
            paths.push(path.path.length);
            costs.push(path.cost);

            if (controller) {
                path = PathFinder.search(source.pos, { pos: controller.pos, range: 1 }, { ignoreCreeps: true });
                paths.push(path.path.length);
                costs.push(path.cost);
            }
        });
        const maxPathLength = Math.max(...paths);
        const maxPathCost = Math.max(...costs);
        Memory.cache.sourcePath[roomName].length = maxPathLength;
        Memory.cache.sourcePath[roomName].cost = maxPathCost;
        return;
    }
}

function deltaEnergy(roomName) {
    if (!Memory.energyStats) {
        Memory.energyStats = {};
    }
    const room = Game.rooms[roomName];
    let energy = room.energyAvailable;
    const storage = room.storage;
    const terminal = room.terminal;
    if (storage) {
        energy += storage.store[RESOURCE_ENERGY] || 0;
    }
    if (terminal) {
        energy += terminal.store[RESOURCE_ENERGY] || 0;
    }
    if(!Memory.energyStats[roomName]){
        Memory.energyStats[roomName] = { lastValue: energy, totalDelta: 0 };
    }
    const towers = global.getCachedStructures(roomName, STRUCTURE_TOWER);
    _.forEach(towers, function(tower){
        energy += tower.store[RESOURCE_ENERGY];
    });
    
    const delta = Memory.energyStats[roomName].lastValue - energy;
    Memory.energyStats[roomName].totalDelta -= delta;
    Memory.energyStats[roomName].lastValue = energy;

    return {
        delta: Memory.energyStats[roomName].totalDelta,
        totalRoomEnergy: energy
    };
}

profiler.enable();
module.exports.loop = function() {
    dark_mode();
    // console.log(getRoomPriorityBySourceCount());
    // if(Game.shard.name === 'shard2'){console.log(Math.min(global.getFreeSources('E1N29', global.getSources('E1N29')[0].id).length,2));}   
    // console.log(findClosestHighwayRoom('E1N24'));
    //clearConsole();
    profiler.wrap(function() {
    Game.cpu.generatePixel();
    
    
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
        }
    }
    CACHE_SPAWN();
    console.log(`############### ROOM INFO ###############`);
    _.forEach(my_spawns, function(room_spawn){
        const roomName = room_spawn.room.name;
        roomPlanCacher(roomName);
        roomLinksCacher(roomName);
        roomContainerCacher(roomName);
        labsCacher(roomName);
        TowerCACHE(room_spawn);
        calculateSourcePathLength(roomName,room_spawn);



        //towers
        try{
        _.forEach(global.getCachedStructures(roomName, STRUCTURE_TOWER), function(tower){
            if(Enemies.get(room_spawn.room.name).length > 0) {
                var closestHostile = tower.pos.findClosestByRange(Enemies.get(room_spawn.room.name));
                    tower.attack(closestHostile);
            }else{
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
            }
        });
        } catch(e){
            console.log("Tower error");
            console.log(e);
            TowerCACHE(room_spawn);
        }

        //links
        //roomPlanCacher(room_spawn.room.name);

        const source_links = global.getSourceLinks(roomName);
        const destination_links = global.getDestLinks(roomName);
        const controller_links = global.getControllerLinks(roomName);
        const target_links = global.getDestLinks(roomName).concat(global.getControllerLinks(roomName));
        if(target_links){
            target_links.sort(function(a,b){return b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY];});
        }

        _.forEach(source_links, function(link){
            if(target_links.length > 0){
                _.forEach(target_links, function(t_link){
                    if(t_link.store.getFreeCapacity(RESOURCE_ENERGY) > 100){
                        link.transferEnergy(t_link);
                    }
                });
            }
        });
        // _.forEach(destination_links, function(d_link){
        //     if(controller_links.length > 0){
        //         _.forEach(controller_links, function(c_link){
        //             if(c_link.store.getFreeCapacity(RESOURCE_ENERGY) > 100){
        //                 d_link.transferEnergy(c_link);
        //             }
        //         });
        //     }
        // });

        //power_spawn
        var power_spawn = room_spawn.room.find(FIND_MY_STRUCTURES, {filter: (structure) => {return(structure.structureType == STRUCTURE_POWER_SPAWN) && structure.isActive() && structure.store[RESOURCE_POWER] > 0 && structure.store[RESOURCE_ENERGY] >= 50;}});
        if(power_spawn.length > 0){
            power_spawn[0].processPower();
        }

        
        let room_level = "L0";
        let Harvester_BP = [WORK,CARRY,MOVE];
        let maxHarvesters = 1;
        let Ugrader_BP = [WORK,CARRY,MOVE];
        let maxUpgraders = adjustMaxUpgradersByEnergy(1, roomName);
        let Builder_BP = [WORK,CARRY,CARRY,MOVE];
        let maxBuilders = 1;
        let maxCenters = 1;
        let CenterBP = [WORK,WORK,CARRY,MOVE];
        let maxTransferers = 0;
        let Trasnferer_BP = [CARRY,CARRY,MOVE,MOVE];
        let maxClaimers = 0;
        let Claimer_BP = [CLAIM, MOVE];
        let maxBuildersM = 0;
        let Builder_M_BP = [WORK,CARRY,MOVE];
        let maxHarvestersUpgr = 0;
        let HarvesterUpgr_BP = [WORK,CARRY,MOVE];
        let maxMiners = 0;
        let Miner_BP = [WORK,CARRY,MOVE];
        let maxMaintenancers = 0;
        let Maintenancer_BP = [WORK,CARRY,MOVE,MOVE];

        const Extensions = global.getCachedStructures(roomName, STRUCTURE_EXTENSION);
        const roomLevel = getBaseLevel(Extensions.length);
        switch(roomLevel){
            case 0:
                room_level = "L0";
                Harvester_BP = [WORK,CARRY,MOVE];
                maxHarvesters = 1;
                Ugrader_BP = [WORK,CARRY,MOVE];
                maxUpgraders = adjustMaxUpgradersByEnergy(1, roomName);
                Builder_BP = [WORK,CARRY,CARRY,MOVE];
                maxBuilders = 1;
                maxCenters = 1;
                CenterBP = [WORK,WORK,CARRY,MOVE];
                maxTransferers = 0;
                Trasnferer_BP = [CARRY,CARRY,MOVE,MOVE];
                maxClaimers = 0;
                Claimer_BP = [CLAIM, MOVE];
                maxBuildersM = 0;
                Builder_M_BP = [WORK,CARRY,MOVE];
                break;
            case 1:
                room_level = "L1";
                Harvester_BP = [WORK,WORK,CARRY,MOVE];
                maxHarvesters = Math.min(global.getFreeSources(roomName, global.getSources(roomName)[0].id).length,3);
                Ugrader_BP = [WORK,WORK,CARRY,MOVE];
                maxUpgraders = adjustMaxUpgradersByEnergy(3, roomName);
                Builder_BP = [WORK,CARRY,CARRY,MOVE];
                maxBuilders = 3;
                maxCenters = global.getSourceContainers(roomName).length || 1;
                CenterBP = [CARRY,MOVE,CARRY,MOVE,CARRY,MOVE];
                maxTransferers = 3;
                Trasnferer_BP = [CARRY,CARRY,MOVE,MOVE];
                maxClaimers = 0;
                Claimer_BP = [CLAIM, MOVE];
                maxBuildersM = 0;
                Builder_M_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
                break;
            case 2:
                room_level = "L2";
                Harvester_BP = [WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE];
                maxHarvesters = Math.min(global.getFreeSources(roomName, global.getSources(roomName)[0].id).length,2);
                Ugrader_BP = [WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE];
                maxUpgraders = adjustMaxUpgradersByEnergy(2, roomName);
                maxBuilders = 2;
                Builder_BP = [WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE];
                maxCenters = global.getSourceContainers(roomName).length || 1;
                CenterBP = [CARRY, MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE];
                maxTransferers = 0;
                Trasnferer_BP = [CARRY,CARRY,MOVE,MOVE];
                maxClaimers = 0;
                Claimer_BP = [CLAIM, MOVE];
                maxBuildersM = 0;
                Builder_M_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
                break;
            case 3:
                room_level = "L3";
                Harvester_BP = [WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE];
                maxHarvesters = Math.min(global.getFreeSources(roomName, global.getSources(roomName)[0].id).length,2);
                Ugrader_BP = [WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE];
                maxUpgraders = adjustMaxUpgradersByEnergy(2, roomName);
                Builder_BP = [WORK,WORK,CARRY,CARRY,MOVE,MOVE];
                maxBuilders = 1;
                maxCenters = global.getSourceContainers(roomName).length || 1;
                CenterBP = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];
                maxTransferers = 0;
                Trasnferer_BP = [CARRY,CARRY,MOVE,MOVE];
                maxClaimers = 0;
                Claimer_BP = [CLAIM, MOVE];
                maxBuildersM = 0;
                Builder_M_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
                break;
            case 4:
                room_level = "L4";
                Harvester_BP = [WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE];
                maxHarvesters = Math.min(global.getFreeSources(roomName, global.getSources(roomName)[0].id).length,1);
                Ugrader_BP = [WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE];   
                maxUpgraders = adjustMaxUpgradersByEnergy(2, roomName);
                Builder_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE];
                maxBuilders = 1;
                maxCenters = global.getSourceContainers(roomName).length || 1;
                CenterBP = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];
                maxTransferers = 0;
                Trasnferer_BP = [CARRY,CARRY,MOVE,MOVE];
                maxClaimers = 0;
                Claimer_BP = [CLAIM, MOVE];
                maxBuildersM = 0;
                Builder_M_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
                break;
            case 5:
                room_level = "L5";
                Harvester_BP = [WORK,WORK,WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE];
                maxHarvesters = Math.min(global.getFreeSources(roomName, global.getSources(roomName)[0].id).length,1);
                Ugrader_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
                maxUpgraders = adjustMaxUpgradersByEnergy(1, roomName);
                Builder_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
                maxBuilders = 1;
                maxCenters = global.getSourceContainers(roomName).concat(global.getSourceLinks(roomName)).length || 1;
                CenterBP = [MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];
                maxTransferers = 0;
                Trasnferer_BP = [CARRY,CARRY,MOVE,MOVE];
                maxClaimers = 0;
                Claimer_BP = [CLAIM, MOVE];
                maxBuildersM = 0;
                Builder_M_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
                break;
            case 6:
                room_level = "L6";
                Harvester_BP = [WORK,WORK,WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE]
                maxHarvesters = Math.min(global.getFreeSources(roomName, global.getSources(roomName)[0].id).length,1);
                Ugrader_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
                maxUpgraders = adjustMaxUpgradersByEnergy(1, roomName);
                Builder_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE];
                maxBuilders = 1;
                maxCenters = global.getSourceContainers(roomName).concat(global.getSourceLinks(roomName)).length || 1;
                CenterBP = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];
                maxTransferers = 0;
                Trasnferer_BP = [CARRY,CARRY,MOVE,MOVE];
                maxClaimers = 0;
                Claimer_BP = [CLAIM, MOVE];
                maxBuildersM = 0;
                Builder_M_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
                break;
            case 7:
                room_level = "L7";
                Harvester_BP = [WORK,WORK,WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE]
                maxHarvesters = Math.min(global.getFreeSources(roomName, global.getSources(roomName)[0].id).length,1);
                Ugrader_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE];
                maxUpgraders = adjustMaxUpgradersByEnergy(1, roomName);
                Builder_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE];
                maxBuilders = 1;
                maxCenters = global.getSourceContainers(roomName).concat(global.getSourceLinks(roomName)).length || 1;
                CenterBP = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];
                maxTransferers = 0;
                Trasnferer_BP = [CARRY,CARRY,MOVE,MOVE];
                maxClaimers = 0;
                Claimer_BP = [CLAIM, MOVE];
                maxBuildersM = 0;
                Builder_M_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
                break;
            case 8:
                room_level = "L8";
                Harvester_BP = [WORK,WORK,WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE];
                maxHarvesters = Math.min(global.getFreeSources(roomName, global.getSources(roomName)[0].id).length,2);
                Ugrader_BP = [WORK,CARRY,MOVE];
                maxUpgraders = 1;
                Builder_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE];
                maxBuilders = 1;
                maxCenters = global.getSourceContainers(roomName).length || 1;
                CenterBP = [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
                maxTransferers = 1;
                Trasnferer_BP = [CARRY,CARRY,MOVE,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE];
                maxClaimers = 0;
                Claimer_BP = [CLAIM, MOVE];
                maxBuildersM = 0;
                Builder_M_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
                break;
        }
        if(global.getSources(roomName).length > 1){
            maxHarvestersUpgr = Math.min(global.getFreeSources(roomName, global.getSources(roomName)[1].id).length,maxHarvesters);
            HarvesterUpgr_BP = Harvester_BP;
        }
        else{
            maxHarvestersUpgr = 0;
        }
        const CenterInfo = adjustCenterBP(roomName);
        maxCenters = CenterInfo.maxCenters;
        CenterBP = CenterInfo.CenterBP;
        const UpgraderInfo = adjustUpgraderBP(roomName);
        maxUpgraders = UpgraderInfo.maxUpgraders;
        Ugrader_BP = UpgraderInfo.UpgraderBP;
        if(global.getMineralContainers(roomName).length > 0){
            const MinerInfo = adjustMinerBP(roomName);
            maxMiners = MinerInfo.maxMiners;
            Miner_BP = MinerInfo.MinerBP;
        }
        if(global.getCachedStructures(roomName, STRUCTURE_ROAD).filter(s => s.hits < 1500).length > 0){
            maxMaintenancers = 1;
        }


        try{
            render_room(room_spawn, maxHarvesters, maxUpgraders, maxBuilders, maxHarvestersUpgr, maxTransferers, maxCenters, maxMiners);
        }catch(e){
            // console.log("визуалки опять наебнулись");
            // console.log(e);
        }
        var spawn_list = [];
        if(room_spawn.spawnCreep() != 0){
            spawn_list = global.getCachedStructures(roomName, STRUCTURE_SPAWN);
        }
        else {
            spawn_list = room_spawn;
        }
        if(spawn_list.length == 0){
            spawn_list[0] = room_spawn;
        }

        CACHE_CREEPS(room_spawn);
        _.forEach(spawn_list, function(room_spawn){
            let status = 'NaN';
            var testIfCanSpawn = room_spawn.spawnCreep(Harvester_BP, 'dry',{ dryRun: true });
            var testIfCanSpawnC = room_spawn.spawnCreep(CenterBP, 'dry',{ dryRun: true });

            var harvesters = Harvesters.get(room_spawn.room.name);
            var reserve_harvesters = ReserveHarvesters.get(room_spawn.room.name);
            var upgraders = Upgraders.get(room_spawn.room.name);
            var builders = Builders.get(room_spawn.room.name);
            var transfers = Transfers.get(room_spawn.room.name);
            var centers = Centers.get(room_spawn.room.name);
            var harvester_upgr = HarvesterUpgr.get(room_spawn.room.name);
            var miners = Miners.get(room_spawn.room.name);
            var maintainers = Maintainers.get(room_spawn.room.name);

            if((harvesters.length - reserve_harvesters.length) < maxHarvesters && testIfCanSpawn == 0){
                var newHarvesterName = 'H_2.0_' + Game.time + "_" + room_spawn.room + "_" + room_level;
                status = room_spawn.spawnCreep(Harvester_BP, newHarvesterName,
                    {memory: {role: 'harvester'}});
            }
            if(upgraders.length < maxUpgraders && (harvesters.length >= maxHarvesters && centers.length >= maxCenters) && testIfCanSpawn == 0){
                var newUpgraderName = 'U_2.0_' + Game.time + "_" + room_spawn.room + "_" + room_level;
                status = room_spawn.spawnCreep(Ugrader_BP, newUpgraderName,
                    {memory: {role: 'upgrader'}});
            }
            if(builders.length < maxBuilders && harvesters.length >= maxHarvesters && global.getConstructionSites(room_spawn.room.name).length > 0 && upgraders.length >= maxUpgraders && testIfCanSpawn == 0 && reserve_harvesters.length == 0){
                var newBuilderName = 'B_2.0_' + Game.time + "_" + room_spawn.room + "_" + room_level;
                status = room_spawn.spawnCreep(Builder_BP, newBuilderName,
                    {memory: {role: 'builder'}});
            }
            if(transfers.length < maxTransferers && harvesters.length == maxHarvesters && global.getCachedStructures(roomName, STRUCTURE_POWER_SPAWN).length > 0 && upgraders.length == maxUpgraders && testIfCanSpawn == 0 && reserve_harvesters.length == 0){
                var newTransferName = 'T_2.0_' + Game.time + "_" + room_spawn.room + "_" + room_level;
                status = room_spawn.spawnCreep(Trasnferer_BP, newTransferName,
                    {memory: {role: 'transfer'}});
            }
            if(miners.length < maxMiners && harvesters.length == maxHarvesters && global.getCachedStructures(roomName, STRUCTURE_EXTRACTOR).length > 0 && upgraders.length == maxUpgraders && testIfCanSpawn == 0 && reserve_harvesters.length == 0){
                var newMinerName = 'M_2.0_' + Game.time + "_" + room_spawn.room + "_" + room_level;
                status = room_spawn.spawnCreep(Miner_BP, newMinerName,
                    {memory: {role: 'miner'}});
            }
            if(maintainers.length < maxMaintenancers && harvesters.length == maxHarvesters && upgraders.length == maxUpgraders && testIfCanSpawn == 0 && reserve_harvesters.length == 0){
                var newMaintainerName = 'R_2.0_' + Game.time + "_" + room_spawn.room + "_" + room_level;
                status = room_spawn.spawnCreep(Maintenancer_BP, newMaintainerName,
                    {memory: {role: 'maintainer'}});
            }
            if(centers.length < maxCenters && /*global.getCachedStructures(roomName, STRUCTURE_LINK).concat(getCachedStructures(roomName, STRUCTURE_CONTAINER)).length >= 1 &&*/ testIfCanSpawnC == 0 && testIfCanSpawn == 0){
                var newCenterName = 'C_2.0_' + Game.time + "_" + room_spawn.room + "_" + room_level;
                status = room_spawn.spawnCreep(CenterBP, newCenterName,
                    {memory: {role: 'center'}});
            }
            if(harvester_upgr.length < maxHarvestersUpgr && harvesters.length == maxHarvesters && global.getSources(room_spawn.room.name).length >= 2 && testIfCanSpawn == 0 && upgraders.length >= maxUpgraders) {
                var newHarvesterUpgrName = 'HU_2.0_' + Game.time + "_" + room_spawn.room + "_" + room_level;
                status = room_spawn.spawnCreep(HarvesterUpgr_BP, newHarvesterUpgrName,
                    {memory: {role: 'harvester_upgr'}});
            }
            if(harvesters.length < 1 && centers.length == 0 && testIfCanSpawn != 0){
                var newHarvesterName = 'H_2.0_' + Game.time + "_" + room_spawn.room + "_" + room_level;
                status = room_spawn.spawnCreep([WORK,CARRY,MOVE], newHarvesterName,
                    {memory: {role: 'harvester'}});
            }
            if(centers.length < 1 && centers.length < maxCenters && (testIfCanSpawn == -6 || testIfCanSpawnC == -6) && reserve_harvesters.length > 0){
                var newCenterName = 'C_2.0_' + Game.time + "_" + room_spawn.room + "_" + room_level;
                status = room_spawn.spawnCreep([CARRY,MOVE,CARRY,MOVE,CARRY,MOVE], newCenterName,
                    {memory: {role: 'center'}});
            }

            var claimers = _.filter(Game.creeps, (creep) => creep.memory.role === 'claimer');
            if(claimers.length < maxClaimers && harvesters.length == maxHarvesters && testIfCanSpawn == 0 && reserve_harvesters.length == 0){
                var newClaimerName = 'C_2.0_' + Game.time + "_" + room_spawn.room + "_" + room_level;
                status = room_spawn.spawnCreep(Claimer_BP, newClaimerName,
                    {memory: {role: 'claimer'}});
            }
            var builders_m = _.filter(Game.creeps, (creep) => creep.memory.role === 'builder_m');
            if(builders_m.length < maxBuildersM && harvesters.length == maxHarvesters && testIfCanSpawn == 0 && reserve_harvesters.length == 0){
                var newBuilderMName = 'BM_2.0_' + Game.time + "_" + room_spawn.room + "_" + room_level;
                status = room_spawn.spawnCreep(Builder_M_BP, newBuilderMName,
                    {memory: {role: 'builder_m'}});
            }
            var remoteClaimers = _.filter(Game.creeps, (creep) => creep.memory.role === 'remote_claimer');
            if(Object.values(Memory.ClaimingRooms).includes(roomName) && remoteClaimers.length < 0 && harvesters.length == maxHarvesters && testIfCanSpawn == 0 && reserve_harvesters.length == 0){
                var newName = 'RC_2.0_' + Game.time + "_" + room_spawn.room + "_" + room_level;
                status = room_spawn.spawnCreep([MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY], newName,
                    {memory: {role: 'remote_claimer'}});
            }

            // console.log(roomName, status);
       });


    //terminals
    if(Game.time % 10 == 1){
        // const priorityRooms = getRoomPriorityBySourceCount();
        // if(Game.rooms[roomName].terminal != undefined){
        //     const terminal = Game.rooms[roomName].terminal;
        //     // if(Game.resources[PIXEL] >= 0) {
        //         // var orders = Game.market.getAllOrders(order => order.resourceType == PIXEL &&
        //                                             //   order.type == ORDER_BUY);
        //                                             //   orders.sort(function(a,b){return b.price - a.price;});
        //         // if(orders.length != 0){
        //                 // if(orders[0].amount > Game.resources[PIXEL]){
        //                     // var result = Game.market.deal(orders[0].id, Game.resources[PIXEL]);
        //                 // }
        //                 // else{
        //                     // var result = Game.market.deal(orders[0].id, orders[0].amount);
        //                 // }
        //         // }
        //     // }
            
        //     if(global.getCachedStructures(roomName, STRUCTURE_POWER_SPAWN).length > 0){
        //             if(terminal.store[RESOURCE_POWER] <= 1000) {
        //                 var orders = Game.market.getAllOrders(order => order.resourceType == RESOURCE_POWER &&
        //                                                       order.type == ORDER_SELL &&
        //                                                       Game.market.calcTransactionCost(terminal.store[RESOURCE_POWER], terminal.room.name, order.roomName) < 200000
        //                                                     );
        //                                                     orders.sort(function(a,b){return a.price - b.price;});
        //                 if(orders.length != 0){
        //                             var result = Game.market.deal(orders[0].id, orders[0].amount, terminal.room.name);
        //                 }
        //             }
        //     }
            
        //     if(terminal.store[RESOURCE_ENERGY] >= 50000 && global.getSources(roomName).length > 1){
        //         let targetRoom = {};
        //         for(let i = 0; i < priorityRooms.length; i++){
        //             targetRoom = {};
        //             if(roomName != priorityRooms[i] && Game.rooms[priorityRooms[i]].terminal != undefined && Game.rooms[priorityRooms[i]].terminal.store[RESOURCE_ENERGY] < 100000){
        //                 targetRoom = priorityRooms[i];
        //                 break;
        //             }
        //         }
        //         if(targetRoom != {}){
        //             if(Game.rooms[targetRoom].terminal.store.getFreeCapacity(RESOURCE_ENERGY) > terminal.store[RESOURCE_ENERGY]){
        //                 terminal.send(RESOURCE_ENERGY, (terminal.store[RESOURCE_ENERGY]*0.75), targetRoom);
        //             }
        //             else{
        //                 terminal.send(RESOURCE_ENERGY, Game.rooms[targetRoom].terminal.store.getFreeCapacity(RESOURCE_ENERGY), targetRoom);
        //             }
        //         }
        //         else{
        //             if(terminal.store[RESOURCE_ENERGY] >= 50000){
        //                 var orders = Game.market.getAllOrders(order => order.resourceType == RESOURCE_ENERGY &&
        //                     order.type == ORDER_BUY &&
        //                     Game.market.calcTransactionCost(terminal.store[RESOURCE_ENERGY], terminal.room.name, order.roomName) < 200000
        //                     );
        //                     orders.sort(function(a,b){return b.price - a.price;});
        //                     if(orders.length != 0){
        //                     var result = Game.market.deal(orders[0].id, orders[0].amount, terminal.room.name);
        //                     }
        //                 }
        //             }
        //         }
        //     // else{
        //         if(terminal.store[RESOURCE_ENERGY] >= 200000){ {
        //             var orders = Game.market.getAllOrders(order => order.resourceType == RESOURCE_ENERGY &&
        //                 order.type == ORDER_BUY &&
        //                 Game.market.calcTransactionCost(terminal.store[RESOURCE_ENERGY], terminal.room.name, order.roomName) < 200000
        //                 );
        //                 orders.sort(function(a,b){return b.price - a.price;});
        //                 if(orders.length != 0){
        //                 var result = Game.market.deal(orders[0].id, orders[0].amount, terminal.room.name);
        //                 }
        //             }
        //         }
            
        //         if(terminal.room.find(FIND_MY_STRUCTURES, {
        //             filter: (structure) => {
        //                 return(structure.structureType == STRUCTURE_NUKER) &&
        //                 structure.isActive() && structure.store[RESOURCE_GHODIUM] < 5000;
        //             }}).length > 0){
        //                 if(terminal.store[RESOURCE_GHODIUM] <= 1000) {
        //                     var orders = Game.market.getAllOrders(order => order.resourceType == RESOURCE_GHODIUM &&
        //                                                           order.type == ORDER_SELL &&
        //                                                           Game.market.calcTransactionCost(terminal.store[RESOURCE_GHODIUM], terminal.room.name, order.roomName) < 200000
        //                                                         );
        //                     if(orders.length != 0){
        //                                 var result = Game.market.deal(orders[0].id, orders[0].amount, terminal.room.name);
        //                     }
        //                 }
        //             }
        //     }
        // // }
    
        }
    });
    // console.log(InterShardMemory.getLocal());
    if(Game.shard.name === 'shard3'){
        // InterShardMemory.setLocal("{}");
    }
    if(Game.shard.name === 'shard2'){
        for(var name in Game.creeps){
            // console.log(name);
            const creep = Game.creeps[name];
            if(!creep.memory.role){const data = JSON.parse(InterShardMemory.getRemote('shard3') || "{}");try{creep.memory.role = data.creepRoles[name].role;}catch{}}
            // console.log(creep);
            // console.log(creep.name);
            // console.log(creep.memory.role);
            
            // console.log(JSON.stringify(data));
            // console.log(data.creepRoles[name]);
            // console.log(data.creepRoles[name].role);
        }
        // console.log(readCreepRolesFromIntershardMemory('shard3'));
        // var data = JSON.parse(InterShardMemory.getRemote('shard3') || "{}");
        // console.log(data.creepRoles);
    }
    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        if(creep.memory.role == 'harvester') {
            roleHarvester.run(creep);
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
        if(creep.memory.role == 'remote_claimer') {
            roleRemoteClaimer.run(creep);
        }
        if(creep.memory.role == 'maintainer') {
            roleMaintainer.run(creep);
        }
    }
render();
global.cache = {};
});
}
    
