<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';

  type Task = {
    id: string;
    title: string;
    description: string | null;
    priority: 'Low' | 'Medium' | 'High';
    due_date: string;
    status: 'Pending' | 'In Progress' | 'Completed';
    created_at: string;
  };

  // ---------- Create form ----------
  let title = '';
  let description = '';
  let priority: Task['priority'] = 'Medium';
  let due_date = '';

  let loadingTasks = true;
  let creating = false;
  let error = '';
  let message = '';

  // ---------- Tasks list ----------
  let tasks: Task[] = [];

  // ---------- Edit state ----------
  let editingId: string | null = null;
  let editTitle = '';
  let editDescription = '';
  let editPriority: Task['priority'] = 'Medium';
  let editDueDate = '';
  let editStatus: Task['status'] = 'Pending';
  let savingEdit = false;
  let deletingId: string | null = null;

  // ---------- Filter / Sort / Search ----------
  let statusFilter: 'All' | Task['status'] = 'All';
  let priorityFilter: 'All' | Task['priority'] = 'All';
  let sortBy: 'newest' | 'oldest' | 'dueSoon' | 'dueLate' | 'priorityHigh' = 'newest';
  let search = '';

  let visibleTasks: Task[] = [];

  function priorityRank(p: Task['priority']) {
    if (p === 'High') return 3;
    if (p === 'Medium') return 2;
    return 1; // Low
  }

  $: {
    const term = search.trim().toLowerCase();

    let filtered = tasks
      .filter((t) => (statusFilter === 'All' ? true : t.status === statusFilter))
      .filter((t) => (priorityFilter === 'All' ? true : t.priority === priorityFilter))
      .filter((t) => t.title.toLowerCase().includes(term));

    // sort
    visibleTasks = filtered.slice().sort((a, b) => {
      const createdA = new Date(a.created_at).getTime();
      const createdB = new Date(b.created_at).getTime();
      const dueA = new Date(a.due_date).getTime();
      const dueB = new Date(b.due_date).getTime();

      switch (sortBy) {
        case 'oldest':
          return createdA - createdB;
        case 'dueSoon':
          return dueA - dueB;
        case 'dueLate':
          return dueB - dueA;
        case 'priorityHigh':
          return priorityRank(b.priority) - priorityRank(a.priority);
        case 'newest':
        default:
          return createdB - createdA;
      }
    });
  }

  async function ensureUser() {
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      window.location.href = '/auth/login';
      throw new Error('No user');
    }

    return user;
  }

  async function loadTasks() {
    loadingTasks = true;
    error = '';

    try {
      const user = await ensureUser();

      const { data, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (tasksError) {
        console.error(tasksError);
        error = 'Failed to load tasks.';
        tasks = [];
      } else {
        tasks = (data ?? []) as Task[];
      }
    } catch (e) {
      console.error(e);
    } finally {
      loadingTasks = false;
    }
  }

  onMount(() => {
    loadTasks();
  });

  // ---------- Create ----------
  async function handleCreateTask() {
    error = '';
    message = '';

    if (!title || !priority || !due_date) {
      error = 'Please fill all required fields.';
      return;
    }

    creating = true;

    try {
      const user = await ensureUser();

      const { error: insertError } = await supabase.from('tasks').insert({
        user_id: user.id,
        title,
        description,
        priority,
        due_date,
        status: 'Pending'
      });

      if (insertError) {
        console.error(insertError);
        error = 'Something went wrong while creating the task.';
        return;
      }

      // Clear form + reload
      title = '';
      description = '';
      priority = 'Medium';
      due_date = '';
      message = 'Task created successfully!';

      await loadTasks();
    } finally {
      creating = false;
    }
  }

  // ---------- Edit ----------
  function startEdit(task: Task) {
    editingId = task.id;
    editTitle = task.title;
    editDescription = task.description ?? '';
    editPriority = task.priority;
    editDueDate = task.due_date;
    editStatus = task.status;
    error = '';
    message = '';
  }

  function cancelEdit() {
    editingId = null;
  }

  async function saveEdit() {
    if (!editingId) return;

    if (!editTitle || !editPriority || !editDueDate || !editStatus) {
      error = 'Please fill all fields in edit form.';
      return;
    }

    savingEdit = true;
    error = '';
    message = '';

    try {
      const user = await ensureUser();

      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          title: editTitle,
          description: editDescription,
          priority: editPriority,
          due_date: editDueDate,
          status: editStatus
        })
        .eq('id', editingId)
        .eq('user_id', user.id);

      if (updateError) {
        console.error(updateError);
        error = 'Failed to update task.';
        return;
      }

      message = 'Task updated successfully!';
      editingId = null;
      await loadTasks();
    } finally {
      savingEdit = false;
    }
  }

  // ---------- Delete ----------
  async function deleteTask(id: string) {
    const confirmed = window.confirm('Are you sure you want to delete this task?');
    if (!confirmed) return;

    deletingId = id;
    error = '';
    message = '';

    try {
      const user = await ensureUser();

      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error(deleteError);
        error = 'Failed to delete task.';
        return;
      }

      message = 'Task deleted.';
      await loadTasks();
    } finally {
      deletingId = null;
    }
  }
</script>

<h2>Dashboard</h2>

