use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Task {
    pub id: String,
    pub content: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Column {
    pub id: String,
    pub title: String,
    pub tasks: Vec<Task>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Board {
    pub columns: Vec<Column>,
}

impl Board {
    fn new() -> Self {
        // Initial mock data
        Board {
            columns: vec![
                Column {
                    id: "todo".to_string(),
                    title: "To Do".to_string(),
                    tasks: vec![
                        Task { id: Uuid::new_v4().to_string(), content: "Learn Tauri".to_string() },
                        Task { id: Uuid::new_v4().to_string(), content: "Setup React".to_string() },
                    ],
                },
                Column {
                    id: "in-progress".to_string(),
                    title: "In Progress".to_string(),
                    tasks: vec![
                        Task { id: Uuid::new_v4().to_string(), content: "Build Kanban".to_string() },
                    ],
                },
                Column {
                    id: "done".to_string(),
                    title: "Done".to_string(),
                    tasks: vec![],
                },
            ],
        }
    }
}

pub struct AppState {
    pub board: Mutex<Board>,
}

#[tauri::command]
fn get_board(state: State<'_, AppState>) -> Board {
    let board = state.board.lock().unwrap();
    board.clone()
}

#[tauri::command]
fn add_column(state: State<'_, AppState>, title: String) -> Board {
    let mut board = state.board.lock().unwrap();
    let new_col = Column {
        id: Uuid::new_v4().to_string(),
        title,
        tasks: vec![],
    };
    board.columns.push(new_col);
    board.clone()
}

#[tauri::command]
fn delete_column(state: State<'_, AppState>, column_id: String) -> Board {
    let mut board = state.board.lock().unwrap();
    board.columns.retain(|c| c.id != column_id);
    board.clone()
}

#[tauri::command]
fn add_task(state: State<'_, AppState>, column_id: String, content: String) -> Result<Board, String> {
    let mut board = state.board.lock().unwrap();
    if let Some(col) = board.columns.iter_mut().find(|c| c.id == column_id) {
        col.tasks.push(Task {
            id: Uuid::new_v4().to_string(),
            content,
        });
        Ok(board.clone())
    } else {
        Err("Column not found".to_string())
    }
}

#[tauri::command]
fn update_task(state: State<'_, AppState>, task_id: String, content: String) -> Board {
    let mut board = state.board.lock().unwrap();
    for col in board.columns.iter_mut() {
        if let Some(task) = col.tasks.iter_mut().find(|t| t.id == task_id) {
            task.content = content.clone();
            break;
        }
    }
    board.clone()
}

#[tauri::command]
fn delete_task(state: State<'_, AppState>, task_id: String) -> Board {
    let mut board = state.board.lock().unwrap();
    for col in board.columns.iter_mut() {
        col.tasks.retain(|t| t.id != task_id);
    }
    board.clone()
}

#[tauri::command]
fn move_task(
    state: State<'_, AppState>,
    source_col_id: String,
    dest_col_id: String,
    source_index: usize,
    dest_index: usize,
) -> Result<Board, String> {
    let mut board = state.board.lock().unwrap();

    let src_idx = board.columns.iter().position(|c| c.id == source_col_id).ok_or("Source column not found")?;
    let dst_idx = board.columns.iter().position(|c| c.id == dest_col_id).ok_or("Dest column not found")?;

    if src_idx == dst_idx {
        let col = &mut board.columns[src_idx];
        if source_index >= col.tasks.len() {
            return Err("Source index out of bounds".to_string());
        }
        let task = col.tasks.remove(source_index);
        let insert_index = if dest_index > col.tasks.len() {
            col.tasks.len()
        } else {
            dest_index
        };
        col.tasks.insert(insert_index, task);
    } else {
        if src_idx < dst_idx {
            let (left, right) = board.columns.split_at_mut(dst_idx);
            let src_col = &mut left[src_idx];
            let dst_col = &mut right[0];
            
            if source_index >= src_col.tasks.len() {
                return Err("Source index out of bounds".to_string());
            }
            let task = src_col.tasks.remove(source_index);
            let insert_index = if dest_index > dst_col.tasks.len() {
                dst_col.tasks.len()
            } else {
                dest_index
            };
            dst_col.tasks.insert(insert_index, task);
        } else {
             let (left, right) = board.columns.split_at_mut(src_idx);
             let dst_col = &mut left[dst_idx];
             let src_col = &mut right[0];
             
             if source_index >= src_col.tasks.len() {
                return Err("Source index out of bounds".to_string());
            }
             let task = src_col.tasks.remove(source_index);
             let insert_index = if dest_index > dst_col.tasks.len() {
                dst_col.tasks.len()
            } else {
                dest_index
            };
             dst_col.tasks.insert(insert_index, task);
        }
    }

    Ok(board.clone())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            board: Mutex::new(Board::new()),
        })
        .invoke_handler(tauri::generate_handler![
            get_board, 
            add_column, 
            delete_column,
            add_task, 
            update_task, 
            delete_task, 
            move_task
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
