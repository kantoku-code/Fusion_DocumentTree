// サンプルJSONデータ生成（実際のデータに置き換えてください）
function generateSampleData() {
    return new Promise((resolve) => {
        setTimeout(() => {
            const data = [
                {
                    id: 1,
                    text: "ルートフォルダ",
                    icon: "📁",
                    Thumbnail: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                    children: [
                        {
                            id: 2,
                            text: "ドキュメント",
                            icon: "📄",
                            Thumbnail: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==",
                            children: [
                                {
                                    id: 3,
                                    text: "レポート.docx",
                                    icon: "📝",
                                    Thumbnail: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA+WFGIQAAAABJRU5ErkJggg==",
                                    children: []
                                }
                            ]
                        },
                        {
                            id: 4,
                            text: "画像",
                            icon: "🖼️",
                            Thumbnail: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==",
                            children: [
                                {
                                    id: 5,
                                    text: "photo1.jpg",
                                    icon: "🖼️",
                                    Thumbnail: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
                                    children: []
                                },
                                {
                                    id: 6,
                                    text: "photo2.jpg",
                                    icon: "🖼️",
                                    Thumbnail: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgADhAGA/WFGIQAAAABJRU5ErkJggg==",
                                    children: []
                                }
                            ]
                        }
                    ]
                }
            ];
            resolve(data);
        }, 1500); // JSONロードをシミュレート
    });
}

class TreeView {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.contextMenu = document.getElementById('contextMenu');
        this.tooltip = document.getElementById('tooltip');
        this.searchInput = document.getElementById('searchInput');
        this.currentContextNode = null;
        this.treeData = [];
        this.searchTerm = '';
        
