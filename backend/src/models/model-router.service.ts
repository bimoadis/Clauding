import { Injectable } from '@nestjs/common';
import { ModelRef, RoutingRequest } from './model-router.interface';

@Injectable()
export class ModelRouter {
  // Configured weights for each tier
  private weights = {
    economy:  { quality: 0.1, cost: 0.8, latency: 0.1 },
    balanced: { quality: 0.4, cost: 0.4, latency: 0.2 },
    premium:  { quality: 0.8, cost: 0.1, latency: 0.1 }
  };

  /**
   * Sorts and maps active models into a prioritized fallback chain based on the agent policy.
   */
  public route(req: RoutingRequest, models: ModelRef[]): ModelRef[] {
    // 1. Filter candidates by health and hard requirements
    const candidates = models.filter(m => {
      if (!m.healthy) return false;
      if (req.pinnedModel && m.id !== req.pinnedModel) return false;

      // Ensure model has required capabilities (e.g. function_calling, vision)
      if (req.requires && req.requires.length > 0) {
        const hasAllCaps = req.requires.every(cap => m.capabilities.includes(cap));
        if (!hasAllCaps) return false;
      }

      return true;
    });

    if (candidates.length === 0) {
      throw new Error('No healthy candidate models found matching routing requirements');
    }

    // 2. Score candidates based on costTier weights
    const tier = req.costTier ?? 'balanced';
    const selectedWeights = this.weights[tier];

    const scored = candidates.map(m => {
      // Cost score: lower cost = higher score
      const costPerMillion = Number(m.inPriceMicroUsd + m.outPriceMicroUsd);
      const costScore = costPerMillion > 0 ? 10000000 / costPerMillion : 10;

      // Latency score: lower latency = higher score
      const latencyScore = m.latencyAvgMs > 0 ? 10000 / m.latencyAvgMs : 10;

      // Quality score: standard quality rank (e.g. 0-100)
      const qualityScore = m.qualityRank;

      const totalScore =
        (qualityScore * selectedWeights.quality) +
        (costScore * selectedWeights.cost) +
        (latencyScore * selectedWeights.latency);

      return { model: m, score: totalScore };
    });

    // 3. Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    return scored.map(s => s.model);
  }
}
