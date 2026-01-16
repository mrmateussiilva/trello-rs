import { invoke } from "@tauri-apps/api/core";

export interface Task {
    id: string;
    content: string;
}

export interface Column {
    id: string;
    title: string;
    tasks: Task[];
}

export interface Board {
    columns: Column[];
}

export const api = {
    getBoard: () => invoke<Board>("get_board"),
    addColumn: (title: string) => invoke<Board>("add_column", { title }),
    deleteColumn: (columnId: string) => invoke<Board>("delete_column", { columnId }),
    addTask: (columnId: string, content: string) => invoke<Board>("add_task", { columnId, content }),
    updateTask: (taskId: string, content: string) => invoke<Board>("update_task", { taskId, content }),
    deleteTask: (taskId: string) => invoke<Board>("delete_task", { taskId }),
    moveTask: (sourceColId: string, destColId: string, sourceIndex: number, destIndex: number) =>
        invoke<Board>("move_task", { sourceColId, destColId, sourceIndex, destIndex }),
};
