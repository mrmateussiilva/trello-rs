import { useEffect, useState } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { api, Board } from "./services/api";
import { Column } from "./components/Column";
import "./index.css";

function App() {
  const [board, setBoard] = useState<Board | null>(null);
  const [newColTitle, setNewColTitle] = useState("");
  const [isAddingCol, setIsAddingCol] = useState(false);

  const fetchBoard = async () => {
    const data = await api.getBoard();
    setBoard(data);
  };

  useEffect(() => {
    fetchBoard();
  }, []);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Optimistic update
    const newBoard = JSON.parse(JSON.stringify(board)) as Board;
    const sourceCol = newBoard.columns.find(c => c.id === source.droppableId);
    const destCol = newBoard.columns.find(c => c.id === destination.droppableId);

    if (sourceCol && destCol) {
      const [removed] = sourceCol.tasks.splice(source.index, 1);
      destCol.tasks.splice(destination.index, 0, removed);
      setBoard(newBoard);
    }

    try {
      await api.moveTask(
        source.droppableId,
        destination.droppableId,
        source.index,
        destination.index
      );
    } catch (e) {
      console.error("Failed to move task", e);
      fetchBoard(); // Revert on error
    }
  };

  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColTitle.trim()) return;
    await api.addColumn(newColTitle);
    setNewColTitle("");
    setIsAddingCol(false);
    fetchBoard();
  };

  if (!board) return <div className="flex items-center justify-center h-screen text-slate-400">Loading Board...</div>;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background text-foreground">
      <header className="h-14 border-b border-border flex items-center px-6 justify-between shrink-0 z-10 bg-background/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-primary-foreground text-sm shadow-sm">TR</div>
          <h1 className="font-bold text-lg tracking-tight">TrelloRust</h1>
        </div>
        <div className="flex gap-2">
          {/* Add global actions here if needed */}
        </div>
      </header>

      <main className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="h-full flex px-6 pb-6 pt-8 gap-6 items-start">
          <DragDropContext onDragEnd={onDragEnd}>
            {board.columns.map((col) => (
              <Column key={col.id} column={col} refreshBoard={fetchBoard} />
            ))}
          </DragDropContext>

          <div className="w-72 flex-shrink-0">
            {isAddingCol ? (
              <form onSubmit={handleAddColumn} className="bg-card border border-border p-3 rounded-lg shadow-sm flex flex-col gap-2">
                <input
                  autoFocus
                  placeholder="Enter list title..."
                  value={newColTitle}
                  onChange={e => setNewColTitle(e.target.value)}
                  className="bg-background border border-input focus:border-ring rounded-md p-2 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground"
                />
                <div className="flex gap-2 items-center mt-1">
                  <button type="submit" className="text-xs py-2 px-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium transition-all">Add List</button>
                  <button
                    type="button"
                    onClick={() => setIsAddingCol(false)}
                    className="bg-transparent hover:bg-muted text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsAddingCol(true)}
                className="w-full bg-secondary/50 hover:bg-secondary text-secondary-foreground p-4 rounded-xl flex items-center gap-2 font-medium transition-all border border-transparent hover:border-border"
              >
                <span className="text-primary text-xl leading-none">+</span> Add another list
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
