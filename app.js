(() => {
  'use strict';
  const storageKey = 'snail-todos-v1';
  const $ = (id) => document.getElementById(id);
  let tasks = [];
  let filter = 'all';
  const notify = (message) => { $('notice').textContent = message; $('notice').hidden = false; };
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (!Array.isArray(saved)) throw new Error('Invalid data');
    tasks = saved.filter((task) => task && typeof task.id === 'string' && typeof task.text === 'string' && typeof task.done === 'boolean');
  } catch { notify('无法读取本地待办。你仍然可以添加任务，请检查浏览器的存储权限。'); }
  const save = () => {
    try { localStorage.setItem(storageKey, JSON.stringify(tasks)); }
    catch { notify('浏览器未能保存待办，关闭页面后可能丢失。请检查存储权限。'); }
  };
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
    $('task-list').replaceChildren();
    for (const task of visible) {
      const row = document.createElement('li');
      row.className = `task${task.done ? ' completed' : ''}`;
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox'; checkbox.checked = task.done; checkbox.id = `task-${task.id}`;
      checkbox.addEventListener('change', () => { task.done = checkbox.checked; save(); render(); });
      const label = document.createElement('label'); label.htmlFor = checkbox.id; label.textContent = task.text;
      const remove = document.createElement('button');
      remove.type = 'button'; remove.className = 'delete'; remove.textContent = '×'; remove.setAttribute('aria-label', `删除：${task.text}`);
      remove.addEventListener('click', () => { tasks = tasks.filter((item) => item.id !== task.id); save(); render(); });
      row.append(checkbox, label, remove); $('task-list').append(row);
    }
    $('empty').hidden = visible.length > 0;
    $('empty').querySelector('h3').textContent = filter === 'done' ? '每一份完成，都值得期待' : filter === 'active' && tasks.length ? '做完啦，给自己一个小小的奖励' : '留一点空间，给新的开始';
    $('empty').querySelector('p').textContent = filter === 'done' ? '完成一件待办，它就会出现在这里。' : filter === 'active' && tasks.length ? '所有待办都已完成，享受这份轻松吧。' : '添加你的第一件待办，慢慢把日子过好。';
  }
  $('add-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const text = $('task-input').value.trim();
    if (!text) { $('task-input').value = ''; $('task-input').focus(); return; }
    tasks.unshift({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, text, done: false });
    $('task-input').value = ''; save(); setFilter('all'); $('task-input').focus();
  });
  function setFilter(value) {
    filter = value;
    document.querySelectorAll('[data-filter]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
    render();
  }
  document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => setFilter(button.dataset.filter)));
  $('clear-done').addEventListener('click', () => { tasks = tasks.filter((task) => !task.done); save(); render(); });
  $('date').textContent = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' }).format(new Date());
  render();
})();
