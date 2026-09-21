import { RelationalFarmDatabase } from '../relationalStore';
import { getSupabaseClient } from '../supabaseClient';
import { Animal } from '../../../src/types/farm';

export class AnimalRepository {
  private db = RelationalFarmDatabase.getInstance();

  public async getAnimals(filter?: { barn_id?: string; pen_id?: string; status?: string; search?: string }): Promise<Animal[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        let query = supabase.from('animals').select('*');
        if (filter?.barn_id) query = query.eq('barn_id', filter.barn_id);
        if (filter?.pen_id) query = query.eq('pen_id', filter.pen_id);
        if (filter?.status && filter.status !== 'all') query = query.eq('status', filter.status);
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data as Animal[];
        }
      } catch (err) {
        console.warn('Supabase query failed, falling back to relational store:', err);
      }
    }
    return this.db.getAnimals(filter);
  }

  public async getAnimalById(id: string): Promise<Animal | undefined> {
    return this.db.getAnimalById(id);
  }
}
