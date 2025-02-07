// AppExplainer SDK
(function(window) {
    const AppExplainer = {
        config: {
            fps: 30, // Default refresh rate in milliseconds
            elementClassname: "app-explainer-el",
            storageKey: 'AppExplainerData',
            elementIdPrefix: 'AppExplainer',
            canvasPlayerId: 'AppExplainer_canvas_player'
        },
        editData: {},
        recordedFrames: [],
        mediaRecorder: null,
        recordingCanvas: null,
        recordingContext: null,
        overlayContainer: null,
        previousPageHash: null,
        isRecording: false,
        lastCaptureHash: null,
        
        init: function() {
            window.addEventListener('load', () => {
                const explainerRawData = localStorage.getItem(this.config.storageKey);
                if(explainerRawData) {
                    try {
                        this.editData = JSON.parse(explainerRawData)

                    } catch(e) { }
                }

                 // Create the <style> element and add styles
                const style = document.createElement('style');
                style.classList.add(this.config.elementClassname)
                style.innerHTML = `
                    /* Add your styles here */
                    .${this.config.elementClassname} button.explainer-btn, .${this.config.elementClassname}  button.explainer-btn {
                        background-color: #007bff;
                        color: white;
                        border: none;
                        padding: 5px 10px;
                        margin: 5px;
                        cursor: pointer;
                        border-radius: 3px;
                    }
                    .${this.config.elementClassname} button.explainer-btn:hover, .${this.config.elementClassname}  button.explainer-btn:hover {
                        background-color: #0056b3;
                    }
                    .hide {
                        display: none;
                    }
                    .${this.config.elementClassname}#${this.config.canvasPlayerId} {
                        pointer-events: none;
                        position: absolute;
                        left: 0; top: 0; right: 0; bottom: 0;

                    }
                    .toolbar.${this.config.elementClassname} {
                        position: absolute;
                        bottom: 10px;
                        right: 10px;
                        z-index: 10001;
                    }
                `;
                // Append the <style> element to the <head>
                document.head.appendChild(style);

                this.createToolbar();
            });
        },
        createToolbar: function() {
            if(this.toolbar) return
            var toolbar = document.createElement('div');
            toolbar.setAttribute("id", `${this.config.elementIdPrefix}_toolbar`)
            toolbar.classList.add("toolbar")
            toolbar.classList.add(this.config.elementClassname)

            const recordButton = document.createElement('button');
            recordButton.setAttribute("id", `${this.config.elementIdPrefix}_record`)
            recordButton.classList.add("explainer-btn")
            recordButton.innerText = 'Record';
            recordButton.onclick = () => this.toggleScreenRecording(recordButton);

            const editButton = document.createElement('button');
            editButton.setAttribute("id", `${this.config.elementIdPrefix}_edit`)
            editButton.classList.add("explainer-btn")
            editButton.innerText = 'Edit';
            editButton.onclick = () => this.startEditing();

            /*
            const soundButton = document.createElement('button');
            soundButton.setAttribute("id", `${this.config.elementIdPrefix}_sound`)
            soundButton.classList.add("explainer-btn")
            soundButton.innerText = 'Sound';
            soundButton.onclick = () => this.startSoundRecording();*/

            toolbar.appendChild(recordButton);
            toolbar.appendChild(editButton);
            //toolbar.appendChild(soundButton);

            this.toolbar = toolbar
            document.body.appendChild(toolbar);
        },
        prependElement: function (parent, newElement) {
            if (parent.firstChild) {
                parent.insertBefore(newElement, parent.firstChild);
            } else {
                parent.appendChild(newElement);
            }
        },
        toggleScreenRecording: function(button) {
            if (this.isRecording) {
                this.stopScreenRecording(button);
            } else {
                this.startScreenRecording(button);
            }
        },
        startScreenRecording: function(button) {
            this.isRecording = true;
            button.innerText = 'Stop';

            document.getElementById(`${this.config.elementIdPrefix}_edit`).classList.add("hide");

            const canvasPlayer = document.createElement('div');
            canvasPlayer.setAttribute("id", this.config.canvasPlayerId)
            canvasPlayer.width = window.innerWidth;
            canvasPlayer.height = window.innerHeight;

            canvasPlayer.classList.add(this.config.elementClassname)
            
            document.body.appendChild(canvasPlayer);

            this.captureFrames(canvasPlayer);
        },
        stopScreenRecording: function(button) {
            this.isRecording = false;
            button.innerText = 'Record';
            document.getElementById(`${this.config.elementIdPrefix}_edit`).classList.remove("hide");
        },
        screenshot: function() {
            return new Promise((resolve, reject) => {
                html2canvas(document.body).then(canvas => {
                    resolve(canvas)
                });
            })
        },
        captureFrames: async function(canvasPlayer) {
            if (!window.MediaRecorder) {
                throw new Error("MediaRecorder API is not supported in this browser.");
            }
          
            // Set up an offscreen canvas for recording
            this.recordingCanvas = document.createElement('canvas');
            this.recordingCanvas.width = window.innerWidth;
            this.recordingCanvas.height = window.innerHeight;
            this.recordingContext = this.recordingCanvas.getContext('2d');
            canvasPlayer.appendChild(this.recordingCanvas)
          
            // Create a stream from the canvas
            const stream = this.recordingCanvas.captureStream(this.config.fps);
            this.mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });
          
            let chunks = [];
          
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };
          
            this.mediaRecorder.onstop = () => {
                console.log("Recording stopped, processing video...");
                this.lastCaptureHash = undefined
                document.body.removeChild(canvasPlayer);
                // Create a safe filename from the page title
                let safeTitle = document.title
                .replace(/[^a-zA-Z0-9\s]/g, "") // Remove special characters
                .trim()
                .replace(/\s+/g, "_"); // Replace spaces with underscores

                // Get the current timestamp in a readable format (YYYY-MM-DD_HH-MM-SS)
                let now = new Date();
                let timestamp = now.toISOString().replace(/[:T]/g, "-").split(".")[0]; // e.g., 2025-01-31_14-30-45

                // Construct the final filename
                const filename = `${safeTitle || "recorded_video"}_${timestamp}.webm`;
          
                // Create a Blob from the chunks
                const blob = new Blob(chunks, { type: "video/webm" });
                const videoURL = URL.createObjectURL(blob);
          
                // Automatically download the video
                const a = document.createElement("a");
                a.href = videoURL;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
          
                // Cleanup
                URL.revokeObjectURL(videoURL);
            };
          
            this.mediaRecorder.start(); // Start recording
          
            console.log("Recording started...");
          
            let lastCaptureTime = performance.now();
          
            const captureFrame = async () => {
                if (!this.isRecording) {
                    this.mediaRecorder.stop();
                    return;
                }
          
                const now = performance.now();
                const frameInterval = 1000 / this.config.fps;
          
                if (now - lastCaptureTime >= frameInterval) {
                    lastCaptureTime = now;
          
                    const pageHash = this.hashHTML(this.removeRecorderElements(document.documentElement.outerHTML));
          
                    if (this.lastCaptureHash !== pageHash) {
                        this.lastCaptureHash = pageHash;
                        await this.paintLayers(canvasPlayer, pageHash);
                    }
          
                    // Take a screenshot and draw it on the recording canvas
                    const screenshotCanvas = await this.screenshot();
                    this.recordingContext.clearRect(0, 0, this.recordingCanvas.width, this.recordingCanvas.height);
                    this.recordingContext.drawImage(screenshotCanvas, 0, 0, this.recordingCanvas.width, this.recordingCanvas.height);
                }
          
                requestAnimationFrame(captureFrame); // Schedule the next frame
            };
          
            requestAnimationFrame(captureFrame); // Start the loop
        },
        removeRecorderElements: function (htmlContent) {
            // Parse the HTML content into a DOM structure
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');
          
            // Find all elements with the given class name and remove them
            const elementsToRemove = doc.getElementsByClassName(this.config.elementClassname);
            while (elementsToRemove.length > 0) {
              elementsToRemove[0].remove();
            }
          
            // Return the updated HTML as a string
            return doc.documentElement.outerHTML;
        },
        hideRecorderElements: function (hide) {
            // Find all elements with the given class name
            const elements = document.getElementsByClassName(this.config.elementClassname);
        
            // Loop through all the elements and toggle their visibility
            for (let i = 0; i < elements.length; i++) {
                const element = elements[i];
                
                // Check if the element is currently hidden
                if (hide) {
                    // Unhide the element
                    element.style.display = 'none';
                } else {
                    // Hide the element
                    element.style.display = '';
                }
            }
        },
        startEditing: function() {
            this.toolbar.classList.add("hide")
            this.hideRecorderElements(true)
            html2canvas(document.body).then(canvas => {
                this.hideRecorderElements(false)
                const screenshot = canvas.toDataURL('image/jpeg', 0.5);
                const content = this.removeRecorderElements(document.documentElement.outerHTML)
                const pageHash = this.hashHTML(content);
                console.log("captureFrames:2 ", content, pageHash)

                if (!this.editData[pageHash]) {
                    this.editData[pageHash] = { screenshot, layers: [], created_on: Date.now(), updated_on: Date.now() };
                }

                
                this.showEditOverlay(screenshot, pageHash);
            });
        },
        showEditOverlay: function(screenshot, pageHash) {
            const screenshotOverlay = document.createElement('div');
            screenshotOverlay.style.position = 'fixed';
            screenshotOverlay.style.top = '0';
            screenshotOverlay.style.left = '0';
            screenshotOverlay.style.width = '100%';
            screenshotOverlay.style.height = '100%';
            screenshotOverlay.style.backgroundImage = `url(${screenshot})`;
            screenshotOverlay.style.backgroundSize = 'cover';
            screenshotOverlay.style.zIndex = '10000';
            screenshotOverlay.classList.add(this.config.elementClassname)

            const editorView = document.createElement('div');
            editorView.classList.add(this.config.elementClassname)
            editorView.style.position = "absolute"
            editorView.style.left = "0"
            editorView.style.top = "0"
            editorView.style.right = "0"
            editorView.style.bottom = "0"

            const canvasContainer = document.createElement('div');
            canvasContainer.setAttribute("id", "app-explainer-canvas-container")
            canvasContainer.width = window.innerWidth;
            canvasContainer.height = window.innerHeight;
            canvasContainer.style.position = 'absolute';
            canvasContainer.style.top = '0';
            canvasContainer.style.left = '0';
        
            this.paintLayers(canvasContainer, pageHash)
            .then(() => {
                console.info("this.paintLayers")
            })
            .catch(e => {
                console.error("this.paintLayers:error ", e?.message)
            })
            
            screenshotOverlay.appendChild(canvasContainer);
            screenshotOverlay.appendChild(editorView);
            
            document.body.appendChild(screenshotOverlay);

            ImageEditor.show(editorView)
            .onDone((imageData) => {
                document.body.removeChild(screenshotOverlay)
                this.toolbar.classList.remove("hide")
                if(imageData) {
                    this.editData[pageHash].layers.push(imageData)
                    this.saveEditData()
                }
                console.log("imageData:", imageData)
            })
        },
        paintLayers: async function(canvasContainer, pageHash) {
            //console.log("explainerLayers:0", canvasContainer, pageHash)
            canvasContainer.innerHTML = ""
            const explainerRawData = localStorage.getItem(this.config.storageKey);
            //console.log("explainerLayers:1", explainerRawData)
            if(explainerRawData) {
                //console.log("explainerLayers:2", explainerRawData)
                try {
                    const explainerLayers = JSON.parse(explainerRawData)[pageHash]?.layers || []
                    //console.log("explainerLayers:3", explainerLayers)
                    for(const layer of explainerLayers) {
                        const image = await this.loadImage(layer);
                        image.style.position = 'absolute';
                        image.style.top = '0';
                        image.style.left = '0';
                        canvasContainer.appendChild(image)
                    }

                } catch(e) {
                    console.error("paintLayers.JSON.parse(explainerRawData): ", e?.message)
                }
            }
        },
        startSoundRecording: function() {
            this.toolbar.classList.add("hide")
            this.hideRecorderElements(true)

            const editorView = document.createElement('div');
            editorView.classList.add(this.config.elementClassname)
            editorView.style.position = "absolute"
            editorView.style.left = "0"
            editorView.style.top = "0"
            editorView.style.right = "0"
            editorView.style.bottom = "0"

            document.body.appendChild(editorView)
            SoundEditor.show(editorView)
            .onDone((soundData) => {
                document.body.removeChild(editorView)
                this.toolbar.classList.remove("hide")
                if(soundData) {
                    this.editData[pageHash].sounds.push(soundData)
                    this.saveEditData()
                }
                console.log("soundData:", soundData)
            })
        },
        saveEditData: function() {
            localStorage.setItem(this.config.storageKey, JSON.stringify(this.editData));
            console.log('Edit data saved:', this.editData);
        },
        hashHTML: function(html) {
            let hash = 0;
            for (let i = 0; i < html.length; i++) {
                const char = html.charCodeAt(i);
                hash = (hash << 5) - hash + char;
                hash |= 0;
            }
            return hash;
        },
        loadImage: async function(image) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = image instanceof File ? URL.createObjectURL(image) : image;
            });
        }
    };

    window.AppExplainer = AppExplainer;
    AppExplainer.init();
})(window);