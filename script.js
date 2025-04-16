const video = document.querySelector("video");
const textElem = document.querySelector("[data-text]");
let isProcessing = false;
let worker = null;

async function setup() {
  try {
    // Get camera access
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;

    // Wait for video to start playing
    await new Promise(resolve => {
      if (video.readyState >= 2) {
        resolve();
      } else {
        video.addEventListener("loadeddata", resolve, { once: true });
      }
    });

    console.log("Video is ready, initializing Tesseract...");
    
    // Initialize Tesseract worker (only once)
    worker = await Tesseract.createWorker("eng");
    console.log("Tesseract worker initialized successfully");

    // Create canvas for capturing frames
    const canvas = document.createElement("canvas");
    canvas.width = video.width;
    canvas.height = video.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    // Handle spacebar press to capture and process text
    document.addEventListener("keypress", async e => {
      if (e.code !== "Space" || isProcessing) return;
      
      isProcessing = true;
      textElem.textContent = "Processing...";
      
      try {
        // Capture current video frame
        ctx.drawImage(video, 0, 0, video.width, video.height);
        
        console.log("Image captured, starting OCR...");
        
        // Process with OCR
        const { data: { text } } = await worker.recognize(canvas);
        
        console.log("OCR completed, text found:", text ? "Yes" : "No");
        
        // Display the recognized text
        textElem.textContent = text || "No text detected";
        
        // Read the text aloud
        if (text && text.trim().length > 0) {
          const cleanText = text.replace(/\s+/g, " ").trim();
          const utterance = new SpeechSynthesisUtterance(cleanText);
          
          // Cancel any ongoing speech before starting new one
          speechSynthesis.cancel();
          speechSynthesis.speak(utterance);
        }
      } catch (error) {
        console.error("Error during OCR processing:", error);
        textElem.textContent = "Error processing text. Please try again.";
      } finally {
        isProcessing = false;
      }
    });
    
    // Add a button for manual text reading
    const readButton = document.createElement("button");
    readButton.className = "toggle-btn";
    readButton.textContent = "Read Text";
    readButton.style.margin = "20px";
    readButton.addEventListener("click", () => {
      // Simulate spacebar press
      document.dispatchEvent(new KeyboardEvent("keypress", { code: "Space" }));
    });
    document.body.appendChild(readButton);
    
    console.log("OCR system ready");
  } catch (error) {
    console.error("Setup failed:", error);
    textElem.textContent = "Camera access error. Please refresh and allow camera permissions.";
  }
}

// Start the setup
setup();