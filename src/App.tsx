import { MdOutlineFileUpload, MdDelete } from "react-icons/md";
import { BsStars } from "react-icons/bs";
import { useState, useRef } from "react";
import { convertPdfToSlides } from "./firebase";
import type { SlideData } from "./types";
import { fileToBase64 } from "./helper";


declare const google: any;

function App() {
  const [loading, setLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
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
    e.stopPropagation();
    setPdfFile(null);
    setStatus("");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const callGoogleAppScript = (slidesData: SlideData) => {
    if (google?.script?.run) {
      google.script.run
        .withSuccessHandler(() => {
          setLoading(false);
          setStatus("✅ Slides created successfully!");
          console.log("Slides created successfully!");

          // Reset after 3 seconds
          setTimeout(() => {
            setStatus("");
            setPdfFile(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }, 3000);
        })
        .withFailureHandler((error: any) => {
          setLoading(false);
          setStatus("❌ Error creating slides in Google Slides");
          console.error("Google Apps Script error:", error);
          alert("Error creating slides: " + error.message);
        })
        .convertPdfToSlide(slidesData);
    } else {
      setLoading(false);
      setStatus("✅ Slides created successfully!");
      console.log("Slides created successfully!");
    }
  }

  const convertPDF = async () => {
    if (!pdfFile) {
      alert("Please upload a PDF first!");
      return;
    }

    try {
      setLoading(true);
      setStatus("Reading PDF file...");

      const pdfBase64 = await fileToBase64(pdfFile);

      setStatus("Uploading to server...");


      // call firebase function (AI integration & data formatting)
      const response = await convertPdfToSlides(pdfBase64);
      // const response = dummySlidesData;

      if (!response.data) {
        throw new Error("No data received from Firebase function");
      }

      const slidesData: SlideData = response.data as SlideData;

      setStatus(`AI generated ${slidesData.slides.length} slides. Creating in Google Slides...`);

      // Step 3: Call Google Apps Script function to create slides
      callGoogleAppScript(slidesData);

    } catch (error: any) {
      setLoading(false);
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
        {loading && (
          <div className="w-full">
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `100%` }}
              />
            </div>
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
