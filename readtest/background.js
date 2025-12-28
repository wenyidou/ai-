// 高效阅读器 - 后台服务工作者

// 监听扩展安装
chrome.runtime.onInstalled.addListener(() => {
    console.log('益阅读已安装');
    // 设置默认配置
    chrome.storage.sync.set({
        readerSettings: {
            fontSize: 18,
            lineHeight: 1.8,
            fontFamily: 'Georgia, "Times New Roman", serif',
            backgroundColor: '#ffffff',
            textColor: '#333333',
            maxWidth: '1000px',
            darkMode: false
        }
    });
});

// 监听快捷键命令
chrome.commands.onCommand.addListener((command) => {
    if (command === 'toggle-reader') {
        toggleReaderMode();
    }
});

// 切换阅读模式
async function toggleReaderMode() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        return;
    }
    
    chrome.tabs.sendMessage(tab.id, { action: 'toggle' });
}

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getStatus') {
        // 可以在这里处理状态查询
        sendResponse({ success: true });
    }
    return true;
});
