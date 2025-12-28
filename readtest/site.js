function setnotebook(){
   // 获取要操作的div元素
const divElement = document.querySelector('.ai-iframe');

// 清空div中的所有内容
while (divElement.firstChild) {
    divElement.removeChild(divElement.firstChild);
}

// 创建新的元素并添加到div中
const newElement = document.createElement('p');
newElement.textContent = '这是新的内容';
divElement.appendChild(newElement);
}
