(() => {
  'use strict';
  const storageKey = 'snail-todos-v1';
  const $ = (id) => document.getElementById(id);
  let tasks = [];
  let filter = 'all';
  let sortDirection = null;
  const notify = (message) => { $('notice').textContent = message; $('notice').hidden = false; };
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (!Array.isArray(saved)) throw new Error('Invalid data');
    tasks = saved.filter((task) => task && typeof task.id === 'string' && typeof task.text === 'string' && typeof task.done === 'boolean').map((task) => ({ ...task, deadline: typeof task.deadline === 'string' && Number.isFinite(Date.parse(task.deadline)) ? task.deadline : null }));
  } catch { notify('无法读取本地待办。你仍然可以添加任务，请检查浏览器的存储权限。'); }
  const save = () => {
    try { localStorage.setItem(storageKey, JSON.stringify(tasks)); }
    catch { notify('浏览器未能保存待办，关闭页面后可能丢失。请检查存储权限。'); }
  };
  const deadlineFormat = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  function updateDeadlines() {
    const now = Date.now();
    document.querySelectorAll('[data-deadline]').forEach((time) => {
      const overdue = time.dataset.done === 'false' && Date.parse(time.dataset.deadline) <= now;
      time.textContent = `${overdue ? '已过期 · ' : '截止：'}${deadlineFormat.format(new Date(time.dataset.deadline))}`;
      time.classList.toggle('overdue', overdue);
      time.closest('.task').classList.toggle('overdue-task', overdue);
    });
  }
  function render() {
    const done = tasks.filter((task) => task.done).length;
    const active = tasks.length - done;
    $('all-count').textContent = tasks.length;
    $('active-count').textContent = active;
    $('done-count').textContent = done;
    $('remaining').textContent = `${active} 件待办等待完成`;
    $('summary').textContent = tasks.length ? `已完成 ${done} / ${tasks.length} 件，每一步都算数。` : '今天，也是向前的一天。';
    $('clear-done').disabled = done === 0;
    const visible = tasks.filter((task) => filter === 'all' || (filter === 'done' ? task.done : !task.done));
    if (sortDirection) {
      visible.sort((a, b) => {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        const difference = Date.parse(a.deadline) - Date.parse(b.deadline);
        return sortDirection === 'asc' ? difference : -difference;
      });
    }
    $('task-list').replaceChildren();
    for (const task of visible) {
      const row = document.createElement('li');
      row.className = `task${task.done ? ' completed' : ''}`;
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox'; checkbox.checked = task.done; checkbox.id = `task-${task.id}`;
      checkbox.addEventListener('change', () => { task.done = checkbox.checked; save(); render(); });
      const label = document.createElement('label'); label.htmlFor = checkbox.id; label.textContent = task.text;
      const content = document.createElement('div'); content.className = 'task-content';
      content.append(label);
      if (task.deadline) {
        const time = document.createElement('time'); time.className = 'task-deadline';
        time.dateTime = task.deadline; time.dataset.deadline = task.deadline; time.dataset.done = String(task.done);
        content.append(time);
      }
      const remove = document.createElement('button');
      remove.type = 'button'; remove.className = 'delete'; remove.textContent = '×'; remove.setAttribute('aria-label', `删除：${task.text}`);
      remove.addEventListener('click', () => { tasks = tasks.filter((item) => item.id !== task.id); save(); render(); });
      row.append(checkbox, content, remove); $('task-list').append(row);
    }
    updateDeadlines();
    $('empty').hidden = visible.length > 0;
    $('empty').querySelector('h3').textContent = filter === 'done' ? '每一份完成，都值得期待' : filter === 'active' && tasks.length ? '做完啦，给自己一个小小的奖励' : '留一点空间，给新的开始';
    $('empty').querySelector('p').textContent = filter === 'done' ? '完成一件待办，它就会出现在这里。' : filter === 'active' && tasks.length ? '所有待办都已完成，享受这份轻松吧。' : '添加你的第一件待办，慢慢把日子过好。';
  }
  $('add-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const text = $('task-input').value.trim();
    if (!text) { $('task-input').value = ''; $('task-input').focus(); return; }
    const selectedDeadline = $('task-deadline').value;
    const parsedDeadline = selectedDeadline ? new Date(selectedDeadline) : null;
    if (parsedDeadline && !Number.isFinite(parsedDeadline.getTime())) { $('task-deadline').focus(); return; }
    tasks.unshift({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, text, done: false, deadline: parsedDeadline ? parsedDeadline.toISOString() : null });
    $('task-input').value = ''; $('task-deadline').value = ''; save(); setFilter('all'); $('task-input').focus();
  });
  function setFilter(value) {
    filter = value;
    document.querySelectorAll('[data-filter]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
    render();
  }
  document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => setFilter(button.dataset.filter)));
  $('sort-deadline').addEventListener('click', () => {
    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    $('sort-deadline').textContent = '排序';
    $('sort-deadline').setAttribute('aria-pressed', 'true');
    $('sort-deadline').setAttribute('aria-label', sortDirection === 'asc' ? '当前按截止时间从早到晚排序，点击切换为从晚到早' : '当前按截止时间从晚到早排序，点击切换为从早到晚');
    render();
  });
  $('clear-done').addEventListener('click', () => { tasks = tasks.filter((task) => !task.done); save(); render(); });
  $('date').textContent = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' }).format(new Date());
  render();
  setInterval(updateDeadlines, 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) updateDeadlines(); });
})();
