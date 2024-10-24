// 获取DOM元素
const taskList = document.getElementById('task-list');
const planForm = document.getElementById('plan-form');
const dateGaugeFill = document.getElementById('date-gauge-fill');
const dateGaugeCover = document.getElementById('date-gauge-cover');
const taskGaugeFill = document.getElementById('task-gauge-fill');
const taskGaugeCover = document.getElementById('task-gauge-cover');
const totalTaskGaugeFill = document.getElementById('total-task-gauge-fill');
const totalTaskGaugeCover = document.getElementById('total-task-gauge-cover');

// 从本地存储加载计划
let plans = JSON.parse(localStorage.getItem('plans')) || [];

// 更新仪表盘和任务列表
function updateDashboard() {
    if (plans.length === 0) {
        dateGaugeCover.textContent = '无计划';
        taskGaugeCover.textContent = '无计划';
        totalTaskGaugeCover.textContent = '无计划';
        taskList.innerHTML = '';
        return;
    }

    const now = new Date();
    let currentPlan = null;
    let passedDays = 0;
    let totalDays = 0;
    let totalTasks = 0;
    let completedTasks = 0;

    for (const plan of plans) {
        const start = new Date(plan.startDate);
        const end = new Date(plan.endDate);
        totalDays += (end - start) / (1000 * 60 * 60 * 24) + 1;

        if (plan.stage === 'A') {
            totalTasks += plan.tasks.flat().length;
            completedTasks += plan.tasks.flat().filter(task => task.completed).length;
        }

        if (now >= start && now <= end) {
            currentPlan = plan;
            passedDays = Math.min(Math.max((now - start) / (1000 * 60 * 60 * 24), 0), totalDays);
        }
    }

    if (!currentPlan) {
        dateGaugeCover.textContent = '无当前计划';
        taskGaugeCover.textContent = '无当前计划';
        totalTaskGaugeCover.textContent = '无当前计划';
        taskList.innerHTML = '<li>今天没有任务</li>';
        return;
    }

    const todayTasks = currentPlan.tasks[Math.floor(passedDays)];
    taskList.innerHTML = todayTasks ? todayTasks.map((task, index) => `<li data-index="${index}" class="${task.completed ? 'completed' : ''}">${task.name}</li>`).join('') : '<li>今天没有任务</li>';

    const dateProgressValue = Math.round(passedDays / totalDays * 100);
    const taskProgressValue = Math.round(todayTasks.filter(task => task.completed).length / todayTasks.length * 100);
    const totalTaskProgressValue = Math.round(completedTasks / totalTasks * 100);

    dateGaugeFill.style.top = `${100 - dateProgressValue}%`;
    dateGaugeCover.textContent = `${dateProgressValue}%`;

    taskGaugeFill.style.top = `${100 - taskProgressValue}%`;
    taskGaugeCover.textContent = `${taskProgressValue}%`;

    totalTaskGaugeFill.style.top = `${100 - totalTaskProgressValue}%`;
    totalTaskGaugeCover.textContent = `${totalTaskProgressValue}%`;
}

// 处理表单提交
planForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const stage = document.getElementById('stage').value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const tasks = document.getElementById('tasks').value.split('\n').map(task => ({ name: task.trim(), completed: false }));

    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = (end - start) / (1000 * 60 * 60 * 24) + 1;

    const dailyTasks = Array.from({ length: totalDays }, () => tasks);

    const newPlan = {
        stage,
        startDate,
        endDate,
        tasks: dailyTasks
    };

    plans.push(newPlan);
    localStorage.setItem('plans', JSON.stringify(plans));
    updateDashboard();
    planForm.reset();
});

// 处理任务点击
taskList.addEventListener('click', function(e) {
    if (e.target.tagName === 'LI') {
        const index = e.target.dataset.index;
        const now = new Date();
        let currentPlan = null;
        let dayIndex = 0;

        for (const plan of plans) {
            const start = new Date(plan.startDate);
            const end = new Date(plan.endDate);
            if (now >= start && now <= end) {
                currentPlan = plan;
                dayIndex = Math.floor((now - start) / (1000 * 60 * 60 * 24));
                break;
            }
        }

        if (currentPlan) {
            currentPlan.tasks[dayIndex][index].completed = !currentPlan.tasks[dayIndex][index].completed;
            localStorage.setItem('plans', JSON.stringify(plans));
            updateDashboard();
        }
    }
});

// 初始化
updateDashboard();

// 每天凌晨更新任务列表
setInterval(() => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) {
        updateDashboard();
    }
}, 60000); // 每分钟检查一次
