"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simulateBattle = simulateBattle;
const ruleset_1 = require("./ruleset");
const calculations_1 = require("./calculations");
function simulateBattle(input) {
    const ruleset = input.ruleset || (0, ruleset_1.getDefaultRuleset)();
    const maxTurns = input.maxTurns || 100;
    const participant1 = (0, calculations_1.createParticipant)(input.participant1, 'participant1', ruleset);
    const participant2 = (0, calculations_1.createParticipant)(input.participant2, 'participant2', ruleset);
    const participants = [participant1, participant2];
    const log = [];
    const turns = [];
    let turnNumber = 0;
    let timestamp = 0;
    log.push(`Battle started: ${input.participant1.speciesName} vs ${input.participant2.speciesName}`);
    log.push(`${input.participant1.speciesName}: ${participant1.currentHp} HP`);
    log.push(`${input.participant2.speciesName}: ${participant2.currentHp} HP`);
    while (turnNumber < maxTurns && !isBattleComplete(participants)) {
        turnNumber++;
        timestamp += ruleset.turnDurationMs;
        const turnActions = [];
        const damageEvents = [];
        const energyEvents = [];
        for (let i = 0; i < participants.length; i++) {
            const attacker = participants[i];
            const defender = participants[1 - i];
            if (!attacker.isActive || attacker.currentHp <= 0) {
                continue;
            }
            let action = null;
            const availableChargedMove = attacker.pokemon.chargedMoves.find((move) => (0, calculations_1.calculateEnergyCost)(move) <= attacker.currentEnergy);
            if (availableChargedMove) {
                const energyCost = (0, calculations_1.calculateEnergyCost)(availableChargedMove);
                attacker.currentEnergy -= energyCost;
                action = {
                    type: 'CHARGED_ATTACK',
                    participantId: attacker.pokemon.formId,
                    moveId: availableChargedMove.id,
                    timestamp,
                };
                let damageBlocked = false;
                if (defender.shieldsRemaining > 0) {
                    defender.shieldsRemaining--;
                    damageBlocked = true;
                    log.push(`Turn ${turnNumber}: ${defender.pokemon.speciesName} used a shield!`);
                }
                if (!damageBlocked) {
                    const damage = (0, calculations_1.calculateDamage)(availableChargedMove, attacker.pokemon, defender.pokemon, ruleset);
                    const defenderTypes = [defender.pokemon.primaryType];
                    if (defender.pokemon.secondaryType) {
                        defenderTypes.push(defender.pokemon.secondaryType);
                    }
                    const effectiveness = (0, ruleset_1.getTypeEffectiveness)(availableChargedMove.type, defenderTypes, ruleset);
                    defender.currentHp = Math.max(0, defender.currentHp - damage);
                    damageEvents.push({
                        attackerId: attacker.pokemon.formId,
                        defenderId: defender.pokemon.formId,
                        moveId: availableChargedMove.id,
                        damage,
                        isCritical: false,
                        effectiveness,
                        defenderHpAfter: defender.currentHp,
                    });
                    log.push(`Turn ${turnNumber}: ${attacker.pokemon.speciesName} used ${availableChargedMove.name}! ` +
                        `Dealt ${damage} damage. ${defender.pokemon.speciesName} has ${defender.currentHp} HP remaining.`);
                }
                else {
                    log.push(`Turn ${turnNumber}: ${attacker.pokemon.speciesName} used ${availableChargedMove.name}, but it was blocked!`);
                }
            }
            else {
                const fastMove = attacker.pokemon.fastMove;
                const energyGain = (0, calculations_1.calculateEnergyGain)(fastMove);
                attacker.currentEnergy = Math.min(ruleset.maxEnergy, attacker.currentEnergy + energyGain);
                action = {
                    type: 'FAST_ATTACK',
                    participantId: attacker.pokemon.formId,
                    moveId: fastMove.id,
                    timestamp,
                };
                const damage = (0, calculations_1.calculateDamage)(fastMove, attacker.pokemon, defender.pokemon, ruleset);
                const defenderTypes = [defender.pokemon.primaryType];
                if (defender.pokemon.secondaryType) {
                    defenderTypes.push(defender.pokemon.secondaryType);
                }
                const effectiveness = (0, ruleset_1.getTypeEffectiveness)(fastMove.type, defenderTypes, ruleset);
                defender.currentHp = Math.max(0, defender.currentHp - damage);
                damageEvents.push({
                    attackerId: attacker.pokemon.formId,
                    defenderId: defender.pokemon.formId,
                    moveId: fastMove.id,
                    damage,
                    isCritical: false,
                    effectiveness,
                    defenderHpAfter: defender.currentHp,
                });
                energyEvents.push({
                    participantId: attacker.pokemon.formId,
                    energyChange: energyGain,
                    energyAfter: attacker.currentEnergy,
                    source: 'FAST_MOVE',
                });
                log.push(`Turn ${turnNumber}: ${attacker.pokemon.speciesName} used ${fastMove.name}. ` +
                    `Dealt ${damage} damage, gained ${energyGain} energy. ` +
                    `${defender.pokemon.speciesName} has ${defender.currentHp} HP remaining.`);
            }
            if (action) {
                turnActions.push(action);
            }
            if (defender.currentHp <= 0) {
                defender.isActive = false;
                log.push(`${defender.pokemon.speciesName} was knocked out!`);
                break;
            }
        }
        const stateAfter = {
            participants: participants.map((p) => ({ ...p })),
            turnNumber,
            timestamp,
            isComplete: isBattleComplete(participants),
            winnerId: getWinnerId(participants),
        };
        turns.push({
            turnNumber,
            timestamp,
            actions: turnActions,
            damageEvents,
            energyEvents,
            stateAfter,
        });
    }
    const finalState = {
        participants: participants.map((p) => ({ ...p })),
        turnNumber,
        timestamp,
        isComplete: isBattleComplete(participants),
        winnerId: getWinnerId(participants),
    };
    if (finalState.winnerId) {
        const winner = participants.find((p) => p.pokemon.formId === finalState.winnerId);
        log.push(`Battle ended! ${winner?.pokemon.speciesName} wins!`);
    }
    else {
        log.push('Battle ended in a draw (max turns reached).');
    }
    return {
        input,
        ruleset,
        turns,
        finalState,
        durationMs: timestamp,
        log,
    };
}
function isBattleComplete(participants) {
    const activeCount = participants.filter((p) => p.isActive && p.currentHp > 0).length;
    return activeCount < 2;
}
function getWinnerId(participants) {
    const winner = participants.find((p) => p.isActive && p.currentHp > 0);
    return winner?.pokemon.formId;
}
//# sourceMappingURL=simulation.js.map