        this.init();
    }

    init() {
        // イベントリスナー設定
        document.getElementById('expandAll').addEventListener('click', () => this.expandAll());
        document.getElementById('collapseAll').addEventListener('click', () => this.collapseAll());
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        
        // コンテキストメニュー
        document.getElementById('menuInfo').addEventListener('click', () => this.showInfo());
        document.getElementById('menuExpand').addEventListener('click', () => this.expandNode());
        document.getElementById('menuCollapse').addEventListener('click', () => this.collapseNode());
        
        // コンテキストメニューを閉じる
        document.addEventListener('click', () => this.hideContextMenu());
        
        // データ読み込み
        this.loadData();
    }

    async loadData() {
        try {
            this.treeData = await generateSampleData();
            this.render();
        } catch (error) {
            this.container.innerHTML = '<p>データの読み込みに失敗しました</p>';
        }
    }

    render() {
        this.container.innerHTML = '<div class="tree" id="treeRoot"></div>';
        const treeRoot = document.getElementById('treeRoot');
        
        this.treeData.forEach(node => {
            treeRoot.appendChild(this.createNode(node));
        });
    }

    createNode(nodeData) {
        const nodeDiv = document.createElement('div');
        nodeDiv.className = 'tree-node';
        nodeDiv.dataset.nodeId = nodeData.id;
        nodeDiv.dataset.nodeText = nodeData.text;
        nodeDiv.dataset.thumbnail = nodeData.Thumbnail || '';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'tree-node-content';

        // トグルボタン
        const toggle = document.createElement('span');
        toggle.className = 'tree-toggle';
        if (nodeData.children && nodeData.children.length > 0) {
            toggle.textContent = '▶';
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleNode(nodeDiv);
            });
        } else {
            toggle.classList.add('empty');
        }

        // アイコン
        const icon = document.createElement('span');
        icon.className = 'tree-icon';
        icon.textContent = nodeData.icon || '📄';

        // テキスト
        const text = document.createElement('span');
        text.className = 'tree-text';
        text.textContent = nodeData.text;

        // 検索ハイライト
        if (this.searchTerm && nodeData.text.toLowerCase().includes(this.searchTerm.toLowerCase())) {
            text.classList.add('highlight');
        }

        contentDiv.appendChild(toggle);
        contentDiv.appendChild(icon);
        contentDiv.appendChild(text);

        // ホバーイベント
        contentDiv.addEventListener('mouseenter', (e) => this.showTooltip(e, nodeData));
        contentDiv.addEventListener('mouseleave', () => this.hideTooltip());

        // コンテキストメニュー
        contentDiv.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showContextMenu(e, nodeDiv);
        });

        nodeDiv.appendChild(contentDiv);

        // 子ノード
        if (nodeData.children && nodeData.children.length > 0) {
            const childrenDiv = document.createElement('div');
            childrenDiv.className = 'tree-children';
            
            nodeData.children.forEach(child => {
                childrenDiv.appendChild(this.createNode(child));
            });
            
            nodeDiv.appendChild(childrenDiv);
        }

        return nodeDiv;
    }

    toggleNode(nodeDiv) {
        const childrenDiv = nodeDiv.querySelector('.tree-children');
        const toggle = nodeDiv.querySelector('.tree-toggle');
        
        if (childrenDiv) {
            childrenDiv.classList.toggle('expanded');
            toggle.textContent = childrenDiv.classList.contains('expanded') ? '▼' : '▶';
        }
    }

    expandAll() {
        const allChildren = document.querySelectorAll('.tree-children');
        const allToggles = document.querySelectorAll('.tree-toggle:not(.empty)');
        
        allChildren.forEach(child => child.classList.add('expanded'));
        allToggles.forEach(toggle => toggle.textContent = '▼');
    }

    collapseAll() {
        const allChildren = document.querySelectorAll('.tree-children');
        const allToggles = document.querySelectorAll('.tree-toggle:not(.empty)');
        
        allChildren.forEach(child => child.classList.remove('expanded'));
        allToggles.forEach(toggle => toggle.textContent = '▶');
    }

    handleSearch(term) {
        this.searchTerm = term;
        this.render();

        if (term) {
            // 検索結果のノードまで展開
            const highlightedNodes = document.querySelectorAll('.tree-text.highlight');
            highlightedNodes.forEach(node => {
                let parent = node.closest('.tree-node').parentElement;
                while (parent && parent.classList.contains('tree-children')) {
                    parent.classList.add('expanded');
                    const toggle = parent.previousElementSibling?.querySelector('.tree-toggle');
                    if (toggle && !toggle.classList.contains('empty')) {
                        toggle.textContent = '▼';
                    }
                    parent = parent.parentElement?.parentElement;
                }
            });
        }
    }

    showTooltip(event, nodeData) {
        const tooltip = this.tooltip;
        const tooltipImage = document.getElementById('tooltipImage');
        const tooltipText = document.getElementById('tooltipText');

        if (nodeData.Thumbnail) {
            tooltipImage.src = nodeData.Thumbnail;
            tooltipImage.style.display = 'block';
        } else {
            tooltipImage.style.display = 'none';
        }

        tooltipText.textContent = nodeData.text;

        tooltip.classList.add('show');
        
        const x = event.clientX + 10;
        const y = event.clientY + 10;
        
        tooltip.style.left = x + 'px';
        tooltip.style.top = y + 'px';
    }

    hideTooltip() {
        this.tooltip.classList.remove('show');
    }

    showContextMenu(event, nodeDiv) {
        this.currentContextNode = nodeDiv;
        const menu = this.contextMenu;
        
        menu.classList.add('show');
        menu.style.left = event.clientX + 'px';
        menu.style.top = event.clientY + 'px';
    }

    hideContextMenu() {
        this.contextMenu.classList.remove('show');
    }

    showInfo() {
        if (this.currentContextNode) {
            const text = this.currentContextNode.dataset.nodeText;
            const id = this.currentContextNode.dataset.nodeId;
            alert(`ノード情報:\nID: ${id}\nテキスト: ${text}`);
        }
        this.hideContextMenu();
    }

    expandNode() {
        if (this.currentContextNode) {
            const childrenDiv = this.currentContextNode.querySelector('.tree-children');
            const toggle = this.currentContextNode.querySelector('.tree-toggle');
            
            if (childrenDiv && !childrenDiv.classList.contains('expanded')) {
                childrenDiv.classList.add('expanded');
                if (toggle && !toggle.classList.contains('empty')) {
                    toggle.textContent = '▼';
                }
            }
        }
        this.hideContextMenu();
    }

    collapseNode() {
        if (this.currentContextNode) {
            const childrenDiv = this.currentContextNode.querySelector('.tree-children');
            const toggle = this.currentContextNode.querySelector('.tree-toggle');
            
            if (childrenDiv && childrenDiv.classList.contains('expanded')) {
                childrenDiv.classList.remove('expanded');
                if (toggle && !toggle.classList.contains('empty')) {
                    toggle.textContent = '▶';
                }
            }
        }
        this.hideContextMenu();
    }
}

// TreeView初期化
const treeView = new TreeView('treeContainer');