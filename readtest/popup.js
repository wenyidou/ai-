const statusBadge = document.getElementById("status");
const statusText = document.getElementById("statusText");
const toggleBtn = document.getElementById("toggleBtn");
const settingsBtn = document.getElementById("settingsBtn");
const optionsLink = document.getElementById("optionsLink");
const darkModeToggle = document.getElementById("darkModeToggle");
//第三步设置点击后的插件效果
function setStatus(active) {
  if (active) {
    statusBadge.classList.remove("inactive");
    statusBadge.classList.add("active");
    statusText.textContent = "阅读模式已开启";
    toggleBtn.textContent = "关闭阅读模式";
  } else {
    statusBadge.classList.add("inactive");
    statusBadge.classList.remove("active");
    statusText.textContent = "阅读模式未开启";
    toggleBtn.textContent = "开启阅读模式";
  }
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}
//第二步查看当前网页是否可以被阅读
async function sendToTab(message) {
  const tab = await getActiveTab();
  if (!tab || !tab.id || tab.url.startsWith("chrome://")) {
    throw new Error("当前页面不支持阅读模式");
  }
  return chrome.tabs.sendMessage(tab.id, message);
}
//刷新网页状态
async function refreshStatus() {
  try {
    const response = await sendToTab({ action: "get-reader-state" });
    setStatus(response.active);
  } catch (error) {
    console.warn(error);
    statusText.textContent = error.message || "无法通信";
    statusBadge.classList.add("inactive");
  }
}

async function initSettings() {
  chrome.storage.sync.get("readerSettings", (data) => {
    const settings = data.readerSettings || {};
    darkModeToggle.checked = Boolean(settings.darkMode);
  });
}
//搜索框待完成
// function shousuo{
//   const searchInput = document.getElementById("searchInput");
//   searchInput.addEventListener("input", (e) => {
//     const searchValue = e.target.value;
//     chrome.tabs.sendMessage(tab.id, { action: "search-tab", searchValue: searchValue });
//   });
// }

document.addEventListener("DOMContentLoaded", () => {
  refreshStatus();
  initSettings();
//第一步点击后的处理：作用于插件的监听
  toggleBtn.addEventListener("click", async () => {
    toggleBtn.disabled = true;
    try {
      const response = await sendToTab({ action: "toggle-reader" });
      if (response.success) {
        setStatus(response.active);
      } else {
        statusText.textContent = response.error || "切换失败";
      }
    } catch (error) {
      statusText.textContent = error.message;
    } finally {
      toggleBtn.disabled = false;
    }
  });
//第一步作用于设置效果的监听（详细设置）
  settingsBtn.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();//打开详细设置的界面
  });

  optionsLink.addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
//黑暗模式的设置
  darkModeToggle.addEventListener("change", () => {
    chrome.storage.sync.get("readerSettings", (data) => {
      const settings = Object.assign(
        {
          fontSize: 18,
          lineHeight: 1.8,
          fontFamily: 'Georgia, "Times New Roman", serif',
          backgroundColor: "#ffffff",
          textColor: "#1f2933",
          maxWidth: "760px",
          darkMode: false,
        },
        data.readerSettings || {}
      );
      settings.darkMode = darkModeToggle.checked;
      chrome.storage.sync.set({ readerSettings: settings }, () => {
        sendToTab({ action: "get-reader-state" }).catch(() => {});
      });
    });
  });
});

