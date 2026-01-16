import { Droppable } from "@hello-pangea/dnd";
import { Column as IColumn, api, Task } from "../services/api";
import { TaskCard } from "./TaskCard";
import { useState } from "react";

interface ColumnProps {
    column: IColumn;
    refreshBoard: () => void;
    onTaskClick: (task: Task) => void;
}

export function Column({ column, refreshBoard, onTaskClick }: ColumnProps) {
    const [newTaskContent, setNewTaskContent] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskContent.trim()) return;
        await api.addTask(column.id, newTaskContent);
        setNewTaskContent("");
        setIsAdding(false);
        refreshBoard();
    };

    const handleDelete = async () => {
        if (confirm('Delete column?')) {
            await api.deleteColumn(column.id);
            refreshBoard();
        }
    }

    return (
        <div className="bg-card border border-border rounded-lg shadow-sm w-72 flex-shrink-0 flex flex-col max-h-full">
            <div className="p-3 font-semibold flex justify-between items-center text-card-foreground border-b border-border">
                <span className="truncate">{column.title}</span>
                <button onClick={handleDelete} className="text-xs bg-transparent text-muted-foreground hover:text-destructive p-1 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 scrollbar-none">
                <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`min-h-[20px] transition-colors rounded-md flex flex-col gap-2 ${snapshot.isDraggingOver ? 'bg-muted/50' : ''}`}
                        >
                            {column.tasks.map((task, index) => (
                                <TaskCard key={task.id} task={task} index={index} onClick={onTaskClick} />
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </div>

            <div className="p-2 border-t border-border">
                {isAdding ? (
                    <form onSubmit={handleAddTask} className="flex flex-col gap-2 p-2">
                        <textarea
                            autoFocus
                            className="w-full resize-none p-2 rounded-md bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                            placeholder="Enter a title for this card..."
                            rows={3}
                            value={newTaskContent}
                            onChange={(e) => setNewTaskContent(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddTask(e);
                                }
                            }}
                        />
                        <div className="flex gap-2 items-center">
                            <button type="submit" className="text-xs py-1.5 px-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md font-medium">Add Card</button>
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="bg-transparent hover:bg-muted text-muted-foreground p-1 rounded transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                    </form>
                ) : (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="w-full text-left text-sm text-muted-foreground hover:text-foreground hover:bg-muted p-2 rounded-md flex items-center gap-2 bg-transparent transition-colors"
                    >
                        <span>+</span> Add a card
                    </button>
                )}
            </div>
        </div>
    );
}