<div style="max-width: 900px;">
  <!-- Create task card -->
  <section
    style="
      border:1px solid #e5e5e5;
      border-radius:0.75rem;
      padding:1.5rem;
      margin-bottom:2rem;
    "
  >
    <h3 style="margin-top:0;">Create new task</h3>

    <form on:submit|preventDefault={handleCreateTask}>
      <!-- Title -->
      <div style="margin-bottom:0.75rem;">
        <label for="title">Title *</label><br />
        <input
          id="title"
          name="title"
          placeholder="e.g. Finish frontend assignment"
          bind:value={title}
          required
          maxlength="100"
          style="width:100%;padding:0.4rem;"
        />
      </div>

      <!-- Description -->
      <div style="margin-bottom:0.75rem;">
        <label for="description">Description</label><br />
        <textarea
          id="description"
          name="description"
          placeholder="Optional notes..."
          bind:value={description}
          maxlength="500"
          style="width:100%;min-height:80px;padding:0.4rem;"
        ></textarea>
      </div>

      <!-- Priority -->
      <div style="margin-bottom:0.75rem;">
        <label for="priority">Priority *</label><br />
        <select
          id="priority"
          name="priority"
          bind:value={priority}
          required
          style="padding:0.4rem;"
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
      </div>

      <!-- Due date -->
      <div style="margin-bottom:1rem;">
        <label for="due_date">Due date *</label><br />
        <input
          id="due_date"
          type="date"
          name="due_date"
          bind:value={due_date}
          required
          style="padding:0.4rem;"
        />
      </div>

      <button
        type="submit"
        disabled={creating}
        style="
          padding:0.5rem 1rem;
          border-radius:0.4rem;
          border:none;
          background:#2563eb;
          color:white;
          cursor:pointer;
        "
      >
        {creating ? 'Adding...' : 'Add Task'}
      </button>

      {#if error}
        <p style="color:red;margin-top:0.5rem;">{error}</p>
      {/if}
      {#if message}
        <p style="color:green;margin-top:0.5rem;">{message}</p>
      {/if}
    </form>
  </section>

  <!-- Tasks list -->
  <section>
    <h3>Your tasks</h3>

    <!-- Filters / Sort / Search -->
    <div
      style="
        margin-bottom:1rem;
        display:flex;
        flex-wrap:wrap;
        gap:0.75rem;
        align-items:flex-end;
      "
    >
      <div>
        <label>Status</label><br />
        <select bind:value={statusFilter} style="padding:0.3rem;">
          <option value="All">All</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      <div>
        <label>Priority</label><br />
        <select bind:value={priorityFilter} style="padding:0.3rem;">
          <option value="All">All</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
      </div>

      <div>
        <label>Sort</label><br />
        <select bind:value={sortBy} style="padding:0.3rem;">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="dueSoon">Due date: soonest</option>
          <option value="dueLate">Due date: latest</option>
          <option value="priorityHigh">Priority: high to low</option>
        </select>
      </div>

      <div style="flex:1;min-width:160px;">
        <label>Search title</label><br />
        <input
          type="text"
          placeholder="Search..."
          bind:value={search}
          style="width:100%;padding:0.3rem;"
        />
      </div>
    </div>

    {#if loadingTasks}
      <p>Loading tasks...</p>
    {:else if visibleTasks.length === 0}
      <p>No tasks match your filters.</p>
    {:else}
      {#each visibleTasks as task}
        <div
          style="
            border:1px solid #eee;
            border-radius:0.75rem;
            padding:1rem;
            margin-bottom:0.75rem;
          "
        >
          {#if editingId === task.id}
            <!-- Edit mode -->
            <div style="margin-bottom:0.5rem;">
              <label>Title *</label><br />
              <input
                bind:value={editTitle}
                style="width:100%;padding:0.35rem;"
              />
            </div>

            <div style="margin-bottom:0.5rem;">
              <label>Description</label><br />
              <textarea
                bind:value={editDescription}
                style="width:100%;min-height:60px;padding:0.35rem;"
              ></textarea>
            </div>

            <div style="margin-bottom:0.5rem;">
              <label>Priority *</label><br />
              <select bind:value={editPriority} style="padding:0.35rem;">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div style="margin-bottom:0.5rem;">
              <label>Due date *</label><br />
              <input
                type="date"
                bind:value={editDueDate}
                style="padding:0.35rem;"
              />
            </div>

            <div style="margin-bottom:0.75rem;">
              <label>Status *</label><br />
              <select bind:value={editStatus} style="padding:0.35rem;">
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <button
              on:click|preventDefault={saveEdit}
              disabled={savingEdit}
              style="
                padding:0.35rem 0.8rem;
                border-radius:0.4rem;
                border:none;
                background:#16a34a;
                color:white;
                cursor:pointer;
                margin-right:0.5rem;
              "
            >
              {savingEdit ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              on:click={cancelEdit}
              style="
                padding:0.35rem 0.8rem;
                border-radius:0.4rem;
                border:1px solid #ccc;
                background:white;
                cursor:pointer;
              "
            >
              Cancel
            </button>
          {:else}
            <!-- View mode -->
            <strong>{task.title}</strong>
            <div>{task.description}</div>
            <div>Priority: {task.priority}</div>
            <div>Due: {task.due_date}</div>
            <div>Status: {task.status}</div>

            <div style="margin-top:0.5rem;display:flex;gap:0.5rem;">
              <button
                type="button"
                on:click={() => startEdit(task)}
                style="
                  padding:0.35rem 0.8rem;
                  border-radius:0.4rem;
                  border:1px solid #ccc;
                  background:white;
                  cursor:pointer;
                "
              >
                Edit
              </button>

              <button
                type="button"
                on:click={() => deleteTask(task.id)}
                disabled={deletingId === task.id}
                style="
                  padding:0.35rem 0.8rem;
                  border-radius:0.4rem;
                  border:none;
                  background:#fee2e2;
                  cursor:pointer;
                "
              >
                {deletingId === task.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          {/if}
        </div>
      {/each}
    {/if}
  </section>
</div>
