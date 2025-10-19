import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoalPeriod {
  start: string;
  end: string;
}

function calculatePeriod(period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly', date: Date): GoalPeriod {
  const start = new Date(date);
  const end = new Date(date);

  switch (period) {
    case 'daily':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'weekly':
      const day = start.getDay();
      start.setDate(start.getDate() - day);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    case 'monthly':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(start.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'quarterly':
      const quarter = Math.floor(start.getMonth() / 3);
      start.setMonth(quarter * 3, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(quarter * 3 + 3, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'yearly':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting goal achievements calculation...');

    // Buscar todas as metas ativas
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('is_active', true);

    if (goalsError) {
      console.error('Error fetching goals:', goalsError);
      throw goalsError;
    }

    console.log(`Found ${goals?.length || 0} active goals`);

    for (const goal of goals || []) {
      const now = new Date();
      const period = calculatePeriod(goal.period, now);

      console.log(`Processing goal ${goal.id} for period ${period.start} to ${period.end}`);

      // Se meta é por departamento
      if (goal.department_id) {
        // Buscar usuários do departamento
        const { data: users } = await supabase
          .from('profiles')
          .select('id')
          .eq('department_id', goal.department_id);

        for (const user of users || []) {
          await calculateUserGoalAchievement(supabase, goal, user.id, period);
        }

        // Cálculo consolidado do departamento
        await calculateDepartmentGoalAchievement(supabase, goal, period);
      } else {
        // Meta geral da empresa
        await calculateCompanyGoalAchievement(supabase, goal, period);
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed_goals: goals?.length || 0 }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in calculate-goal-achievements:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function calculateUserGoalAchievement(supabase: any, goal: any, userId: string, period: GoalPeriod) {
  // Contar atividades baseado no metric_type
  const activityTypeMap: Record<string, string> = {
    'tickets_resolved': 'ticket',
    'calls_made': 'call',
    'emails_sent': 'email',
    'meetings_attended': 'meeting',
    'tasks_completed': 'task'
  };

  const activityType = activityTypeMap[goal.metric_type];

  const { data: activities } = await supabase
    .from('activity_events')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('activity_type', activityType)
    .gte('timestamp', `${period.start}T00:00:00Z`)
    .lte('timestamp', `${period.end}T23:59:59Z`);

  const currentValue = activities?.length || 0;

  // Upsert achievement
  await supabase
    .from('goal_achievements')
    .upsert({
      company_id: goal.company_id,
      goal_id: goal.id,
      user_id: userId,
      department_id: goal.department_id,
      period_start: period.start,
      period_end: period.end,
      current_value: currentValue,
      target_value: goal.target_value,
      calculated_at: new Date().toISOString()
    }, {
      onConflict: 'goal_id,user_id,department_id,period_start'
    });
}

async function calculateDepartmentGoalAchievement(supabase: any, goal: any, period: GoalPeriod) {
  const activityTypeMap: Record<string, string> = {
    'tickets_resolved': 'ticket',
    'calls_made': 'call',
    'emails_sent': 'email',
    'meetings_attended': 'meeting',
    'tasks_completed': 'task'
  };

  const activityType = activityTypeMap[goal.metric_type];

  const { data: activities } = await supabase
    .from('activity_events')
    .select('*', { count: 'exact', head: true })
    .eq('department_id', goal.department_id)
    .eq('activity_type', activityType)
    .gte('timestamp', `${period.start}T00:00:00Z`)
    .lte('timestamp', `${period.end}T23:59:59Z`);

  const currentValue = activities?.length || 0;

  await supabase
    .from('goal_achievements')
    .upsert({
      company_id: goal.company_id,
      goal_id: goal.id,
      user_id: null,
      department_id: goal.department_id,
      period_start: period.start,
      period_end: period.end,
      current_value: currentValue,
      target_value: goal.target_value,
      calculated_at: new Date().toISOString()
    }, {
      onConflict: 'goal_id,user_id,department_id,period_start'
    });
}

async function calculateCompanyGoalAchievement(supabase: any, goal: any, period: GoalPeriod) {
  const activityTypeMap: Record<string, string> = {
    'tickets_resolved': 'ticket',
    'calls_made': 'call',
    'emails_sent': 'email',
    'meetings_attended': 'meeting',
    'tasks_completed': 'task'
  };

  const activityType = activityTypeMap[goal.metric_type];

  const { data: activities } = await supabase
    .from('activity_events')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', goal.company_id)
    .eq('activity_type', activityType)
    .gte('timestamp', `${period.start}T00:00:00Z`)
    .lte('timestamp', `${period.end}T23:59:59Z`);

  const currentValue = activities?.length || 0;

  await supabase
    .from('goal_achievements')
    .upsert({
      company_id: goal.company_id,
      goal_id: goal.id,
      user_id: null,
      department_id: null,
      period_start: period.start,
      period_end: period.end,
      current_value: currentValue,
      target_value: goal.target_value,
      calculated_at: new Date().toISOString()
    }, {
      onConflict: 'goal_id,user_id,department_id,period_start'
    });
}