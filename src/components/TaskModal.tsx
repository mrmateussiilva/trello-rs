import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"; // Assuming you might have shadcn later, but for now we'll build a custom modal using Tailwind overlay
import { useState, useEffect } from "react";
import { Task, api } from "../services/api";

// We'll implement a simple Portal-based modal or just a fixed overlay since we don't have radix-ui setup yet
// actually, let's stick to a simple absolute overlay for speed, or basic fixed div.

interface TaskModalProps {
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

export function TaskModal({ task, isOpen, onClose, onUpdate }: TaskModalProps) {
    if (!isOpen || !task) return null;

    const [content, setContent] = useState(task.content);
    const [description, setDescription] = useState(task.description || "");
    const [dueDate, setDueDate] = useState(task.due_date || "");

    // Available labels (mocked for now)
    const availableLabels = ["#ef4444", "#eab308", "#22c55e", "#3b82f6", "#a855f7"];
    const [selectedLabels, setSelectedLabels] = useState<string[]>(task.labels || []);

    useEffect(() => {
        if (task) {
            setContent(task.content);
            setDescription(task.description || "");
            setDueDate(task.due_date || "");
            setSelectedLabels(task.labels || []);
        }
    }, [task]);

    const handleSave = async () => {
        if (task) {
            await api.updateTaskDetails(task.id, content, description, dueDate || undefined, selectedLabels);
            onUpdate();
            onClose();
        }
    };

    const toggleLabel = (label: string) => {
        if (selectedLabels.includes(label)) {
            setSelectedLabels(selectedLabels.filter(l => l !== label));
        } else {
            setSelectedLabels([...selectedLabels, label]);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-card w-full max-w-lg rounded-xl shadow-2xl border border-border flex flex-col max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-border flex justify-between items-start gap-4">
                    <input
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        className="text-lg font-bold bg-transparent outline-none w-full text-card-foreground placeholder-muted-foreground"
                        placeholder="Task title..."
                    />
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Labels */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-semibold uppercase text-muted-foreground">Labels</h3>
                        <div className="flex gap-2 flex-wrap">
                            {availableLabels.map(color => (
                                <button
                                    key={color}
                                    onClick={() => toggleLabel(color)}
                                    className={`w-8 h-8 rounded-full transition-transform hover:scale-110 flex items-center justify-center ring-2 ring-offset-2 ring-offset-card ${selectedLabels.includes(color) ? 'ring-primary' : 'ring-transparent'}`}
                                    style={{ backgroundColor: color }}
                                >
                                    {selectedLabels.includes(color) && <span className="text-white text-xs">✓</span>}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-semibold uppercase text-muted-foreground">Description</h3>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full min-h-[150px] bg-secondary/30 border border-input rounded-md p-3 text-sm text-foreground focus:ring-1 focus:ring-ring outline-none resize-y"
                            placeholder="Add a more detailed description..."
                        />
                    </div>

                    {/* Due Date */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-semibold uppercase text-muted-foreground">Due Date</h3>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={e => setDueDate(e.target.value)}
                            className="bg-background border border-input rounded-md p-2 text-sm text-foreground"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border bg-secondary/10 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors shadow-sm"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
