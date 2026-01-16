import { Draggable } from "@hello-pangea/dnd";
import { Task } from "../services/api";

interface TaskCardProps {
    task: Task;
    index: number;
}

export function TaskCard({ task, index }: TaskCardProps) {
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
                    className="bg-card hover:bg-accent hover:text-accent-foreground p-3 rounded-md border border-border shadow-sm transition-all text-sm text-card-foreground select-none"
                >
                    {task.content}
                </div>
            )}
        </Draggable>
    );
}
