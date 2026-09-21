import { RelationalFarmDatabase } from '../relationalStore';

export class FarmRepository {
  private db = RelationalFarmDatabase.getInstance();

  public async getSummary() {
    return this.db.getSummary();
  }

  public async getBarnsAndPens() {
    return this.db.getBarnsAndPens();
  }

  public async getProtocols() {
    return Array.from(this.db.protocols.values());
  }

  public async getTreatments() {
    return Array.from(this.db.treatments.values());
  }

  public async addTreatmentFollowup(treatmentId: string, followup: { progression: any; notes: string; recorded_by: string }) {
    const treatment = this.db.treatments.get(treatmentId);
    if (!treatment) {
      throw new Error(`Treatment not found: ${treatmentId}`);
    }
    if (!treatment.followups) {
      treatment.followups = [];
    }
    treatment.followups.push({
      date: new Date().toISOString(),
      progression: followup.progression,
      notes: followup.notes,
      recorded_by: followup.recorded_by,
    });
    this.db.treatments.set(treatmentId, treatment);
    return treatment;
  }
}
