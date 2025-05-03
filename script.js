document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const taskInput = document.getElementById('taskInput');
    const taskDueDate = document.getElementById('taskDueDate');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const tasksLeft = document.getElementById('tasksLeft');
    const clearCompletedBtn = document.getElementById('clearCompleted');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const themeBtn = document.getElementById('themeBtn');
    const currentDateElement = document.getElementById('currentDate');
    const currentMonthYearElement = document.getElementById('currentMonthYear');
    const calendarDaysElement = document.getElementById('calendarDays');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const completedCountElement = document.getElementById('completedCount');
    const dueTodayCountElement = document.getElementById('dueTodayCount');
    
    // Modal elements
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Edit Task</h2>
                <button class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <input type="text" id="editTaskInput" class="modal-input">
                <input type="date" id="editTaskDueDate" class="modal-input">
            </div>
            <div class="modal-actions">
                <button class="cancel-btn">Cancel</button>
                <button class="save-btn">Save Changes</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // State variables
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let selectedDate = new Date();
    let editingTaskId = null;
    
    // Initialize the app
    function init() {
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
        
        // Set current date display
        updateCurrentDateDisplay();
        
        // Set today's date as default in date picker
        const today = formatDateForInput(currentDate);
        taskDueDate.value = today;
        taskDueDate.min = today;
        
        // Initialize calendar
        renderCalendar();
        
        // Load and render tasks
        renderTasks();
        updateTaskCount();
        updateStats();
        
        // Add event listeners
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
        
        prevMonthBtn.addEventListener('click', () => {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            renderCalendar();
        });
        
        nextMonthBtn.addEventListener('click', () => {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            renderCalendar();
        });
        
        // Modal event listeners
        modal.querySelector('.close-btn').addEventListener('click', closeModal);
        modal.querySelector('.cancel-btn').addEventListener('click', closeModal);
        modal.querySelector('.save-btn').addEventListener('click', saveEditedTask);
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
    
    // Update current date display
    function updateCurrentDateDisplay() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateElement.textContent = selectedDate.toLocaleDateString(undefined, options);
    }
    
    // Format date for input field
    function formatDateForInput(date) {
        return date.toISOString().split('T')[0];
    }
    
    // Format date for display
    function formatDateForDisplay(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }
    
    // Check if date is today
    function isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() && 
               date.getMonth() === today.getMonth() && 
               date.getFullYear() === today.getFullYear();
    }
    
    // Check if date is in the past
    function isPastDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    }
    
    // Render calendar
    function renderCalendar() {
        // Update month/year display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        currentMonthYearElement.textContent = `${monthNames[currentMonth]} ${currentYear}`;
        
        // Get first day of month and total days in month
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        // Get days from previous month
        const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
        
        // Clear calendar
        calendarDaysElement.innerHTML = '';
        
        // Add day names header
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayNamesElement = document.createElement('div');
        dayNamesElement.className = 'day-names';
        
        dayNames.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = 'day-name';
            dayElement.textContent = day;
            dayNamesElement.appendChild(dayElement);
        });
        
        calendarDaysElement.appendChild(dayNamesElement);
        
        // Add calendar days
        let dayCount = 1;
        let nextMonthDay = 1;
        
        // 6 rows to ensure we show all days
        for (let i = 0; i < 42; i++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            
            if (i < firstDay) {
                // Days from previous month
                const prevDay = prevMonthDays - (firstDay - i - 1);
                dayElement.textContent = prevDay;
                dayElement.classList.add('other-month');
            } else if (dayCount <= daysInMonth) {
                // Days in current month
                dayElement.textContent = dayCount;
                
                // Check if this date has tasks
                const date = new Date(currentYear, currentMonth, dayCount);
                const dateString = formatDateForInput(date);
                const hasTasks = tasks.some(task => task.dueDate === dateString);
                
                if (hasTasks) {
                    dayElement.classList.add('has-tasks');
                }
                
                // Highlight today
                if (isToday(date)) {
                    dayElement.classList.add('today');
                }
                
                // Highlight selected date
                if (date.toDateString() === selectedDate.toDateString()) {
                    dayElement.classList.add('selected');
                }
                
                // Add click event
                dayElement.addEventListener('click', () => {
                    selectedDate = date;
                    updateCurrentDateDisplay();
                    renderCalendar();
                    renderTasks();
                });
                
                dayCount++;
            } else {
                // Days from next month
                dayElement.textContent = nextMonthDay;
                dayElement.classList.add('other-month');
                nextMonthDay++;
            }
            
            calendarDaysElement.appendChild(dayElement);
        }
    }
    
    // Add a new task
    function addTask() {
        const taskText = taskInput.value.trim();
        if (taskText === '') {
            taskInput.focus();
            return;
        }
        
        const dueDate = taskDueDate.value || formatDateForInput(currentDate);
        
        const newTask = {
            id: Date.now(),
            text: taskText,
            dueDate: dueDate,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        tasks.unshift(newTask);
        saveTasks();
        renderTasks();
        updateTaskCount();
        updateStats();
        renderCalendar();
        
        taskInput.value = '';
        taskInput.focus();
    }
    
    // Render tasks based on current filter
    function renderTasks() {
        taskList.innerHTML = '';
        
        let filteredTasks = tasks;
        
        switch(currentFilter) {
            case 'today':
                const today = formatDateForInput(selectedDate);
                filteredTasks = tasks.filter(task => task.dueDate === today);
                break;
            case 'upcoming':
                const todayStr = formatDateForInput(new Date());
                filteredTasks = tasks.filter(task => !task.completed && task.dueDate >= todayStr);
                break;
            case 'completed':
                filteredTasks = tasks.filter(task => task.completed);
                break;
            case 'all':
            default:
                filteredTasks = [...tasks];
        }
        
        if (filteredTasks.length === 0) {
            const emptyState = document.createElement('li');
            emptyState.className = 'empty-state';
            
            switch(currentFilter) {
                case 'today':
                    emptyState.textContent = 'No tasks for today';
                    break;
                case 'upcoming':
                    emptyState.textContent = 'No upcoming tasks';
                    break;
                case 'completed':
                    emptyState.textContent = 'No completed tasks';
                    break;
                default:
                    emptyState.textContent = 'No tasks yet';
            }
            
            taskList.appendChild(emptyState);
        } else {
            // Sort tasks: incomplete first, then by due date
            filteredTasks.sort((a, b) => {
                if (a.completed !== b.completed) {
                    return a.completed ? 1 : -1;
                }
                
                if (a.dueDate && b.dueDate) {
                    return new Date(a.dueDate) - new Date(b.dueDate);
                }
                
                return new Date(b.createdAt) - new Date(a.createdAt);
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
        checkbox.addEventListener('change', () => toggleTask(task.id));
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'task-content';
        
        const textSpan = document.createElement('span');
        textSpan.className = 'task-text';
        if (task.completed) textSpan.classList.add('completed');
        textSpan.textContent = task.text;
        
        const dueDateSpan = document.createElement('span');
        dueDateSpan.className = 'task-due-date';
        
        if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            dueDateSpan.innerHTML = `<i class="far fa-calendar-alt"></i> ${formatDateForDisplay(task.dueDate)}`;
            
            if (!task.completed) {
                if (isPastDate(task.dueDate)) {
                    dueDateSpan.classList.add('overdue');
                } else if (dueDate.toDateString() === today.toDateString()) {
                    dueDateSpan.classList.add('today');
                }
            }
        }
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'task-actions';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.innerHTML = '<i class="far fa-edit"></i>';
        editBtn.addEventListener('click', () => openEditModal(task));
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<i class="far fa-trash-alt"></i>';
        deleteBtn.addEventListener('click', () => deleteTask(task.id));
        
        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);
        
        contentDiv.appendChild(textSpan);
        if (task.dueDate) contentDiv.appendChild(dueDateSpan);
        
        li.appendChild(checkbox);
        li.appendChild(contentDiv);
        li.appendChild(actionsDiv);
        
        return li;
    }
    
    // Open edit modal
    function openEditModal(task) {
        editingTaskId = task.id;
        modal.querySelector('#editTaskInput').value = task.text;
        modal.querySelector('#editTaskDueDate').value = task.dueDate || '';
        modal.style.display = 'flex';
    }
    
    // Close modal
    function closeModal() {
        modal.style.display = 'none';
        editingTaskId = null;
    }
    
    // Save edited task
    function saveEditedTask() {
        const newText = modal.querySelector('#editTaskInput').value.trim();
        const newDueDate = modal.querySelector('#editTaskDueDate').value;
        
        if (newText === '') {
            alert('Task text cannot be empty');
            return;
        }
        
        const taskIndex = tasks.findIndex(task => task.id === editingTaskId);
        if (taskIndex !== -1) {
            tasks[taskIndex].text = newText;
            tasks[taskIndex].dueDate = newDueDate;
            saveTasks();
            renderTasks();
            updateTaskCount();
            updateStats();
            renderCalendar();
        }
        
        closeModal();
    }
    
    // Toggle task completion status
    function toggleTask(taskId) {
        const task = tasks.find(task => task.id === taskId);
        
        if (task) {
            task.completed = !task.completed;
            saveTasks();
            renderTasks();
            updateTaskCount();
            updateStats();
            renderCalendar();
        }
    }
    
    // Delete a task
    function deleteTask(taskId) {
        if (!confirm('Are you sure you want to delete this task?')) return;
        
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks();
        renderTasks();
        updateTaskCount();
        updateStats();
        renderCalendar();
    }
    
    // Clear completed tasks
    function clearCompleted() {
        if (tasks.filter(task => task.completed).length === 0) return;
        if (!confirm('Are you sure you want to clear all completed tasks?')) return;
        
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
        updateTaskCount();
        updateStats();
        renderCalendar();
    }
    
    // Update task count
    function updateTaskCount() {
        const activeTasks = tasks.filter(task => !task.completed).length;
        tasksLeft.textContent = `${activeTasks} ${activeTasks === 1 ? 'item' : 'items'} left`;
    }
    
    // Update stats
    function updateStats() {
        const completedTasks = tasks.filter(task => task.completed).length;
        const todayStr = formatDateForInput(new Date());
        const dueToday = tasks.filter(task => !task.completed && task.dueDate === todayStr).length;
        
        completedCountElement.textContent = completedTasks;
        dueTodayCountElement.textContent = dueToday;
    }
    
    // Save tasks to localStorage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    // Initialize the app
    init();
});