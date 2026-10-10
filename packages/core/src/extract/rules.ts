import defaultRulesJson from '../../rules/default-rules.json' with { type: 'json' };

export interface ExtractionRules {
  versionPatterns: string[];
  temporalKeywords: string[];
  ignoreMarkers: string[];
  paperPatterns: string[];
}

export function loadDefaultRules(): ExtractionRules {
  return {
    versionPatterns: defaultRulesJson.versionPatterns,
    temporalKeywords: defaultRulesJson.temporalKeywords,
    ignoreMarkers: defaultRulesJson.ignoreMarkers,
    paperPatterns: defaultRulesJson.paperPatterns,
  };
}
