import { RelationalFarmDatabase } from '../relationalStore';
import { FarmTask } from '../../../src/types/farm';

export class TaskRepository {
  private db = RelationalFarmDatabase.getInstance();

  public async getTasks(filter?: { status?: string; role?: string }): Promise<FarmTask[]> {
    return this.db.getTasks(filter);
  }

  public async updateTaskStatus(
    taskId: string,
    status: 'pending' | 'in_progress' | 'completed',
    completedBy?: string
  ): Promise<FarmTask> {
    return this.db.updateTaskStatus(taskId, status, completedBy);
  }
}
