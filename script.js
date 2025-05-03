document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const tasksLeft = document.getElementById('tasksLeft');
    const clearCompletedBtn = document.getElementById('clearCompleted');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const themeBtn = document.getElementById('themeBtn');
    
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';
    
    // Initialize the app
    function init() {
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
        
        renderTasks();
        updateTaskCount();
        addEventListeners();
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
            });
        });
        
        themeBtn.addEventListener('click', toggleTheme);
    }
    
    // Toggle between light and dark theme
    function toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    }
    
    // Update theme icon
    function updateThemeIcon(theme) {
        const icon = themeBtn.querySelector('i');
        icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
    
    // Add a new task
    function addTask() {
        const taskText = taskInput.value.trim();
        if (taskText === '') {
            taskInput.focus();
            return;
        }
        
        const newTask = {
            id: Date.now(),
            text: taskText,
            completed: false
        };
        
        tasks.unshift(newTask);
        saveTasks();
        renderTasks();
        updateTaskCount();
        
        taskInput.value = '';
        taskInput.focus();
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
            const emptyState = document.createElement('li');
            emptyState.className = 'empty-state';
            emptyState.textContent = currentFilter === 'all' ? 'No tasks yet' : 
                                  currentFilter === 'active' ? 'No active tasks' : 'No completed tasks';
            taskList.appendChild(emptyState);
        } else {
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
        deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
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
        }
    }
    
    // Delete a task
    function deleteTask(e) {
        const taskId = parseInt(e.target.closest('.task-item').dataset.id);
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks();
        renderTasks();
        updateTaskCount();
    }
    
    // Clear completed tasks
    function clearCompleted() {
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
        updateTaskCount();
    }
    
    // Update task count
    function updateTaskCount() {
        const activeTasks = tasks.filter(task => !task.completed).length;
        tasksLeft.textContent = `${activeTasks} ${activeTasks === 1 ? 'item' : 'items'} left`;
    }
    
    // Save tasks to localStorage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    // Initialize the app
    init();
});