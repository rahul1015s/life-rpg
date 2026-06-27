import type { GoalRewardResult, PersonalGoal, QuestCompletionLogEntry } from './types';

export function getGoalProgressPercent(
  goal: PersonalGoal,
  completionLog: QuestCompletionLogEntry[]
): number {
  if (goal.linkedQuestIds.length === 0) {
    return goal.progressPercent;
  }

  const completedIds = new Set(
    completionLog
      .filter((entry) => entry.completedAt >= goal.createdAt && goal.linkedQuestIds.includes(entry.questId))
      .map((entry) => entry.questId)
  );

  return Math.min(Math.round((completedIds.size / goal.linkedQuestIds.length) * 100), 100);
}

export function updateGoalsFromCompletion(
  goals: PersonalGoal[],
  completionLog: QuestCompletionLogEntry[],
  rewardedAt: string
): { goals: PersonalGoal[]; completedGoals: GoalRewardResult[] } {
  const completedGoals: GoalRewardResult[] = [];

  const nextGoals = goals.map((goal) => {
    if (goal.status === 'completed') {
      return goal;
    }

    const progressPercent = getGoalProgressPercent(goal, completionLog);
    if (progressPercent < 100) {
      return { ...goal, progressPercent };
    }

    const completedGoal = {
      ...goal,
      progressPercent: 100,
      status: 'completed' as const,
      completedAt: rewardedAt,
    };
    completedGoals.push({ goal: completedGoal, rewardedAt });
    return completedGoal;
  });

  return { goals: nextGoals, completedGoals };
}

export function getTopActiveGoal(goals: PersonalGoal[]): PersonalGoal | null {
  return (
    goals
      .filter((goal) => goal.status === 'active')
      .sort((first, second) => {
        if (second.progressPercent !== first.progressPercent) {
          return second.progressPercent - first.progressPercent;
        }
        return first.targetDate.localeCompare(second.targetDate);
      })[0] ?? null
  );
}
