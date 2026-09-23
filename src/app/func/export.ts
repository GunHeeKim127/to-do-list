import { supabase } from "../lib/supabase";

export async function getExportData() {
  const readTable = async (name: string) => {
    const rows: Record<string, unknown>[] = [];
    const pageSize = 500;
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await supabase.from(name).select("*").order("id").range(offset, offset + pageSize - 1);
      if (error) throw new Error("자료를 불러오지 못했습니다. 연결 상태를 확인하고 다시 내보내 주세요.");
      rows.push(...data);
      if (data.length < pageSize) return rows;
    }
  };
  const [allTasks, plans, planHistories, executionLogs] = await Promise.all([
    readTable("tasks"), readTable("plans"), readTable("plan_histories"), readTable("execution_logs"),
  ]);
  return {
    exportedAt: new Date().toISOString(), timezone: "Asia/Seoul", format: "database-columns-v1",
    tasks: allTasks.filter((task) => !task.deleted_at), deletedTasks: allTasks.filter((task) => task.deleted_at),
    plans, planHistories, executionLogs,
  };
}
