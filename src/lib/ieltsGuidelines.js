/**
 * Expert IELTS Guidelines — Task 1 & Task 2 tips for STRATUM.ai
 * Icons (Lucide React) are mapped in components. Used on Landing, Dashboard (Cheat Sheet), and Analysis (Examiner's Checklist).
 */
export const TASK1_TIPS = [
  { id: 'no-opinion', label: 'No Personal Opinion', icon: 'EyeOff' },
  { id: 'overview', label: 'The Overview is King', icon: 'Crown' },
  { id: 'no-dump', label: 'Avoid Data Dumping', icon: 'Filter' },
  { id: 'vocabulary', label: 'Vary Your Vocabulary', icon: 'Type' },
  { id: 'group-data', label: 'Group Your Data', icon: 'LayoutGrid' },
];

export const TASK2_TIPS = [
  { id: 'paraphrase', label: 'Paraphrase the Prompt', icon: 'RefreshCw' },
  { id: 'one-idea', label: 'One Idea, One Paragraph', icon: 'AlignLeft' },
  { id: 'formal', label: 'Formal Tone Only', icon: 'Shield' },
  { id: 'thesis', label: 'The Thesis Statement', icon: 'Target' },
  { id: 'complex', label: 'Complex Structures', icon: 'Zap' },
];


/**
 * Heuristics for Examiner's Checklist: did the user follow each tip?
 * @param { 'Task 1' | 'Task 2' } taskType
 * @param { string } essayText
 * @param { object } result - activeResult (criteria, corrections, analysis)
 * @returns { Record<string, boolean> } tipId -> true if followed, false if missed
 */
export function getChecklistStatus(taskType, essayText, result) {
  const text = (essayText || '').toLowerCase();
  const comments = result?.criteria
    ? Object.values(result.criteria).map((c) => (c?.comment || '').toLowerCase()).join(' ')
    : '';
  const corrections = (result?.corrections || []).map((c) => (c?.original || '').toLowerCase()).join(' ');

  if (taskType === 'Task 1') {
    const hasFirstPerson = /\b(i|my|we|our|me)\b/.test(text);
    const overviewMention = /overview|summaris(e|ing)|main (feature|trend)/.test(comments);
    const dataDumpWarning = /(data dump|list|listing|every (detail|number)|too much detail)/.test(comments);
    const vocabMention = /(variety|vocabulary|repetition|repetitive|vary)/.test(comments);
    const groupingMention = /(group|organi(z|s)ation|logical|clear (structure|paragraph))/.test(comments);

    return {
      'no-opinion': !hasFirstPerson,
      overview: overviewMention === false || /overview|clear (overview|summary)/.test(comments),
      'no-dump': !dataDumpWarning,
      vocabulary: !/repetition|repetitive/.test(comments) || vocabMention,
      'group-data': groupingMention || !/disorgani(z|s)ed|no (clear )?structure/.test(comments),
    };
  }

  if (taskType === 'Task 2') {
    const hasParaphrase = text.length > 50 && (/(it is (often |widely )?(argued|believed|said)|many people|some argue|the (topic|issue|question))/i.test(text) || !/^(in (this )?essay|this essay (will|discuss))/i.test(text));
    const informal = /\b(gonna|wanna|gotta|yeah|stuff|thing|lots of|a lot of|kind of|sort of)\b/.test(text) || /\b(i think|i believe|in my opinion)\b/.test(text);
    const hasThesis = text.length > 80 && (/(this essay (will|aims)|(will|shall) (argue|discuss|examine)|(the (main )?argument|thesis))/i.test(text) || text.split(/\n/).length >= 2);
    const complexMention = /(complex (sentence|structure)|subordination|compound|variety of (structure|sentence))/.test(comments) || !/(simple (only|sentence)|lack of (complexity|variety))/.test(comments);

    return {
      paraphrase: hasParaphrase,
      'one-idea': !/(multiple ideas in one paragraph|one paragraph (with|has) (many|several))/i.test(comments),
      formal: !informal,
      thesis: hasThesis,
      complex: complexMention,
    };
  }

  return {};
}
