"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateCP = calculateCP;
exports.calculateHP = calculateHP;
exports.calculateDamage = calculateDamage;
exports.calculateEnergyGain = calculateEnergyGain;
exports.calculateEnergyCost = calculateEnergyCost;
exports.createParticipant = createParticipant;
const ruleset_1 = require("./ruleset");
function calculateCP(baseAttack, baseDefense, baseStamina, ivAtk, ivDef, ivSta, level, ruleset) {
    const attack = baseAttack + ivAtk;
    const defense = baseDefense + ivDef;
    const stamina = baseStamina + ivSta;
    const cpMultiplier = ruleset.cpMultiplierTable[level] || ruleset.cpMultiplierTable[40];
    const cpMultiplierSquared = cpMultiplier * cpMultiplier;
    const cp = Math.floor((attack * Math.sqrt(defense) * Math.sqrt(stamina) * cpMultiplierSquared) / 10);
    return Math.max(1, cp);
}
function calculateHP(baseStamina, ivSta, level, ruleset) {
    const stamina = baseStamina + ivSta;
    const cpMultiplier = ruleset.cpMultiplierTable[level] || ruleset.cpMultiplierTable[40];
    const hp = Math.floor(stamina * cpMultiplier);
    return Math.max(1, hp);
}
function calculateDamage(move, attacker, defender, ruleset) {
    const attackerAttack = attacker.baseAttack + attacker.ivAtk;
    const defenderDefense = defender.baseDefense + defender.ivDef;
    const attackerLevel = attacker.level;
    const attackerCpMultiplier = ruleset.cpMultiplierTable[attackerLevel] || ruleset.cpMultiplierTable[40];
    const defenderLevel = defender.level;
    const defenderCpMultiplier = ruleset.cpMultiplierTable[defenderLevel] || ruleset.cpMultiplierTable[40];
    const attackStat = attackerAttack * attackerCpMultiplier;
    const defenseStat = defenderDefense * defenderCpMultiplier;
    const isStab = move.type === attacker.primaryType || move.type === attacker.secondaryType;
    const stabMultiplier = isStab ? ruleset.stabMultiplier : 1.0;
    const defenderTypes = [defender.primaryType];
    if (defender.secondaryType) {
        defenderTypes.push(defender.secondaryType);
    }
    const effectiveness = (0, ruleset_1.getTypeEffectiveness)(move.type, defenderTypes, ruleset);
    const baseDamage = 0.5 * move.power * (attackStat / defenseStat) * stabMultiplier * effectiveness;
    const damage = Math.floor(baseDamage) + 1;
    return Math.max(1, damage);
}
function calculateEnergyGain(move) {
    if (move.category !== 'FAST') {
        return 0;
    }
    return Math.abs(move.energyDelta);
}
function calculateEnergyCost(move) {
    if (move.category !== 'CHARGED') {
        return 0;
    }
    return move.energyDelta;
}
function createParticipant(pokemon, participantId, ruleset) {
    const maxHp = pokemon.hp || calculateHP(pokemon.baseStamina, pokemon.ivSta, pokemon.level, ruleset);
    return {
        pokemon,
        currentHp: maxHp,
        currentEnergy: 0,
        shieldsRemaining: ruleset.shieldsPerSide,
        isActive: true,
    };
}
//# sourceMappingURL=calculations.js.map