import { useState, useEffect } from 'react'
import { LemmaClient } from 'lemma-sdk'
import { AssistantEmbedded } from 'lemma-sdk/react'
import 'lemma-sdk/react/styles.css'
import './index.css'

interface Todo {
  id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  due_date?: string
  completed_at?: string
  created_at: string
}

const client = new LemmaClient({
  apiUrl: import.meta.env.VITE_LEMMA_API_URL,
  authUrl: import.meta.env.VITE_LEMMA_AUTH_URL,
  podId: import.meta.env.VITE_LEMMA_POD_ID,
})

const ASSISTANT_ID = '019d5456-125f-7a63-85bd-109abf973741'

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12h14"/>
  </svg>
)

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
  </svg>
)

const CheckIcon = ({ checked }: { checked: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={checked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    {checked && <path d="M9 12l2 2 4-4"/>}
  </svg>
)

function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [newTodo, setNewTodo] = useState({ title: '', description: '', priority: 'medium' as const, due_date: '' })
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')

  useEffect(() => {
    loadTodos()
  }, [filter])

  async function loadTodos() {
    setLoading(true)
    try {
      const response = await client.records.list('todos', { limit: 100 })
      let items = response.items.map((item: any) => ({ ...item.data, id: item.id })) as Todo[]
      if (filter !== 'all') {
        items = items.filter((t) => t.status === filter)
      }
      setTodos(items.sort((a, b) => {
        if (a.status === 'completed' && b.status !== 'completed') return 1
        if (a.status !== 'completed' && b.status === 'completed') return -1
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }))
    } catch (err) {
      console.error('Failed to load todos:', err)
    } finally {
      setLoading(false)
    }
  }

  async function addTodo(e: React.FormEvent) {
    e.preventDefault()
    if (!newTodo.title.trim()) return
    try {
      await client.records.create('todos', {
        title: newTodo.title,
        description: newTodo.description,
        priority: newTodo.priority,
        due_date: newTodo.due_date || null,
        status: 'pending',
      })
      setNewTodo({ title: '', description: '', priority: 'medium', due_date: '' })
      loadTodos()
    } catch (err) {
      console.error('Failed to create todo:', err)
    }
  }

  async function toggleStatus(todo: Todo) {
    const newStatus = todo.status === 'completed' ? 'pending' : 'completed'
    try {
      await client.records.update('todos', todo.id, {
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
      })
      loadTodos()
    } catch (err) {
      console.error('Failed to update todo:', err)
    }
  }

  async function deleteTodo(id: string) {
    try {
      await client.records.delete('todos', id)
      loadTodos()
    } catch (err) {
      console.error('Failed to delete todo:', err)
    }
  }

  const priorityColors = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700'
  }

  const activeCount = todos.filter(t => t.status !== 'completed').length
  const completedCount = todos.filter(t => t.status === 'completed').length

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Left Panel - Todos */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Todo Commander</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {activeCount} active · {completedCount} completed
              </p>
            </div>
          </div>
        </header>

        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <form onSubmit={addTodo} className="flex gap-3">
            <input
              type="text"
              placeholder="What needs to be done?"
              value={newTodo.title}
              onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={newTodo.priority}
              onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value as any })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <input
              type="date"
              value={newTodo.due_date}
              onChange={(e) => setNewTodo({ ...newTodo, due_date: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!newTodo.title.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
            >
              <PlusIcon /> Add
            </button>
          </form>
        </div>

        <div className="bg-gray-50 border-b border-gray-200 px-6 py-2 flex gap-2">
          {(['all', 'pending', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {f === 'all' ? 'All Tasks' : f === 'pending' ? 'Active' : 'Completed'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-gray-500">Loading...</div>
          ) : todos.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg font-medium">No tasks yet</p>
              <p className="text-sm mt-1">Add your first todo above or ask the assistant for help</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  className={`group bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4 hover:shadow-md transition-shadow ${
                    todo.status === 'completed' ? 'opacity-60' : ''
                  }`}
                >
                  <button
                    onClick={() => toggleStatus(todo)}
                    className={`flex-shrink-0 ${todo.status === 'completed' ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <CheckIcon checked={todo.status === 'completed'} />
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-gray-900 ${todo.status === 'completed' ? 'line-through' : ''}`}>
                      {todo.title}
                    </p>
                    {todo.description && (
                      <p className="text-sm text-gray-500 mt-0.5 truncate">{todo.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[todo.priority]}`}>
                        {todo.priority}
                      </span>
                      {todo.due_date && (
                        <span className="text-xs text-gray-500">
                          Due {new Date(todo.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Assistant with proper height container */}
      <div className="w-96 border-l border-gray-200 bg-white flex flex-col min-h-0">
        <div className="flex-1 min-h-0">
          <AssistantEmbedded
            client={client}
            assistantId={ASSISTANT_ID}
            title="Todo Assistant"
            subtitle="Ask me to manage your tasks"
            theme="auto"
            onOperationExecuted={() => {
              loadTodos()
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default App
