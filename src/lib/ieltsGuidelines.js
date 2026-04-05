/**
 * Expert IELTS Guidelines — Task 1 & Task 2 tips for STRATUM.ai
 * Icons (Lucide React) are mapped in components. Used on Landing, Dashboard (Cheat Sheet), and Analysis (Examiner's Checklist).
 */
export const TASK1_TIPS = [
  { id: 'overview-included', label: 'Overview Included', icon: 'Eye' },
  { id: 'data-accuracy', label: 'Data Accuracy', icon: 'Target' },
  { id: 'no-personal-opinion', label: 'No Personal Opinion', icon: 'Shield' },
  { id: 'comparisons-made', label: 'Comparisons Made', icon: 'Filter' },
  { id: 'complex-sentences', label: 'Complex Sentences', icon: 'Zap' },
];

export const TASK2_TIPS = [
  { id: 'clear-thesis', label: 'Clear Thesis Statement', icon: 'Target' },
  { id: 'paragraph-unity', label: 'Paragraph Unity', icon: 'LayoutGrid' },
  { id: 'main-ideas-supported', label: 'Main Ideas Supported', icon: 'Crown' },
  { id: 'academic-register', label: 'Academic Register', icon: 'Shield' },
  { id: 'logical-conclusion', label: 'Logical Conclusion', icon: 'RefreshCw' },
];


/**
 * Heuristics for Examiner's Checklist: did the user follow each tip?
 * @param { 'Task 1' | 'Task 2' } taskType
 * @param { string } essayText
 * @param { object } result - activeResult (criteria, corrections, analysis)
 * @returns { Record<string, boolean> } tipId -> true if followed, false if missed
 */
export function getChecklistStatus(taskType, essayText, result) {
  const essay = String(essayText || '');
  const text = essay.toLowerCase();

  const comments = result?.criteria
    ? Object.values(result.criteria)
      .map((c) => (c?.comment || '').toLowerCase())
      .join(' ')
    : '';
  const corrections = (result?.corrections || [])
    .map((c) => (c?.original || '').toLowerCase())
    .join(' ');

  // Includes "original/explanation/type" from the examiner pass, not just the criteria comments.
  const errorsText = Array.isArray(result?.errors)
    ? result.errors
        .map((e) => `${e?.type || ''} ${e?.original || ''} ${e?.explanation || ''}`)
        .join(' ')
        .toLowerCase()
    : '';

  const checklist = result?.checklist || null;
  const getChecklistBool = (key) => {
    if (!checklist || !Object.prototype.hasOwnProperty.call(checklist, key)) return undefined;
    const v = checklist[key];
    if (v === true) return true;
    if (v === false) return false;
    if (typeof v === 'number') return v === 1;
    if (typeof v === 'string') {
      const s = v.trim().toLowerCase();
      if (s === 'true' || s === '1' || s === 'yes') return true;
      if (s === 'false' || s === '0' || s === 'no') return false;
    }
    return undefined;
  };

  if (taskType === 'Task 1') {
    const hasFirstPerson = /\b(i|my|we|our|me)\b/.test(text);

    const overviewRegex = /(overall|in general|to summarize|in summary|main (features|trends|points))/i;
    const overviewMention = overviewRegex.test(essay) || /overview|summaris(e|ing)|main (feature|trend)/.test(comments);

    const comparisonsRegex =
      /(compared to|compared with|in contrast|while|whereas|however|on the other hand|more than|less than|the (highest|lowest|greatest|smallest)|surpass(ed|es)?|outnumber(ed|s)?)/i;
    const comparisonsMade = comparisonsRegex.test(essay);

    const complexRegex =
      /(because|although|whereas|while|since|which|that |who |whom |when |where |if |unless |despite|moreover|nevertheless|consequently)/i ||
      /;/.test(essay) ||
      (essay.split(/\n+/).join(' ').match(/,\s*\w+/g)?.length || 0) >= 3;
    const complexSentences = Boolean(complexRegex);

    // If the examiner found logic errors that indicate factual mismatch/contradiction, assume data accuracy is weak.
    const dataAccuracyIssues = /(contradict|contradiction|inconsistent|inaccurate|wrong trend|does not match|mismatch|incorrect|unsupported)/i.test(
      [comments, corrections, errorsText].join(' ')
    );
    const dataAccuracy = !dataAccuracyIssues;

    const noPersonalOpinion = !hasFirstPerson;

    return {
      'overview-included': getChecklistBool('overview_included') ?? overviewMention,
      'data-accuracy': getChecklistBool('data_accuracy') ?? dataAccuracy,
      'no-personal-opinion': getChecklistBool('no_personal_opinion') ?? noPersonalOpinion,
      'comparisons-made': getChecklistBool('comparisons_made') ?? comparisonsMade,
      'complex-sentences': getChecklistBool('complex_sentences') ?? complexSentences,
    };
  }

  if (taskType === 'Task 2') {
    const paragraphs = essay
      .trim()
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);

    const clearThesisRegex =
      /(this essay (will|aims|discuss)|in this essay (will|i will)|the (main )?(argument|thesis)|i (agree|disagree)|i believe|i would argue|it is argued|it is believed)/i;
    const clearThesisStatement = clearThesisRegex.test(essay);

    const academicRegisterIssues = /\b(gonna|wanna|gotta|yeah|stuff|thing|lots of|a lot of|kind of|sort of|kinda|sorta|like)\b/i.test(essay) ||
      /\b(can't|won't|don't|isn't|aren't|i'm|it's|they're|we're|he's|she's)\b/i.test(essay);
    const academicRegister = !academicRegisterIssues;

    const paragraphUnityIssues = /(off topic|irrelevant|lack of (unity|focus)|paragraph (shift|switch)|unclear structure)/i.test(
      [comments, corrections, errorsText].join(' ')
    );
    const paragraphUnity = !paragraphUnityIssues && paragraphs.length >= 2;

    const supportedIdeas =
      /(for example|for instance|such as|e\.g\.|because\s|since\s|therefore\s|as a result\s|this means\s)/i.test(essay) &&
      essay.trim().length > 200;

    const mainIdeasSupported = supportedIdeas;

    const logicalConclusionRegex =
      /(in conclusion|to conclude|overall|to sum up|finally|therefore|thus)\b/i;
    const logicalConclusion = logicalConclusionRegex.test(essay) && paragraphs.length >= 2;

    return {
      'clear-thesis': getChecklistBool('clear_thesis_statement') ?? clearThesisStatement,
      'paragraph-unity': getChecklistBool('paragraph_unity') ?? paragraphUnity,
      'main-ideas-supported': getChecklistBool('main_ideas_supported') ?? mainIdeasSupported,
      'academic-register': getChecklistBool('academic_register') ?? academicRegister,
      'logical-conclusion': getChecklistBool('logical_conclusion') ?? logicalConclusion,
    };
  }

  return {};

}
