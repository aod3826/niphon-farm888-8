import { RelationalFarmDatabase, AIAuditRecord } from '../relationalStore';

export class AuditRepository {
  private db = RelationalFarmDatabase.getInstance();

  public async logAIAuditEvent(event: Omit<AIAuditRecord, 'id' | 'created_at' | 'farm_id'>): Promise<AIAuditRecord> {
    return this.db.logAIAuditEvent(event);
  }

  public async getAuditEvents(limit = 50): Promise<AIAuditRecord[]> {
    return this.db.auditEvents.slice(0, limit);
  }
}
