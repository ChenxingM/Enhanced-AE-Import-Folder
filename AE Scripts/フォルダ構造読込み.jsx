/**
 * スクリプト名: フォルダ構造読込み.jsx 
 * 説明: このスクリプトは、指定されたディレクトリの全てのファイルやサブディレクトリの内容を選択し、
 * インポートすることができます。さまざまなファイル形式をサポートし、ユーザーが選択できる多くのオプションが提供されています。
 * 著者: 千石まよひ
 * バージョン: 1.0
 * 日付: 2023-09-27
 * メール: mchenxing-contact@yahoo.co.jp
 * 
 * 著作権: © 2023 千石まよひ. 全著作権所有。
 * 
 * このソースおよびバイナリ形式での再配布および使用は、変更の有無に関係なく、
 * 上記の著作権通知、この条件一覧、および以下の免責事項が含まれている場合に許可されます。
 * 
 * 免責事項: このソフトウェアは「現状のまま」提供され、明示または黙示を問わず、
 * いかなる保証も行われません。商業性、特定の目的への適合性に関する黙示の保証を含むが、
 * これに限定されない、いかなる明示的または黙示的な保証も否認されます。
 * 著者または著作権所有者は、契約、厳格な責任、または不法行為
 * (過失を含むがこれに限定されない) に基づくいかなる理論においても、
 * このソフトウェアの使用に起因または関連して発生したいかなる直接的、間接的、
 * 偶発的、特別、典型的、または結果的な損害（代替の商品またはサービスの調達、
 * 使用の喪失、データの喪失、利益の喪失、業務の中断を含むがこれに限定されない）
 * について、そのような損害の可能性を知らされていたとしても、責任を負わないものとします。
 */

