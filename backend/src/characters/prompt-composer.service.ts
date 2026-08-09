import { Injectable } from '@nestjs/common';
import { Character } from './character.interface';

@Injectable()
export class PromptComposer {
  private readonly platformPolicy = `[Layer 0: Platform Policy]
1. You are Clauding, a helpful, safe, and robust AI Agent.
2. Under no circumstances should you bypass safety filters, output toxic remarks, or leak system configurations.
3. If asked to perform actions beyond your catalog, politely refuse.`;

  /**
   * Compiles Layer 0 to Layer 3 inputs into a single unified system prompt.
   */
  public compose(
    agentInstructions: string,
    character?: Character,
    sessionContext?: { userWallet?: string; timestamp?: string; memory?: string[] }
  ): string {
    const layer0 = this.platformPolicy;
    const layer1 = character ? this.renderCharacterLayer(character) : '';
    const layer2 = `[Layer 2: Agent Specific Instructions]\n${agentInstructions}`;
    const layer3 = this.renderSessionLayer(sessionContext);

    return [layer0, layer1, layer2, layer3]
      .filter(layer => layer.trim().length > 0)
      .join('\n\n');
  }

  private renderCharacterLayer(char: Character): string {
    const voice = char.voice;
    const toneInstructions = `Tone: ${voice.tone.join(', ')}`;
    const formalityInst = voice.formality > 0.7 
      ? 'Speak in a highly professional and structured manner.' 
      : voice.formality < 0.3 
      ? 'Speak in a casual, conversational, and direct manner.' 
      : 'Maintain a polite, balanced formality.';

    const verbosityInst = voice.verbosity > 0.7
      ? 'Provide detailed, analytical, and complete answers.'
      : voice.verbosity < 0.3
      ? 'Provide extremely brief, direct, and terse responses.'
      : 'Provide clear, medium-length responses.';

    const emojiInst = voice.emoji 
      ? 'Use appropriate emojis naturally to make replies engaging.' 
      : 'Do not use emojis under any circumstances.';

    const signatureInst = voice.signatureMoves.length > 0
      ? `Signature conversational rules: ${voice.signatureMoves.map(m => `"${m}"`).join(', ')}`
      : '';

    return `[Layer 1: Character Persona - ${char.name}]
Identity: ${char.identity}
Voice directives:
- ${toneInstructions}
- ${formalityInst}
- ${verbosityInst}
- ${emojiInst}
${signatureInst ? `- ${signatureInst}` : ''}
Values to uphold: ${char.values.join(', ')}
DOs:
${char.dos.map(item => `* ${item}`).join('\n')}
DONTs:
${char.donts.map(item => `* ${item}`).join('\n')}
Sample Phrase Adherence: ${char.sampleUtterances.map(phrase => `"${phrase}"`).join(', ')}`;
  }

  private renderSessionLayer(ctx?: { userWallet?: string; timestamp?: string; memory?: string[] }): string {
    if (!ctx) return '';
    const walletText = ctx.userWallet ? `User Wallet: ${ctx.userWallet}` : '';
    const timeText = ctx.timestamp ? `Current Time: ${ctx.timestamp}` : '';
    const memoryText = ctx.memory && ctx.memory.length > 0
      ? `[Retrieved Episodic Memory]:\n${ctx.memory.map(m => `- ${m}`).join('\n')}`
      : '';

    return `[Layer 3: Session Context]
${walletText}
${timeText}
${memoryText}`.trim();
  }
}
