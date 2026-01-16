import { invoke } from "@tauri-apps/api/core";

export interface Comment {
    id: string;
    author: string;
    content: string;
    created_at: string;
}

export interface Attachment {
    id: string;
    file_name: string;
    file_path: string;
    mime_type: string;
}

export interface Task {
    id: string;
    content: string;
    description?: string;
    due_date?: string;
    labels: string[];
    comments: Comment[];
    attachments: Attachment[];
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
    updateTaskDetails: (taskId: string, content?: string, description?: string, dueDate?: string, labels?: string[]) =>
        invoke<Board>("update_task_details", { taskId, content, description, dueDate, labels }),
    addComment: (taskId: string, content: string) => invoke<Board>("add_comment", { taskId, content }),
    addAttachment: (taskId: string, filePath: string, fileName: string, mimeType: string) =>
        invoke<Board>("add_attachment", { taskId, filePath, fileName, mimeType }),
    deleteTask: (taskId: string) => invoke<Board>("delete_task", { taskId }),
    moveTask: (sourceColId: string, destColId: string, sourceIndex: number, destIndex: number) =>
        invoke<Board>("move_task", { sourceColId, destColId, sourceIndex, destIndex }),
};
