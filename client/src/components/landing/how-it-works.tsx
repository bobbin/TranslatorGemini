export function HowItWorks() {
  return (
    <div id="how-it-works" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
            Our process is designed to be simple while delivering professional-quality translations.
          </p>
        </div>

        <div className="mt-16 max-w-4xl mx-auto">
          <div className="relative">
            {/* Step 1 */}
            <div className="flex">
              <div className="flex flex-col items-center mr-6">
                <div className="rounded-full bg-primary-600 text-white w-10 h-10 flex items-center justify-center font-bold text-lg">1</div>
                <div className="h-full w-0.5 bg-primary-200 mt-2"></div>
              </div>
              <div className="pb-12">
                <h3 className="text-xl font-medium text-gray-900">Upload Your File</h3>
                <p className="mt-2 text-gray-600">
                  Drag and drop your EPUB or PDF file onto our secure platform. We accept files up to 100MB.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex">
              <div className="flex flex-col items-center mr-6">
                <div className="rounded-full bg-primary-600 text-white w-10 h-10 flex items-center justify-center font-bold text-lg">2</div>
                <div className="h-full w-0.5 bg-primary-200 mt-2"></div>
              </div>
              <div className="pb-12">
                <h3 className="text-xl font-medium text-gray-900">Select Languages</h3>
                <p className="mt-2 text-gray-600">
                  Choose the source language of your document and the target language for translation.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex">
              <div className="flex flex-col items-center mr-6">
                <div className="rounded-full bg-primary-600 text-white w-10 h-10 flex items-center justify-center font-bold text-lg">3</div>
                <div className="h-full w-0.5 bg-primary-200 mt-2"></div>
              </div>
              <div className="pb-12">
                <h3 className="text-xl font-medium text-gray-900">AI Translation</h3>
                <p className="mt-2 text-gray-600">
                  Our system extracts the text, maintains the document structure, and sends it to Google Gemini 2.0 Flash AI for translation.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex">
              <div className="flex flex-col items-center mr-6">
                <div className="rounded-full bg-primary-600 text-white w-10 h-10 flex items-center justify-center font-bold text-lg">4</div>
              </div>
              <div>
                <h3 className="text-xl font-medium text-gray-900">Download Translated Document</h3>
                <p className="mt-2 text-gray-600">
                  Once complete, download your translated document in the original format with preserved styling.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
