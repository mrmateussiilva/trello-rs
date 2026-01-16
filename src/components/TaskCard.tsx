import { Draggable } from "@hello-pangea/dnd";
import { Task } from "../services/api";

interface TaskCardProps {
    task: Task;
    index: number;
    onClick: (task: Task) => void;
}

export function TaskCard({ task, index, onClick }: TaskCardProps) {
    return (
        <Draggable draggableId={task.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{
                        ...provided.draggableProps.style,
                        opacity: snapshot.isDragging ? 0.8 : 1,
                        transform: snapshot.isDragging ? provided.draggableProps.style?.transform + " scale(1.05)" : provided.draggableProps.style?.transform,
                    }}
                    onClick={() => onClick(task)}
                    className="bg-card hover:bg-accent hover:text-accent-foreground p-3 rounded-md border border-border shadow-sm transition-all text-sm text-card-foreground select-none cursor-pointer flex flex-col gap-2 group"
                >
                    <div className="font-medium">{task.content}</div>

                    {/* Badges */}
                    {(task.labels.length > 0 || task.due_date || task.description) && (
                        <div className="flex gap-2 items-center flex-wrap pt-1">
                            {task.labels.map(label => (
                                <div key={label} className="w-8 h-2 rounded-full" style={{ backgroundColor: label }} />
                            ))}
                            {task.description && (
                                <span className="text-xs text-muted-foreground">≡</span>
                            )}
                            {task.due_date && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground flex items-center gap-1">
                                    🕒 {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            )}
        </Draggable>
    );
}