var panelGlobal = this;
var palette = (function() {
var myPanel = (panelGlobal instanceof Panel) ? panelGlobal: new Window("palette", "フォルダ構造読込み", undefined, {
            resizeable: true,
            closeButton: true
    });

    var sequenceFolderNamesInput, folderPathInput;

    // 提示 输入框
    var sequenceNameGroup = myPanel.add("group");
    sequenceNameGroup.orientation = "row";
    sequenceNameGroup.alignChildren = "left";
    sequenceNameGroup.add("statictext", undefined, "シーケンスのフォルダ名（カンマ区切り）");
    sequenceFolderNamesInput = sequenceNameGroup.add("edittext", undefined, "");
    sequenceFolderNamesInput.characters = 42;

    // 文件夹路径 输入框 打开文件夹按钮
    var folderInputGroup = myPanel.add("group");
    folderInputGroup.orientation = "row";
    folderInputGroup.alignChildren = "left";
    folderInputGroup.add("statictext", undefined, "フォルダのパス：");
    folderPathInput = folderInputGroup.add("edittext", undefined, "");
    folderPathInput.characters = 46;

    var openFolderBtn = folderInputGroup.add("button", undefined, "開く/読込み");
    openFolderBtn.preferredSize.width = 100;
    openFolderBtn.onClick = main;

    var checkboxGroup = myPanel.add("group", undefined);
    checkboxGroup.orientation = "row";
    checkboxGroup.alignChildren = "left";
    checkboxGroup.alignment = "left";

    var ignoreErrorsCheckbox = checkboxGroup.add("checkbox", undefined, "サポートされていないファイルを無視");
    ignoreErrorsCheckbox.value = true;

    var includeOuterFolderCheckbox = checkboxGroup.add("checkbox", undefined, "最外層のフォルダを含む");
    includeOuterFolderCheckbox.value = true;

    var alwaysOpenDialogCheckbox = checkboxGroup.add("checkbox", undefined, "常に選択ダイアログを開く");
    alwaysOpenDialogCheckbox.value = false; // 默认不选中

    

    // 文件选择对话框
    function openFolderDialog() {
        // 如果复选框被选中或输入框为空，则总是打开选择对话框
        if (alwaysOpenDialogCheckbox.value || !folderPathInput.text) {
            return Folder.selectDialog("选择一个文件夹");
        } else {
            return new Folder(folderPathInput.text);
        }
    }

    function importFilesFromFolder(folder, aeFolder) {
        var items = folder.getFiles();
        var hasImportedSequenceFromCurrentFolder = false;
    
        var sequenceFolderNames = sequenceFolderNamesInput.text.split(",");
        function trimString(str) {
            return str.replace(/^\s+|\s+$/g, "");
        }
        
        for (var k = 0; k < sequenceFolderNames.length; k++) {
            sequenceFolderNames[k] = trimString(sequenceFolderNames[k]);
        }
    
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
    
            // 忽略 .DS_Store 文件
            if (item.name === ".DS_Store") {
                continue;
            }
    
            if (item instanceof Folder) {
                var newAeFolder = app.project.items.addFolder(item.displayName);
                newAeFolder.parentFolder = aeFolder;
                importFilesFromFolder(item, newAeFolder);
            } else if (item instanceof File && !hasImportedSequenceFromCurrentFolder) {
                try {
                    var importOpts = new ImportOptions(item);
                    if (importOpts.canImportAs(ImportAsType.FOOTAGE)) {
                        var isSequenceFolder = false;
                        for (var j = 0; j < sequenceFolderNames.length; j++) {
                            if (folder.displayName === sequenceFolderNames[j]) {
                                isSequenceFolder = true;
                                break;
                            }
                        }
    
                        if (isSequenceFolder) {
                            importOpts.sequence = true;
                            hasImportedSequenceFromCurrentFolder = true;
                        }
                        var importedItem = app.project.importFile(importOpts);
                        importedItem.parentFolder = aeFolder;
                    }
                } catch (e) {
                    if (!ignoreErrorsCheckbox.value) {
                        alert("Error importing file: " + item.fullName + "\n" + e.toString());
                    }
                }
            }
        }
    }

    function decodeUTF8URIEncoded(str) {
        return str.replace(/(%[0-9A-Fa-f]{2})+/g, function(match) {
            return decodeUTF8Array(URIEncodedToByteArray(match));
        });
    }
    
    function URIEncodedToByteArray(URIEncoded) {
        var byteArr = [];
        for (var i = 0; i < URIEncoded.length; i += 3) {
            byteArr.push(parseInt(URIEncoded.substring(i + 1, i + 3), 16));
        }
        return byteArr;
    }
    
    function decodeUTF8Array(byteArray) {
        var str = '';
        for (var i = 0; i < byteArray.length; i++) {
            var byte1 = byteArray[i];
            if (byte1 < 128) {
                str += String.fromCharCode(byte1);
            } else if (byte1 < 224) {
                var byte2 = byteArray[++i];
                str += String.fromCharCode(((byte1 & 31) << 6) | (byte2 & 63));
            } else if (byte1 < 240) {
                var byte2 = byteArray[++i];
                var byte3 = byteArray[++i];
                str += String.fromCharCode(((byte1 & 15) << 12) | ((byte2 & 63) << 6) | (byte3 & 63));
            } 
        }
        return str;
    }

    function main() {
        var folder = openFolderDialog();
        folderPathInput.text = decodeUTF8URIEncoded(folder.fsName.toString());
        if (folder) {
            app.beginUndoGroup("imp");
            if (includeOuterFolderCheckbox.value) {
                // 包含最外层文件夹
                var pathComponents = folder.fullName.split("/");
                var folderName = pathComponents[pathComponents.length - 1]; // 获取路径的最后一部分
                var outerAeFolder = app.project.items.addFolder(folderName);                
                importFilesFromFolder(folder, outerAeFolder);
            } else {
                // 不包括最外层文件夹
                importFilesFromFolder(folder, app.project.rootFolder);
            }
            app.endUndoGroup();
        } else {
            alert("フォルダが選択されていないか、ファイルダイアログがキャンセルされました。");
        }
        
    }
    

    myPanel.layout.layout(true);
    myPanel.layout.resize();
    myPanel.onResizing = myPanel.onResize = function() {
        this.layout.resize()
    }

    if (myPanel instanceof Window) myPanel.show();
    return myPanel;

}());
