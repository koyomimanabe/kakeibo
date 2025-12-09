// ダッシュボード関連のJavaScript

let currentFilters = {
    type: 'all',
    startDate: '',
    endDate: ''
};

// ページ読み込み時
document.addEventListener('DOMContentLoaded', async () => {
    // セッション確認
    const isAuthenticated = await checkSession();
    if (!isAuthenticated) {
        window.location.href = '/';
        return;
    }
    
    // データ読み込み
    await loadSummary();
    await loadItems();
    
    // イベントリスナー設定
    setupEventListeners();
    
    // URLパラメータから編集IDを取得
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    if (editId) {
        await editItem(parseInt(editId));
        // URLからパラメータを削除
        window.history.replaceState({}, document.title, '/dashboard.html');
    }
});

// セッション確認
async function checkSession() {
    try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        return data.authenticated;
    } catch (error) {
        console.error('セッション確認エラー:', error);
        return false;
    }
}

// イベントリスナー設定
function setupEventListeners() {
    // ログアウト
    document.getElementById('logout-btn').addEventListener('click', async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/';
        } catch (error) {
            console.error('ログアウトエラー:', error);
        }
    });
    
    // フィルター適用
    document.getElementById('apply-filter').addEventListener('click', async () => {
        currentFilters.type = document.getElementById('type-filter').value;
        currentFilters.startDate = document.getElementById('start-date').value;
        currentFilters.endDate = document.getElementById('end-date').value;
        
        await loadSummary();
        await loadItems();
    });
    
    // フィルタークリア
    document.getElementById('clear-filter').addEventListener('click', () => {
        document.getElementById('type-filter').value = 'all';
        document.getElementById('start-date').value = '';
        document.getElementById('end-date').value = '';
        
        currentFilters = {
            type: 'all',
            startDate: '',
            endDate: ''
        };
        
        loadSummary();
        loadItems();
    });
    
    // 追加ボタン
    document.getElementById('add-item-btn').addEventListener('click', () => {
        openModal();
    });
    
    // モーダル関連
    const modal = document.getElementById('item-modal');
    const closeBtn = document.querySelector('.close');
    const cancelBtn = document.getElementById('cancel-btn');
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // フォーム送信
    document.getElementById('item-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveItem();
    });
}

// サマリー読み込み
async function loadSummary() {
    try {
        const params = new URLSearchParams();
        if (currentFilters.startDate) params.append('startDate', currentFilters.startDate);
        if (currentFilters.endDate) params.append('endDate', currentFilters.endDate);
        
        const response = await fetch(`/api/items/summary?${params.toString()}`);
        const data = await response.json();
        
        document.getElementById('total-income').textContent = `¥${data.totalIncome.toLocaleString()}`;
        document.getElementById('total-expense').textContent = `¥${data.totalExpense.toLocaleString()}`;
        document.getElementById('balance').textContent = `¥${data.balance.toLocaleString()}`;
    } catch (error) {
        console.error('サマリー読み込みエラー:', error);
    }
}

// 収支項目読み込み
async function loadItems() {
    try {
        const params = new URLSearchParams();
        if (currentFilters.type !== 'all') params.append('type', currentFilters.type);
        if (currentFilters.startDate) params.append('startDate', currentFilters.startDate);
        if (currentFilters.endDate) params.append('endDate', currentFilters.endDate);
        
        const response = await fetch(`/api/items?${params.toString()}`);
        const items = await response.json();
        
        displayItems(items);
    } catch (error) {
        console.error('収支項目読み込みエラー:', error);
    }
}

// 収支項目表示（テーブル）
function displayItems(items) {
    const tbody = document.getElementById('items-body');
    if (!tbody) return;

    if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="loading">収支項目がありません</td></tr>`;
        return;
    }

    tbody.innerHTML = items.map(item => {
        const typeLabel = item.type === 'Income' ? '収入' : '支出';
        const sign = item.type === 'Income' ? '+' : '-';
        return `
            <tr>
                <td>${escapeHtml(item.event)}</td>
                <td>${typeLabel}</td>
                <td>${sign}¥${parseInt(item.amount).toLocaleString()}</td>
                <td>${formatDate(item.createdAt)}</td>
                <td>
                    <div class="item-actions">
                        <button class="btn-secondary" onclick="viewDetail(${item.id})">詳細</button>
                        <button class="btn-secondary" onclick="editItem(${item.id})">編集</button>
                        <button class="btn-secondary" onclick="deleteItem(${item.id})">削除</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// 詳細表示
function viewDetail(id) {
    window.location.href = `/detail?id=${id}`;
}

// 編集
async function editItem(id) {
    try {
        const response = await fetch(`/api/items/${id}`);
        const item = await response.json();
        
        document.getElementById('modal-title').textContent = '収支項目を編集';
        document.getElementById('item-id').value = item.id;
        document.getElementById('item-event').value = item.event;
        document.getElementById('item-amount').value = item.amount;
        document.getElementById('item-type').value = item.type;
        document.getElementById('item-memo').value = item.memo || '';
        document.getElementById('item-date').value = item.createdAt ? item.createdAt.slice(0, 10) : '';
        
        openModal();
    } catch (error) {
        console.error('編集データ読み込みエラー:', error);
        alert('データの読み込みに失敗しました');
    }
}

// 削除
async function deleteItem(id) {
    if (!confirm('この項目を削除しますか？')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/items/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            await loadSummary();
            await loadItems();
        } else {
            alert('削除に失敗しました');
        }
    } catch (error) {
        console.error('削除エラー:', error);
        alert('削除に失敗しました');
    }
}

// モーダルを開く
function openModal() {
    const modal = document.getElementById('item-modal');
    modal.classList.add('active');
    
    // 新規追加の場合はフォームをリセット
    if (!document.getElementById('item-id').value) {
        document.getElementById('modal-title').textContent = '収支項目を追加';
        document.getElementById('item-form').reset();
        document.getElementById('item-id').value = '';
        // デフォルト日付を今日に設定
        const today = new Date().toISOString().slice(0, 10);
        const dateInput = document.getElementById('item-date');
        if (dateInput) dateInput.value = today;
    }
}

// モーダルを閉じる
function closeModal() {
    const modal = document.getElementById('item-modal');
    modal.classList.remove('active');
    document.getElementById('item-form').reset();
    document.getElementById('item-id').value = '';
}

// 項目保存
async function saveItem() {
    const id = document.getElementById('item-id').value;
    const event = document.getElementById('item-event').value;
    const amount = parseInt(document.getElementById('item-amount').value);
    const type = document.getElementById('item-type').value;
    const memo = document.getElementById('item-memo').value;
    const createdAt = document.getElementById('item-date').value;
    
    try {
        const url = id ? `/api/items/${id}` : '/api/items';
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ event, amount, type, memo, createdAt })
        });
        
        if (response.ok) {
            closeModal();
            await loadSummary();
            await loadItems();
        } else {
            const data = await response.json();
            alert(data.error || '保存に失敗しました');
        }
    } catch (error) {
        console.error('保存エラー:', error);
        alert('保存に失敗しました');
    }
}

// 日付フォーマット
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
}

// HTMLエスケープ
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

