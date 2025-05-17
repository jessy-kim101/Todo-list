document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const newTodoInput = document.getElementById('new-todo');
    const todoList = document.getElementById('todo-list');
    const itemsLeft = document.getElementById('items-left');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const body = document.body;
    
    // State
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    let currentFilter = 'all';
    let draggedItem = null;

    // Initialize
    renderTodos();
    updateItemsLeft();
    
    // Theme setup
    if (localStorage.getItem('theme') === 'dark') {
        body.classList.add('dark');
        themeIcon.src = '.image/icon-sun.svg';
    }

    // Event Listeners
    newTodoInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && this.value.trim() !== '') {
            addTodo(this.value.trim());
            this.value = '';
        }
    });
    
    clearCompletedBtn.addEventListener('click', clearCompleted);
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentFilter = button.dataset.filter;
            renderTodos();
        });
    });
    
    themeToggle.addEventListener('click', toggleTheme);

    // Todo Functions
    function addTodo(text) {
        const newTodo = {
            id: Date.now(),
            text,
            completed: false
        };
        todos.push(newTodo);
        saveTodos();
        renderTodos();
        updateItemsLeft();
    }
    
    function renderTodos() {
        todoList.innerHTML = '';
        
        const filteredTodos = todos.filter(todo => {
            if (currentFilter === 'all') return true;
            if (currentFilter === 'active') return !todo.completed;
            if (currentFilter === 'completed') return todo.completed;
            return true;
        });
        
        if (filteredTodos.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.classList.add('todo-item', 'empty-message');
            emptyMessage.textContent = currentFilter === 'all' ? 'No todos yet' : 
                                      currentFilter === 'active' ? 'No active todos' : 
                                      'No completed todos';
            todoList.appendChild(emptyMessage);
            return;
        }
        
        filteredTodos.forEach(todo => {
            const todoItem = document.createElement('div');
            todoItem.classList.add('todo-item');
            todoItem.dataset.id = todo.id;
            todoItem.draggable = true;
            
            todoItem.innerHTML = `
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
                <span class="todo-text">${todo.text}</span>
                <button class="delete-btn"><i class="fas fa-times"></i></button>
            `;
            
            const checkbox = todoItem.querySelector('.todo-checkbox');
            const deleteBtn = todoItem.querySelector('.delete-btn');
            const todoText = todoItem.querySelector('.todo-text');
            
            checkbox.addEventListener('change', () => toggleTodoComplete(todo.id));
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTodo(todo.id);
            });
            todoText.addEventListener('dblclick', () => editTodo(todo.id, todoText));
            
            // Drag and Drop Events
            todoItem.addEventListener('dragstart', handleDragStart);
            todoItem.addEventListener('dragover', handleDragOver);
            todoItem.addEventListener('dragleave', handleDragLeave);
            todoItem.addEventListener('drop', handleDrop);
            todoItem.addEventListener('dragend', handleDragEnd);
            
            todoList.appendChild(todoItem);
        });
    }
    
    // Drag and Drop Handlers
    function handleDragStart(e) {
        draggedItem = this;
        setTimeout(() => {
            this.classList.add('dragging');
        }, 0);
    }
    
    function handleDragOver(e) {
        e.preventDefault();
        if (draggedItem !== this) {
            const rect = this.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            
            if (e.clientY < midY) {
                this.classList.add('drop-above');
                this.classList.remove('drop-below');
            } else {
                this.classList.add('drop-below');
                this.classList.remove('drop-above');
            }
        }
    }
    
    function handleDragLeave() {
        this.classList.remove('drop-above', 'drop-below');
    }
    
    function handleDrop(e) {
        e.preventDefault();
        this.classList.remove('drop-above', 'drop-below');
        
        if (draggedItem !== this) {
            const todoItems = Array.from(todoList.children);
            const draggedIndex = todoItems.indexOf(draggedItem);
            const targetIndex = todoItems.indexOf(this);
            
            // Determine drop position (above or below)
            const rect = this.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            const insertBefore = e.clientY < midY;
            
            // Reorder in DOM
            if (insertBefore) {
                this.before(draggedItem);
            } else {
                this.after(draggedItem);
            }
            
            // Reorder in todos array
            const [draggedTodo] = todos.splice(draggedIndex, 1);
            const adjustedIndex = insertBefore ? targetIndex : targetIndex + 1;
            todos.splice(adjustedIndex, 0, draggedTodo);
            
            saveTodos();
        }
    }
    
    function handleDragEnd() {
        this.classList.remove('dragging', 'drop-above', 'drop-below');
        draggedItem = null;
    }
    
    // Other Todo Functions
    function toggleTodoComplete(id) {
        todos = todos.map(todo => 
            todo.id === id ? {...todo, completed: !todo.completed} : todo
        );
        saveTodos();
        updateItemsLeft();
    }
    
    function deleteTodo(id) {
        todos = todos.filter(todo => todo.id !== id);
        saveTodos();
        renderTodos();
        updateItemsLeft();
    }
    
    function clearCompleted() {
        todos = todos.filter(todo => !todo.completed);
        saveTodos();
        renderTodos();
        updateItemsLeft();
    }
    
    function updateItemsLeft() {
        const activeTodos = todos.filter(todo => !todo.completed).length;
        itemsLeft.textContent = `${activeTodos} ${activeTodos === 1 ? 'item' : 'items'} left`;
    }
    
    function saveTodos() {
        localStorage.setItem('todos', JSON.stringify(todos));
    }
    
    function toggleTheme() {
        body.classList.toggle('dark');
        
        if (body.classList.contains('dark')) {
            localStorage.setItem('theme', 'dark');
            themeIcon.src = '.image/icon-sun.svg';
        } else {
            localStorage.setItem('theme', 'light');
            themeIcon.src = '.image/icon-moon.svg';
        }
    }
    
    function editTodo(id, element) {
        const currentText = element.textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentText;
        input.classList.add('edit-input');
        
        element.parentNode.replaceChild(input, element);
        input.focus();
        
        input.addEventListener('blur', finishEditing);
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') finishEditing();
            if (e.key === 'Escape') {
                input.value = currentText;
                finishEditing();
            }
        });
        
        function finishEditing() {
            const newText = input.value.trim();
            const span = document.createElement('span');
            span.classList.add('todo-text');
            span.textContent = newText;
            
            input.parentNode.replaceChild(span, input);
            
            if (newText) {
                todos = todos.map(todo => 
                    todo.id === id ? {...todo, text: newText} : todo
                );
                saveTodos();
            }
            
            span.addEventListener('dblclick', () => editTodo(id, span));
        }
    }
});