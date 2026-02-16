import React from 'react';

export interface PlanExercise {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  notes: string;
}

export interface PlanDay {
  day: string;
  focus: string;
  exercises: PlanExercise[];
}

export interface SuggestedPlan {
  week_overview: string;
  days: PlanDay[];
}

interface AICoachPlanCardProps {
  plan: SuggestedPlan;
}

export const AICoachPlanCard: React.FC<AICoachPlanCardProps> = ({ plan }) => {
  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
      <h4 className="text-base font-semibold text-white">Suggested Plan</h4>
      <p className="mt-2 text-white/70">{plan.week_overview}</p>
      <div className="mt-4 space-y-4">
        {plan.days.map((day) => (
          <div key={day.day} className="rounded-xl border border-white/10 bg-black/30 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-white">{day.day}</span>
              <span className="text-white/60">{day.focus}</span>
            </div>
            <div className="mt-3 space-y-2">
              {day.exercises.map((exercise) => (
                <div key={`${day.day}-${exercise.name}`} className="rounded-lg bg-white/5 p-2">
                  <div className="text-sm font-medium text-white">{exercise.name}</div>
                  <div className="mt-1 text-xs text-white/60">
                    {exercise.sets} • {exercise.reps} • Rest: {exercise.rest}
                  </div>
                  {exercise.notes && (
                    <div className="mt-1 text-xs text-white/50">{exercise.notes}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
