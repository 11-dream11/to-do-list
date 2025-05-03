document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const tasksLeft = document.getElementById('tasksLeft');
    const clearCompletedBtn = document.getElementById('clearCompleted');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const emptyState = document.getElementById('emptyState');
    const appContent = document.querySelector('.app-content');
    
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';
    
    // Initialize the app
    function init() {
        renderTasks();
        updateTaskCount();
        addEventListeners();
        checkEmptyState();
    }
    
    // Add event listeners
    function addEventListeners() {
        addTaskBtn.addEventListener('click', addTask);
        taskInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addTask();
        });
        
        clearCompletedBtn.addEventListener('click', clearCompleted);
        
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                currentFilter = this.dataset.filter;
                renderTasks();
                checkEmptyState();
            });
        });
    }
    
    // Add a new task
    function addTask() {
        const taskText = taskInput.value.trim();
        if (taskText === '') {
            showInputError();
            return;
        }
        
        const newTask = {
            id: Date.now(),
            text: taskText,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        tasks.unshift(newTask); // Add new tasks at the beginning
        saveTasks();
        renderTasks();
        updateTaskCount();
        checkEmptyState();
        
        taskInput.value = '';
        taskInput.focus();
        
        // Show success animation
        addTaskBtn.innerHTML = '<i class="fas fa-check"></i> Added!';
        setTimeout(() => {
            addTaskBtn.innerHTML = '<i class="fas fa-plus"></i> Add';
        }, 1500);
    }
    
    // Show input error state
    function showInputError() {
        taskInput.style.border = '2px solid var(--danger-color)';
        taskInput.placeholder = 'Please enter a task...';
        setTimeout(() => {
            taskInput.style.border = 'none';
            taskInput.placeholder = 'What needs to be done?';
        }, 2000);
    }
    
    // Render tasks based on current filter
    function renderTasks() {
        taskList.innerHTML = '';
        
        let filteredTasks = tasks;
        if (currentFilter === 'active') {
            filteredTasks = tasks.filter(task => !task.completed);
        } else if (currentFilter === 'completed') {
            filteredTasks = tasks.filter(task => task.completed);
        }
        
        if (filteredTasks.length === 0) {
            checkEmptyState();
        } else {
            emptyState.style.display = 'none';
            appContent.style.display = 'block';
            
            // Sort tasks: incomplete first, then by creation date
            filteredTasks.sort((a, b) => {
                if (a.completed !== b.completed) {
                    return a.completed ? 1 : -1;
                }
                return new Date(a.createdAt) - new Date(b.createdAt);
            });
            
            filteredTasks.forEach(task => {
                const taskItem = createTaskElement(task);
                taskList.appendChild(taskItem);
            });
        }
    }
    
    // Create task element
    function createTaskElement(task) {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.dataset.id = task.id;
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-checkbox';
        checkbox.checked = task.completed;
        checkbox.addEventListener('change', toggleTask);
        
        const span = document.createElement('span');
        span.className = 'task-text';
        if (task.completed) span.classList.add('completed');
        span.textContent = task.text;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.addEventListener('click', deleteTask);
        
        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(deleteBtn);
        
        return li;
    }
    
    // Toggle task completion status
    function toggleTask(e) {
        const taskId = parseInt(e.target.parentElement.dataset.id);
        const task = tasks.find(task => task.id === taskId);
        
        if (task) {
            task.completed = e.target.checked;
            saveTasks();
            renderTasks();
            updateTaskCount();
            checkEmptyState();
        }
    }
    
    // Delete a task
    function deleteTask(e) {
        const taskItem = e.target.closest('.task-item');
        taskItem.classList.add('deleting');
        
        setTimeout(() => {
            const taskId = parseInt(taskItem.dataset.id);
            tasks = tasks.filter(task => task.id !== taskId);
            saveTasks();
            renderTasks();
            updateTaskCount();
            checkEmptyState();
        }, 300);
    }
    
    // Clear completed tasks
    function clearCompleted() {
        if (!confirm('Are you sure you want to clear all completed tasks?')) return;
        
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
        updateTaskCount();
        checkEmptyState();
        
        // Show confirmation
        const originalText = clearCompletedBtn.textContent;
        clearCompletedBtn.textContent = 'Cleared!';
        setTimeout(() => {
            clearCompletedBtn.textContent = originalText;
        }, 1500);
    }
    
    // Update task count
    function updateTaskCount() {
        const activeTasks = tasks.filter(task => !task.completed).length;
        tasksLeft.textContent = `${activeTasks} ${activeTasks === 1 ? 'task' : 'tasks'} left`;
    }
    
    // Check if we should show empty state
    function checkEmptyState() {
        const filteredTasks = currentFilter === 'all' ? tasks : 
                           currentFilter === 'active' ? tasks.filter(t => !t.completed) : 
                           tasks.filter(t => t.completed);
        
        if (filteredTasks.length === 0) {
            emptyState.style.display = 'flex';
            appContent.style.display = 'none';
            
            // Update empty state message
            const emptyTitle = emptyState.querySelector('h3');
            const emptyText = emptyState.querySelector('p');
            
            if (currentFilter === 'all') {
                emptyTitle.textContent = 'No tasks yet!';
                emptyText.textContent = 'Add your first task using the input above';
            } else if (currentFilter === 'active') {
                emptyTitle.textContent = 'No active tasks!';
                emptyText.textContent = 'All tasks are completed or add a new one';
            } else {
                emptyTitle.textContent = 'No completed tasks!';
                emptyText.textContent = 'Complete some tasks to see them here';
            }
        } else {
            emptyState.style.display = 'none';
            appContent.style.display = 'block';
        }
    }
    
    // Save tasks to localStorage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    // Initialize the app
    init();
});