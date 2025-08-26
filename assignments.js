document.addEventListener('DOMContentLoaded', () => {
  let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');

  const taskInput = document.getElementById('task-input');
  const taskDate = document.getElementById('task-date');
  const taskPriority = document.getElementById('task-priority');
  const timeline = document.getElementById('timeline');
  const empty = document.getElementById('timeline-empty');

  const updateUI = () => {
    document.getElementById('total-tasks').textContent = tasks.length;
    document.getElementById('completed-tasks').textContent = tasks.filter(t => t.completed).length;
    document.getElementById('pending-tasks').textContent = tasks.filter(t => !t.completed).length;

    if (!tasks.length) {
      empty.style.display = 'block';
      timeline.innerHTML = '';
      return;
    } else {
      empty.style.display = 'none';
    }

    timeline.innerHTML = tasks.map((task, i) => `
          <div class="timeline-item">
            <div class="task-card" data-task-id="${i}">
              <div class="task-header">
                <h3 class="task-title ${task.completed ? 'completed' : ''}">${task.title}</h3>
                <span class="task-priority ${task.priority}">${task.priority}</span>
              </div>
              <div class="task-date">
                <i class="fas fa-calendar"></i> ${task.date}
              </div>
              <div class="task-actions">
                <button onclick="toggleTask(${i})"><i class="fas fa-${task.completed ? 'undo' : 'check'}"></i></button>
                <button onclick="deleteTask(${i})"><i class="fas fa-trash"></i></button>
              </div>
            </div>
          </div>
        `).join('');
  };

  const saveTasks = () => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    updateUI();
  };

  window.addTask = () => {
    const title = taskInput.value.trim();
    const date = taskDate.value;
    const priority = taskPriority.value;
    if (!title || !date) return alert('Please fill all fields');

    tasks.push({ title, date, priority, completed: false });
    taskInput.value = '';
    taskDate.value = '';
    taskPriority.value = 'medium';
    saveTasks();
  };

  window.toggleTask = index => {
    tasks[index].completed = !tasks[index].completed;
    // Make sure the class is being added to the element
    const element = document.querySelector(`[data-task-id="${index}"]`);
    element.classList.toggle('completed');
    saveTasks();
  };

  window.deleteTask = index => {
    if (confirm('Delete this task?')) {
      tasks.splice(index, 1);
      saveTasks();
    }
  };

  window.clearCompleted = () => {
    const remaining = tasks.filter(t => !t.completed);
    if (remaining.length === tasks.length) return alert('No completed tasks');
    if (confirm('Clear completed tasks?')) {
      tasks = remaining;
      saveTasks();
    }
  };

  window.clearAll = () => {
    if (!tasks.length) return alert('No tasks to clear');
    if (confirm('Clear all tasks?')) {
      tasks = [];
      saveTasks();
    }
  };

  window.exportTasks = () => {
    if (!tasks.length) return alert('No tasks to export');
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tasks.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  document.getElementById('add-task').addEventListener('click', addTask);
  document.getElementById('clear-completed').addEventListener('click', clearCompleted);
  document.getElementById('clear-tasks').addEventListener('click', clearAll);
  document.getElementById('export-tasks').addEventListener('click', exportTasks);

  updateUI();
});