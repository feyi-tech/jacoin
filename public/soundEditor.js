class SoundEditor {
    constructor() {
        this.editorClassname = "app-explainer-sound-editor"
        this.colorAccent = "#007bff"
        this.colorAccentWeak = "#D6E8FF"
        this.colorAccentStrong = "#004080"
        this.selectedColor = "rgb(0,0,0)"
        this.dependencyMaps = {}

        this.fontStyles = [
            { name: "Arial, sans-serif" },
            { name: "Verdana, sans-serif" },
            { name: "Helvetica, sans-serif" },
            { name: "Tahoma, sans-serif" },
            { name: "Trebuchet MS, sans-serif" },
            { name: "Georgia, serif" },
            { name: "Times New Roman, serif" },
            { name: "Garamond, serif" },
            { name: "Courier New, monospace" },
            { name: "Lucida Console, monospace" },
            { name: "Comic Sans MS, cursive" },
            { name: "Impact, sans-serif" },
            { name: "Palatino Linotype, serif" },
            { name: "Century Gothic, sans-serif" },
            { name: "Segoe UI, sans-serif" },
            { name: "Roboto, sans-serif" },
            { name: "Open Sans, sans-serif" },
            { name: "Lato, sans-serif" },
            { name: "Montserrat, sans-serif" },
            { name: "Raleway, sans-serif" },
            { name: "PT Sans, sans-serif" },
            { name: "Playfair Display, serif" },
            { name: "Oswald, sans-serif" },
            { name: "Merriweather, serif" },
            { name: "Quicksand, sans-serif" },
            { name: "Dancing Script, cursive" }
        ];
    }

    static show(parentSelector) {
        const editor = new SoundEditor()
        editor.parent = typeof parentSelector == "string"? document.querySelector(parentSelector) : parentSelector
        editor.parent.classList.add(editor.editorClassname)


        editor.canvas = document.createElement("canvas");
        editor.canvas.width = editor.parent.clientWidth;
        editor.canvas.height = editor.parent.clientHeight;
        editor.ctx = editor.canvas.getContext("2d");

        editor.toolbar = document.createElement("div");
        editor.toolbar.className = "editor-toolbar";
        
        editor.addToolButtons();
        editor.parent.appendChild(editor.toolbar);
        editor.parent.appendChild(editor.canvas);

        editor.addStyles();
        editor.activeTool = null;
        editor.activeItem = null; // Track the selected item
        return editor
    }

    static show(parentSelector) {
        const editor = new SoundEditor();
        editor.parent = typeof parentSelector == "string" ? document.querySelector(parentSelector) : parentSelector;
        editor.parent.classList.add(editor.editorClassname);
        
        editor.createUI();
        return editor;
    }

    createUI() {
        this.parent.innerHTML = ""; // Clear previous content

        this.controls = document.createElement("div");
        this.controls.className = "sound-editor-controls";

        this.uploadButton = this.createButton("Upload Sound", () => this.uploadSound());
        this.recordButton = this.createButton("Record", () => this.toggleRecording());
        this.playButton = this.createButton("▶ Play", () => this.playAudio());
        this.trimButton = this.createButton("✂ Trim", () => this.trimAudio());
        this.saveButton = this.createButton("💾 Save", () => this.saveAudio());

        this.controls.append(this.uploadButton, this.recordButton, this.playButton, this.trimButton, this.saveButton);
        
        this.audioElement = document.createElement("audio");
        this.audioElement.controls = true;
        this.audioElement.classList.add("sound-editor-audio");
        
        this.waveform = document.createElement("canvas");
        this.waveform.classList.add("sound-editor-waveform");

        this.parent.appendChild(this.controls);
        this.parent.appendChild(this.waveform);
        this.parent.appendChild(this.audioElement);
    }

    createButton(text, onClick) {
        const button = document.createElement("button");
        button.className = "sound-editor-btn";
        button.innerText = text;
        button.onclick = onClick;
        return button;
    }

    setState(key, value) {
        if (this[key] !== undefined) {
            this[key] = value;
            
            if (key !== "dependencyMaps") {
                var dependencyMaps = { ...this.dependencyMaps };
    
                for (const [k, v] of Object.entries(this.dependencyMaps)) {
                    dependencyMaps[k] = v.filter(callback => {
                        try {
                            callback(value);
                            return true; // Keep the callback if it doesn't fail
                        } catch (e) {
                            return false; // Remove the callback if it throws an error
                        }
                    });
                }
    
                this.dependencyMaps = dependencyMaps;
            }
        }
    }
    
    addToDependency(stateKey, callback) {
        this.dependencyMaps = {
            ...this.dependencyMaps,
            [stateKey]: [...(this.dependencyMaps[stateKey] || []), callback]
        }

        console.log("this.dependencyMaps", this.dependencyMaps)
    }

    prependElement(parent, newElement) {
        if (parent.firstChild) {
            parent.insertBefore(newElement, parent.firstChild);
        } else {
            parent.appendChild(newElement);
        }
    }

    addStyles() {
        // Create the <style> element and add styles
        const style = document.createElement('style');
        style.innerHTML = `
            /* Add your styles here */
            .${this.editorClassname} .editor-toolbar {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                display: flex;
                justify-content: space-between;
                background: #eee;
            }
            .${this.editorClassname} .editor-toolbar>div {
                display: flex;
                justify-content: flex-start;
                gap: 10px;
                padding: 10px;
            }
            .${this.editorClassname} .tool-btn, .${this.editorClassname} .selection-box, .${this.editorClassname} .tool-pane span {
                cursor: pointer;
            }
            .${this.editorClassname} .tool-btn {
                font-size: 20px;
            }
            .${this.editorClassname} .selection-box {
                position: absolute;
                border: 2px dashed #000;
                cursor: move;
                display: flex;
                justify-content: center;
                align-items: center;
                user-select: none;
                font-size: 100px;
                text-align: center;
            }
            .${this.editorClassname} .tool-pane {
                position: absolute;
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
                align-items: flex-start;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: transparent;
            }
            .${this.editorClassname} .tool-pane-content {
                width: 100%;
                height: 100%;
            }
            .${this.editorClassname} .tool-pane span {
                font-size: 24px;
                cursor: pointer;
            }
            .${this.editorClassname} .button {
                background-color: ${this.colorAccent};
                color: white;
                border: none;
                padding: 5px 10px;
                margin: 5px;
                cursor: pointer;
                border-radius: 5px;
                text-align: center;
            }
            .${this.editorClassname} .square {
                padding: 5px;
            }
            .${this.editorClassname} .tabs {
                display: flex;
                justify-content: space-between;
                background: #ddd;
                cursor: pointer;
            }
            .${this.editorClassname} .tabs div {
                flex: 1;
                text-align: center;
                padding: 10px;
                font-weight: bold;
                cursor: pointer;
            }
            .${this.editorClassname} .tabs div.active {
                background: white;
                border-bottom: 3px solid ${this.colorAccent};
            }
            .${this.editorClassname} .emoji-layout {
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                padding-top: 1rem;
            }
            .${this.editorClassname} .emoji-content, .${this.editorClassname} .image-content {
                flex: 1;
                padding: 10px;
                overflow-y: auto;
                display: none;
            }
            .${this.editorClassname} .emoji-content {
                display: flex;
                flex-wrap: wrap;
                text-align: center;
                cursor: pointer;
            }
            .${this.editorClassname} .emoji-content span {
                font-size: 24px;
                display: block;
            }
            .${this.editorClassname} .image-content {
                width: 100%; height: 100%;
                display: flex;
                justify-content:center;
                align-items: center;
            }
            .${this.editorClassname} .image-content>div {
                display: flex;
                align-items: center;
                justify-content: center;
                flex-direction: column;
                border: 2px dashed ${this.colorAccent};
                text-align: center;
                color: ${this.colorAccent};
                font-size: 16px;
                cursor: pointer;
                width: 80%; height: 50%;
            }
            .${this.editorClassname} .image-content input {
                display: none;
            }
            .${this.editorClassname} .emoji-search {
                width: 90%;
                height: 30px;
                margin: 5px auto;
                padding: 5px;
                border: 1px solid #ccc;
                border-radius: 5px;
                font-size: 16px;
                outline: none;
            }
            .${this.editorClassname} .rotation-handle {
                position: absolute;
                top: -25px;
                left: 50%;
                transform: translateX(-50%);
                cursor: grab;
                font-size: 18px;
                background: white;
                border: 1px solid black;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .${this.editorClassname} .resize-handle {
                position: absolute;
                width: 15px;
                height: 15px;
                background: white;
                border: 1px solid black;
                cursor: nwse-resize;
            }
            .${this.editorClassname} .resize-handle.bottom-right { bottom: -7px; right: -7px; }
            .${this.editorClassname} .resize-handle.bottom-left { bottom: -7px; left: -7px; cursor: nesw-resize; }
            .${this.editorClassname} .resize-handle.top-left { top: -7px; left: -7px; cursor: nwse-resize; }
            .${this.editorClassname} .resize-handle.top-right { top: -7px; right: -7px; cursor: nesw-resize; }
            .${this.editorClassname} .box-controls {
                position: absolute;
                top: -12px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                gap: 5px;
            }
            .${this.editorClassname} .box-controls button {
                background: #fff;
                border: 1px solid #000;
                cursor: pointer;
            }
            .${this.editorClassname} .text-box {
                position: absolute;
                display: flex;
                justify-content: center;
                align-items: center;
                background: white;
                padding: 5px;
                resize: both;
                overflow: hidden;
                min-width: 5px;
                font-size: 20px;
                border: 1px solid black;
            }
            .${this.editorClassname} .text-toolbar {
                position: absolute;
                bottom: 10px;
                left: 50%;
                transform: translateX(-50%);
                background: white;
                padding: 5px;
                display: flex;
                gap: 10px;
                border-radius: 5px;
            }
            .${this.editorClassname} .font-picker {
                font-size: 16px;
                padding: 5px;
            }
            .${this.editorClassname} .align-button {
                font-size: 16px;
                padding: 5px;
                cursor: pointer;
            }
            .${this.editorClassname} .color-picker-container {
                position: absolute;
                right: 10px;
                top: 50%;
                transform: translateY(-50%);
                height: 50vh;
                width: 50px;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            .${this.editorClassname} .color-bar {
                height: 100%;
                width: 100%;
                background: linear-gradient(to bottom, red, orange, yellow, green, cyan, blue, violet);
                cursor: crosshair;
                position: relative;
            }
            .${this.editorClassname} .color-slider {
                position: absolute;
                left: 0;
                width: 100%;
                height: 5px;
                background: white;
                border: 1px solid black;
                cursor: grab;
            }
            .${this.editorClassname} .color-box {
                width: 100%;
                height: 20px;
                cursor: pointer;
                margin-top: 5px;
                margin-bottom: 5px;
                padding: 1px;
                background: linear-gradient(to right, red, orange, yellow, green, cyan, blue, violet);
            }
            .${this.editorClassname} .color-box>div {
                width: 100%;
                height: 100%;
            }
            .${this.editorClassname} .cards-view-container {
                position: relative;
                width: 100%;
                display: flex;
                align-items: center;
                overflow: hidden;
            }
            .${this.editorClassname} .cards-wrapper {
                display: flex;
                gap: 10px;
                overflow-x: auto;
                scroll-behavior: smooth;
                white-space: nowrap;
                padding: 0rem 1rem;
                width: 100%;
            }
            .${this.editorClassname} .card {
                flex: 0 0 auto;
                width: 150px;
                height: 200px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                display: flex;
                align-items: center;
                justify-content: center;
                text-align: center;
                cursor: pointer;
                user-select: none;
                transition: transform 0.2s;
            }
            .${this.editorClassname} .card:hover {
                transform: scale(1.05);
            }
            .${this.editorClassname} .arrow {
                position: absolute;
                background: rgba(0, 0, 0, 0.6);
                color: white;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                font-size: 24px;
                z-index: 2;
            }
            .${this.editorClassname} .left-arrow {
                left: 10px;
            }
            .${this.editorClassname} .right-arrow {
                right: 10px;
            }
            .${this.editorClassname} ::-webkit-scrollbar {
                width: 8px;
            }
            .${this.editorClassname} ::-webkit-scrollbar-thumb {
                background: ${this.colorAccent};
                border-radius: 8px;
            }
            .${this.editorClassname} ::-webkit-scrollbar-track {
                box-shadow: inset 0 0 5px ${this.colorAccentWeak};
                border-radius: 10px;
            }
            .${this.editorClassname} ::-webkit-scrollbar-thumb:hover {
                background-color: ${this.colorAccentStrong}; /* Darker red on hover */
            }
            .${this.editorClassname} .range-container {
                position: relative;
                width: 300px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .${this.editorClassname} .range-track {
                position: absolute;
                width: 100%;
                height: 6px;
                background: #ddd;
                border-radius: 3px;
                cursor: pointer;
            }
            .${this.editorClassname} .range-handle {
                position: absolute;
                width: 20px;
                height: 20px;
                background: #007bff;
                border-radius: 50%;
                cursor: grab;
                transform: translate(-50%, -50%);
                top: 50%;
            }
            .${this.editorClassname} .range-handle:active {
                cursor: grabbing;
            }
            .${this.editorClassname} .range-value {
                position: absolute;
                top: 0px;
                font-size: 14px;
                font-weight: bold;
                color: #333;
            }
            .${this.editorClassname} .top-menu-item {
                margin: 0 0.5rem 0 0.5rem;
                border: 1px solid;
                border-color: #dfdfdf;
                border-radius: 3px;
                padding: 3px;
            }
            .${this.editorClassname} .top-menu-item>div {
                border: 1px solid #dfdfdf;
            }

        `;
        // Append the <style> element to the <head>
        this.parent.appendChild(style);
    }
    
    intervalRunner(onRun, onStopCondition, interval) {
        if(!onStopCondition()) {
            onRun()
            setTimeout(() => {
                this.intervalRunner(onRun, onStopCondition, interval)
            }, interval);
        }
    }

    getPercentageValue(baseValue, percentage) {
        return (baseValue * percentage);
    }
    
    setCursorToEnd(element) {
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(element);
        range.collapse(false); // Moves cursor to the end
        selection.removeAllRanges();
        selection.addRange(range);
    }

    addToolButtons() {
        const tools = ["🖼️", "🔤", "✏️", "🧽"];
        const toolsView = document.createElement("div")
        tools.forEach((icon, index) => {
            const button = document.createElement("button");
            button.innerHTML = icon;
            button.className = "tool-btn";
            button.onclick = () => {
                this.selectTool(index)
                this.toolbar.style.display = "none"
            };
            toolsView.appendChild(button);
        });
        this.toolbar.appendChild(toolsView);

        const toolsExits = document.createElement("div")
        const saveButton = document.createElement("button")
        saveButton.className = "button"
        saveButton.innerHTML = "Save"
        saveButton.onclick = () => {
            this.save()
        }
        toolsExits.appendChild(saveButton);

        const close = this.createCloseButton()
        close.onclick = () => {
            this.close()
        }
        toolsExits.appendChild(close);

        this.toolbar.appendChild(toolsExits);

    }

    selectTool(index) {
        this.activeTool = index;
        if (index === 0) this.showEmojiImageSelector();
        if (index === 1) this.showTextTool();
        if (index === 2) this.activatePenTool();
        if (index === 3) this.activateEraser();
    }

    createCloseButton() {
        const close = document.createElement("div");
        close.innerHTML = "&times;"
        close.style.fontSize = "2rem"
        close.style.width = "30px"
        close.style.height = "30px"
        close.className = "button square"
        close.style.background = "red"
        return close;
    }
    createToolPane(child) {
        const selector = document.createElement("div");
        selector.className = "tool-pane";

        const close = this.createCloseButton()
        close.style.position = "absolute"
        close.style.bottom = "0"
        close.style.right = "0"
        close.style.margin = "0.5rem"
        close.style.alignSelf = "flex-end"
        close.style.marginBottom = "0.5rem"
        close.onclick = () => this.removeExistingUI()

        selector.appendChild(child)
        selector.appendChild(close)

        this.parent.appendChild(selector);
        return selector
    }

    showEmojiImageSelector() {
        this.removeExistingUI();

        const selector = document.createElement("div");
        selector.className = "tool-pane-content";
        selector.style.background = "white"

        // Tabs
        const tabs = document.createElement("div");
        tabs.className = "tabs";
        const emojiTab = document.createElement("div");
        emojiTab.innerText = "Emoji";
        emojiTab.classList.add("active");
        const imageTab = document.createElement("div");
        imageTab.innerText = "Image";

        // Emoji Search Bar
        const searchInput = document.createElement("input");
        searchInput.className = "emoji-search";
        searchInput.placeholder = "Search emoji...";

        // Emoji Grid
        const emojiBox = document.createElement("div");
        emojiBox.className = "emoji-layout";
        const emojiContent = document.createElement("div");
        emojiContent.className = "emoji-content";

        // Emoji Dictionary
        const emojiMap = {
            "grinning": "😀", "cool": "😎", "joy": "😂", "angel": "😇", "wink": "😉",
            "fire": "🔥", "heart": "💖", "party": "🥳", "thinking": "🤔", "clap": "👏",
            "star": "⭐", "thumbs up": "👍", "cry": "😭", "angry": "😡", "100": "💯"
        };

        const that = this
        function renderEmojis(filter = "") {
            emojiContent.innerHTML = "";
            Object.keys(emojiMap)
                .filter(name => name.includes(filter.toLowerCase()))
                .forEach((name) => {
                    const span = document.createElement("span");
                    span.innerHTML = emojiMap[name];
                    span.onclick = () => {
                        that.addSelectionBox(emojiMap[name], "emoji", {width: "150px", height: "150px"}, true, true);
                        selector.remove();
                    };
                    emojiContent.appendChild(span);
                });
        }

        renderEmojis(); // Initial emoji load
        searchInput.addEventListener("input", () => renderEmojis(searchInput.value));

        // Image Upload Area
        const imageContent = document.createElement("div");
        imageContent.className = "image-content";
        imageContent.style.display = "none"
        const uploadArea = document.createElement("div");
        uploadArea.innerHTML = "Click or Drag Image Here";

        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "image/*";
        fileInput.onchange = (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.src = e.target.result;
                    img.onload = () => {
                        this.addSelectionBox(img, "image", {width: "150px", height: "150px"}, false, true);
                        selector.remove();
                    };
                };
                reader.readAsDataURL(file);
            }
        };
        
        uploadArea.appendChild(fileInput);

        // Drag & Drop Support
        uploadArea.addEventListener("click", () => fileInput.click());
        uploadArea.addEventListener("dragover", (event) => {
            event.preventDefault();
            uploadArea.style.background = "#cce5ff";
        });
        uploadArea.addEventListener("dragleave", () => {
            uploadArea.style.background = "white";
        });
        uploadArea.addEventListener("drop", (event) => {
            event.preventDefault();
            uploadArea.style.background = "white";
            const file = event.dataTransfer.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.src = e.target.result;
                    img.onload = () => {
                        this.addSelectionBox(img, "image", {width: "150px", height: "150px"}, false);
                        selector.remove();
                    };
                };
                reader.readAsDataURL(file);
            }
        });

        
        imageContent.appendChild(uploadArea)

        // Tab Switching
        emojiTab.onclick = () => {
            emojiTab.classList.add("active");
            imageTab.classList.remove("active");
            emojiBox.style.display = "flex";
            imageContent.style.display = "none";
            searchInput.style.display = "block"
        };
        imageTab.onclick = () => {
            imageTab.classList.add("active");
            emojiTab.classList.remove("active");
            emojiBox.style.display = "none";
            imageContent.style.display = "flex";
            searchInput.style.display = "none"
        };
        
        tabs.appendChild(emojiTab);
        tabs.appendChild(imageTab);

        selector.appendChild(tabs);
        emojiBox.appendChild(searchInput)
        emojiBox.appendChild(emojiContent)
        selector.appendChild(emojiBox);
        selector.appendChild(imageContent);

        this.createToolPane(selector)
    }

    showTextTool() {
        this.removeExistingUI();
    
        const selector = document.createElement("div");
        selector.className = "tool-pane-content";
    
        // Text Editor Box
        const textBox = document.createElement("div");
        textBox.className = "text-box";
        textBox.contentEditable = true;
        textBox.style.position = "absolute";
        textBox.style.minWidth = "5px";
        textBox.style.maxWidth = "100%"; // Prevents overflow
        textBox.style.fontFamily = "Arial";
        textBox.style.color = this.selectedColor;
        textBox.style.textAlign = "center";
        textBox.style.padding = "5px";
        textBox.style.outline = "none";
        textBox.style.top = "50%";
        //textBox.style.userSelect = "none";
        textBox.style.border = "none";
        textBox.style.whiteSpace = "pre-wrap";
        textBox.style.wordBreak = "break-all";
        textBox.style.break
        textBox.style.backgroundColor = "transparent";
        textBox.style.cursor = "text";
        
        const boxStyles = {
            width: "140px", 
            height: "140px"
        }
        
        this.addSelectionBox(textBox, "text", boxStyles, true, true);
    
        // Ensure the cursor stays visible while typing
        textBox.addEventListener("keydown", () => {
            setTimeout(() => {
                textBox.focus();
            }, 0);
        });
    
        const colorPicker = this.getColorPicker((selectedColor) => {
            //textBox.style.color = selectedColor;
        });
    
        selector.appendChild(colorPicker);
    
        // Font selection cards
        const cardsView = this.getCardsView(
            this.fontStyles,
            { width: "70px", height: "70px" },
            (font) => {
                const fontView = document.createElement("div");
                fontView.style.fontFamily = font.name;
                fontView.innerHTML = "Aa";
                return fontView;
            },
            (font) => {
                textBox.style.fontFamily = font.name;
            }
        );
        // Font selection cards container
        const cardsViewContainer = document.createElement("div");
        cardsViewContainer.style.position = "absolute";
        cardsViewContainer.style.bottom = "80px";
        cardsViewContainer.style.left = "70px";
        cardsViewContainer.style.right = "70px";
        cardsViewContainer.style.border = "1px solid #dfdfdf";
        cardsViewContainer.style.borderRadius = "5px";
        cardsViewContainer.appendChild(cardsView);
        selector.appendChild(cardsViewContainer);

        // Font size slider
        const ranger = this.getRanger((value) => {
            const calcValue = `${value}px`
            console.log("Slider Value:", value, calcValue);
            textBox.style.fontSize = calcValue
            return calcValue
        }, 8, 200, 16);
        // Font size slider container
        const rangerContainer = document.createElement("div");
        rangerContainer.style.position = "absolute";
        rangerContainer.style.bottom = "155px";
        rangerContainer.style.left = "70px";
        rangerContainer.style.right = "70px";
        rangerContainer.style.display = "flex";
        rangerContainer.style.justifyContent = "center";
        rangerContainer.appendChild(ranger);
        selector.appendChild(rangerContainer);

        //Top Menu Container
        const topMenu = document.createElement("div");
        topMenu.style.position = "absolute";
        topMenu.style.top = "0";
        topMenu.style.left = "0";
        topMenu.style.right = "0";
        topMenu.style.padding = "0.5rem";
        topMenu.style.display = "flex"
        topMenu.style.justifyContent = "center"

        // Text aligment toggle
        const textAlignViews = [
            { alignment: "left", name: "Left Aligned" },
            { alignment: "center", name: "Center Aligned" },
            { alignment: "right", name: "Right Aligned" }
        ]
        const textAlignViewsToggle = this.getViewToggle(textAlignViews, (view) => {
            const toggleView = this.getAlignmentIcon(view.alignment);
            toggleView.title = view.name;
            toggleView.ariaLabel = view.name;
            textBox.style.textAlign = view.alignment;
            return toggleView;
        })
        // Text aligment toggle
        const textAlignViewsToggleContainer = document.createElement("div");
        textAlignViewsToggleContainer.classList.add("top-menu-item")
        textAlignViewsToggleContainer.appendChild(textAlignViewsToggle);
        topMenu.appendChild(textAlignViewsToggleContainer);

        // Font weight toggle
        const fontWeightViews = [
            { style: "normal", tag: "B", name: "Text Not Boldend" },
            { style: "bold", tag: "B", name: "Text Boldend" }
        ]
        const fontWeightViewsToggle = this.getViewToggle(fontWeightViews, (view) => {
            const fontWeightView = document.createElement("div");
            fontWeightView.title = view.name;
            fontWeightView.ariaLabel = view.name;
            fontWeightView.innerHTML = view.tag;
            fontWeightView.style.fontWeight = view.style;
            fontWeightView.style.display = "flex";
            fontWeightView.style.justifyContent = "center";
            fontWeightView.style.alignItems = "center";
            textBox.style.fontWeight = view.style;
            return fontWeightView;
        })
        // Font weight toggle container
        const fontWeightViewsToggleContainer = document.createElement("div");
        fontWeightViewsToggleContainer.classList.add("top-menu-item")
        fontWeightViewsToggleContainer.appendChild(fontWeightViewsToggle);
        fontWeightViewsToggleContainer.style.display = "flex"
        fontWeightViewsToggleContainer.style.justifyContent = "center"
        topMenu.appendChild(fontWeightViewsToggleContainer);

        // Font style toggle
        const fontStyleViews = [
            { style: "normal", tag: "i", name: "Text Not Italized" },
            { style: "italic", tag: "i", name: "Text Italized" }
        ]
        const fontStyleViewsToggle = this.getViewToggle(fontStyleViews, (view) => {
            const fontStyleView = document.createElement("div");
            fontStyleView.title = view.name;
            fontStyleView.ariaLabel = view.name;
            fontStyleView.innerHTML = view.tag;
            fontStyleView.style.fontStyle = view.style;
            fontStyleView.style.display = "flex";
            fontStyleView.style.justifyContent = "center";
            fontStyleView.style.alignItems = "center";
            textBox.style.fontStyle = view.style;
            return fontStyleView;
        })
        // Font style toggle container
        const fontStyleViewsToggleContainer = document.createElement("div");
        fontStyleViewsToggleContainer.classList.add("top-menu-item")
        fontStyleViewsToggleContainer.appendChild(fontStyleViewsToggle);
        fontStyleViewsToggleContainer.style.display = "flex"
        fontStyleViewsToggleContainer.style.justifyContent = "center"
        topMenu.appendChild(fontStyleViewsToggleContainer);

        // Font case toggle
        const fontCaseViews = [
            { style: "none", tag: "AaA", name: "Text Not Transformed" },
            { style: "uppercase", tag: "AAA", name: "Uppercase Transformed" },
            { style: "lowercase", tag: "aaa", name: "Lowercase Transformed" },
            { style: "capitalize", tag: "Aaa", name: "Text Capitalized" },
        ]
        const fontCaseViewsToggle = this.getViewToggle(fontCaseViews, (view) => {
            const fontCaseView = document.createElement("div");
            fontCaseView.title = view.name;
            fontCaseView.ariaLabel = view.name;
            fontCaseView.innerHTML = view.tag;
            fontCaseView.style.display = "flex";
            fontCaseView.style.justifyContent = "center";
            fontCaseView.style.alignItems = "center";
            textBox.style.textTransform = view.style;
            return fontCaseView;
        }, {width: "auto"})
        // Font case toggle container
        const fontCaseViewsToggleContainer = document.createElement("div");
        fontCaseViewsToggleContainer.classList.add("top-menu-item")
        fontCaseViewsToggleContainer.appendChild(fontCaseViewsToggle);
        fontCaseViewsToggleContainer.style.display = "flex"
        fontCaseViewsToggleContainer.style.justifyContent = "center"
        topMenu.appendChild(fontCaseViewsToggleContainer);

        // Text line toggle
        const textLineViews = [
            { style: "none", tag: "U", name: "Text without line" },
            { style: "underline", tag: "U", name: "Text underlined" },
            { style: "line-through", tag: "U", name: "Text center-lined" },
            { style: "overline", tag: "U", name: "Text overlined" }
        ]
        const textLineViewsToggle = this.getViewToggle(textLineViews, (view) => {
            const textLineView = document.createElement("div");
            textLineView.title = view.name;
            textLineView.ariaLabel = view.name;
            textLineView.innerHTML = view.tag;
            textLineView.style.textDecoration = view.style;
            textLineView.style.display = "flex";
            textLineView.style.justifyContent = "center";
            textLineView.style.alignItems = "center";
            textBox.style.textDecoration = view.style;
            return textLineView;
        })
        // Text line toggle container
        const textLineViewsToggleContainer = document.createElement("div");
        textLineViewsToggleContainer.classList.add("top-menu-item")
        textLineViewsToggleContainer.appendChild(textLineViewsToggle);
        textLineViewsToggleContainer.style.display = "flex"
        textLineViewsToggleContainer.style.justifyContent = "center"
        topMenu.appendChild(textLineViewsToggleContainer);

        // Text button toggle
        const textButtonViews = [
            { style: "none", tag: "A", name: "Text without background" },
            { style: "bg", tag: "A", name: "Text with background" }
        ]
        const that = this
        const textButtonViewsToggle = this.getViewToggle(textButtonViews, (view, textButtonViewsToggle) => {
            const textButtonView = document.createElement("div");
            textButtonView.innerHTML = view.tag;
            textButtonView.style.display = "flex";
            textButtonView.style.justifyContent = "center";
            textButtonView.style.alignItems = "center";
            textButtonView.title = view.name;
            textButtonView.ariaLabel = view.name;
            if(view.style == "bg") {
                textButtonViewsToggle.style.background = that.selectedColor;
                textButtonViewsToggle.style.color = that.getContrastColor(that.selectedColor);
                
                textBox.style.background = that.selectedColor;
                textBox.style.color = that.getContrastColor(that.selectedColor);

                
                this.addToDependency("selectedColor", (selectedColor) => {
                    textButtonViewsToggle.style.background = selectedColor;
                    textButtonViewsToggle.style.color = that.getContrastColor(selectedColor);
                    
                    textBox.style.background = selectedColor;
                    textBox.style.color = that.getContrastColor(selectedColor);
                })

            } else {
                textButtonViewsToggle.style.background = that.selectedColor;
                textButtonViewsToggle.style.color = that.selectedColor;
                
                textBox.style.background = "none";
                textBox.style.color = that.selectedColor;

                this.addToDependency("selectedColor", (selectedColor) => {
                    textButtonViewsToggle.style.background = selectedColor;
                    textButtonViewsToggle.style.color = selectedColor;
                    
                    textBox.style.background = "none";
                    textBox.style.color = selectedColor;
                })
            }
            return textButtonView;
        })
        // Text button toggle container
        const textButtonViewsToggleContainer = document.createElement("div");
        textButtonViewsToggleContainer.classList.add("top-menu-item")
        textButtonViewsToggleContainer.appendChild(textButtonViewsToggle);
        textButtonViewsToggleContainer.style.display = "flex"
        textButtonViewsToggleContainer.style.justifyContent = "center"
        topMenu.appendChild(textButtonViewsToggleContainer);


        selector.appendChild(topMenu);
        this.createToolPane(selector);
    
        // Auto-focus text box
        textBox.focus();
        this.setCursorToEnd(textBox);
        
        this.intervalRunner(() => {
            // Only refocus if the user hasn't selected text manually
            if (window.getSelection().isCollapsed) {
                textBox.focus();
                this.setCursorToEnd(textBox);
                console.log("textBox.focus()")
            }
        }, () => !document.contains(textBox), 200)
    }

    activatePenTool() {
        this.removeExistingUI();
    
        const selector = document.createElement("div");
        selector.className = "tool-pane-content";
    
        // Draw Pane
        const drawPane = document.createElement("canvas");
        drawPane.className = "draw-pane";
        drawPane.width = this.parent.clientWidth; // Match parent width
        drawPane.height = this.parent.clientHeight; // Match parent height
        selector.appendChild(drawPane);
    
        const ctx = this.canvas.getContext("2d");
        ctx.lineCap = "round"; // Smooth edges
        ctx.lineJoin = "round";
    
        let isDrawing = false;
        let strokeColor = "#000"; // Default color
        let strokeWidth = 2; // Default thickness
    
        // Drawing events
        drawPane.addEventListener("mousedown", (e) => {
            isDrawing = true;
            ctx.beginPath();
            ctx.moveTo(e.offsetX, e.offsetY);
        });
    
        drawPane.addEventListener("mousemove", (e) => {
            if (!isDrawing) return;
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = strokeWidth;
            ctx.lineTo(e.offsetX, e.offsetY);
            ctx.stroke();
        });
    
        drawPane.addEventListener("mouseup", () => {
            isDrawing = false;
            ctx.closePath();
        });
    
        drawPane.addEventListener("mouseleave", () => {
            isDrawing = false;
            ctx.closePath();
        });
    
        // Color Picker
        const colorPicker = this.getColorPicker((selectedColor) => {
            strokeColor = selectedColor;
            console.log("Selected Color:", selectedColor);
        });
    
        selector.appendChild(colorPicker);
    
        // Thickness Slider
        const ranger = this.getRanger(
            (value) => {
                strokeWidth = value; // Update thickness
                return `${value}px`;
            },
            1, // Min size
            300, // Max size
            2 // Default size
        );
    
        // Slider Container
        const rangerContainer = document.createElement("div");
        rangerContainer.style.position = "absolute";
        rangerContainer.style.bottom = "50px";
        rangerContainer.style.left = "70px";
        rangerContainer.style.right = "70px";
        rangerContainer.style.display = "flex";
        rangerContainer.style.justifyContent = "center";
        rangerContainer.appendChild(ranger);
        selector.appendChild(rangerContainer);
    
        this.createToolPane(selector);
    }    

    activateEraser() {
        this.removeExistingUI();
    
        const selector = document.createElement("div");
        selector.className = "tool-pane-content";
    
        // Eraser Pane
        const drawPane = document.createElement("canvas");
        drawPane.className = "draw-pane";
        drawPane.width = this.parent.clientWidth; // Match parent width
        drawPane.height = this.parent.clientHeight; // Match parent height
        selector.appendChild(drawPane);
    
        const ctx = this.canvas.getContext("2d");
        ctx.lineCap = "round"; // Smooth edges
        ctx.lineJoin = "round";
    
        let isErasing = false;
        let eraserSize = 10; // Default size
    
        // Erasing events
        drawPane.addEventListener("mousedown", (e) => {
            isErasing = true;
            eraseAt(e.offsetX, e.offsetY);
        });
    
        drawPane.addEventListener("mousemove", (e) => {
            if (!isErasing) return;
            eraseAt(e.offsetX, e.offsetY);
        });
    
        drawPane.addEventListener("mouseup", () => {
            isErasing = false;
        });
    
        drawPane.addEventListener("mouseleave", () => {
            isErasing = false;
        });
    
        // Erase function
        const eraseAt = (x, y) => {
            ctx.clearRect(x - eraserSize / 2, y - eraserSize / 2, eraserSize, eraserSize);
        };
    
        // Thickness Slider
        const ranger = this.getRanger(
            (value) => {
                eraserSize = value; // Update eraser size
                return `${value}px`;
            },
            5,  // Min size
            50, // Max size
            10  // Default size
        );
    
        // Slider Container
        const rangerContainer = document.createElement("div");
        rangerContainer.style.position = "absolute";
        rangerContainer.style.bottom = "50px";
        rangerContainer.style.left = "70px";
        rangerContainer.style.right = "70px";
        rangerContainer.style.display = "flex";
        rangerContainer.style.justifyContent = "center";
        rangerContainer.appendChild(ranger);
        selector.appendChild(rangerContainer);
    
        this.createToolPane(selector);
    }


    addSelectionBox(content, type, boxStyles, isSquaredResize, canResize) {
        this.removeExistingUI();

        var box = document.createElement("div");
        box.className = "selection-box";
        box.style.width = "100px";
        box.style.height = "100px";
        box.style.top = `${this.canvas.height / 2}px`;
        box.style.left = `${this.canvas.width / 2}px`;
        box.setAttribute("data-rotation", "0");
        box.style.zIndex = 1

        if (type === "emoji") {
            box.innerHTML = content;
            box.style.fontSize = boxStyles?.width || box.style.width;

        } else if (type === "text") {
            box.appendChild(content);

        } else {
            const img = content;
            img.style.width = "100%";
            img.style.height = "100%";
            box.appendChild(img);
        }

        if(boxStyles) {
            for(const [key, value] of Object.entries(boxStyles)) {
                box.style[key] = value
            }
        }

        box.style.top = `${(this.canvas.height / 2) - this.removeUnit(box.style.width) / 2}px`;
        box.style.left = `${(this.canvas.width / 2) - this.removeUnit(box.style.height) / 2}px`;

        // Rotation Handle
        const rotateHandle = document.createElement("div");
        rotateHandle.className = "rotation-handle";
        rotateHandle.innerHTML = "🔄";
        rotateHandle.onmousedown = (e) => this.startRotation(e, box);

        const { rotationContainer, onTargetAttrUpdated } = this.createCircularRotationSlider();

        if(canResize) {
            // Resize Handles
            ["bottom-right", "bottom-left", "top-left", "top-right"].forEach(pos => {
                const resizeHandle = document.createElement("div");
                resizeHandle.className = `resize-handle ${pos}`;
                resizeHandle.onmousedown = (e) => {
                    this.startResizing(e, box, pos, isSquaredResize, (x, y, width, height) => {
                        console.log("this.startResizing: ", x, y, width, height)
                        onTargetAttrUpdated()
                    })
                };
                box.appendChild(resizeHandle);
            });
        }

        // Controls
        const controls = document.createElement("div");
        controls.className = "box-controls";

        const deleteBtn = document.createElement("button");
        deleteBtn.innerHTML = "❌";
        deleteBtn.onclick = () => {
            box.remove();
            this.removeExistingUI();
        }
        controls.appendChild(deleteBtn);

        const commitBtn = document.createElement("button");
        commitBtn.innerHTML = "✔️";
        commitBtn.onclick = () => this.commitToCanvas(box, content, type);
        controls.appendChild(commitBtn);

        //box.appendChild(rotateHandle);
        box.appendChild(controls);

        onTargetAttrUpdated(box)

        
        this.prependElement(box, rotationContainer)
        this.parent.appendChild(box);

        this.makeDraggable(box, onTargetAttrUpdated);
        return box;
        //this.parent.appendChild(box);
    }

    removeUnit(size) {
        console.log("size:", size)
        if(typeof size == "number") return size
        return Number(size.replace("px", "").replace(/[ ]+/g, "").replace("!important", ""))
    }

    createCircularRotationSlider() {
        let targetElement;
        const rotationContainer = document.createElement("div");
        rotationContainer.className = "rotation-slider";
        rotationContainer.style.position = "absolute";
        rotationContainer.style.border = `4px solid ${this.colorAccent}`;
        rotationContainer.style.borderRadius = "50%";
        rotationContainer.style.display = "flex";
        rotationContainer.style.alignItems = "center";
        rotationContainer.style.justifyContent = "center";
    
        // Rotation Handle
        const rotateHandle = document.createElement("div");
        rotateHandle.className = "rotation-handle";
        rotateHandle.innerHTML = "🔄";
        rotateHandle.style.position = "absolute";
        rotateHandle.style.width = "20px";
        rotateHandle.style.height = "20px";
        rotateHandle.style.background = "white";
        rotateHandle.style.border = "1px solid black";
        rotateHandle.style.borderRadius = "50%";
        rotateHandle.style.cursor = "grab";
        
        rotationContainer.appendChild(rotateHandle);
    
        // ✅ Function to update handle position along the circumference
        const updateHandlePos = (angle) => {
            const radius = rotationContainer.offsetWidth / 2;
    
            // Get center coordinates of the rotation container
            const centerX = targetElement.offsetLeft + targetElement.offsetWidth / 2;
            const centerY = targetElement.offsetTop + targetElement.offsetHeight / 2;
    
            // Convert angle from degrees to radians
            const angleRad = angle * (Math.PI / 180);
    
            // Calculate handle position on the circumference
            const handleX = centerX + radius * Math.cos(angleRad);
            const handleY = centerY + radius * Math.sin(angleRad);
    
            // Apply new position relative to the rotation container
            //rotateHandle.style.left = `${handleX - rotationContainer.offsetLeft - rotateHandle.offsetWidth / 2}px`;
            //rotateHandle.style.top = `${handleY - rotationContainer.offsetTop - rotateHandle.offsetHeight / 2}px`;
        };
    
        // ✅ Function to update rotationContainer size and position
        const onTargetAttrUpdated = (el) => {
            if (el) targetElement = el;
            if (!targetElement) return;
            
            const w = this.removeUnit(targetElement.style.width);
            const h = this.removeUnit(targetElement.style.height);
            const oW = this.removeUnit(targetElement.offsetWidth) || w;
            const oH = this.removeUnit(targetElement.offsetHeight) || h;
            const size = Math.max(w, h);
            const padding = 100;

            rotationContainer.style.width = `${oW + padding}px`;
            rotationContainer.style.height = `${oH + padding}px`;
    
            // Center the rotation container around the target element
            //rotationContainer.style.left = `${targetElement.offsetLeft - padding / 2}px`;
            //rotationContainer.style.top = `${targetElement.offsetTop - padding / 2}px`;
    
            // Update the handle's position based on the current rotation
            updateHandlePos(parseFloat(targetElement.getAttribute("data-rotation")) || 0);
        };
    
        let isRotating = false;
        let startAngle = 0;
        let initialRotation = 0;
    
        // ✅ Drag rotation logic
        rotateHandle.addEventListener("mousedown", (e) => {
            e.preventDefault();
            isRotating = true;
    
            // Get center of rotation
            const centerX = targetElement.offsetLeft + targetElement.offsetWidth / 2;
            const centerY = targetElement.offsetTop + targetElement.offsetHeight / 2;
    
            // Get current rotation of the target
            initialRotation = parseFloat(targetElement.getAttribute("data-rotation")) || 0;
    
            // Get starting angle using closest point on the circumference
            const mouseX = e.clientX - centerX;
            const mouseY = e.clientY - centerY;
            startAngle = Math.atan2(mouseY, mouseX) * (180 / Math.PI);
    
            function rotate(event) {
                if (!isRotating || !targetElement) return;
    
                // Get new mouse position relative to the center
                const deltaX = event.clientX - centerX;
                const deltaY = event.clientY - centerY;
                const currentAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    
                // Calculate new rotation based on the change in angle
                let newRotation = initialRotation + (currentAngle - startAngle);
    
                targetElement.style.transform = `rotate(${newRotation}deg)`;
                targetElement.setAttribute("data-rotation", newRotation);
    
                // Update handle position smoothly
                updateHandlePos(newRotation);
            }
    
            function stopRotate() {
                isRotating = false;
                document.removeEventListener("mousemove", rotate);
                document.removeEventListener("mouseup", stopRotate);
            }
    
            document.addEventListener("mousemove", rotate);
            document.addEventListener("mouseup", stopRotate);
        });
    
        return { rotationContainer, onTargetAttrUpdated };
    }
    

    startResizing(event, box, corner, isSquaredResize, onResize) {
        event.preventDefault();
        let startX = event.clientX;
        let startY = event.clientY;
        let startWidth = box.offsetWidth;
        let startHeight = box.offsetHeight;
        let startLeft = box.offsetLeft;
        let startTop = box.offsetTop;

        const onMouseMove = (e) => {
            let dx = e.clientX - startX;
            let dy = e.clientY - startY;

            if (corner.includes("bottom")) {
                box.style.height = `${startHeight + dy}px`;
            } else {
                box.style.top = `${startTop + dy}px`;
                box.style.height = `${startHeight - dy}px`;
            }

            if (corner.includes("right")) {
                box.style.width = `${startWidth + dx}px`;
            } else {
                box.style.left = `${startLeft + dx}px`;
                box.style.width = `${startWidth - dx}px`;
            }

            if (isSquaredResize) {
                let newSize = Math.max(parseInt(box.style.width), parseInt(box.style.height));
                box.style.width = `${newSize}px`;
                box.style.height = `${newSize}px`;
                box.style.fontSize = `${newSize}px`;
            }

            if(onResize) onResize(box.style.left, box.style.top, box.style.width, box.style.height)
        };

        const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    }

    makeDraggable(box) {
        let offsetX, offsetY, isDragging = false;

        box.onmousedown = (e) => {
            if (e.target.classList.contains("rotation-handle") || e.target.classList.contains("resize-handle")) return;
            isDragging = true;
            offsetX = e.clientX - box.offsetLeft;
            offsetY = e.clientY - box.offsetTop;
        };

        document.onmousemove = (e) => {
            if (!isDragging) return;
            box.style.left = `${e.clientX - offsetX}px`;
            box.style.top = `${e.clientY - offsetY}px`;
        };

        document.onmouseup = () => {
            isDragging = false;
        };
    }

    startRotation(event, box) {
        event.preventDefault();
        let startX = event.clientX;
        let startY = event.clientY;
        let startAngle = parseFloat(box.getAttribute("data-rotation")) || 0;
        let centerX = box.offsetLeft + box.offsetWidth / 2;
        let centerY = box.offsetTop + box.offsetHeight / 2;

        const onMouseMove = (e) => {
            let dx = e.clientX - centerX;
            let dy = e.clientY - centerY;
            let angle = Math.atan2(dy, dx) * (180 / Math.PI);
            box.style.transform = `rotate(${angle}deg)`;
            box.setAttribute("data-rotation", angle);
        };

        const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    }

    commitToCanvas(box, content, type) {
        const rect = box.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();
    
        const x = rect.left - canvasRect.left;
        const y = rect.top - canvasRect.top;
        const width = rect.width;
        const height = rect.height;
        const rotation = parseFloat(box.getAttribute("data-rotation")) || 0;
    
        this.ctx.save();
        this.ctx.translate(x + width / 2, y + height / 2);
        this.ctx.rotate((rotation * Math.PI) / 180);
        this.ctx.translate(-width / 2, -height / 2);
    
        if (type === "text") {
            // Get computed styles from the text box
            const computedStyles = window.getComputedStyle(content);
            const fontSize = computedStyles.fontSize;
            const fontFamily = computedStyles.fontFamily;
            const fontWeight = computedStyles.fontWeight;
            const fontStyle = computedStyles.fontStyle;
            const textAlign = computedStyles.textAlign;
            const textColor = computedStyles.color;
            const backgroundColor = computedStyles.backgroundColor;
            const textDecoration = computedStyles.textDecoration;
            const textTransform = computedStyles.textTransform;
            const padding = 8; // Padding around text

            // Apply text transformations
            let textContent = content.innerText || content.textContent;
            if (textTransform === "uppercase") textContent = textContent.toUpperCase();
            if (textTransform === "lowercase") textContent = textContent.toLowerCase();
            if (textTransform === "capitalize") {
                textContent = textContent
                    .split(" ")
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ");
            }

            // Break text by lines
            const lines = textContent.split("\n"); // Handle manual line breaks
            const lineHeight = parseInt(fontSize, 10) * 1.3; // Adjust line height

            // Word wrap logic
            const wrappedLines = [];
            for (let line of lines) {
                let words = line.split(" ");
                let currentLine = "";
                for (let word of words) {
                    let testLine = currentLine + (currentLine ? " " : "") + word;
                    let testWidth = this.ctx.measureText(testLine).width;
                    if (testWidth > width - 2 * padding && currentLine !== "") {
                        wrappedLines.push(currentLine);
                        currentLine = word;
                    } else {
                        currentLine = testLine;
                    }
                }
                wrappedLines.push(currentLine);
            }

            // Calculate total text height
            const totalTextHeight = wrappedLines.length * lineHeight + 2 * padding;

            // Draw background if applicable
            if (backgroundColor !== "rgba(0, 0, 0, 0)" && backgroundColor !== "transparent") {
                this.ctx.fillStyle = backgroundColor;
                this.ctx.fillRect(0, 0, width, totalTextHeight);
            }

            // Set text styles
            this.ctx.font = `${fontStyle} ${fontWeight} ${fontSize} ${fontFamily}`;
            this.ctx.fillStyle = textColor;
            this.ctx.textAlign = textAlign;
            this.ctx.textBaseline = "top";

            // Draw text lines with alignment
            let yOffset = padding;
            for (let line of wrappedLines) {
                let textX = padding; // Default for left alignment
                if (textAlign === "center") {
                    textX = width / 2;
                } else if (textAlign === "right") {
                    textX = width - padding;
                }

                this.ctx.fillText(line, textX, yOffset);
                yOffset += lineHeight;
            }
        } else if (type === "emoji") {
            // Handle emoji rendering
            this.ctx.font = `${width}px Arial`;
            this.ctx.textAlign = "center";
            this.ctx.fillText(content, width / 2, height);
    
        } else {
            // Handle image rendering
            const img = new Image();
            img.src = content.src;
            img.onload = () => this.ctx.drawImage(img, 0, 0, width, height);
        }
    
        this.ctx.restore();
        box.remove(); // Remove selection box after committing
        this.removeExistingUI()
    }
    
    

    makeInteractive(box, isSquaredResize) {
        let isDragging = false, isResizing = false, corner = "";
        let offsetX, offsetY, initialWidth, initialHeight, initialLeft, initialTop;

        box.addEventListener("mousedown", (e) => {
            if (e.target.classList.contains("rotation-handle")) return;

            const rect = box.getBoundingClientRect();
            const xDist = e.clientX - rect.left;
            const yDist = e.clientY - rect.top;

            if (xDist < 10 && yDist < 10) corner = "top-left";
            else if (xDist > rect.width - 10 && yDist < 10) corner = "top-right";
            else if (xDist < 10 && yDist > rect.height - 10) corner = "bottom-left";
            else if (xDist > rect.width - 10 && yDist > rect.height - 10) corner = "bottom-right";

            if (corner) {
                isResizing = true;
                initialWidth = rect.width;
                initialHeight = rect.height;
                initialLeft = rect.left;
                initialTop = rect.top;
                offsetX = e.clientX;
                offsetY = e.clientY;
                return;
            }

            isDragging = true;
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
        });

        document.addEventListener("mousemove", (e) => {
            if (isDragging) {
                box.style.left = `${e.clientX - offsetX}px`;
                box.style.top = `${e.clientY - offsetY}px`;
            } else if (isResizing) {
                let newSize = Math.max(initialWidth + (e.clientX - offsetX), initialHeight + (e.clientY - offsetY));
                box.style.width = `${newSize}px`;
                box.style.height = `${newSize}px`;
            }
        });

        document.addEventListener("mouseup", () => {
            isDragging = false;
            isResizing = false;
            corner = "";
        });
    }

    removeExistingUI() {
        const existing = document.querySelector(".tool-pane");
        if (existing) existing.remove();
        this.toolbar.style.display = "flex";
    }

    drawImage(img) {
        const size = Math.min(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.drawImage(img, this.canvas.width / 4, this.canvas.height / 4, size, size);
    }

    getColorPicker(onColor) {
        const pickerContainer = document.createElement("div");
        pickerContainer.className = "color-picker-container";
    
        const whiteBoxBg = document.createElement("div");
        whiteBoxBg.className = "color-box";
        const whiteBox = document.createElement("div");
        whiteBox.style.background = "white";
        whiteBoxBg.appendChild(whiteBox)
    
        const colorBar = document.createElement("div");
        colorBar.className = "color-bar";
    
        const blackBoxBg = document.createElement("div");
        blackBoxBg.className = "color-box";
        const blackBox = document.createElement("div");
        blackBox.style.background = "black";
        blackBoxBg.appendChild(blackBox)
    
        const slider = document.createElement("div");
        slider.className = "color-slider";
        slider.style.top = "0px";
    
        function getColorAtPosition(y, rect) {
            let ctx = document.createElement("canvas").getContext("2d");
            ctx.canvas.width = 1;
            ctx.canvas.height = rect.height;
            let gradient = ctx.createLinearGradient(0, 0, 0, rect.height);
            gradient.addColorStop(0, "red");
            gradient.addColorStop(1 / 6, "orange");
            gradient.addColorStop(2 / 6, "yellow");
            gradient.addColorStop(3 / 6, "green");
            gradient.addColorStop(4 / 6, "cyan");
            gradient.addColorStop(5 / 6, "blue");
            gradient.addColorStop(1, "violet");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 1, rect.height);
            let colorData = ctx.getImageData(0, y, 1, 1).data;
            return `rgb(${colorData[0]}, ${colorData[1]}, ${colorData[2]})`;
        }
    
        let isDragging = false;
        document.addEventListener("mouseup", () => isDragging = false);
    
        document.addEventListener("mousemove", (e) => {
            if (!isDragging) return;
            let rect = colorBar.getBoundingClientRect();
            let y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
            slider.style.top = `${y}px`;
            
            this.setState("selectedColor", getColorAtPosition(y, rect))
            if (onColor) onColor(this.selectedColor);
        });
    
        colorBar.addEventListener("mousedown", (e) => {
            let rect = colorBar.getBoundingClientRect();
            let y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
            slider.style.top = `${y}px`;
            isDragging = true;

            this.setState("selectedColor", getColorAtPosition(y, rect))
            if (onColor) onColor(this.selectedColor);
        });
    
        whiteBox.addEventListener("click", () => {
            this.setState("selectedColor", "rgb(255, 255, 255)")
            if (onColor) onColor(this.selectedColor);
        });
    
        blackBox.addEventListener("click", () => {
            this.setState("selectedColor", "rgb(0, 0, 0)")
            if (onColor) onColor(this.selectedColor);
        });
    
        colorBar.appendChild(slider);
        pickerContainer.appendChild(whiteBoxBg);
        pickerContainer.appendChild(colorBar);
        pickerContainer.appendChild(blackBoxBg);
    
        return pickerContainer;
    }

    getRanger(onRangeValue, min, max, defaultValue) {
        // Ensure defaultValue is within the min-max range
        defaultValue = Math.max(min, Math.min(max, defaultValue));
    
        // Create the main container
        const rangeContainer = document.createElement("div");
        rangeContainer.className = "range-container";
    
        // Create the slider track
        const track = document.createElement("div");
        track.className = "range-track";
    
        // Create the slider handle
        const handle = document.createElement("div");
        handle.className = "range-handle";
    
        // Create the value display
        const valueDisplay = document.createElement("div");
        valueDisplay.className = "range-value";
    
        let isDragging = false;
        let minValue = min;
        let maxValue = max;
        let currentValue = defaultValue;
    
        // Set initial position of the handle based on defaultValue
        let initialPercent = ((defaultValue - minValue) / (maxValue - minValue)) * 100;
        handle.style.left = `${initialPercent}%`;
        valueDisplay.innerText = onRangeValue(defaultValue);
    
        rangeContainer.appendChild(track);
        rangeContainer.appendChild(handle);
        rangeContainer.appendChild(valueDisplay);
    
        // Update value based on handle position
        const updateValue = (clientX) => {
            const rect = track.getBoundingClientRect();
            let percent = (clientX - rect.left) / rect.width;
            percent = Math.max(0, Math.min(1, percent)); // Clamp between 0 and 1
    
            currentValue = Math.round(percent * (maxValue - minValue) + minValue);
            handle.style.left = `${percent * 100}%`;
            valueDisplay.innerText = onRangeValue(currentValue);
        };
    
        // Drag Events
        handle.addEventListener("mousedown", (e) => {
            e.preventDefault();
            isDragging = true;
        });
    
        document.addEventListener("mousemove", (e) => {
            if (isDragging) updateValue(e.clientX);
        });
    
        document.addEventListener("mouseup", () => {
            isDragging = false;
        });
    
        // Click on track to move handle
        track.addEventListener("click", (e) => {
            updateValue(e.clientX);
        });
    
        // Return the slider
        return rangeContainer;
    }        
    
    getCardsView(dataArray, cardStyles, onCardView, onClick) {
        const container = document.createElement("div");
        container.className = "cards-view-container";
    
        const leftArrow = document.createElement("div");
        leftArrow.className = "arrow left-arrow";
        leftArrow.innerHTML = "&lt;"; // Left arrow
        leftArrow.style.display = "none";
    
        const rightArrow = document.createElement("div");
        rightArrow.className = "arrow right-arrow";
        rightArrow.innerHTML = "&gt;"; // Right arrow
    
        const cardsWrapper = document.createElement("div");
        cardsWrapper.className = "cards-wrapper";
    
        dataArray.forEach((item, index) => {
            const card = document.createElement("div");
            card.className = "card";
            
            if(cardStyles) {
                for(const [key, value] of Object.entries(cardStyles)) {
                    card.style[key] = value
                }
            }
            
            card.appendChild(onCardView(item)); // Custom card content
    
            card.onclick = () => {
                if (onClick) onClick(item, index);
            };
    
            cardsWrapper.appendChild(card);
        });
    
        // Scroll left function
        leftArrow.onclick = () => {
            cardsWrapper.scrollBy({ left: -200, behavior: "smooth" });
        };
    
        // Scroll right function
        rightArrow.onclick = () => {
            cardsWrapper.scrollBy({ left: 200, behavior: "smooth" });
        };
    
        // Handle arrow visibility
        function updateArrows() {
            leftArrow.style.display = cardsWrapper.scrollLeft > 0 ? "flex" : "none";
            rightArrow.style.display =
                cardsWrapper.scrollLeft + cardsWrapper.clientWidth < cardsWrapper.scrollWidth
                    ? "flex"
                    : "none";
        }
    
        // Detect scrolling
        cardsWrapper.addEventListener("scroll", updateArrows);
        setTimeout(updateArrows, 100); // Initial check
    
        container.appendChild(leftArrow);
        container.appendChild(cardsWrapper);
        container.appendChild(rightArrow);
    
        return container;
    }
    
    getViewToggle(items, onView, toggleStyles) {
        if (!items.length) {
            console.error("toggleView: No items provided.");
            return null;
        }
    
        let currentIndex = 0;
    
        // Create the container
        const viewContainer = document.createElement("div");
        viewContainer.style.width = "24px";
        viewContainer.style.height = "24px";
        viewContainer.style.overflow = "hidden";
        viewContainer.style.display = "flex";
        viewContainer.style.alignItems = "center";
        viewContainer.style.justifyContent = "center";
        viewContainer.style.cursor = "pointer";
        viewContainer.style.position = "relative";

        if(toggleStyles) {
            for(const [key, value] of Object.entries(toggleStyles)) {
                viewContainer.style[key] = value
            }
        }
    
        // Function to update the view
        function updateView() {
            viewContainer.innerHTML = ""; // Clear current content
            const newView = onView(items[currentIndex], viewContainer); // Get new view from onView
            viewContainer.appendChild(newView);
        }
    
        // Initial render
        updateView();
    
        // Click event to cycle through views
        viewContainer.addEventListener("click", () => {
            currentIndex = (currentIndex + 1) % items.length; // Rotate views
            updateView();
        });
    
        return viewContainer;
    }

    getAlignmentIcon(alignment, width) {
        const icon = document.createElement("div");
        icon.style.display = "flex";
        icon.style.flexDirection = "column";
        if(!width) width = 24;
        const lineHeight = (width / 6) / 2
        icon.style.width = `${width}px`;
        icon.style.alignItems = "center"
        icon.style.position = "relative";
    
        for (let i = 0; i < 6; i++) {
            const line = document.createElement("div");
            line.style.height = `${lineHeight}px`;
            line.style.background = "black";
            line.style.width = "100%";
            line.style.marginBottom = `${lineHeight}px`;
            
            if ((i + 1) % 2 == 0) {
                line.style.width = "70%"
                if(alignment != "center") line.style.alignSelf = alignment === "right"? "flex-end" : "flex-start";
            }
    
            icon.appendChild(line);
        }
    
        return icon;
    }
    
    getContrastColor(rgbString) {
        // Extract RGB values from the input string
        const rgbMatch = rgbString.match(/\d+/g);
        if (!rgbMatch || rgbMatch.length !== 3) return null;
    
        // Convert to numbers
        const [r, g, b] = rgbMatch.map(Number);
    
        // Calculate luminance using relative luminance formula
        const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
    
        // Return black if luminance is high (bright color), else return white
        return luminance > 0.5 ? "rgb(0,0,0)" : "rgb(255,255,255)";
    }

    onDone(callback) {
        this.callback = callback
    }

    save() {
        const dataURL = this.canvas.toDataURL();
        if(this.parent) this.parent.innerHTML = ""
        if(this.callback) this.callback(dataURL)
    }

    close() {
        if(this.parent) this.parent.innerHTML = ""
        if(this.callback) this.callback()
    }
}
