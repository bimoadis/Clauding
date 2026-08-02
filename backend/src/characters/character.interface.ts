export interface VoiceKnobs {
  tone: string[];
  formality: number;      // 0.0 (casual) to 1.0 (formal)
  verbosity: number;      // 0.0 (terse) to 1.0 (expansive)
  emoji: boolean;
  signatureMoves: string[];
}

export interface ModelAffinity {
  preferred: string;
  temperature: number;
}

export interface Character {
  id: string;
  name: string;
  tagline: string;
  identity: string;
  voice: VoiceKnobs;
  values: string[];
  dos: string[];
  donts: string[];
  sampleUtterances: string[];
  modelAffinity: ModelAffinity;
  safetyLocked: boolean;
}
