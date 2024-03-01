/**
 * 脚本名: 导入目录及文件.jsx
 * 描述: 此脚本允许用户选择并导入指定目录的所有文件及子目录内容。支持多种文件格式，并提供了多个选项供用户选择。
 * 作者: 千石まよひ
 * 版本: 1.0
 * 日期: 2023-09-27
 * 邮件: tammcx@gmail.com
 * 
 * Copyright: © 2023 千石まよひ. All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the above copyright
 * notice, this list of conditions and the following disclaimer are included.
 * 
 * DISCLAIMER: THIS SOFTWARE IS PROVIDED "AS IS" AND ANY EXPRESSED OR IMPLIED 
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF 
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. 
 * IN NO EVENT SHALL THE AUTHOR OR COPYRIGHT HOLDERS BE LIABLE FOR ANY DIRECT, 
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES 
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; 
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND 
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT 
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS 
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

var panelGlobal = this;
var palette = (function() {
var myPanel = (panelGlobal instanceof Panel) ? panelGlobal: new Window("palette", "导入文件夹", undefined, {
            resizeable: true,
            closeButton: true
    });

    var sequenceFolderNamesInput, folderPathInput;

    // 提示 输入框
    var sequenceNameGroup = myPanel.add("group");
    sequenceNameGroup.orientation = "row";
    sequenceNameGroup.alignChildren = "left";
    sequenceNameGroup.add("statictext", undefined, "序列帧文件夹名（用逗号分隔）：");
    sequenceFolderNamesInput = sequenceNameGroup.add("edittext", undefined, "");
    sequenceFolderNamesInput.characters = 35;

    // 文件夹路径 输入框 打开文件夹按钮
    var folderInputGroup = myPanel.add("group");
    folderInputGroup.orientation = "row";
    folderInputGroup.alignChildren = "left";
    folderInputGroup.add("statictext", undefined, "文件夹路径：");
    folderPathInput = folderInputGroup.add("edittext", undefined, "");
    folderPathInput.characters = 35;

    var openFolderBtn = folderInputGroup.add("button", undefined, "打开/导入");
    openFolderBtn.preferredSize.width = 100;
    openFolderBtn.onClick = main;

    var checkboxGroup = myPanel.add("group", undefined);
    checkboxGroup.orientation = "row";
    checkboxGroup.alignChildren = "left";
    checkboxGroup.alignment = "left";
    
    var ignoreErrorsCheckbox = checkboxGroup.add("checkbox", undefined, "忽略不支持的文件");
    ignoreErrorsCheckbox.value = true;
    
    var includeOuterFolderCheckbox = checkboxGroup.add("checkbox", undefined, "包括最外层文件夹");
    includeOuterFolderCheckbox.value = true;

    var alwaysOpenDialogCheckbox = checkboxGroup.add("checkbox", undefined, "总是打开选择对话框");
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
        folderPathInput.text = decodeUTF8URIEncoded(folder.toString());
        if (folder) {
            app.beginUndoGroup("导入文件夹内容");
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
            alert("未选择文件夹或者文件对话框被取消了");
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
