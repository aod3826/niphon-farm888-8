import { RelationalFarmDatabase } from '../relationalStore';
import { getSupabaseClient } from '../supabaseClient';
import { HealthCase, AITriageResponse } from '../../../src/types/farm';

export class CaseRepository {
  private db = RelationalFarmDatabase.getInstance();

  public async getCases(filter?: { triage_level?: string; status?: string }): Promise<HealthCase[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        let query = supabase.from('health_cases').select('*').order('created_at', { ascending: false });
        if (filter?.triage_level && filter.triage_level !== 'all') {
          query = query.eq('triage_level', filter.triage_level);
        }
        if (filter?.status && filter.status !== 'all') {
          query = query.eq('status', filter.status);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data as HealthCase[];
        }
      } catch (err) {
        console.warn('Supabase query failed, using relational store:', err);
      }
    }
    return this.db.getCases(filter);
  }

  public async getCaseById(id: string): Promise<HealthCase | undefined> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('health_cases').select('*').eq('id', id).single();
        if (!error && data) {
          return data as HealthCase;
        }
      } catch (err) {
        console.warn('Supabase getCaseById failed, using relational store:', err);
      }
    }
    return this.db.getCaseById(id);
  }

  public async createCase(input: {
    animal_id?: string;
    animal_code?: string;
    barn_id: string;
    pen_id: string;
    affected_count: number;
    reported_by: string;
    reported_by_role?: any;
    chief_complaint: string;
    symptoms: any[];
    temperature_c?: number;
    respiratory_rate?: number;
    feed_intake_status: any;
    photos?: string[];
  }): Promise<HealthCase> {
    // Save to relational store
    const created = this.db.createCase(input);

    // Sync to Supabase if connected
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('health_cases').insert({
          id: created.id,
          farm_id: created.farm_id,
          case_number: created.case_number,
          animal_id: created.animal_id,
          barn_id: created.barn_id,
          pen_id: created.pen_id,
          affected_count: created.affected_count,
          reported_by: created.reported_by,
          chief_complaint: created.chief_complaint,
          symptoms: created.symptoms,
          temperature_c: created.temperature_c,
          respiratory_rate: created.respiratory_rate,
          feed_intake_status: created.feed_intake_status,
          photos: created.photos,
          triage_level: created.triage_level,
          status: created.status,
        });
      } catch (err) {
        console.warn('Supabase insert failed:', err);
      }
    }

    return created;
  }

  public async updateCaseTriage(caseId: string, triage: AITriageResponse): Promise<HealthCase> {
    const updated = this.db.updateCaseTriage(caseId, triage);
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('health_cases')
          .update({
            triage_level: triage.triage_level,
            ai_triage: triage,
            status: updated.status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', caseId);
      } catch (err) {
        console.warn('Supabase triage update failed:', err);
      }
    }
    return updated;
  }

  public async addInterviewAnswer(caseId: string, question: string, answer: string): Promise<HealthCase> {
    return this.db.addInterviewAnswer(caseId, question, answer);
  }

  public async reviewCase(
    caseId: string,
    review: {
      reviewed_by: string;
      reviewer_role: string;
      status: 'approved' | 'modified' | 'rejected';
      clinical_notes: string;
      confirmed_diagnosis?: string;
    }
  ): Promise<HealthCase> {
    if (review.reviewer_role !== 'veterinarian') {
      throw new Error('Unauthorized: Only licensed veterinarians can sign off clinical reviews.');
    }
    return this.db.reviewCaseByVet(caseId, review);
  }
}
