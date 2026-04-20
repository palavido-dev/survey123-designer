/**
 * Survey Optimizer - Structural form analysis and optimization suggestions
 *
 * Scans survey structure to identify simplification and UX improvement opportunities.
 * Unlike validation (which catches errors), this suggests patterns that could be
 * improved for better form experience and maintainability.
 */

import { SurveyForm, SurveyRow, QuestionType } from '../types/survey';

// ============================================================
// Type Definitions
// ============================================================

export type OptimizationSeverity = 'suggestion' | 'recommendation' | 'improvement';
export type OptimizationCategory =
  | 'structural-simplification'
  | 'ux-improvement'
  | 'performance'
  | 'expression-optimization';

export interface OptimizationMatch {
  /** Array of row IDs that this suggestion applies to */
  rowIds: string[];
  /** Human-readable description of what to fix */
  suggestedFix: string;
  /** Optional: actionable button text if auto-fixable */
  actionText?: string;
}

export interface OptimizationRule {
  id: string;
  title: string;
  description: string;
  category: OptimizationCategory;
  severity: OptimizationSeverity;
  /** Detector function that walks the form and returns matches */
  detect: (form: SurveyForm) => OptimizationMatch[];
}

export interface OptimizationResult {
  ruleId: string;
  title: string;
  description: string;
  category: OptimizationCategory;
  severity: OptimizationSeverity;
  matches: OptimizationMatch[];
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Find the parent group/repeat for a given row by its ID.
 * Walks backwards from the row to find the nearest begin_group/begin_repeat.
 */
function findParentContainer(
  survey: SurveyRow[],
  rowId: string
): { rowId: string; type: 'group' | 'repeat' } | null {
  const rowIndex = survey.findIndex((r) => r.id === rowId);
  if (rowIndex === -1) return null;

  let nestLevel = 0;
  for (let i = rowIndex - 1; i >= 0; i--) {
    const row = survey[i];
    if (row.type === 'end_group' || row.type === 'end_repeat') {
      nestLevel++;
    } else if (row.type === 'begin_group') {
      if (nestLevel === 0) return { rowId: row.id, type: 'group' };
      nestLevel--;
    } else if (row.type === 'begin_repeat') {
      if (nestLevel === 0) return { rowId: row.id, type: 'repeat' };
      nestLevel--;
    }
  }

  return null;
}

/**
 * Get all children of a group/repeat (rows between begin and end markers).
 */
function getContainerChildren(
  survey: SurveyRow[],
  containerId: string
): SurveyRow[] {
  const containerIndex = survey.findIndex((r) => r.id === containerId);
  if (containerIndex === -1) return [];

  const containerType = survey[containerIndex].type;
  const isGroup = containerType === 'begin_group';
  const endMarker = isGroup ? 'end_group' : 'end_repeat';

  const children: SurveyRow[] = [];
  let nestLevel = 0;

  for (let i = containerIndex + 1; i < survey.length; i++) {
    const row = survey[i];

    if (row.type === 'begin_group' || row.type === 'begin_repeat') {
      if (nestLevel === 0) {
        children.push(row);
      }
      nestLevel++;
    } else if (row.type === endMarker) {
      if (nestLevel === 0) break;
      nestLevel--;
      if (nestLevel === 0) {
        children.push(row);
      }
    } else if (nestLevel === 0) {
      children.push(row);
    }
  }

  return children;
}

/**
 * Get immediate children (not nested in sub-groups) of a container.
 */
function getImmediateChildren(
  survey: SurveyRow[],
  containerId: string
): SurveyRow[] {
  const containerIndex = survey.findIndex((r) => r.id === containerId);
  if (containerIndex === -1) return [];

  const containerType = survey[containerIndex].type;
  const isGroup = containerType === 'begin_group';
  const endMarker = isGroup ? 'end_group' : 'end_repeat';

  const children: SurveyRow[] = [];
  let nestLevel = 0;

  for (let i = containerIndex + 1; i < survey.length; i++) {
    const row = survey[i];

    if (row.type === 'begin_group' || row.type === 'begin_repeat') {
      if (nestLevel === 0) {
        children.push(row);
      }
      nestLevel++;
    } else if (row.type === endMarker) {
      if (nestLevel === 0) break;
      nestLevel--;
    } else if (nestLevel === 0) {
      children.push(row);
    }
  }

  return children;
}

/**
 * Check if a type is a complex question that benefits from hints.
 */
function isComplexQuestionType(type: QuestionType): boolean {
  return ['geopoint', 'geotrace', 'geoshape', 'barcode', 'file', 'image'].includes(type);
}

/**
 * Get the nesting depth of a row.
 */
function getRowNestDepth(survey: SurveyRow[], rowId: string): number {
  const rowIndex = survey.findIndex((r) => r.id === rowId);
  if (rowIndex === -1) return 0;

  let depth = 0;
  for (let i = rowIndex - 1; i >= 0; i--) {
    const row = survey[i];
    if (row.type === 'end_group' || row.type === 'end_repeat') {
      depth++;
    } else if (row.type === 'begin_group' || row.type === 'begin_repeat') {
      depth--;
      if (depth < 0) depth = 0;
    }
  }

  return depth;
}

// ============================================================
// Optimization Rules
// ============================================================

/**
 * Rule 1: Repeat with single photo
 * A repeat containing only an image question. Suggest multiline appearance instead.
 */
const repeatWithSinglePhoto: OptimizationRule = {
  id: 'repeat-single-photo',
  title: 'Repeat with single photo',
  description:
    'A repeat that only contains one image question. Consider using the multiline appearance on the image question instead to allow multiple photos without the complexity of a repeat.',
  category: 'structural-simplification',
  severity: 'recommendation',
  detect: (form: SurveyForm) => {
    const matches: OptimizationMatch[] = [];

    for (const row of form.survey) {
      if (row.type !== 'begin_repeat') continue;

      const children = getImmediateChildren(form.survey, row.id);
      const questionChildren = children.filter(
        (c) => !['end_group', 'end_repeat', 'begin_group', 'begin_repeat'].includes(c.type)
      );

      if (questionChildren.length === 1 && questionChildren[0].type === 'image') {
        matches.push({
          rowIds: [row.id, questionChildren[0].id],
          suggestedFix:
            'Remove this repeat and add multiline appearance to the image question instead. This allows multiple photos without nesting complexity.',
          actionText: 'View suggestion',
        });
      }
    }

    return matches;
  },
};

/**
 * Rule 2: Repeat with single question
 * A repeat containing only one question of any type.
 */
const repeatWithSingleQuestion: OptimizationRule = {
  id: 'repeat-single-question',
  title: 'Repeat with single question',
  description:
    'A repeat containing only one question. This may be over-complex. Consider whether the repeat is truly needed or if a simpler structure would work.',
  category: 'structural-simplification',
  severity: 'suggestion',
  detect: (form: SurveyForm) => {
    const matches: OptimizationMatch[] = [];

    for (const row of form.survey) {
      if (row.type !== 'begin_repeat') continue;

      const children = getImmediateChildren(form.survey, row.id);
      const questionChildren = children.filter(
        (c) => !['end_group', 'end_repeat', 'begin_group', 'begin_repeat'].includes(c.type)
      );

      if (questionChildren.length === 1) {
        matches.push({
          rowIds: [row.id, questionChildren[0].id],
          suggestedFix: 'This repeat contains only one question. Evaluate if the repeat structure is necessary.',
          actionText: 'Review',
        });
      }
    }

    return matches;
  },
};

/**
 * Rule 3: Group with single child
 * A group containing only one question.
 */
const groupWithSingleChild: OptimizationRule = {
  id: 'group-single-child',
  title: 'Group with single question',
  description:
    'A group that contains only one question provides no organizational benefit. Consider removing the group and placing the question at the parent level.',
  category: 'structural-simplification',
  severity: 'suggestion',
  detect: (form: SurveyForm) => {
    const matches: OptimizationMatch[] = [];

    for (const row of form.survey) {
      if (row.type !== 'begin_group') continue;

      const children = getImmediateChildren(form.survey, row.id);
      const questionChildren = children.filter(
        (c) => !['end_group', 'end_repeat', 'begin_group', 'begin_repeat'].includes(c.type)
      );

      if (children.length === 1 && questionChildren.length === 1) {
        matches.push({
          rowIds: [row.id, questionChildren[0].id],
          suggestedFix:
            'This group contains only one question. Remove the group to simplify the structure, or add more related questions.',
          actionText: 'Review',
        });
      }
    }

    return matches;
  },
};

/**
 * Rule 4: Deeply nested groups
 * Groups nested 3+ levels deep.
 */
const deeplyNestedGroups: OptimizationRule = {
  id: 'deeply-nested-groups',
  title: 'Deeply nested groups',
  description:
    'Nesting groups more than 2 levels deep can make forms harder to understand and edit. Consider flattening the structure or using page breaks (field-list) instead.',
  category: 'structural-simplification',
  severity: 'recommendation',
  detect: (form: SurveyForm) => {
    const matches: OptimizationMatch[] = [];

    for (const row of form.survey) {
      if (row.type !== 'begin_group' && row.type !== 'begin_repeat') continue;

      const depth = getRowNestDepth(form.survey, row.id);
      if (depth >= 3) {
        matches.push({
          rowIds: [row.id],
          suggestedFix: `This ${row.type === 'begin_group' ? 'group' : 'repeat'} is nested ${depth} levels deep. Consider flattening or using field-list pages.`,
          actionText: 'View',
        });
      }
    }

    return matches;
  },
};

/**
 * Rule 5: Empty group/repeat
 * A group or repeat with no children.
 */
const emptyGroupOrRepeat: OptimizationRule = {
  id: 'empty-group-repeat',
  title: 'Empty group or repeat',
  description: 'A group or repeat with no content. Remove it or add questions to it.',
  category: 'structural-simplification',
  severity: 'suggestion',
  detect: (form: SurveyForm) => {
    const matches: OptimizationMatch[] = [];

    for (const row of form.survey) {
      if (row.type !== 'begin_group' && row.type !== 'begin_repeat') continue;

      const children = getImmediateChildren(form.survey, row.id);
      if (children.length === 0) {
        matches.push({
          rowIds: [row.id],
          suggestedFix: 'This empty container contains no questions. Remove it or add content.',
          actionText: 'Delete',
        });
      }
    }

    return matches;
  },
};

/**
 * Rule 6: Long choice lists without search
 * A select_one with 10+ choices and no search or autocomplete appearance.
 */
const longChoiceListNoSearch: OptimizationRule = {
  id: 'long-choices-no-search',
  title: 'Long choice list without search',
  description:
    'A select with 10+ choices but no search or autocomplete appearance. Add search or autocomplete appearance to improve usability on mobile devices.',
  category: 'ux-improvement',
  severity: 'recommendation',
  detect: (form: SurveyForm) => {
    const matches: OptimizationMatch[] = [];

    for (const row of form.survey) {
      if (!['select_one', 'select_multiple'].includes(row.type)) continue;
      if (!row.listName) continue;

      const choiceList = form.choiceLists.find((cl) => cl.list_name === row.listName);
      if (!choiceList || choiceList.choices.length < 10) continue;

      const appearance = (row.appearance || '').toLowerCase();
      const hasSearch = appearance.includes('search') || appearance.includes('autocomplete');
      if (hasSearch) continue;

      matches.push({
        rowIds: [row.id],
        suggestedFix: `This ${row.type} has ${choiceList.choices.length} choices. Add search or autocomplete appearance for better mobile UX.`,
        actionText: 'Edit appearance',
      });
    }

    return matches;
  },
};

/**
 * Rule 7: Select with only 2 choices (yes/no pattern)
 * A select_one with exactly 2 choices that look like yes/no.
 */
const selectTwoChoicesAsToggle: OptimizationRule = {
  id: 'select-two-choices-toggle',
  title: 'Binary choice as toggle',
  description:
    'A select with only 2 choices (e.g., yes/no, true/false, agree/disagree). Consider using yes_no_toggle appearance for a better UX.',
  category: 'ux-improvement',
  severity: 'suggestion',
  detect: (form: SurveyForm) => {
    const matches: OptimizationMatch[] = [];
    const yesNoPatterns = [
      ['yes', 'no'],
      ['true', 'false'],
      ['agree', 'disagree'],
      ['pass', 'fail'],
      ['on', 'off'],
    ];

    for (const row of form.survey) {
      if (row.type !== 'select_one') continue;
      if (!row.listName) continue;

      const choiceList = form.choiceLists.find((cl) => cl.list_name === row.listName);
      if (!choiceList || choiceList.choices.length !== 2) continue;

      const appearance = (row.appearance || '').toLowerCase();
      if (appearance.includes('toggle')) continue;

      const choiceNames = choiceList.choices.map((c) => c.name.toLowerCase()).sort();
      const isPattern = yesNoPatterns.some((pattern) => {
        const sorted = pattern.sort();
        return choiceNames[0] === sorted[0] && choiceNames[1] === sorted[1];
      });

      if (isPattern) {
        matches.push({
          rowIds: [row.id],
          suggestedFix: `This select has 2 binary choices. Use yes_no_toggle appearance for a cleaner interface.`,
          actionText: 'Edit appearance',
        });
      }
    }

    return matches;
  },
};

/**
 * Rule 8: No required fields
 * A form with 5+ questions but zero required fields.
 */
const noRequiredFields: OptimizationRule = {
  id: 'no-required-fields',
  title: 'No required fields',
  description:
    'Your form has 5+ questions but no fields are marked as required. Consider marking key fields as required to ensure data quality.',
  category: 'ux-improvement',
  severity: 'suggestion',
  detect: (form: SurveyForm) => {
    const matches: OptimizationMatch[] = [];

    const questionRows = form.survey.filter(
      (r) => !['end_group', 'end_repeat', 'begin_group', 'begin_repeat', 'note', 'calculate', 'hidden', 'start', 'end', 'username', 'deviceid'].includes(
        r.type
      ) && r.name
    );

    if (questionRows.length < 5) return [];

    const hasRequired = questionRows.some((r) => r.required && r.required !== 'no');

    if (!hasRequired) {
      matches.push({
        rowIds: [],
        suggestedFix: `Your form has ${questionRows.length} questions but none are marked as required. Mark key fields as required to ensure data completeness.`,
        actionText: 'Review',
      });
    }

    return matches;
  },
};

/**
 * Rule 9: Missing hints on complex questions
 * Questions with complex types (geopoint, barcode, file) but no hint text.
 */
const missingHintsOnComplex: OptimizationRule = {
  id: 'missing-hints-complex',
  title: 'Missing hints on complex questions',
  description:
    'Complex question types like geopoint, barcode, and file upload benefit from guidance text. Add a hint to help respondents understand what to do.',
  category: 'ux-improvement',
  severity: 'recommendation',
  detect: (form: SurveyForm) => {
    const matches: OptimizationMatch[] = [];

    for (const row of form.survey) {
      if (!isComplexQuestionType(row.type)) continue;
      if (row.hint && row.hint.trim()) continue;

      matches.push({
        rowIds: [row.id],
        suggestedFix: `Add a hint to guide respondents on how to use the ${row.type} question.`,
        actionText: 'Edit properties',
      });
    }

    return matches;
  },
};

/**
 * Rule 10: Consecutive same-type questions
 * 3+ consecutive questions of the same type that could be grouped.
 */
const consecutiveSameTypeQuestions: OptimizationRule = {
  id: 'consecutive-same-type',
  title: 'Consecutive same-type questions',
  description:
    'Multiple consecutive questions of the same type could potentially be combined or grouped together to improve form organization.',
  category: 'ux-improvement',
  severity: 'suggestion',
  detect: (form: SurveyForm) => {
    const matches: OptimizationMatch[] = [];

    let i = 0;
    while (i < form.survey.length) {
      const row = form.survey[i];

      // Skip structural elements
      if (['end_group', 'end_repeat', 'begin_group', 'begin_repeat', 'note', 'calculate', 'hidden', 'start', 'end'].includes(row.type)) {
        i++;
        continue;
      }

      // Count consecutive rows of same type
      let j = i + 1;
      while (j < form.survey.length) {
        const nextRow = form.survey[j];
        if (['end_group', 'end_repeat', 'begin_group', 'begin_repeat'].includes(nextRow.type)) break;
        if (nextRow.type !== row.type) break;
        j++;
      }

      const count = j - i;
      if (count >= 3) {
        const ids = form.survey.slice(i, j).map((r) => r.id);
        matches.push({
          rowIds: ids,
          suggestedFix: `${count} consecutive ${row.type} questions. Consider grouping them or combining into a single select_multiple for better organization.`,
          actionText: 'View',
        });
        i = j;
      } else {
        i++;
      }
    }

    return matches;
  },
};

/**
 * Rule 11: Large choice list in multiple questions
 * The same choice list with 50+ items used in multiple select questions.
 */
const largeChoiceListMultipleQuestions: OptimizationRule = {
  id: 'large-choice-list-reuse',
  title: 'Large choice list used multiple times',
  description:
    'A choice list with 50+ items is used by multiple questions. Consider using select_*_from_file with a CSV file instead for better performance.',
  category: 'performance',
  severity: 'recommendation',
  detect: (form: SurveyForm) => {
    const matches: OptimizationMatch[] = [];

    for (const choiceList of form.choiceLists) {
      if (choiceList.choices.length < 50) continue;

      const questions = form.survey.filter(
        (r) => ['select_one', 'select_multiple', 'rank'].includes(r.type) && r.listName === choiceList.list_name
      );

      if (questions.length > 1) {
        matches.push({
          rowIds: questions.map((q) => q.id),
          suggestedFix: `Choice list "${choiceList.list_name}" has ${choiceList.choices.length} items and is used by ${questions.length} questions. Use select_*_from_file with a CSV file for better performance.`,
          actionText: 'Review',
        });
      }
    }

    return matches;
  },
};

/**
 * Rule 12: Too many top-level questions
 * 20+ questions at the top level without groups.
 */
const tooManyTopLevelQuestions: OptimizationRule = {
  id: 'too-many-top-level',
  title: 'Too many top-level questions',
  description:
    'Your form has 20+ questions at the top level without grouping. Consider organizing them into logical groups or pages (field-list) for better UX.',
  category: 'ux-improvement',
  severity: 'recommendation',
  detect: (form: SurveyForm) => {
    const matches: OptimizationMatch[] = [];

    const topLevelQuestions = form.survey.filter((r) => {
      if (['end_group', 'end_repeat', 'begin_group', 'begin_repeat', 'note', 'calculate', 'hidden', 'start', 'end'].includes(r.type)) {
        return false;
      }
      return getRowNestDepth(form.survey, r.id) === 0;
    });

    if (topLevelQuestions.length >= 20) {
      matches.push({
        rowIds: topLevelQuestions.map((q) => q.id),
        suggestedFix: `Your form has ${topLevelQuestions.length} top-level questions. Organize them into logical groups or use field-list pages for better structure.`,
        actionText: 'Review',
      });
    }

    return matches;
  },
};

/**
 * Rule 13: Duplicate relevant conditions
 * Multiple questions with identical relevant expressions.
 */
const duplicateRelevantConditions: OptimizationRule = {
  id: 'duplicate-relevant',
  title: 'Duplicate relevant conditions',
  description:
    'Multiple questions have the same relevant expression. Consider grouping them under a single group with that relevant condition.',
  category: 'expression-optimization',
  severity: 'suggestion',
  detect: (form: SurveyForm) => {
    const matches: OptimizationMatch[] = [];

    const relevantMap = new Map<string, string[]>();
    for (const row of form.survey) {
      if (!row.relevant || !row.relevant.trim()) continue;
      const ids = relevantMap.get(row.relevant) || [];
      ids.push(row.id);
      relevantMap.set(row.relevant, ids);
    }

    for (const [relevant, ids] of relevantMap) {
      if (ids.length >= 2) {
        matches.push({
          rowIds: ids,
          suggestedFix: `${ids.length} questions share the same relevant condition. Consider grouping them and applying the condition to the group instead.`,
          actionText: 'View',
        });
      }
    }

    return matches;
  },
};

/**
 * Rule 14: Overly complex expressions
 * Relevant/constraint expressions exceeding 200 characters.
 */
const overlyComplexExpressions: OptimizationRule = {
  id: 'overly-complex-expressions',
  title: 'Overly complex expressions',
  description:
    'This expression is very long and complex. Consider breaking it into smaller parts using helper calculate fields, or simplify the logic.',
  category: 'expression-optimization',
  severity: 'suggestion',
  detect: (form: SurveyForm) => {
    const matches: OptimizationMatch[] = [];

    for (const row of form.survey) {
      const fields = [
        { expr: row.relevant, name: 'relevant' },
        { expr: row.constraint, name: 'constraint' },
        { expr: row.calculation, name: 'calculation' },
      ];

      for (const field of fields) {
        if (!field.expr || field.expr.length < 200) continue;

        matches.push({
          rowIds: [row.id],
          suggestedFix: `The ${field.name} expression is ${field.expr.length} characters long. Consider simplifying with helper calculate fields.`,
          actionText: 'Review',
        });
      }
    }

    return matches;
  },
};

// ============================================================
// Rule Registry
// ============================================================

const allRules: OptimizationRule[] = [
  repeatWithSinglePhoto,
  repeatWithSingleQuestion,
  groupWithSingleChild,
  deeplyNestedGroups,
  emptyGroupOrRepeat,
  longChoiceListNoSearch,
  selectTwoChoicesAsToggle,
  noRequiredFields,
  missingHintsOnComplex,
  consecutiveSameTypeQuestions,
  largeChoiceListMultipleQuestions,
  tooManyTopLevelQuestions,
  duplicateRelevantConditions,
  overlyComplexExpressions,
];

// ============================================================
// Main Analyzer
// ============================================================

export function analyzeSurvey(form: SurveyForm): OptimizationResult[] {
  const results: OptimizationResult[] = [];

  for (const rule of allRules) {
    const matches = rule.detect(form);
    if (matches.length > 0) {
      results.push({
        ruleId: rule.id,
        title: rule.title,
        description: rule.description,
        category: rule.category,
        severity: rule.severity,
        matches,
      });
    }
  }

  // Sort by severity (recommendation > improvement > suggestion)
  const severityOrder = { recommendation: 0, improvement: 1, suggestion: 2 };
  results.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return results;
}
