use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use std::fs;
use std::path::PathBuf;
use tauri::{State, AppHandle, Manager};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Comment {
    pub id: String,
    pub author: String,
    pub content: String,
    pub created_at: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Attachment {
    pub id: String,
    pub file_name: String,
    pub file_path: String, // Absolute path or relative to app data
    pub mime_type: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Task {
    pub id: String,
    pub content: String,
    pub description: Option<String>,
    pub due_date: Option<String>,
    pub labels: Vec<String>,
    pub comments: Vec<Comment>,
    pub attachments: Vec<Attachment>,
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
        Board {
            columns: vec![
                Column {
                    id: "todo".to_string(),
                    title: "To Do".to_string(),
                    tasks: vec![],
                },
                Column {
                    id: "doing".to_string(),
                    title: "Doing".to_string(),
                    tasks: vec![],
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
    pub file_path: Mutex<PathBuf>,
}

fn save_board_to_disk(board: &Board, path: &PathBuf) {
    if let Ok(data) = serde_json::to_string_pretty(board) {
        let _ = fs::write(path, data);
    }
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
    save_board_to_disk(&board, &state.file_path.lock().unwrap());
    board.clone()
}

#[tauri::command]
fn delete_column(state: State<'_, AppState>, column_id: String) -> Board {
    let mut board = state.board.lock().unwrap();
    board.columns.retain(|c| c.id != column_id);
    save_board_to_disk(&board, &state.file_path.lock().unwrap());
    board.clone()
}

#[tauri::command]
fn add_task(state: State<'_, AppState>, column_id: String, content: String) -> Result<Board, String> {
    let mut board = state.board.lock().unwrap();
    if let Some(col) = board.columns.iter_mut().find(|c| c.id == column_id) {
        col.tasks.push(Task {
            id: Uuid::new_v4().to_string(),
            content,
            description: None,
            due_date: None,
            labels: vec![],
            comments: vec![],
            attachments: vec![],
        });
        save_board_to_disk(&board, &state.file_path.lock().unwrap());
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
            save_board_to_disk(&board, &state.file_path.lock().unwrap());
            break;
        }
    }
    board.clone()
}

#[tauri::command]
fn add_comment(state: State<'_, AppState>, task_id: String, content: String) -> Result<Board, String> {
    let mut board = state.board.lock().unwrap();
    for col in board.columns.iter_mut() {
        if let Some(task) = col.tasks.iter_mut().find(|t| t.id == task_id) {
            let comment = Comment {
                id: Uuid::new_v4().to_string(),
                author: "User".to_string(), // In a real app, get from auth context
                content,
                created_at: Utc::now().to_rfc3339(),
            };
            task.comments.push(comment);
            save_board_to_disk(&board, &state.file_path.lock().unwrap());
            return Ok(board.clone());
        }
    }
    Err("Task not found".to_string())
}

#[tauri::command]
fn add_attachment(state: State<'_, AppState>, task_id: String, file_path: String, file_name: String, mime_type: String) -> Result<Board, String> {
    let mut board = state.board.lock().unwrap();
    for col in board.columns.iter_mut() {
        if let Some(task) = col.tasks.iter_mut().find(|t| t.id == task_id) {
            let attachment = Attachment {
                id: Uuid::new_v4().to_string(),
                file_name,
                file_path,
                mime_type,
            };
            task.attachments.push(attachment);
            save_board_to_disk(&board, &state.file_path.lock().unwrap());
            return Ok(board.clone());
        }
    }
    Err("Task not found".to_string())
}

#[tauri::command]
fn update_task_details(
    state: State<'_, AppState>, 
    task_id: String, 
    content: Option<String>,
    description: Option<String>, 
    due_date: Option<String>,
    labels: Option<Vec<String>>
) -> Result<Board, String> {
    let mut board = state.board.lock().unwrap();
    for col in board.columns.iter_mut() {
        if let Some(task) = col.tasks.iter_mut().find(|t| t.id == task_id) {
            if let Some(c) = content { task.content = c; }
            if let Some(d) = description { task.description = Some(d); }
            if let Some(dd) = due_date { task.due_date = Some(dd); }
            if let Some(l) = labels { task.labels = l; }
            save_board_to_disk(&board, &state.file_path.lock().unwrap());
            return Ok(board.clone());
        }
    }
    Err("Task not found".to_string())
}

#[tauri::command]
fn delete_task(state: State<'_, AppState>, task_id: String) -> Board {
    let mut board = state.board.lock().unwrap();
    for col in board.columns.iter_mut() {
        col.tasks.retain(|t| t.id != task_id);
    }
    save_board_to_disk(&board, &state.file_path.lock().unwrap());
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

    save_board_to_disk(&board, &state.file_path.lock().unwrap());
    Ok(board.clone())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir().expect("failed to get app data dir");
            if !app_data_dir.exists() {
                let _ = fs::create_dir_all(&app_data_dir);
            }
            let file_path = app_data_dir.join("board.json");
            
            let mut board = Board::new();
            if file_path.exists() {
                 if let Ok(data) = fs::read_to_string(&file_path) {
                    if let Ok(saved_board) = serde_json::from_str::<Board>(&data) {
                        board = saved_board;
                    }
                 }
            }

            app.manage(AppState {
                board: Mutex::new(board),
                file_path: Mutex::new(file_path),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_board, 
            add_column, 
            delete_column,
            add_task, 
            update_task, 
            add_comment,
            add_attachment,
            update_task_details,
            delete_task, 
            move_task
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
