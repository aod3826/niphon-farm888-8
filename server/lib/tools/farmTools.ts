import { RelationalFarmDatabase } from '../db/relationalStore';

export class FarmTools {
  private static db = RelationalFarmDatabase.getInstance();

  public static async getAnimalHistory(animalCodeOrId: string) {
    const animals = Array.from(this.db.animals.values());
    const animal = animals.find((a) => a.id === animalCodeOrId || a.animal_code.includes(animalCodeOrId));

    if (!animal) {
      return {
        found: false,
        message: `ไม่พบข้อมูลสุกรรหัส ${animalCodeOrId} ในระบบ`,
      };
    }

    const cases = Array.from(this.db.cases.values()).filter((c) => c.animal_id === animal.id);

    return {
      found: true,
      animal: {
        id: animal.id,
        code: animal.animal_code,
        type: animal.type,
        breed: animal.breed,
        age_months: animal.age_months,
        parity: animal.parity,
        farrowing_date: animal.farrowing_date,
        barn: animal.barn_name,
        pen: animal.pen_name,
        status: animal.status,
        recent_cases: cases.map((c) => ({
          case_number: c.case_number,
          reported_at: c.reported_at,
          complaint: c.chief_complaint,
          triage: c.triage_level,
          status: c.status,
        })),
        timeline: animal.timeline || [],
      },
    };
  }

  public static async getPenMorbidity(penId: string) {
    const pen = this.db.pens.get(penId);
    if (!pen) {
      return { found: false, message: 'ไม่พบคอกระบุ' };
    }

    const penAnimals = Array.from(this.db.animals.values()).filter((a) => a.pen_id === penId);
    const activeCases = Array.from(this.db.cases.values()).filter(
      (c) => c.pen_id === penId && c.status !== 'resolved'
    );

    const sickCount = penAnimals.filter((a) => a.status === 'sick' || a.status === 'isolated').length;
    const morbidityRate = pen.current_count > 0 ? (sickCount / pen.current_count) * 100 : 0;

    return {
      found: true,
      pen_name: pen.name,
      capacity: pen.capacity,
      current_count: pen.current_count,
      active_cases_count: activeCases.length,
      sick_animals_count: sickCount,
      morbidity_rate_pct: Math.round(morbidityRate * 10) / 10,
      anomaly_flag: morbidityRate > 15.0, // Alert if > 15% sick in pen
    };
  }

  public static async searchApprovedProtocols(query: string) {
    const q = query.toLowerCase();
    const protocols = Array.from(this.db.protocols.values()).filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q)
    );

    return protocols.map((p) => ({
      code: p.code,
      title: p.title,
      category: p.category,
      steps: p.steps,
      authority: p.reference_source,
      approved_by: p.approved_by_vet,
    }));
  }
}
