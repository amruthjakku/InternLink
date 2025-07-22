/**
 * Automatic role detection based on GitLab username patterns
 */

export function detectUserRole(gitlabUsername) {
  if (!gitlabUsername) return 'AI Developer Intern'; // Default fallback
  
  const username = gitlabUsername.toLowerCase().trim();
  
  // Admin patterns
  const adminPatterns = [
    /^admin/,           // starts with 'admin'
    /admin$/,           // ends with 'admin'
    /^root/,            // starts with 'root'
    /^superuser/,       // starts with 'superuser'
    /_admin$/,          // ends with '_admin'
    /^sys/,             // starts with 'sys'
    /^master/,          // starts with 'master'
  ];
  
  // Tech Lead patterns
  const mentorPatterns = [
    /^mentor/,          // starts with 'Tech Lead'
    /mentor$/,          // ends with 'Tech Lead'
    /^lead/,            // starts with 'lead'
    /^senior/,          // starts with 'senior'
    /^supervisor/,      // starts with 'supervisor'
    /_mentor$/,         // ends with '_mentor'
    /_lead$/,           // ends with '_lead'
    /^team_lead/,       // starts with 'team_lead'
    /^tl_/,             // starts with 'tl_' (team leader)
  ];
  
  // Super-mentor patterns (higher priority than regular mentor)
  const superTechLeadPatterns = [
    /^poc/,    // starts with 'poc'
    /^chief/,           // starts with 'chief'
    /^head/,            // starts with 'head'
    /^principal/,       // starts with 'principal'
    /_super$/,          // ends with '_super'
    /^director/,        // starts with 'director'
  ];
  
  // Check patterns in order of priority
  for (const pattern of adminPatterns) {
    if (pattern.test(username)) {
      return 'admin';
    }
  }
  
  for (const pattern of superTechLeadPatterns) {
    if (pattern.test(username)) {
      return 'POC';
    }
  }
  
  for (const pattern of mentorPatterns) {
    if (pattern.test(username)) {
      return 'Tech Lead';
    }
  }
  
  // Default to AI Developer Intern if no patterns match
  return 'AI Developer Intern';
}

/**
 * Detect cohort assignment based on username patterns
 */
export function detectCohortFromUsername(gitlabUsername) {
  if (!gitlabUsername) return null;
  
  const username = gitlabUsername.toLowerCase().trim();
  
  // Extract potential cohort identifiers
  const cohortPatterns = [
    // Year-based patterns
    /(\d{4})/,                    // 4-digit year (2024, 2025, etc.)
    /batch[_-]?(\d+)/,            // batch1, batch_2, batch-3
    /cohort[_-]?(\d+)/,           // cohort1, cohort_2, cohort-3
    /group[_-]?([a-z]\d*)/,       // groupA, group_a1, group-b2
    /team[_-]?([a-z]\d*)/,        // teamA, team_a1, team-b2
    
    // Semester patterns  
    /sem[_-]?(\d+)/,              // sem1, sem_2, sem-3
    /s(\d+)/,                     // s1, s2, s3
    
    // Level patterns
    /level[_-]?(\d+)/,            // level1, level_2
    /l(\d+)/,                     // l1, l2, l3
    
    // Class patterns
    /class[_-]?([a-z]\d*)/,       // classA, class_a1
  ];
  
  for (const pattern of cohortPatterns) {
    const match = username.match(pattern);
    if (match) {
      return {
        identifier: match[1],
        type: pattern.source,
        suggestedName: generateCohortName(match[1], pattern.source)
      };
    }
  }
  
  return null;
}

/**
 * Generate cohort name from detected pattern
 */
function generateCohortName(identifier, pattern) {
  if (pattern.includes('batch')) {
    return `Batch ${identifier}`;
  } else if (pattern.includes('cohort')) {
    return `Cohort ${identifier}`;
  } else if (pattern.includes('group')) {
    return `Group ${identifier.toUpperCase()}`;
  } else if (pattern.includes('team')) {
    return `Team ${identifier.toUpperCase()}`;
  } else if (pattern.includes('sem')) {
    return `Semester ${identifier}`;
  } else if (pattern.includes('level')) {
    return `Level ${identifier}`;
  } else if (pattern.includes('class')) {
    return `Class ${identifier.toUpperCase()}`;
  } else if (/\d{4}/.test(identifier)) {
    return `Class of ${identifier}`;
  }
  
  return `Cohort ${identifier}`;
}

/**
 * Validate GitLab username format
 */
export function validateGitlabUsername(username) {
  if (!username) return { valid: false, message: 'GitLab username is required' };
  
  const trimmed = username.trim();
  
  // GitLab username rules
  if (trimmed.length < 2) {
    return { valid: false, message: 'Username must be at least 2 characters long' };
  }
  
  if (trimmed.length > 255) {
    return { valid: false, message: 'Username must be less than 255 characters' };
  }
  
  // Must start with alphanumeric
  if (!/^[a-zA-Z0-9]/.test(trimmed)) {
    return { valid: false, message: 'Username must start with a letter or number' };
  }
  
  // Can only contain alphanumeric, dots, dashes, and underscores
  if (!/^[a-zA-Z0-9._-]+$/.test(trimmed)) {
    return { valid: false, message: 'Username can only contain letters, numbers, dots, dashes, and underscores' };
  }
  
  // Cannot end with dot
  if (trimmed.endsWith('.')) {
    return { valid: false, message: 'Username cannot end with a dot' };
  }
  
  // Cannot have consecutive dots
  if (trimmed.includes('..')) {
    return { valid: false, message: 'Username cannot contain consecutive dots' };
  }
  
  return { valid: true, message: 'Valid username' };
}

/**
 * Get role suggestions based on username
 */
export function getRoleSuggestions(gitlabUsername) {
  const detectedRole = detectUserRole(gitlabUsername);
  const cohortInfo = detectCohortFromUsername(gitlabUsername);
  
  return {
    detectedRole,
    cohortInfo,
    confidence: calculateConfidence(gitlabUsername, detectedRole),
    suggestions: generateSuggestions(gitlabUsername, detectedRole, cohortInfo)
  };
}

/**
 * Calculate confidence level for role detection
 */
function calculateConfidence(username, role) {
  if (!username) return 0;
  
  const lowerUsername = username.toLowerCase();
  
  // High confidence patterns
  if (role === 'admin' && /^admin|admin$|^root|^superuser/.test(lowerUsername)) {
    return 0.9;
  }
  
  if (role === 'POC' && /^poc|^chief|^head|^principal/.test(lowerUsername)) {
    return 0.9;
  }
  
  if (role === 'Tech Lead' && /^mentor|mentor$|^lead|^senior/.test(lowerUsername)) {
    return 0.8;
  }
  
  // Medium confidence for other patterns
  if (role !== 'AI Developer Intern') {
    return 0.6;
  }
  
  // Low confidence for default intern role
  return 0.3;
}

/**
 * Generate role and cohort suggestions
 */
function generateSuggestions(username, detectedRole, cohortInfo) {
  const suggestions = [];
  
  suggestions.push(`Detected role: ${detectedRole}`);
  
  if (cohortInfo) {
    suggestions.push(`Suggested cohort: ${cohortInfo.suggestedName}`);
    suggestions.push(`Based on pattern: ${cohortInfo.identifier}`);
  }
  
  return suggestions;
}