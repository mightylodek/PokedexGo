import {
  BattleSimulationInput,
  BattleSimulationResult,
  BattleTurn,
  BattleAction,
  BattleState,
  BattleParticipant,
  DamageEvent,
  EnergyEvent,
  MoveCategory,
} from './types';
import { getDefaultRuleset, getTypeEffectiveness } from './ruleset';
import {
  calculateDamage,
  calculateEnergyGain,
  calculateEnergyCost,
  createParticipant,
} from './calculations';

/**
 * Simulate a turn-based battle
 * 
 * This is a simplified simulation that:
 * - Alternates turns between participants
 * - Uses fast moves to build energy
 * - Uses charged moves when energy is available
 * - Applies shields automatically when charged moves are used
 * 
 * ASSUMPTIONS:
 * - Participants alternate turns (no simultaneous actions)
 * - Fast moves always execute first if energy is needed
 * - Charged moves are used immediately when energy is available
 * - Shields are used automatically to block charged moves
 * - No swap mechanics in MVP
 */
export function simulateBattle(
  input: BattleSimulationInput
): BattleSimulationResult {
  const ruleset = input.ruleset || getDefaultRuleset();
  const maxTurns = input.maxTurns || 100; // Safety limit
  
  // Create participants
  const participant1: BattleParticipant = createParticipant(
    input.participant1,
    'participant1',
    ruleset
  );
  const participant2: BattleParticipant = createParticipant(
    input.participant2,
    'participant2',
    ruleset
  );
  
  const participants = [participant1, participant2];
  const log: string[] = [];
  const turns: BattleTurn[] = [];
  
  let turnNumber = 0;
  let timestamp = 0;
  
  log.push(`Battle started: ${input.participant1.speciesName} vs ${input.participant2.speciesName}`);
  log.push(`${input.participant1.speciesName}: ${participant1.currentHp} HP`);
  log.push(`${input.participant2.speciesName}: ${participant2.currentHp} HP`);
  
  while (turnNumber < maxTurns && !isBattleComplete(participants)) {
    turnNumber++;
    timestamp += ruleset.turnDurationMs;
    
    const turnActions: BattleAction[] = [];
    const damageEvents: DamageEvent[] = [];
    const energyEvents: EnergyEvent[] = [];
    
    // Process each participant's turn
    for (let i = 0; i < participants.length; i++) {
      const attacker = participants[i];
      const defender = participants[1 - i];
      
      if (!attacker.isActive || attacker.currentHp <= 0) {
        continue;
      }
      
      // Strategy: Use charged move if energy is available, otherwise use fast move
      let action: BattleAction | null = null;
      
      // Check if we can use a charged move
      const availableChargedMove = attacker.pokemon.chargedMoves.find(
        (move) => calculateEnergyCost(move) <= attacker.currentEnergy
      );
      
      if (availableChargedMove) {
        // Use charged move
        const energyCost = calculateEnergyCost(availableChargedMove);
        attacker.currentEnergy -= energyCost;
        
        action = {
          type: 'CHARGED_ATTACK',
          participantId: attacker.pokemon.formId,
          moveId: availableChargedMove.id,
          timestamp,
        };
        
        // Check if defender uses shield
        let damageBlocked = false;
        if (defender.shieldsRemaining > 0) {
          defender.shieldsRemaining--;
          damageBlocked = true;
          log.push(
            `Turn ${turnNumber}: ${defender.pokemon.speciesName} used a shield!`
          );
        }
        
        if (!damageBlocked) {
          const damage = calculateDamage(
            availableChargedMove,
            attacker.pokemon,
            defender.pokemon,
            ruleset
          );
          
          // Calculate effectiveness for logging
          const defenderTypes = [defender.pokemon.primaryType];
          if (defender.pokemon.secondaryType) {
            defenderTypes.push(defender.pokemon.secondaryType);
          }
          const effectiveness = getTypeEffectiveness(
            availableChargedMove.type,
            defenderTypes,
            ruleset
          );
          
          defender.currentHp = Math.max(0, defender.currentHp - damage);
          
          damageEvents.push({
            attackerId: attacker.pokemon.formId,
            defenderId: defender.pokemon.formId,
            moveId: availableChargedMove.id,
            damage,
            isCritical: false, // Simplified, no crits in MVP
            effectiveness,
            defenderHpAfter: defender.currentHp,
          });
          
          log.push(
            `Turn ${turnNumber}: ${attacker.pokemon.speciesName} used ${availableChargedMove.name}! ` +
            `Dealt ${damage} damage. ${defender.pokemon.speciesName} has ${defender.currentHp} HP remaining.`
          );
        } else {
          log.push(
            `Turn ${turnNumber}: ${attacker.pokemon.speciesName} used ${availableChargedMove.name}, but it was blocked!`
          );
        }
      } else {
        // Use fast move
        const fastMove = attacker.pokemon.fastMove;
        const energyGain = calculateEnergyGain(fastMove);
        
        attacker.currentEnergy = Math.min(
          ruleset.maxEnergy,
          attacker.currentEnergy + energyGain
        );
        
        action = {
          type: 'FAST_ATTACK',
          participantId: attacker.pokemon.formId,
          moveId: fastMove.id,
          timestamp,
        };
        
        const damage = calculateDamage(
          fastMove,
          attacker.pokemon,
          defender.pokemon,
          ruleset
        );
        
        // Calculate effectiveness for logging
        const defenderTypes = [defender.pokemon.primaryType];
        if (defender.pokemon.secondaryType) {
          defenderTypes.push(defender.pokemon.secondaryType);
        }
        const effectiveness = getTypeEffectiveness(
          fastMove.type,
          defenderTypes,
          ruleset
        );
        
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
        
        log.push(
          `Turn ${turnNumber}: ${attacker.pokemon.speciesName} used ${fastMove.name}. ` +
          `Dealt ${damage} damage, gained ${energyGain} energy. ` +
          `${defender.pokemon.speciesName} has ${defender.currentHp} HP remaining.`
        );
      }
      
      if (action) {
        turnActions.push(action);
      }
      
      // Check if defender is knocked out
      if (defender.currentHp <= 0) {
        defender.isActive = false;
        log.push(`${defender.pokemon.speciesName} was knocked out!`);
        break;
      }
    }
    
    // Create turn state
    const stateAfter: BattleState = {
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
  
  const finalState: BattleState = {
    participants: participants.map((p) => ({ ...p })),
    turnNumber,
    timestamp,
    isComplete: isBattleComplete(participants),
    winnerId: getWinnerId(participants),
  };
  
  if (finalState.winnerId) {
    const winner = participants.find((p) => p.pokemon.formId === finalState.winnerId);
    log.push(`Battle ended! ${winner?.pokemon.speciesName} wins!`);
  } else {
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

function isBattleComplete(participants: BattleParticipant[]): boolean {
  const activeCount = participants.filter((p) => p.isActive && p.currentHp > 0).length;
  return activeCount < 2;
}

function getWinnerId(participants: BattleParticipant[]): string | undefined {
  const winner = participants.find((p) => p.isActive && p.currentHp > 0);
  return winner?.pokemon.formId;
}

