var roleCenter = {

    /** @param {Creep} creep **/
    run: function(creep) {


        //НЕОПТИМИЗИРОВАННЫЙ КАЛ
        var source_links = [];
        var destination_links = [];
        var sources = creep.room.find(FIND_SOURCES);
        var links = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return(structure.structureType == STRUCTURE_LINK) &&
                    structure.isActive();
            }});
        _.forEach(links, function(link) {
            var closest_source = link.pos.findClosestByRange(sources);
            if (link.pos.getRangeTo(closest_source) < 3) {
                source_links.push(link);
            } else {
                destination_links.push(link);
            }
        });

        //console.log(creep + destination_links);
        //////////////////








        var terminal = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return(structure.structureType == STRUCTURE_TERMINAL) &&
                structure.store[RESOURCE_ENERGY] < 100000 && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 600
                // && Game.market.credits < 1000000;
            }
        });
        var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');
        if(creep.memory.transferring && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.transferring = false;
        }
        if(!creep.memory.transferring && creep.store.getFreeCapacity() == 0) {
            creep.memory.transferring = true;
        }

        if(creep.memory.transferring) {
            var towers = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return(
                        structure.structureType == STRUCTURE_TOWER) &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 100;
                }
            });
            var targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return(
                        structure.structureType == STRUCTURE_SPAWN ||
                        structure.structureType == STRUCTURE_EXTENSION) &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                    }
                });
            var enemies = creep.room.find(FIND_HOSTILE_CREEPS);
            var structures = creep.pos.findClosestByPath(targets);
            if(enemies != 0 && harvesters > 1 && towers != 0){
                var towers = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return(structure.structureType == STRUCTURE_TOWER) &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 100;
                    }
                });
                var tower = creep.pos.findClosestByPath(towers);
                if(towers != 0){
                    if(creep.transfer(tower, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                        creep.moveTo(tower, {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                }

            }
            if(enemies != 0 && towers == 0){
                if(creep.transfer(structures, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                    creep.moveTo(structures, {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
            /*
            У меня нет проблем, кроме моей башки
            1000-7, я умер, прости
            Этот ёбаный дождь нагоняет тоски
            1000-7, я умер, прости
            И им всем никогда меня не победить
            1000-7, я уже погиб
            У меня есть суммы, но мне так по-о-о-х
            Не вывожу из сукиного рта, пох
            Я чувствую вкус крови на губах, сдох
            Им никогда не победить меня (Никогда)
            Под её окном написал «Ты шлюха»
            Клонит спать, но только если под утро
            Это мёртвый звук, на колени, сука
            Я реально мёртвый и это — не шутка
            У меня нет проблем, кроме моей башки
            1000-7, я умер, прости
            Этот ёбаный дождь нагоняет тоски
            1000-7, я умер, прости
            Им всем никогда меня не победить
            1000-7, я уже погиб
            У меня нет проблем, кроме моей башки
            1000-7, я умер, прости
            Этот ёбаный дождь нагоняет тоски
            1000-7, я умер, прости
            Им всем никогда меня не победить
            1000-7, я уже погиб
            У меня есть суммы, но мне так по-о-о-х
            Не вывожу из сукиного рта, пох
            Я чувствую вкус крови на губах, сдох
            Им никогда не победить меня (Никогда)
            */

            else{
                var towers = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return(
                            structure.structureType == STRUCTURE_TOWER) &&
                            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 100;
                    }
                });
                if(targets != 0){
                    if(creep.transfer(structures, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                        creep.moveTo(structures, {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                }
                /*
                if(targets == 0 && towers != 0 && creep.store[RESOURCE_KEANIUM] == 0 && creep.store[RESOURCE_ZYNTHIUM] == 0){
                    var towers = creep.room.find(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return(structure.structureType == STRUCTURE_TOWER) &&
                            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 100;
                        }
                    });
                    var tower = creep.pos.findClosestByRange(towers);
                    if(creep.transfer(tower, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                        creep.moveTo(tower, {visualizePathStyle: {stroke: '#800080'}});
                    }
                }
                if(targets == 0 && towers == 0 && creep.store[RESOURCE_ZYNTHIUM] > 0 && zLab.store.getFreeCapacity(RESOURCE_ZYNTHIUM) > 0 && terminal.length == 0){
                    var terminal = creep.room.find(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return(structure.structureType == STRUCTURE_TERMINAL) &&
                            structure.store[RESOURCE_ZYNTHIUM] > 0;
                        }
                    });
                    if(creep.withdraw(terminal[0], RESOURCE_ZYNTHIUM) == ERR_NOT_IN_RANGE){
                        creep.moveTo(terminal[0], {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                }
                if(creep.store[RESOURCE_ZYNTHIUM] != 0){
                    if(creep.transfer(zLab, RESOURCE_ZYNTHIUM) == ERR_NOT_IN_RANGE){
                        creep.moveTo(zLab, {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                }

                if(targets == 0 && towers == 0 && creep.store[RESOURCE_KEANIUM] == 0 && kLab.store.getFreeCapacity(RESOURCE_KEANIUM) > 0 && terminal.length == 0){
                    var terminal = creep.room.find(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return(structure.structureType == STRUCTURE_TERMINAL) &&
                            structure.store[RESOURCE_KEANIUM] > 0;
                        }
                    });
                    if(creep.withdraw(terminal[0], RESOURCE_KEANIUM) == ERR_NOT_IN_RANGE){
                        creep.moveTo(terminal[0], {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                }
                if(creep.store[RESOURCE_KEANIUM] != 0){
                    if(creep.transfer(kLab, RESOURCE_KEANIUM) == ERR_NOT_IN_RANGE){
                        creep.moveTo(kLab, {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                }
                */
                else{
                    var towers = creep.room.find(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return(structure.structureType == STRUCTURE_TOWER) &&
                            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 100;
                        }
                    });
                    var tower = creep.pos.findClosestByPath(towers);
                    var lab = creep.room.find(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return(structure.structureType == STRUCTURE_LAB) &&
                            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 100;
                        }
                    });
                    var nuker = creep.room.find(FIND_MY_STRUCTURES, {
                        filter: (structure) => {
                            return(structure.structureType == STRUCTURE_NUKER) &&
                            structure.store.getFreeCapacity(RESOURCE_ENERGY) != 0;
                        }
                    });
                    var factory = creep.room.find(FIND_MY_STRUCTURES, {
                        filter: (structure) => {
                            return(structure.structureType == STRUCTURE_FACTORY) &&
                            structure.store[RESOURCE_ENERGY] < 5000;
                        }
                    });
                    var powerSpawn = creep.room.find(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return(
                                structure.structureType == STRUCTURE_POWER_SPAWN) &&
                                structure.store[RESOURCE_ENERGY] < 5000;
                            }
                    });
                    if(terminal.length != 0 && towers.length == 0){
                        if(creep.transfer(terminal[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                            creep.moveTo(terminal[0], {visualizePathStyle: {stroke: '#ffffff'}});
                        }
                     }
                    
                    if(lab.length != 0 && towers.length == 0){
                        if(creep.transfer(lab[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                            creep.moveTo(lab[0]);
                        }
                    }
                    if(powerSpawn.length != 0 && towers.length == 0 && terminal.length == 0 && lab.length == 0 && nuker.length == 0){
                        if(creep.transfer(powerSpawn[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                            creep.moveTo(powerSpawn[0]);
                        }
                    }
                    if(towers.length != 0){
                        if(creep.transfer(tower, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                            creep.moveTo(tower);
                        }
                    }
                    if(nuker.length != 0 && factory.length == 0 && towers.length == 0){
                        if(creep.transfer(nuker[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                            creep.moveTo(nuker[0]);
                        }
                    }
                    if(factory.length != 0 && towers.length == 0){
                        if(creep.transfer(factory[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                            creep.moveTo(factory[0]);
                        }
                    }
                }
            }
            
        }   
        else {
            var sources = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (structure) => {
                    return(structure.structureType == STRUCTURE_CONTAINER);
                }
            });
            if(creep.withdraw(sources, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(sources, {visualizePathStyle: {stroke: '#800080'}});
            }
            if(creep.withdraw(creep.pos.findClosestByPath(destination_links), RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.pos.findClosestByPath(destination_links), {visualizePathStyle: {stroke: '#800080'}});
            }
        }
    }
};

module.exports = roleCenter;