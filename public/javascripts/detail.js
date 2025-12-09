// 詳細ページ関連のJavaScript

// ページ読み込み時
document.addEventListener('DOMContentLoaded', async () => {
    // セッション確認
    const isAuthenticated = await checkSession();
    if (!isAuthenticated) {
        window.location.href = '/';
        return;
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

// 詳細ページはサーバーサイドレンダリングなので、JavaScriptは編集・削除のみ

// 編集
async function editItem(id) {
    window.location.href = `/dashboard?edit=${id}`;
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
            alert('削除しました');
            window.location.href = '/dashboard';
        } else {
            alert('削除に失敗しました');
        }
    } catch (error) {
        console.error('削除エラー:', error);
        alert('削除に失敗しました');
    }
}

// 日時フォーマット
function formatDateTime(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}`;
}

// HTMLエスケープ
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}



