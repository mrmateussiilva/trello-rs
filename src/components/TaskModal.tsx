import { useState, useEffect } from "react";
import { Task, api } from "../services/api";
import { open } from '@tauri-apps/plugin-dialog';

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
    const [selectedLabels, setSelectedLabels] = useState<string[]>(task.labels || []);

    // Comment state
    const [newComment, setNewComment] = useState("");

    // Available labels (mocked for now)
    const availableLabels = ["#ef4444", "#eab308", "#22c55e", "#3b82f6", "#a855f7"];

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

    const handleAddComment = async () => {
        if (!newComment.trim() || !task) return;
        await api.addComment(task.id, newComment);
        setNewComment("");
        onUpdate();
    };

    const handleAddAttachment = async () => {
        if (!task) return;
        const selected = await open({
            multiple: false,
            filters: [{
                name: 'Images',
                extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp']
            }]
        });

        if (selected && typeof selected === 'string') {
            // For simplify, we just store the path. In a real app we might copy it.
            // We need to determine mime type.
            const mimeType = "image/auto"; // Simplified
            const fileName = selected.split(/[\\/]/).pop() || "unknown";
            await api.addAttachment(task.id, selected, fileName, mimeType);
            onUpdate();
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
                className="bg-card w-full max-w-2xl rounded-xl shadow-2xl border border-border flex flex-col max-h-[90vh] overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-border flex justify-between items-start gap-4 flex-shrink-0 bg-background/50">
                    <input
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        className="text-lg font-bold bg-transparent outline-none w-full text-card-foreground placeholder-muted-foreground"
                        placeholder="Task title..."
                    />
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="md:col-span-2 space-y-6">
                            {/* Description */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
                                    Description
                                </h3>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="w-full min-h-[120px] bg-secondary/30 border border-input rounded-md p-3 text-sm text-foreground focus:ring-1 focus:ring-ring outline-none resize-y"
                                    placeholder="Add a more detailed description..."
                                />
                            </div>

                            {/* Attachments */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
                                    Attachments
                                </h3>

                                {task && task.attachments && task.attachments.length > 0 && (
                                    <div className="grid grid-cols-2 gap-2">
                                        {task.attachments.map(att => (
                                            <div key={att.id} className="relative group rounded-md overflow-hidden border border-border aspect-video bg-muted flex items-center justify-center">
                                                {/* Note: Direct file path access might be restricted by browser security policies in WebView. 
                                                    Ideally we'd use `convertFileSrc` from tauri api but let's try direct first or placeholder.
                                                */}
                                                <span className="text-xs text-muted-foreground truncate px-2">{att.file_name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button
                                    onClick={handleAddAttachment}
                                    className="text-sm px-3 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md transition-colors w-full text-left flex items-center gap-2"
                                >
                                    📎 Add an attachment
                                </button>
                            </div>

                            {/* Comments */}
                            <div className="space-y-4 pt-4 border-t border-border">
                                <h3 className="text-xs font-semibold uppercase text-muted-foreground">Activity</h3>

                                <div className="flex gap-2">
                                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                                        YO
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <textarea
                                            value={newComment}
                                            onChange={e => setNewComment(e.target.value)}
                                            className="w-full h-20 bg-background border border-input rounded-md p-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                            placeholder="Write a comment..."
                                        />
                                        <button
                                            onClick={handleAddComment}
                                            disabled={!newComment.trim()}
                                            className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded hover:bg-primary/90 disabled:opacity-50"
                                        >
                                            Save
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4 mt-4">
                                    {task && task.comments && [...task.comments].reverse().map(comment => (
                                        <div key={comment.id} className="flex gap-2">
                                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-bold">
                                                {comment.author.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold">{comment.author}</span>
                                                    <span className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleString()}</span>
                                                </div>
                                                <div className="text-sm p-2 bg-secondary/30 rounded-md border border-border">
                                                    {comment.content}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
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

                            {/* Due Date */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-semibold uppercase text-muted-foreground">Due Date</h3>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={e => setDueDate(e.target.value)}
                                    className="w-full bg-background border border-input rounded-md p-2 text-sm text-foreground"
                                />
                            </div>

                            <div className="pt-4 border-t border-border mt-auto">
                                <button
                                    onClick={onClose}
                                    className="w-full px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-muted transition-colors mb-2"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="w-full px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors shadow-sm"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
