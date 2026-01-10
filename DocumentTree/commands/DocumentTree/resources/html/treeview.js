// Autodesk Fusion対応TreeViewクラス
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
        document.getElementById('menuOpen').addEventListener('click', () => this.openFile());
        document.getElementById('menuExpand').addEventListener('click', () => this.expandNode());
        document.getElementById('menuCollapse').addEventListener('click', () => this.collapseNode());

        // コンテキストメニューを閉じる
        document.addEventListener('click', () => this.hideContextMenu());

        // Autodesk Fusion環境でデータ読み込み
        this.loadDataFromFusion();
    }

    // Autodesk Fusionからデータを取得
    loadDataFromFusion() {
        // adskオブジェクトが利用可能になるまで待機
        // adskオブジェクトが利用可能になるまで待機
        const adskWaiter = setInterval(() => {
            if (window.adsk) {
                clearInterval(adskWaiter);

                // Fusionからデータを取得 (UI描画のために少し待つ)
                setTimeout(() => {
                    adsk.fusionSendData("htmlLoaded", "").then((ret) => {
                        try {
                            const obj = JSON.parse(ret || "null");

                            if (obj && obj.action === "loading") {
                                console.log("Loading started...");
                                return;
                            }

                            if (obj && obj.data) {
                                // データが配列でない場合は配列にラップする
                                if (Array.isArray(obj.data)) {
                                    this.treeData = obj.data;
                                } else {
                                    this.treeData = [obj.data];
                                }
                                this.render();
                            } else {
                                this.container.innerHTML = '<p>データが見つかりませんでした</p>';
                            }
                        } catch (error) {
                            console.error('データのパース中にエラーが発生しました:', error);
                            this.container.innerHTML = '<p>データの読み込みに失敗しました</p>';
                        }
                    }).catch((error) => {
                        console.error('Fusionからのデータ取得に失敗しました:', error);
                        this.container.innerHTML = '<p>データの読み込みに失敗しました</p>';
                    });
                }, 100);
            }
        }, 100);

        // Fusionからの非同期メッセージを受け取るハンドラ
        window.fusionJavaScriptHandler = {
            handle: (action, data) => {
                if (action === 'send') {
                    try {
                        const obj = JSON.parse(data);
                        if (obj && obj.data) {
                            if (Array.isArray(obj.data)) {
                                this.treeData = obj.data;
                            } else {
                                this.treeData = [obj.data];
                            }
                            this.render();
                        } else {
                            this.container.innerHTML = '<p>データが見つかりませんでした</p>';
                        }
                    } catch (error) {
                        console.error('非同期データのパースエラー:', error);
                    }
                }
            }
        };


    }

    // フォールバック用サンプルデータ
    async loadSampleData() {
        try {
            this.treeData = await this.generateSampleData();
            this.render();
        } catch (error) {
            this.container.innerHTML = '<p>データの読み込みに失敗しました</p>';
        }
    }

    generateSampleData() {
        return new Promise((resolve) => {
            setTimeout(() => {
                // より視認性の高いBase64サンプル画像 (赤い四角)
                const redSquare = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAXklEQVR42u3RAQ0AAAgDILV/51nBzwci0Cmqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq+gYE3AABHp8sKwAAAABJRU5ErkJggg==";
                const blueSquare = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAXklEQVR42u3RAQ0AAAjDMO5fNCCDkC5s6mqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq+gYE3AAB7p8sKwAAAABJRU5ErkJggg==";
                const greenSquare = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAXklEQVR42u3RAQ0AMAgDsM5fNCCDkC5s6mqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq+gYAfQAB7p8sKwAAAABJRU5ErkJggg==";

                const data = [
                    {
                        id: 1,
                        text: "ルートフォルダ",
                        icon: "fas fa-folder",
                        Thumbnail: redSquare,
                        children: [
                            {
                                id: 2,
                                text: "ドキュメント",
                                icon: "fas fa-file-alt",
                                Thumbnail: blueSquare,
                                children: [
                                    {
                                        id: 3,
                                        text: "レポート.docx",
                                        icon: "fas fa-file-word",
                                        Thumbnail: greenSquare,
                                        children: []
                                    }
                                ]
                            },
                            {
                                id: 4,
                                text: "画像",
                                icon: "fas fa-images",
                                Thumbnail: redSquare,
                                children: [
                                    {
                                        id: 5,
                                        text: "photo1.jpg",
                                        icon: "fas fa-image",
                                        Thumbnail: blueSquare,
                                        children: []
                                    },
                                    {
                                        id: 6,
                                        text: "photo2.jpg",
                                        icon: "fas fa-image",
                                        Thumbnail: greenSquare,
                                        children: []
                                    }
                                ]
                            }
                        ]
                    }
                ];
                resolve(data);
            }, 1500);
        });
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
        nodeDiv.dataset.thumbnail = nodeData.thumbnail || '';
        nodeDiv.dataset.tooltip = nodeData.tooltip || '';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'tree-node-content';

        // トグルボタン
        const toggle = document.createElement('span');
        toggle.className = 'tree-toggle';
        if (nodeData.children && nodeData.children.length > 0) {
            toggle.innerHTML = '<i class="fas fa-chevron-right"></i>';
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleNode(nodeDiv);
            });
        } else {
            toggle.classList.add('empty');
        }

        // アイコン (Font Awesome対応)
        const icon = document.createElement('span');
        icon.className = 'tree-icon';

        // iconフィールドがFont Awesomeのクラス名の場合
        if (nodeData.icon && nodeData.icon.includes('fa-')) {
            icon.innerHTML = `<i class="${nodeData.icon}"></i>`;
        } else {
            // 絵文字または未指定の場合
            icon.textContent = nodeData.icon || '📄';
        }

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
        contentDiv.addEventListener('mouseenter', (e) => {
            const tooltipData = {
                text: nodeData.tooltip || nodeData.text,
                thumbnail: nodeData.thumbnail
            };
            this.showTooltip(e, tooltipData);
        });
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
            const isExpanded = childrenDiv.classList.toggle('expanded');
            if (toggle) {
                toggle.innerHTML = isExpanded ?
                    '<i class="fas fa-chevron-down"></i>' :
                    '<i class="fas fa-chevron-right"></i>';
            }
        }
    }

    expandAll() {
        const allChildren = document.querySelectorAll('.tree-children');
        const allToggles = document.querySelectorAll('.tree-toggle:not(.empty)');

        allChildren.forEach(child => child.classList.add('expanded'));
        allToggles.forEach(toggle => {
            toggle.innerHTML = '<i class="fas fa-chevron-down"></i>';
        });
    }

    collapseAll() {
        const allChildren = document.querySelectorAll('.tree-children');
        const allToggles = document.querySelectorAll('.tree-toggle:not(.empty)');

        allChildren.forEach(child => child.classList.remove('expanded'));
        allToggles.forEach(toggle => {
            toggle.innerHTML = '<i class="fas fa-chevron-right"></i>';
        });
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
                        toggle.innerHTML = '<i class="fas fa-chevron-down"></i>';
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

        console.log('showTooltip called:', {
            text: nodeData.text,
            hasThumbnail: !!nodeData.thumbnail,
            thumbnailLength: nodeData.thumbnail ? nodeData.thumbnail.length : 0
        });

        // thumbnailがある場合は画像を表示
        if (nodeData.thumbnail && nodeData.thumbnail.trim() !== '') {
            let src = nodeData.thumbnail;
            if (!src.startsWith('data:image')) {
                src = 'data:image/png;base64,' + src;
            }
            tooltipImage.src = src;
            tooltipImage.style.display = 'block';

            // 画像読み込み成功時
            tooltipImage.onload = function () {
                console.log('画像読み込み成功');
            };

            // 画像読み込みエラー時の処理
            tooltipImage.onerror = function () {
                console.error('画像の読み込みに失敗:', nodeData.thumbnail.substring(0, 50));
                this.style.display = 'none';
            };
        } else {
            console.log('Thumbnailが空です');
            tooltipImage.style.display = 'none';
        }

        tooltipText.textContent = nodeData.text;

        tooltip.classList.add('show');

        // 基本位置: カーソルの右下
        const offset = 20;
        let left = event.clientX + 10;
        let top = event.clientY + offset;

        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';

        // 描画後のサイズを取得して調整
        requestAnimationFrame(() => {
            const rect = tooltip.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            // 右端チェック
            if (rect.right > viewportWidth) {
                left = viewportWidth - rect.width - 10;
            }

            // 下端チェック
            if (rect.bottom > viewportHeight) {
                // 下にはみ出る場合は上を試す
                const topAbove = event.clientY - rect.height - offset;

                // 上に配置しても画面外に出ないかチェック
                if (topAbove >= 0) {
                    top = topAbove;
                } else {
                    // 上もダメなら、画面内に収まるように上下位置をクランプ
                    // ただしカーソルと被らないように努力する
                    if (event.clientY > viewportHeight / 2) {
                        // カーソルが下半分にあるなら、できるだけ上に
                        top = Math.max(0, event.clientY - rect.height - offset);
                    } else {
                        // カーソルが上半分にあるなら、できるだけ下に
                        top = Math.min(viewportHeight - rect.height, event.clientY + offset);
                    }
                }
            }

            tooltip.style.left = left + 'px';
            tooltip.style.top = top + 'px';
        });
    }

    hideTooltip() {
        this.tooltip.classList.remove('show');
    }

    showContextMenu(event, nodeDiv) {
        // トップレベルノード（treeRootの直下）の場合はメニューを表示しない
        if (nodeDiv.parentElement.id === 'treeRoot') {
            return;
        }

        this.currentContextNode = nodeDiv;
        const menu = this.contextMenu;

        menu.classList.add('show');

        let left = event.clientX;
        let top = event.clientY;

        menu.style.left = left + 'px';
        menu.style.top = top + 'px';

        // 画面外にはみ出る場合の調整
        requestAnimationFrame(() => {
            const rect = menu.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;

            // 下端チェック
            if (rect.bottom > viewportHeight) {
                // カーソルの上に表示 (高さ分引く)
                top = Math.max(0, event.clientY - rect.height);
                menu.style.top = top + 'px';
            }

            // 右端チェック (念のため)
            if (rect.right > viewportWidth) {
                left = Math.max(0, viewportWidth - rect.width);
                menu.style.left = left + 'px';
            }
        });
    }

    hideContextMenu() {
        this.contextMenu.classList.remove('show');
    }

    hideContextMenu() {
        this.contextMenu.classList.remove('show');
    }

    openFile() {
        if (this.currentContextNode) {
            const id = this.currentContextNode.dataset.nodeId;
            console.log('openFile:', id);

            // Fusionへ送信
            if (window.adsk) {
                const data = JSON.stringify({ id: id });
                adsk.fusionSendData("open_active", data);
            } else {
                console.warn('adsk object not found');
            }
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
                    toggle.innerHTML = '<i class="fas fa-chevron-down"></i>';
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
                    toggle.innerHTML = '<i class="fas fa-chevron-right"></i>';
                }
            }
        }
        this.hideContextMenu();
    }

    // データを再読み込みするメソッド(必要に応じて呼び出し可能)
    refresh() {
        this.loadDataFromFusion();
    }
}

// TreeView初期化(DOMContentLoadedまたはjQueryの$(function)で実行)
document.addEventListener('DOMContentLoaded', function () {
    const treeView = new TreeView('treeContainer');

    // グローバルに参照を保存(必要に応じて)
    window.treeView = treeView;
});