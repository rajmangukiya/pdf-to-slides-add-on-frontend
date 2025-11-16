import { MdOutlineFileUpload, MdDelete } from "react-icons/md";
import { BsStars } from "react-icons/bs";
import { useState, useRef } from "react";
import { convertPdfToSlides } from "./firebase";
import type { SlideData } from "./types";

// const dummySlidesData = {
//   "success": true,
//   "data": {
//     "slides": [
//       {
//         "title": "Introduction to AI",
//         "bullets": [
//           "Defining Artificial Intelligence: What it is and its core concepts",
//           "A brief history of AI: From early ideas to modern breakthroughs",
//           "Key applications of AI across various industries and domains"
//         ]
//       },
//       {
//         "title": "Machine Learning Fundamentals",
//         "bullets": [
//           "Supervised Learning: Training with labeled data for prediction and classification",
//           "Unsupervised Learning: Discovering patterns in unlabeled data for clustering and association",
//           "Reinforcement Learning: Learning through trial and error with rewards and penalties"
//         ]
//       },
//       {
//         "title": "Deep Learning Explained",
//         "bullets": [
//           "Understanding Neural Networks: The building blocks of deep learning",
//           "Convolutional Neural Networks (CNNs): Specialized for image and video processing",
//           "Recurrent Neural Networks (RNNs): Designed for sequential data like text and time series"
//         ]
//       },
//       {
//         "title": "Natural Language Processing (NLP)",
//         "bullets": [
//           "Tokenization: Breaking down text into manageable units for analysis",
//           "Transformers: The architecture behind advanced language models",
//           "ChatGPT: A powerful example of generative AI in natural language understanding and generation"
//         ]
//       },
//       {
//         "title": "Computer Vision Insights",
//         "bullets": [
//           "Image Classification: Identifying and categorizing objects within images",
//           "Object Detection: Locating and identifying multiple objects in an image or video frame"
//         ]
//       }
//     ]
//   },
//   "metadata": {
//     "model": "gemini-2.5-flash",
//     "pagesProcessed": 5,
//     "slidesGenerated": 5
//   }
// }

// For TypeScript or JS with JSX
declare const google: any;

function App() {
  const [loading, setLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("File too large! Maximum size is 10MB");
        return;
      }

      // Check if it's a PDF
      if (file.type !== 'application/pdf') {
        alert("Please upload a PDF file");
        return;
      }

      setPdfFile(file);
      setStatus(`Selected: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
      console.log("PDF selected:", file.name);
    }
  };

  const handleDeleteFile = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the file input
    setPdfFile(null);
    setStatus("");
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Convert File to base64 string
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const convertPDF = async () => {
    if (!pdfFile) {
      alert("Please upload a PDF first!");
      return;
    }

    try {
      setLoading(true);
      setProgress(10);
      setStatus("Reading PDF file...");

      // Step 1: Convert PDF to base64
      const pdfBase64 = await fileToBase64(pdfFile);

      setProgress(30);
      setStatus("Uploading to server...");

      // Step 2: Call Firebase Cloud Function

      // send buffer to firebase
      const response = await convertPdfToSlides(pdfBase64);
      // const response = dummySlidesData;

      if (!response.data) {
        throw new Error("No data received from Firebase function");
      }

      setProgress(70);

      const slidesData: SlideData = response.data as SlideData;
      console.log("Slides data received:", slidesData);

      setStatus(`AI generated ${slidesData.slides.length} slides. Creating in Google Slides...`);
      setProgress(85);

      // Step 3: Call Google Apps Script function to create slides
      if (google?.script?.run) {
        google.script.run
          .withSuccessHandler(() => {
            setLoading(false);
            setProgress(100);
            setStatus("✅ Slides created successfully!");
            console.log("Slides created successfully!");

            // Reset after 3 seconds
            setTimeout(() => {
              setStatus("");
              setProgress(0);
              setPdfFile(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }, 3000);
          })
          .withFailureHandler((error: any) => {
            setLoading(false);
            setProgress(0);
            setStatus("❌ Error creating slides in Google Slides");
            console.error("Google Apps Script error:", error);
            alert("Error creating slides: " + error.message);
          })
          .convertPdfToSlide(slidesData);
      } else {
        setLoading(false);
        setProgress(100);
        setStatus("✅ Slides created successfully!");
        console.log("Slides created successfully!");
      }

    } catch (error: any) {
      setLoading(false);
      setProgress(0);
      console.error("Error:", error);

      // Handle specific error types
      if (error.message?.includes('quota')) {
        setStatus("❌ OpenAI API quota exceeded");
        alert("OpenAI API quota exceeded. Please try again later.");
      } else if (error.message?.includes('extract text')) {
        setStatus("❌ Could not extract text from PDF");
        alert("Could not extract text from PDF. It might be a scanned image.");
      } else {
        setStatus("❌ Error: " + error.message);
        alert("Error: " + error.message);
      }
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <div className="w-[500px] bg-white h-full flex flex-col items-center gap-4 py-10 px-5">
        <div className="text-2xl font-bold">PDF to Slides</div>

        <div className="border-2 border-black rounded-2xl p-2 w-full">
          <input
            ref={fileInputRef}
            id="pdf-input"
            className="hidden"
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            disabled={loading}
          />
          {pdfFile ? (
            <div className="flex flex-col gap-2 w-full bg-gray-100 p-4 rounded-lg">
              <div className="flex items-center justify-between w-full">
                <div className="flex-1 truncate">
                  <p className="font-medium truncate">{pdfFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(pdfFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <button
                  onClick={handleDeleteFile}
                  disabled={loading}
                  className={`ml-2 p-2 rounded-full hover:bg-red-100 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  aria-label="Delete file"
                >
                  <MdDelete size={20} className="text-red-500" />
                </button>
              </div>
            </div>
          ) : (
            <label
              htmlFor="pdf-input"
              className={`cursor-pointer border border-dashed w-full h-full flex flex-col items-center justify-center py-16 rounded-lg gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            >
              <MdOutlineFileUpload size={24} />
              <span className="text-center">Upload PDF</span>
              <span className="text-xs text-gray-500">Max 10MB</span>
            </label>
          )}
        </div>

        {/* Status Message */}
        {status && (
          <div className="text-sm text-gray-600 text-center w-full px-4">
            {status}
          </div>
        )}

        {/* Progress Bar */}
        {loading && progress > 0 && (
          <div className="w-full">
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-center text-gray-500 mt-1">
              {progress}%
            </p>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={convertPDF}
          disabled={loading || !pdfFile}
          className={`w-full text-white px-4 py-2 rounded-full flex items-center justify-center gap-2 transition-colors ${loading || !pdfFile
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-gray-500 cursor-pointer hover:bg-gray-600'
            }`}
        >
          <BsStars size={24} />
          <span>{loading ? "Processing..." : "Generate Slide Deck"}</span>
        </button>
      </div>
    </div>
  );
}

export default App;
