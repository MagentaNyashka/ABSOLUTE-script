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
const SCONT = "sourceContainers";
const DCONT = "destinationContainers";
const CCONT = "controllerContainers";

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

function render_room(room_spawn, maxHarvesters, maxUpgraders, maxBuilders, maxHarvestersUpgr, maxTransferers, maxCenters){
    const roomName = room_spawn.room.name;
    new RoomVisual(roomName)
            .text('Sources ' + global.getSources(roomName).length, 36, 3.2, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
            .text('Extentions ' + global.getCachedStructures(roomName, STRUCTURE_EXTENSION).length, 36, 3.8, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
            .text('Harvesters ' + Harvesters.get(room_spawn.room.name).length + '(' + ReserveHarvesters.get(room_spawn.room.name).length + ')' + '/' + maxHarvesters + '+' + HarvesterUpgr.get(room_spawn.room.name).length + "/" + maxHarvestersUpgr, 36, 4.4, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
            .text('Upgraders ' + Upgraders.get(room_spawn.room.name).length + '/' + maxUpgraders, 36, 5, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
            .text('Centers ' + Centers.get(room_spawn.room.name).length + '/' + maxCenters, 36, 5.6, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
            .text('Builders ' + Builders.get(room_spawn.room.name).length + '/' + maxBuilders, 36, 6.2, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
            .text('Transferers ' + Transfers.get(room_spawn.room.name).length + '/' + maxTransferers, 36, 6.8, {align: 'left', color: '#808080',stroke: '#000000', strokeWidth:0.05, font: 0.5})
            ;
    const sources = global.getSources(room_spawn.room.name);
    for(let i = 0; i < sources.length; i++){
        new RoomVisual(room_spawn.room.name).text(sources[i].energy + "/" + sources[i].energyCapacity, sources[i].pos.x+0.6, sources[i].pos.y+0.15, {align: 'left', color:'#dec15a', stroke: '#000000', strokeWidth: 0.1, font: 0.5})
        .text(sources[i].ticksToRegeneration, sources[i].pos.x-0.6, sources[i].pos.y+0.15, {align: 'right', color:'#dec15a', stroke: '#000000', strokeWidth: 0.1, font: 0.5})
        ;
    }
    const percentage = room_spawn.room.controller.progress/room_spawn.room.controller.progressTotal*100;
    new RoomVisual(roomName).text(room_spawn.room.controller.progress + "/" + room_spawn.room.controller.progressTotal, room_spawn.room.controller.pos.x+0.7, room_spawn.room.controller.pos.y+0.15, {align: 'left', color:'#ffffff', stroke: '#000000', strokeWidth: 0.1, font: 0.5})
    .text(percentage.toFixed(2) + "%", room_spawn.room.controller.pos.x+0.7, room_spawn.room.controller.pos.y+0.75, {align: 'left', color:'#ffffff', stroke: '#000000', strokeWidth: 0.1, font: 0.5})
    ;

    console.log(`${roomName} ${getControllerProgressBar(room_spawn.room.controller)}`);
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
    if (Game.time % 500 === 0) {
        Game.notify(`roomPlanCacher inprogress for room ${Game.shard.name}:[${roomName}]`);
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
        // console.log(`No cached data available for room: ${roomName}`);
        return [];
    }
    if (!global.cache) {
        global.cache = {};
    }
    if (!global.cache[roomName]) {
        global.cache[roomName] = {};
    }
    if (!global.cache[roomName][structureType]) {
        // console.log(`structure caching in progress for [${roomName}][${structureType}]...`);
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

        _.forEach(links, function(link) {
            var closest_source = link.pos.findClosestByRange(sources);
            if (link.pos.getRangeTo(closest_source) < 3) {
                source_links.push(link);
            } else {
                destination_links.push(link);
            }
        });
        let sPositions = [];
        let dPositions = [];
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

        Memory.cache.roomPlan[roomName][SLINK] = map_codec.encode(sPositions);
        Memory.cache.roomPlan[roomName][DLINK] = map_codec.encode(dPositions);
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
        let source_conts = [];
        let dest_conts = [];
        let controller_conts = [];

        source_conts = containers.filter(container => {return sources.some(source => container.pos.inRangeTo(source.pos, 3));});
        controller_conts = containers.filter(container => {return container.pos.inRangeTo(Game.rooms[roomName].controller, 3);});
        dest_conts = containers.filter(container => {return !sources.some(source => container.pos.inRangeTo(source.pos, 3)) && !container.pos.inRangeTo(Game.rooms[roomName].controller, 3);});
        let SCPositions = [];
        let DCPositions = [];
        let CCPositions = [];
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

        Memory.cache.roomPlan[roomName][SCONT] = map_codec.encode(SCPositions);
        Memory.cache.roomPlan[roomName][DCONT] = map_codec.encode(DCPositions);
        Memory.cache.roomPlan[roomName][CCONT] = map_codec.encode(CCPositions);
    }
}

global.getControllerContainers = function(roomName){
    if(!global.cache){
        global.cache = {};
    }
    if(!global.cache[roomName]){
        global.cache[roomName] = {};
    }
    if(!global.cache[roomName].cContainers){
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
    if(!global.cache[roomName].cContainers){
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

global.getDestContainers = function(roomName){
    if(!global.cache){
        global.cache = {};
    }
    if(!global.cache[roomName]){
        global.cache[roomName] = {};
    }
    if(!global.cache[roomName].cContainers){
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
    if(!global.cache[roomName].dLinks){
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
    if(!global.cache[roomName].sLinks){
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

profiler.enable();
module.exports.loop = function() {
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
        TowerCACHE(room_spawn);

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
        if(destination_links){
            destination_links.sort(function(a,b){return b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY];});
        }

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
                Harvester_BP = [WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE];
                maxHarvesters = Math.min(global.getFreeSources(roomName, global.getSources(roomName)[0].id).length,1);
                Ugrader_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
                maxUpgraders = adjustMaxUpgradersByEnergy(1, roomName);
                Builder_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
                maxBuilders = 1;
                maxCenters = global.getSourceContainers(roomName).length || 1;
                CenterBP = [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
                maxTransferers = 0;
                Trasnferer_BP = [CARRY,CARRY,MOVE,MOVE];
                maxClaimers = 0;
                Claimer_BP = [CLAIM, MOVE];
                maxBuildersM = 0;
                Builder_M_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
                break;
            case 6:
                room_level = "L6";
                Harvester_BP = [WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE]
                maxHarvesters = Math.min(global.getFreeSources(roomName, global.getSources(roomName)[0].id).length,1);
                Ugrader_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
                maxUpgraders = adjustMaxUpgradersByEnergy(1, roomName);
                Builder_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE];
                maxBuilders = 1;
                maxCenters = global.getSourceContainers(roomName).length || 1;
                CenterBP = [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
                maxTransferers = 0;
                Trasnferer_BP = [CARRY,CARRY,MOVE,MOVE];
                maxClaimers = 0;
                Claimer_BP = [CLAIM, MOVE];
                maxBuildersM = 0;
                Builder_M_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
                break;
            case 7:
                room_level = "L7";
                Harvester_BP = [WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE]
                maxHarvesters = Math.min(global.getFreeSources(roomName, global.getSources(roomName)[0].id).length,1);
                Ugrader_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE];
                maxUpgraders = adjustMaxUpgradersByEnergy(1, roomName);
                Builder_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE];
                maxBuilders = 1;
                maxCenters = global.getSourceContainers(roomName).length || 1;
                CenterBP = [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
                maxTransferers = 0;
                Trasnferer_BP = [CARRY,CARRY,MOVE,MOVE];
                maxClaimers = 0;
                Claimer_BP = [CLAIM, MOVE];
                maxBuildersM = 0;
                Builder_M_BP = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
                break;
            case 8:
                room_level = "L8";
                Harvester_BP = [WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE];
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
        try{
            render_room(room_spawn, maxHarvesters, maxUpgraders, maxBuilders, maxHarvestersUpgr, maxTransferers, maxCenters);
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
            if(upgraders.length < maxUpgraders && (harvesters.length >= maxHarvesters && centers.length >= maxCenters) && testIfCanSpawn == 0){
                var newUpgraderName = 'U_2.0_' + Game.time + "_" + room_spawn.room + "_" + room_level;
                room_spawn.spawnCreep(Ugrader_BP, newUpgraderName,
                    {memory: {role: 'upgrader'}});
            }
            if(builders.length < maxBuilders && harvesters.length == maxHarvesters && global.getConstructionSites(room_spawn.room.name).length > 0 && upgraders.length == maxUpgraders && testIfCanSpawn == 0 && reserve_harvesters.length == 0){
                var newBuilderName = 'B_2.0_' + Game.time + "_" + room_spawn.room + "_" + room_level;
                room_spawn.spawnCreep(Builder_BP, newBuilderName,
                    {memory: {role: 'builder'}});
            }
            if(transfers.length < maxTransferers && harvesters.length == maxHarvesters && global.getCachedStructures(roomName, STRUCTURE_POWER_SPAWN).length > 0 && upgraders.length == maxUpgraders && testIfCanSpawn == 0 && reserve_harvesters.length == 0){
                var newTransferName = 'T_2.0_' + Game.time + "_" + room_spawn.room + "_" + room_level;
                room_spawn.spawnCreep(Trasnferer_BP, newTransferName,
                    {memory: {role: 'transfer'}});
            }
            if(centers.length < maxCenters && /*global.getCachedStructures(roomName, STRUCTURE_LINK).concat(getCachedStructures(roomName, STRUCTURE_CONTAINER)).length >= 1 &&*/ testIfCanSpawnC == 0 && testIfCanSpawn == 0){
                var newCenterName = 'C_2.0_' + Game.time + "_" + room_spawn.room + "_" + room_level;
                room_spawn.spawnCreep(CenterBP, newCenterName,
                    {memory: {role: 'center'}});
            }
            if(harvester_upgr.length < maxHarvestersUpgr && harvesters.length == maxHarvesters && global.getSources(room_spawn.room.name).length >= 2 && testIfCanSpawn == 0 && upgraders.length == maxUpgraders) {
                var newHarvesterUpgrName = 'HU_2.0_' + Game.time + "_" + room_spawn.room + "_" + room_level;
                room_spawn.spawnCreep(HarvesterUpgr_BP, newHarvesterUpgrName,
                    {memory: {role: 'harvester_upgr'}});
            }
            if(harvesters.length < 1 && testIfCanSpawn != 0){
                var newHarvesterName = 'H_2.0_' + Game.time + "_" + room_spawn.room + "_" + room_level;
                room_spawn.spawnCreep([WORK,CARRY,MOVE], newHarvesterName,
                    {memory: {role: 'harvester'}});
            }
            if(centers.length < 1 && centers.length < maxCenters && (testIfCanSpawn == -6 || testIfCanSpawnC == -6)){
                var newCenterName = 'C_2.0_' + Game.time + "_" + room_spawn.room + "_" + room_level;
                room_spawn.spawnCreep([CARRY,MOVE,CARRY,MOVE], newCenterName,
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
            var remoteClaimers = _.filter(Game.creeps, (creep) => creep.memory.role === 'remote_claimer');
            if(remoteClaimers.length < 0 && harvesters.length == maxHarvesters && testIfCanSpawn == 0 && reserve_harvesters.length == 0 && room_spawn.room.controller.level == 8){
                var newName = 'RC_2.0_' + Game.time + "_" + room_spawn.room + "_" + room_level;
                room_spawn.spawnCreep([MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY], newName,
                    {memory: {role: 'remote_claimer'}});
            }

       });


    //terminals
    if(Game.time % 10 == 1){
        const priorityRooms = getRoomPriorityByControllerCompletion();
        if(Game.rooms[roomName].terminal != undefined){
            const terminal = Game.rooms[roomName].terminal;
            // if(Game.resources[PIXEL] >= 0) {
                // var orders = Game.market.getAllOrders(order => order.resourceType == PIXEL &&
                                                    //   order.type == ORDER_BUY);
                                                    //   orders.sort(function(a,b){return b.price - a.price;});
                // if(orders.length != 0){
                        // if(orders[0].amount > Game.resources[PIXEL]){
                            // var result = Game.market.deal(orders[0].id, Game.resources[PIXEL]);
                        // }
                        // else{
                            // var result = Game.market.deal(orders[0].id, orders[0].amount);
                        // }
                // }
            // }
            /*
            if(global.getCachedStructures(roomName, STRUCTURE_POWER_SPAWN).length > 0){
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
                */
            
            if(terminal.store[RESOURCE_ENERGY] >= 10000 && Game.rooms[roomName].controller.level == 8){
                let targetRoom = priorityRooms[0];
                for(let i = 0; i < priorityRooms.length; i++){
                    if(roomName != priorityRooms[i] && Game.rooms[priorityRooms[i]].terminal != undefined && Game.rooms[priorityRooms[i]].controller.level <= 7){
                        targetRoom = priorityRooms[i];
                        break;
                    }
                }
                if(Game.rooms[targetRoom].terminal.store.getFreeCapacity(RESOURCE_ENERGY) > terminal.store[RESOURCE_ENERGY]){
                    terminal.send(RESOURCE_ENERGY, (terminal.store[RESOURCE_ENERGY]*0.75), targetRoom);
                }
                else{
                    terminal.send(RESOURCE_ENERGY, Game.rooms[targetRoom].terminal.store.getFreeCapacity(RESOURCE_ENERGY), targetRoom);
                }
            }else{
                if(terminal.store[RESOURCE_ENERGY] >= 200000){ {
                    var orders = Game.market.getAllOrders(order => order.resourceType == RESOURCE_ENERGY &&
                        order.type == ORDER_BUY &&
                        Game.market.calcTransactionCost(terminal.store[RESOURCE_ENERGY], terminal.room.name, order.roomName) < 200000
                        );
                        orders.sort(function(a,b){return b.price - a.price;});
                        if(orders.length != 0){
                        var result = Game.market.deal(orders[0].id, orders[0].amount, terminal.room.name);
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
    }}  }  

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
    }
render();
global.cache = {};
});
}
    
